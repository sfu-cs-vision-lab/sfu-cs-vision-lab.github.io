// Figures for the Research pages, redrawn as SVG from data instead of copied as 1990s GIFs.
// The spectra come from data/mondrian.json (Munsell, CIE); the gamut plots from the numbers in the text.
import type { ReactNode } from "react";
import data from "@/data/mondrian.json";
import { illuminant, spectrumHex } from "@/lib/mondrian";
import styles from "./ResearchFigures.module.css";

const W = data.wavelengths;
const CHIP = "10R 7/6";
const reflectance = (data.chips as Record<string, number[]>)[CHIP];
const daylight = illuminant(6504);
const signal = daylight.map((e, i) => e * reflectance[i]);
const { x: xbar, y: ybar, z: zbar } = data.cmf;

type Point = [number, number];

/** A small line plot: axes in ash ink, data in bone ink. */
function Plot({ width = 200, height = 136, x, y, xLabel, yLabel, xTicks, yTicks, children }: {
  width?: number; height?: number; x: Point; y: Point; xLabel: string; yLabel?: string;
  xTicks: number[]; yTicks?: number[]; children: (sx: (v: number) => number, sy: (v: number) => number) => ReactNode;
}) {
  const m = { l: yLabel ? 40 : 14, r: 10, t: 12, b: 38 };
  const sx = (v: number) => m.l + ((v - x[0]) / (x[1] - x[0])) * (width - m.l - m.r);
  const sy = (v: number) => height - m.b - ((v - y[0]) / (y[1] - y[0])) * (height - m.t - m.b);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.plot} aria-hidden="true">
      <path d={`M${sx(x[0])},${sy(y[1])}V${sy(y[0])}H${sx(x[1])}`} className={styles.axis} />
      {xTicks.map(t => (
        <text key={t} x={sx(t)} y={height - m.b + 16} textAnchor="middle" className={styles.tick}>{t}</text>
      ))}
      {yTicks?.map(t => (
        <text key={t} x={m.l - 6} y={sy(t) + 4} textAnchor="end" className={styles.tick}>{t}</text>
      ))}
      <text x={(sx(x[0]) + sx(x[1])) / 2} y={height - 4} textAnchor="middle" className={styles.label}>{xLabel}</text>
      {yLabel && (
        <text transform={`translate(11 ${(sy(y[0]) + sy(y[1])) / 2}) rotate(-90)`} textAnchor="middle" className={styles.label}>{yLabel}</text>
      )}
      {children(sx, sy)}
    </svg>
  );
}

const curve = (values: number[], sx: (v: number) => number, sy: (v: number) => number) =>
  values.map((v, i) => `${i ? "L" : "M"}${sx(W[i]).toFixed(1)},${sy(v).toFixed(1)}`).join("");
const peak = (values: number[]) => Math.max(...values);
const normalised = (values: number[]) => values.map(v => v / peak(values));

function Spectrum({ values, title, ymax = 1 }: { values: number[]; title: string; ymax?: number }) {
  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>{title}</p>
      <Plot x={[400, 700]} y={[0, ymax]} xLabel="Wavelength (nm)" xTicks={[400, 550, 700]}>
        {(sx, sy) => <path d={curve(values, sx, sy)} className={styles.line} />}
      </Plot>
    </div>
  );
}

function ObservedSpectra() {
  return (
    <div className={styles.row}>
      <Spectrum title="Light: CIE D65 daylight" values={normalised(daylight)} />
      <span className={styles.operator} aria-hidden="true">×</span>
      <Spectrum title={`Surface: Munsell ${CHIP} reflectance`} values={reflectance} />
      <span className={styles.operator} aria-hidden="true">=</span>
      <Spectrum title="Light reaching the eye" values={normalised(signal)} />
    </div>
  );
}

