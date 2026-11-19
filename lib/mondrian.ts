// The home page Mondrian: which papers sit where, and how their colours are computed.
// Every colour comes from a measured reflectance spectrum x the light's spectrum x the CIE 1931 observer.
import data from "@/data/mondrian.json";

export type Rgb = [number, number, number];
export type View = "camera" | "grey" | "retinex"; // the white balance: fixed at D65, grey world, retinex
/** Grid lines: rowStart, colStart, rowEnd, colEnd (CSS grid-area order). */
export type Area = [number, number, number, number];

export type Paper = {
  chip: string;
  label?: string;
  href?: string;
  title?: true; // the paper that carries the lab's name
  wide: Area; // 12 x 8 grid, tablet and up
  narrow: Area; // 6 x 12 grid, phones
};

// The twelve papers: six carry the site's sections, one the lab's name; each has a desktop and a phone area.
export const PAPERS: Paper[] = [
  { chip: "2.5Y 9/2", title: true, wide: [1, 1, 5, 6], narrow: [1, 1, 4, 7] },
  { chip: "5PB 5/4", label: "People", href: "/people/", wide: [1, 6, 3, 9], narrow: [10, 2, 12, 4] },
  { chip: "10YR 7/4", label: "Publications", href: "/publications/", wide: [1, 9, 4, 13], narrow: [4, 4, 7, 7] },
  { chip: "7.5R 4/8", label: "Data", href: "/data/", wide: [3, 6, 6, 8], narrow: [6, 1, 8, 3] },
  { chip: "5G 3/4", wide: [3, 8, 5, 9], narrow: [6, 3, 8, 4] },
  { chip: "5YR 4/4", label: "Code", href: "/code/", wide: [4, 9, 7, 11], narrow: [8, 1, 10, 4] },
  { chip: "5Y 8/8", label: "Funding", href: "/funding/", wide: [4, 11, 9, 13], narrow: [7, 4, 10, 7] },
  { chip: "7.5PB 5/6", wide: [5, 1, 9, 3], narrow: [10, 1, 13, 2] },
  { chip: "7.5GY 7/4", label: "Research", href: "/research/", wide: [5, 3, 7, 6], narrow: [4, 1, 6, 4] },
  { chip: "10R 7/6", wide: [7, 3, 9, 6], narrow: [12, 2, 13, 4] },
  { chip: "2.5PB 4/6", wide: [6, 6, 9, 9], narrow: [10, 4, 13, 6] },
  { chip: "5Y 8/2", wide: [7, 9, 9, 11], narrow: [10, 6, 13, 7] },
];

/** The site's sections in menu order, each tied to the paper that carries it on the home page. */
const MENU = ["Research", "Publications", "Data", "Code", "People", "Funding"];
export const SECTIONS = PAPERS.filter(p => p.href)
  .map(p => ({ name: p.label!, href: p.href!, chip: p.chip }))
  .sort((a, b) => MENU.indexOf(a.name) - MENU.indexOf(b.name));

export const LIGHTS = [
  { name: "Tungsten", kelvin: 2856 },
  { name: "D50", kelvin: 5003 },
  { name: "D65", kelvin: 6504 },
  { name: "North sky", kelvin: 10000 },
];
export const KELVIN_MIN = 2700;
export const KELVIN_MAX = 12000;

const W = data.wavelengths;
const { x: XB, y: YB, z: ZB } = data.cmf;
const { s0, s1, s2 } = data.daylight;
const I560 = W.indexOf(560);
const chips = data.chips as Record<string, number[]>;

const at560 = (spd: number[]) => spd.map(v => (100 * v) / spd[I560]);

function planck(T: number) {
  const c2 = 1.4388e-2; // m K
  return at560(W.map(nm => { const l = nm * 1e-9; return 1 / (l ** 5 * (Math.exp(c2 / (l * T)) - 1)); }));
}

