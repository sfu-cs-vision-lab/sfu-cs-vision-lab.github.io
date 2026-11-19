// SPDX-License-Identifier: AGPL-3.0-or-later
//
// JavaScript port of retinex_mccann99.m from https://github.com/sfu-cs-vision-lab/retinex-matlab
// Florian Ciurea, Brian Funt and John McCann, Simon Fraser University. Described in
// B. Funt, F. Ciurea and J. McCann, "Retinex in MATLAB", J. Electronic Imaging 13(1), 48-57 (2004),
// https://doi.org/10.1117/1.1636761. The model is from J. McCann, "Lessons Learned from Mondrians
// Applied to Real Images and Color Gamuts", IS&T/SID Seventh Color Imaging Conference, 1999.
//
// The port keeps the original's steps and edge handling: multiresolution pyramid, eight-neighbour
// ratio-product, reset at the image maximum, averaging, and nearest-neighbour upsampling.

/** Raw McCann99 retinex output for one logarithmic channel in [0, 1], row-major rows x cols. */
export function retinexMcCann99(L: Float64Array, rows: number, cols: number, nIterations: number): Float64Array {
  const nLayers = computeLayers(rows, cols);
  let nr = rows / 2 ** nLayers;
  let nc = cols / 2 ** nLayers;
  if (nr * nc > 25) throw new Error("invalid image size");

  let maximum = -Infinity;
  for (const v of L) if (v > maximum) maximum = v;

  let OP = new Float64Array(nr * nc).fill(maximum);
  let NP = OP;
  for (let layer = 0; layer <= nLayers; layer++) {
    const RR = downResolution(L, rows, cols, 2 ** (nLayers - layer));
    const w = nc + 2;
    // OPE: OP padded with zeros. RRE: RR padded by repeating its edge rows and columns.
    const OPE = new Float64Array((nr + 2) * w);
    const RRE = new Float64Array((nr + 2) * w);
    for (let i = 0; i < nr + 2; i++) {
      for (let j = 0; j < w; j++) {
        const ri = Math.min(nr - 1, Math.max(0, i - 1)), rj = Math.min(nc - 1, Math.max(0, j - 1));
        RRE[i * w + j] = RR[ri * nc + rj];
        if (i > 0 && i <= nr && j > 0 && j <= nc) OPE[i * w + j] = OP[(i - 1) * nc + (j - 1)];
      }
    }

    const IP = new Float64Array(nr * nc);
    const compare = (dr: number, dc: number) => {
      for (let i = 0; i < nr; i++) {
        for (let j = 0; j < nc; j++) {
          const n = (i + 1 + dr) * w + (j + 1 + dc);
          const v = OPE[n] + RRE[(i + 1) * w + (j + 1)] - RRE[n]; // ratio-product
          IP[i * nc + j] = v > maximum ? maximum : v; // reset
        }
      }
      // Where the neighbour is undefined, keep the old product.
      if (dc === -1) for (let i = 0; i < nr; i++) IP[i * nc] = OPE[(i + 1) * w + 1];
      if (dc === 1) for (let i = 0; i < nr; i++) IP[i * nc + nc - 1] = OPE[(i + 1) * w + nc];
      if (dr === -1) for (let j = 0; j < nc; j++) IP[j] = OPE[w + j + 1];
      if (dr === 1) for (let j = 0; j < nc; j++) IP[(nr - 1) * nc + j] = OPE[nr * w + j + 1];
      for (let i = 0; i < nr; i++) {
        for (let j = 0; j < nc; j++) {
          const c = (i + 1) * w + (j + 1);
          OPE[c] = (OPE[c] + IP[i * nc + j]) / 2; // averaging
        }
      }
    };

    for (let iter = 0; iter < nIterations; iter++) {
      compare(-1, 0); compare(-1, 1); compare(0, 1); compare(1, 1);
      compare(1, 0); compare(1, -1); compare(0, -1); compare(-1, -1);
    }

    NP = new Float64Array(nr * nc);
    for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) NP[i * nc + j] = OPE[(i + 1) * w + (j + 1)];
    // Nearest-neighbour upsample by two for the next layer.
    OP = new Float64Array(4 * nr * nc);
    for (let i = 0; i < 2 * nr; i++) for (let j = 0; j < 2 * nc; j++) OP[i * 2 * nc + j] = NP[(i >> 1) * nc + (j >> 1)];
    nr *= 2;
    nc *= 2;
  }
  return NP;
}

/** Number of pyramid layers: log2 of the largest power of two dividing both sides. */
function computeLayers(rows: number, cols: number): number {
  let power = 1;
  while (rows % (power * 2) === 0 && cols % (power * 2) === 0) power *= 2;
  return Math.log2(power);
}

/** Each output pixel is the mean of a block x block square of the input. */
function downResolution(A: Float64Array, rows: number, cols: number, block: number): Float64Array {
  const r = rows / block, c = cols / block;
  const out = new Float64Array(r * c);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) out[Math.floor(i / block) * c + Math.floor(j / block)] += A[i * cols + j];
  const n = block * block;
  for (let k = 0; k < out.length; k++) out[k] /= n;
  return out;
}