function SampledSpectra() {
  const k = 100 / daylight.reduce((s, e, i) => s + e * ybar[i], 0);
  const sum = (bar: number[]) => k * signal.reduce((s, v, i) => s + v * bar[i], 0);
  const XYZ: [string, number][] = [["X", sum(xbar)], ["Y", sum(ybar)], ["Z", sum(zbar)]];
  const cmfMax = Math.max(peak(xbar), peak(zbar));
  return (
    <div className={styles.row}>
      <Spectrum title="Light reaching the eye" values={normalised(signal)} />
      <span className={styles.operator} aria-hidden="true">→</span>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>Three sensors: CIE 1931 observer</p>
        <Plot x={[400, 700]} y={[0, cmfMax]} xLabel="Wavelength (nm)" xTicks={[400, 550, 700]}>
          {(sx, sy) => (
            <>
              <path d={curve(zbar, sx, sy)} className={styles.line} />
              <path d={curve(ybar, sx, sy)} className={`${styles.line} ${styles.dashed}`} />
              <path d={curve(xbar, sx, sy)} className={`${styles.line} ${styles.dotted}`} />
              <text x={sx(470) + 4} y={sy(zbar[W.indexOf(450)]) + 4} className={styles.direct}>z̄</text>
              <text x={sx(555)} y={sy(ybar[W.indexOf(550)]) - 6} className={styles.direct}>ȳ</text>
              <text x={sx(600) + 8} y={sy(xbar[W.indexOf(600)]) + 2} className={styles.direct}>x̄</text>
            </>
          )}
        </Plot>
      </div>
      <span className={styles.operator} aria-hidden="true">→</span>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>A triplet of values</p>
        <dl className={styles.triplet}>
          {XYZ.map(([name, v]) => (
            <div key={name}><dt>{name}</dt><dd>{v.toFixed(1)}</dd></div>
          ))}
        </dl>
        <p className={styles.swatchRow}>
          <span className={styles.swatch} style={{ background: spectrumHex(reflectance) }} aria-hidden="true" />
          The colour these values describe
        </p>
      </div>
    </div>
  );
}

// ---- Gamut constraint example (Colour Constancy Algorithms, Table 1 and the text) ----

const CANONICAL: Point[] = [[1.5, 2.0], [2.0, 5.0], [4.0, 4.0], [4.0, 3.0]];
const A: Point = [3.2, 4.5];
const B: Point = [1.5, 3.8];
const mappings = (p: Point) => CANONICAL.map(([r, g]) => [r / p[0], g / p[1]] as Point);

/** Convex hull, counter-clockwise (monotone chain). */
function hull(points: Point[]): Point[] {
  const ps = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: Point[]) => {
    const out: Point[] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    return out.slice(0, -1);
  };
  return [...half(ps), ...half([...ps].reverse())];
}

/** Intersection of two convex polygons, both counter-clockwise (Sutherland-Hodgman). */
function intersect(subject: Point[], clip: Point[]): Point[] {
  let out = subject;
  for (let i = 0; i < clip.length; i++) {
    const [a, b] = [clip[i], clip[(i + 1) % clip.length]];
    const inside = (p: Point) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0;
    const cut = (p: Point, q: Point): Point => {
      const [x1, y1, x2, y2, x3, y3, x4, y4] = [p[0], p[1], q[0], q[1], a[0], a[1], b[0], b[1]];
      const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
      return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
    };
    const input = out;
    out = [];
    input.forEach((p, j) => {
      const q = input[(j + 1) % input.length];
      if (inside(q)) { if (!inside(p)) out.push(cut(p, q)); out.push(q); }
      else if (inside(p)) out.push(cut(p, q));
    });
  }
  return out;
}

const polygon = (pts: Point[], sx: (v: number) => number, sy: (v: number) => number) =>
  pts.map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");