// CIE 15:2004 daylight at correlated colour temperature T, valid 4000-25000 K.
function daylight(T: number) {
  const xD = T <= 7000
    ? -4.607e9 / T ** 3 + 2.9678e6 / T ** 2 + 0.09911e3 / T + 0.244063
    : -2.0064e9 / T ** 3 + 1.9018e6 / T ** 2 + 0.24748e3 / T + 0.23704;
  const yD = -3 * xD * xD + 2.87 * xD - 0.275;
  const M = 0.0241 + 0.2562 * xD - 0.7341 * yD;
  const M1 = (-1.3515 - 1.7703 * xD + 5.9114 * yD) / M;
  const M2 = (0.03 - 31.4424 * xD + 30.0717 * yD) / M;
  return at560(s0.map((v, i) => v + M1 * s1[i] + M2 * s2[i]));
}

/** Planckian up to 4000 K, CIE daylight from 5000 K, blended between so the light never jumps. */
export function illuminant(T: number): number[] {
  if (T <= 4000) return planck(T);
  if (T >= 5000) return daylight(T);
  const w = (T - 4000) / 1000, p = planck(T), d = daylight(T);
  return p.map((v, i) => v * (1 - w) + d[i] * w);
}

/** XYZ of reflectance R under light E, scaled so a perfect white has Y = 1. */
function xyz(R: readonly number[], E: number[]): Rgb {
  let X = 0, Y = 0, Z = 0, k = 0;
  for (let i = 0; i < W.length; i++) {
    const e = R[i] * E[i];
    X += e * XB[i]; Y += e * YB[i]; Z += e * ZB[i]; k += E[i] * YB[i];
  }
  return [X / k, Y / k, Z / k];
}

// XYZ to linear sRGB, IEC 61966-2-1. Out-of-gamut values clip, as they would on a camera.
const toRgb = ([X, Y, Z]: Rgb): Rgb => [
  Math.max(0, 3.2406 * X - 1.5372 * Y - 0.4986 * Z),
  Math.max(0, -0.9689 * X + 1.8758 * Y + 0.0415 * Z),
  Math.max(0, 0.0557 * X - 0.204 * Y + 1.057 * Z),
];

// Hunt-Pointer-Estevez cone space. Cone signals stay positive for every real surface, so grey world and
// retinex scale them per channel; scaling sRGB channels would lose whatever the camera clipped.
const toLms = ([X, Y, Z]: Rgb): Rgb => [0.38971 * X + 0.68898 * Y - 0.07868 * Z, -0.22981 * X + 1.1834 * Y + 0.04641 * Z, Z];
const fromLms = ([L, M, S]: Rgb): Rgb => [1.9102 * L - 1.11212 * M + 0.20191 * S, 0.37095 * L + 0.62905 * M, S];

/** The ground between papers: flat 1.2% reflectance, roughly a Munsell N1 black paper. */
const BLACK_PAPER = W.map(() => 0.012);
const PERFECT_WHITE = W.map(() => 1);

/** Linear sRGB for display. */
export type Scene = { papers: Rgb[]; ground: Rgb };
/** Cone signals of the display under a light, and of a perfect white under the same light. */
export type Cones = { papers: Rgb[]; ground: Rgb; white: Rgb };

/** Camera view of the whole display under T kelvin, before exposure: balanced for daylight, so the light shows. */
export function cameraScene(T: number): Scene {
  const E = illuminant(T);
  return { papers: PAPERS.map(p => toRgb(xyz(chips[p.chip], E))), ground: toRgb(xyz(BLACK_PAPER, E)) };
}

export function coneScene(T: number): Cones {
  const E = illuminant(T);
  const lms = (R: readonly number[]) => toLms(xyz(R, E));
  return { papers: PAPERS.map(p => lms(chips[p.chip])), ground: lms(BLACK_PAPER), white: lms(PERFECT_WHITE) };
}

const WHITE_D65 = toLms(xyz(PERFECT_WHITE, illuminant(6504)));

