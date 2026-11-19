// scripts/build_mondrian_data.mjs
// One-time build of data/mondrian.json: the spectra behind the home page Mondrian.
// Run with `node scripts/build_mondrian_data.mjs` when the chip list changes; the output is committed.
//
// Sources
//   Munsell matte chip reflectances, 380-800 nm at 1 nm: "Munsell colors matt (spectrofotometer measured)",
//     Computational Spectral Imaging Research Group, University of Eastern Finland,
//     mirrored at https://zenodo.org/records/3269912
//   CIE 1931 2-degree colour-matching functions, https://doi.org/10.25039/CIE.DS.xvudnb9b (CC BY-SA 4.0)
//   CIE components of the relative spectral distribution of daylight, files.cie.co.at (CC BY-SA 4.0)
import fs from "node:fs/promises";
import { gunzipSync } from "node:zlib";

// Each chip is one paper in the Mondrian; app/page.tsx places them.
const CHIPS = [
  "2.5Y 9/2", "5PB 5/4", "10YR 7/4", "7.5R 4/8", "5G 3/4", "5YR 4/4",
  "5Y 8/8", "7.5PB 5/6", "7.5GY 7/4", "10R 7/6", "2.5PB 4/6", "5Y 8/2",
];
const WL = Array.from({ length: 31 }, (_, i) => 400 + 10 * i);

const headers = { "User-Agent": "static-site-data-fetch/1.0" };
async function get(url) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// "400,0.014310000000,0.000396,0.06785" rows -> { 400: [x, y, z], ... }
function csvByWavelength(text) {
  const rows = {};
  for (const line of text.trim().split(/\r?\n/)) {
    const [w, ...v] = line.split(",").map(Number);
    rows[w] = v;
  }
  return rows;
}

const round = (v, d = 6) => Number(v.toFixed(d));

async function main() {
  const zenodo = "https://zenodo.org/api/records/3269912/files";
  const readme = (await get(`${zenodo}/README.txt/content`)).toString("utf8");
  const asc = gunzipSync(await get(`${zenodo}/munsell380_800_1.asc.gz/content`)).toString("utf8");
  const cmf = csvByWavelength((await get("https://files.cie.co.at/Publications-datasets/CIE_xyz_1931_2deg.csv")).toString("utf8"));
  const day = csvByWavelength((await get("https://files.cie.co.at/Publications-datasets/CIE_illum_Dxx_comp.csv")).toString("utf8"));

  // The README ends with the chip index, one "2.5 R 9 / 2" line per spectrum, in file order.
  const names = [];
  for (const line of readme.slice(readme.lastIndexOf("index of the ASCII spectra")).split(/\r?\n/)) {
    const m = line.match(/^\s*(?:\d+\s+)?([\d.]+)\s+([A-Z]+)\s+([\d.]+)\s*\/\s*(\d+)\s*$/);
    if (m) names.push(`${m[1]}${m[2]} ${m[3]}/${m[4]}`);
  }
  const values = asc.trim().split(/\s+/).map(Number);
  if (names.length !== 1269 || values.length !== 421 * 1269) {
    throw new Error(`Unexpected Munsell data: ${names.length} names, ${values.length} values`);
  }

  const chips = {};
  for (const chip of CHIPS) {
    const i = names.indexOf(chip);
    if (i < 0) throw new Error(`Chip ${chip} is not in the Munsell matte set`);
    chips[chip] = WL.map(w => round(values[i * 421 + (w - 380)], 4));
  }

  const out = {
    about: "Spectra for the home page Mondrian, 400-700 nm in 10 nm steps. Built by scripts/build_mondrian_data.mjs.",
    sources: {
      chips: "Munsell colors matt (spectrofotometer measured), Computational Spectral Imaging Research Group, University of Eastern Finland. https://zenodo.org/records/3269912",
      cmf: "CIE 1931 2° colour-matching functions, CIE, https://doi.org/10.25039/CIE.DS.xvudnb9b, CC BY-SA 4.0. Subsampled.",
      daylight: "CIE components of the relative spectral distribution of daylight (S0, S1, S2), CIE, CC BY-SA 4.0. Subsampled.",
    },
    wavelengths: WL,
    cmf: { x: WL.map(w => round(cmf[w][0])), y: WL.map(w => round(cmf[w][1])), z: WL.map(w => round(cmf[w][2])) },
    daylight: { s0: WL.map(w => day[w][0]), s1: WL.map(w => day[w][1]), s2: WL.map(w => day[w][2]) },
    chips,
  };
  await fs.writeFile("data/mondrian.json", JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote data/mondrian.json with ${CHIPS.length} chips`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
