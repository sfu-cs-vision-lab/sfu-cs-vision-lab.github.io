// scripts/check_retinex.mjs
// Checks lib/retinex.ts against the lab's MATLAB original. Run: node scripts/check_retinex.mjs
// The expected values in retinex-matlab-output.json came from running retinex_mccann99.m on the same input.
import fs from "node:fs";
import { retinexMcCann99 } from "../lib/retinex.ts";

const { rows, cols, expected } = JSON.parse(fs.readFileSync(new URL("./retinex-matlab-output.json", import.meta.url)));

// Same input as the MATLAB run: a smooth wave plus a checkerboard, clipped to [0, 1].
const L = new Float64Array(rows * cols);
for (let i = 0; i < rows; i++) {
  for (let j = 0; j < cols; j++) {
    const v = 0.35 + 0.25 * Math.sin(i / 5) * Math.cos(j / 7) + 0.2 * ((Math.floor(i / 6) + Math.floor(j / 8)) % 2);
    L[i * cols + j] = Math.min(1, Math.max(0, v));
  }
}

const out = retinexMcCann99(L, rows, cols, 4);
const worst = expected.reduce((m, v, k) => Math.max(m, Math.abs(v - out[k])), 0);
if (!(worst < 1e-12)) {
  console.error(`retinex port differs from MATLAB by ${worst}`);
  process.exit(1);
}
console.log(`retinex port matches MATLAB (${rows}x${cols}, max difference ${worst.toExponential(1)})`);