function Gamut({ show }: { show: "canonical" | "a" | "b" | "both" }) {
  const hullA = hull(mappings(A));
  const hullB = hull(mappings(B));
  const both = intersect(hullA, hullB);
  const mapped = show !== "canonical";
  return (
    <div className={styles.single}>
      <Plot
        width={420}
        height={320}
        x={mapped ? [0, 3] : [0, 5]}
        y={mapped ? [0, 2] : [0, 5.5]}
        xTicks={mapped ? [0, 1, 2, 3] : [0, 1, 2, 3, 4, 5]}
        yTicks={mapped ? [0, 1, 2] : [0, 1, 2, 3, 4, 5]}
        xLabel={mapped ? "r canonical / r" : "r = R/B"}
        yLabel={mapped ? "g canonical / g" : "g = G/B"}
      >
        {(sx, sy) => (
          <>
            {show === "canonical" && (
              <>
                <polygon points={polygon(hull(CANONICAL), sx, sy)} className={styles.region} />
                {CANONICAL.map(([x, y]) => <circle key={`${x}${y}`} cx={sx(x)} cy={sy(y)} r={4} className={styles.vertex} />)}
                <text x={sx(2.2)} y={sy(3.3)} className={styles.direct}>canonical gamut</text>
                {([["a", A, "start"], ["b", B, "end"]] as [string, Point, "start" | "end"][]).map(([name, p, side]) => (
                  <g key={name}>
                    <circle cx={sx(p[0])} cy={sy(p[1])} r={5} className={styles.point} />
                    <text x={sx(p[0]) + (side === "start" ? 10 : -10)} y={sy(p[1]) + 5} textAnchor={side} className={styles.direct}>
                      {name} ({p[0]}, {p[1]})
                    </text>
                  </g>
                ))}
              </>
            )}
            {(show === "a" || show === "both") && <polygon points={polygon(hullA, sx, sy)} className={styles.region} />}
            {(show === "b" || show === "both") && <polygon points={polygon(hullB, sx, sy)} className={`${styles.region} ${styles.dashedRegion}`} />}
            {show === "both" && <polygon points={polygon(both, sx, sy)} className={styles.overlap} />}
            {(show === "a" || show === "both") && <text x={sx(0.55)} y={sy(1.32)} className={styles.direct}>mappings of a</text>}
            {(show === "b" || show === "both") && <text x={sx(1.9)} y={sy(1.42)} className={styles.direct}>mappings of b</text>}
            {show === "both" && <text x={sx(0.95)} y={sy(0.3)} className={styles.direct}>shaded: consistent with both a and b</text>}
            {show !== "canonical" &&
              (show === "both" ? [...mappings(A), ...mappings(B)] : mappings(show === "a" ? A : B)).map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={sx(x)} cy={sy(y)} r={4} className={styles.vertex} />
              ))}
          </>
        )}
      </Plot>
    </div>
  );
}

const FIGURES: Record<string, { body: () => ReactNode; caption: string; describe: string }> = {
  "observed-spectra": {
    body: ObservedSpectra,
    caption: `The light reaching the eye is the product of the light’s spectrum and the surface’s reflectance. Redrawn for this site from measured data (CIE D65, Munsell ${CHIP}).`,
    describe: `Three plots from 400 to 700 nm: the CIE D65 daylight spectrum, times the reflectance of Munsell paper ${CHIP}, equals the spectrum of the light reaching the eye.`,
  },
  "sampled-spectra": {
    body: SampledSpectra,
    caption: "The eye samples that spectrum with three sensors, reducing it to three numbers. The CIE 1931 standard observer stands in for the eye; X, Y and Z are computed from the spectrum. Redrawn for this site.",
    describe: "The spectrum reaching the eye, the three CIE 1931 colour-matching functions, and the X, Y, Z values they produce.",
  },
  "gamut-canonical": {
    body: () => <Gamut show="canonical" />,
    caption: "Redrawn from the values in Table 1 and the text.",
    describe: "Chromaticity plot: the canonical gamut is the quadrilateral with corners (1.5, 2.0), (2.0, 5.0), (4.0, 4.0) and (4.0, 3.0); a (3.2, 4.5) lies outside it and b (1.5, 3.8) lies to its left.",
  },
  "gamut-a": {
    body: () => <Gamut show="a" />,
    caption: "Redrawn from the values in the text.",
    describe: "The four mappings of a onto the canonical gamut's corners, about (0.47, 0.44), (0.63, 1.1), (1.25, 0.89) and (1.25, 0.67), and their convex hull.",
  },
  "gamut-b": {
    body: () => <Gamut show="b" />,
    caption: "Redrawn from the values in the text.",
    describe: "The four mappings of b onto the canonical gamut's corners, about (1.0, 0.53), (1.33, 1.32), (2.67, 1.05) and (2.67, 0.79), and their convex hull (dashed).",
  },
  "gamut-intersection": {
    body: () => <Gamut show="both" />,
    caption: "Redrawn from the values in the text.",
    describe: "Both convex hulls of mappings overlap in a small region near r 1.0 to 1.25, g 0.6 to 0.9: the illuminations consistent with both a and b.",
  },
};

/** A redrawn figure, named in content markdown by a ```figure fence: first line the name, second an optional caption. */
export default function ResearchFigure({ spec }: { spec: string }) {
  const [name, heading] = spec.trim().split("\n").map(s => s.trim());
  const figure = FIGURES[name];
  if (!figure) return null;
  const Body = figure.body;
  return (
    <figure className={styles.figure} role="group" aria-label={figure.describe}>
      <Body />
      <figcaption>
        {heading && <strong>{heading}. </strong>}
        {figure.caption}
      </figcaption>
    </figure>
  );
}