/** Cone signals given as fractions of white, shown as they would look under daylight. */
export function fromWhiteFractions({ papers, ground }: { papers: Rgb[]; ground: Rgb }): Scene {
  const show = (f: Rgb) => toRgb(fromLms(f.map((v, c) => v * WHITE_D65[c]) as Rgb));
  return expose({ papers: papers.map(show), ground: show(ground) });
}

/** Scale the scene down only when a channel would clip, as an auto-exposure would. */
export function expose({ papers, ground }: Scene): Scene {
  const peak = Math.max(1, ...papers.flat());
  const scale = (c: Rgb) => c.map(v => v / peak) as Rgb;
  return { papers: papers.map(scale), ground: scale(ground) };
}

/** Pixel geometry of the display, used by grey world and retinex. Each grid cell is 16 x 16 px. */
export function geometry(layout: "wide" | "narrow") {
  const [gridRows, gridCols] = layout === "wide" ? [8, 12] : [12, 6];
  const rows = gridRows * 16, cols = gridCols * 16;
  // A 1 px seam of black paper on every side of each paper.
  const rects = PAPERS.map(p => {
    const [r0, c0, r1, c1] = p[layout];
    return [(r0 - 1) * 16 + 1, (c0 - 1) * 16 + 1, (r1 - 1) * 16 - 1, (c1 - 1) * 16 - 1] as Area;
  });
  return { rows, cols, rects };
}

/**
 * Grey world: assume the scene averages to grey, so divide each cone channel by the scene's mean
 * and keep the overall level.
 */
export function greyWorld(cones: Cones, layout: "wide" | "narrow"): Scene {
  const { rows, cols, rects } = geometry(layout);
  const sum: Rgb = [0, 0, 0];
  let paperArea = 0;
  rects.forEach(([r0, c0, r1, c1], i) => {
    const a = (r1 - r0) * (c1 - c0);
    paperArea += a;
    for (let c = 0; c < 3; c++) sum[c] += a * cones.papers[i][c];
  });
  const groundArea = rows * cols - paperArea;
  const mean = sum.map((s, c) => (s + groundArea * cones.ground[c]) / (rows * cols));
  const level = mean.reduce((s, m, c) => s + m / cones.white[c], 0) / 3;
  const balance = (lms: Rgb) => lms.map((v, c) => (v / mean[c]) * level) as Rgb;
  return fromWhiteFractions({ papers: cones.papers.map(balance), ground: balance(cones.ground) });
}

/** The papers lit by D65 with the white balance fixed at D65: the colours grey world and retinex aim for. */
function d65Scene(): Scene {
  return expose(cameraScene(6504));
}

/** Linear sRGB to a CSS hex colour. */
export function hex(rgb: Rgb): string {
  return "#" + rgb.map(v => {
    const c = Math.min(1, Math.max(0, v));
    const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(s * 255).toString(16).padStart(2, "0");
  }).join("");
}

/** Black or white, whichever contrasts more with the paper; the worse case is still 4.58:1. */
export function inkFor(rgb: Rgb): "#000" | "#fff" {
  const [r, g, b] = rgb.map(v => Math.min(1, v));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? "#000" : "#fff";
}

/** The colour of a perfect white under T kelvin as the camera records it: the colour of the light itself. */
export function lightColour(T: number): string {
  return hex(expose({ papers: [toRgb(xyz(PERFECT_WHITE, illuminant(T)))], ground: [0, 0, 0] }).papers[0]);
}

/** The colour of a reflectance under T kelvin, as the camera view shows it. Used by the Research figures. */
export function spectrumHex(reflectance: readonly number[], T = 6504): string {
  return hex(expose({ papers: [toRgb(xyz(reflectance, illuminant(T)))], ground: [0, 0, 0] }).papers[0]);
}

const UNDER_D65 = d65Scene();
/** A paper's colour under D65, for places outside the demonstration (navigation swatches, the mark). */
export function paperHex(chip: string): string {
  return hex(UNDER_D65.papers[PAPERS.findIndex(p => p.chip === chip)]);
}
