// SPDX-License-Identifier: AGPL-3.0-or-later
// Runs the lab's McCann99 retinex (lib/retinex.ts) on the home page Mondrian, off the main thread.
// Input is the display's cone signals; output is each paper and the ground as a fraction of the
// brightest area in each channel, which retinex takes to be white.
import { retinexMcCann99 } from "./retinex";
import type { Area, Rgb } from "./mondrian";

export type RetinexJob = { id: number; rows: number; cols: number; rects: Area[]; papers: Rgb[]; ground: Rgb };
export type RetinexResult = { id: number; papers: Rgb[]; ground: Rgb };

addEventListener("message", (event: MessageEvent<RetinexJob>) => {
  const { id, rows, cols, rects, papers, ground } = event.data;
  const owner = new Int16Array(rows * cols).fill(-1); // which paper each pixel belongs to; -1 is the black ground
  rects.forEach(([r0, c0, r1, c1], k) => {
    for (let i = r0; i < r1; i++) for (let j = c0; j < c1; j++) owner[i * cols + j] = k;
  });

  const outPapers = papers.map(() => [0, 0, 0] as Rgb);
  const outGround: Rgb = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const img = Float64Array.from(owner, k => (k < 0 ? ground[c] : papers[k][c]));
    // The original expects a log image in [0, 1]. Normalise the channel to its brightest pixel,
    // then map four decades of log intensity onto [0, 1].
    let max = 1e-9;
    for (const v of img) if (v > max) max = v;
    const L = img.map(v => 1 + Math.log10(Math.max(v / max, 1e-4)) / 4);
    const R = retinexMcCann99(L, rows, cols, 4);

    // Back to linear, then average each paper's interior (2 px in from its edge) and the ground.
    const sums = new Float64Array(papers.length), counts = new Float64Array(papers.length);
    let groundSum = 0, groundCount = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const v = 10 ** (4 * (R[i * cols + j] - 1)), k = owner[i * cols + j];
        if (k < 0) { groundSum += v; groundCount++; continue; }
        const [r0, c0, r1, c1] = rects[k];
        if (i < r0 + 2 || i >= r1 - 2 || j < c0 + 2 || j >= c1 - 2) continue;
        sums[k] += v; counts[k]++;
      }
    }
    papers.forEach((_, k) => { outPapers[k][c] = sums[k] / counts[k]; });
    outGround[c] = groundSum / groundCount;
  }
  postMessage({ id, papers: outPapers, ground: outGround } satisfies RetinexResult);
});
