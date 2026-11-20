"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import styles from "./Mondrian.module.css";
import {
  PAPERS, LIGHTS, KELVIN_MIN, KELVIN_MAX, cameraScene, coneScene, expose, fromWhiteFractions, geometry, greyWorld,
  hex, inkFor, lightColour, type Scene, type View,
} from "@/lib/mondrian";
import type { RetinexJob, RetinexResult } from "@/lib/retinex.worker";

// The slider is linear in mired (1e6 / kelvin), which spaces colour change evenly along it.
const WARM = 1e6 / KELVIN_MIN;
const COOL = 1e6 / KELVIN_MAX;
const toSlider = (k: number) => Math.round((1000 * (WARM - 1e6 / k)) / (WARM - COOL));
const fromSlider = (s: number) => 1e6 / (WARM - (s / 1000) * (WARM - COOL));

const VIEWS: { id: View; label: string }[] = [
  { id: "camera", label: "Fixed (D65)" },
  { id: "grey", label: "Grey world" },
  { id: "retinex", label: "Retinex" },
];

// The track is the colour of the light itself at each point along the slider.
const TRACK = `linear-gradient(to right, ${Array.from({ length: 13 }, (_, i) => lightColour(fromSlider((i * 1000) / 12))).join(", ")})`;

export default function Mondrian() {
  const [kelvin, setKelvin] = useState(6504);
  const [view, setView] = useState<View>("camera");
  const [layout, setLayout] = useState<"wide" | "narrow">("wide");
  const [retinex, setRetinex] = useState<Scene | null>(null);

  const kelvinNow = useRef(kelvin);
  kelvinNow.current = kelvin;
  const frame = useRef(0);
  const reducedMotion = useRef(false);

  const camera = useMemo(() => cameraScene(kelvin), [kelvin]);
  const cones = useMemo(() => coneScene(kelvin), [kelvin]);

  const animateTo = (target: number, ms: number, delay = 0, then?: () => void) => {
    cancelAnimationFrame(frame.current);
    if (reducedMotion.current) return setKelvin(target);
    // Every frame is computed from the light's spectrum at that temperature; nothing is faded in sRGB.
    const from = 1e6 / kelvinNow.current, to = 1e6 / target, start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start - delay) / ms));
      const eased = p === 1 ? 1 : 1 - 2 ** (-10 * p);
      setKelvin(1e6 / (from + (to - from) * eased));
      if (p < 1) frame.current = requestAnimationFrame(step);
      else then?.();
    };
    frame.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const wide = matchMedia("(min-width: 768px)");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setLayout(wide.matches ? "wide" : "narrow");
      reducedMotion.current = motion.matches;
    };
    update();
    wide.addEventListener("change", update);
    motion.addEventListener("change", update);
    // One authored moment: the light swings from D65 to tungsten and back after the page settles.
    const timer = setTimeout(() => { if (!motion.matches) animateTo(2856, 1600, 0, () => animateTo(6504, 1600, 900)); }, 700);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame.current);
      wide.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  // Retinex runs in a worker. One job at a time; while one runs, only the newest request waits.
  const worker = useRef<Worker | null>(null);
  const busy = useRef(false);
  const queued = useRef<RetinexJob | null>(null);
  const lastId = useRef(0);

  useEffect(() => {
    if (view !== "retinex") return;
    if (!worker.current) {
      worker.current = new Worker(new URL("../lib/retinex.worker.ts", import.meta.url));
      worker.current.onmessage = (e: MessageEvent<RetinexResult>) => {
        if (e.data.id === lastId.current) setRetinex(fromWhiteFractions(e.data));
        busy.current = false;
        if (queued.current) { worker.current!.postMessage(queued.current); busy.current = true; queued.current = null; }
      };
    }
    const { rows, cols, rects } = geometry(layout);
    const job: RetinexJob = { id: ++lastId.current, rows, cols, rects, papers: cones.papers, ground: cones.ground };
    if (busy.current) queued.current = job;
    else { worker.current.postMessage(job); busy.current = true; }
  }, [view, cones, layout]);

  useEffect(() => () => worker.current?.terminate(), []);

  const scene =
    view === "grey" ? greyWorld(cones, layout)
    : view === "retinex" && retinex ? retinex
    : expose(camera);

  const preset = LIGHTS.find(l => Math.abs(l.kelvin - kelvin) < 30);

  return (
    <section data-mondrian className={styles.stage} style={{ background: hex(scene.ground) }} aria-label="Colour Mondrian">
      <div data-mondrian-grid className={styles.grid}>
        {PAPERS.map((p, i) => {
          const style = {
            "--wide": p.wide.join(" / "),
            "--narrow": p.narrow.join(" / "),
            background: hex(scene.papers[i]),
            color: inkFor(scene.papers[i]),
          } as CSSProperties;
          const notation = <span className={styles.notation} aria-hidden="true">{p.chip}</span>;
          if (p.title) {
            return (
              <div key={p.chip} className={`${styles.paper} ${styles.title}`} style={style}>
                {notation}
                <h1>Computational Vision Lab</h1>
                <p><a href="https://www.sfu.ca/">Simon Fraser University</a> · <a href="https://www.sfu.ca/computing.html">School of Computing Science</a></p>
              </div>
            );
          }
          if (p.href) {
            return (
              <Link key={p.chip} href={p.href} className={`${styles.paper} ${styles.link}`} style={style}>
                {notation}
                <span className={styles.label}>{p.label}</span>
              </Link>
            );
          }
          return <div key={p.chip} className={styles.paper} style={style} aria-hidden="true">{notation}</div>;
        })}
      </div>

      <noscript dangerouslySetInnerHTML={{ __html: `<style>.${styles.controls}{display:none}</style>` }} />
      <div className={styles.controls}>
        <div className={styles.light}>
          <label htmlFor="light">Light source</label>
          <input
            id="light"
            className={styles.slider}
            type="range"
            min={0}
            max={1000}
            value={toSlider(kelvin)}
            style={{ "--track": TRACK } as CSSProperties}
            aria-valuetext={`${Math.round(kelvin)} kelvin${preset ? `, ${preset.name}` : ""}`}
            onChange={e => { cancelAnimationFrame(frame.current); setKelvin(fromSlider(Number(e.target.value))); }}
          />
          <output htmlFor="light" className={styles.readout}>
            {Math.round(kelvin)} K
          </output>
        </div>

        <div className={styles.presets} role="group" aria-labelledby="presets-label">
          <span id="presets-label">Presets</span>
          {LIGHTS.map(l => (
            <button key={l.name} type="button" aria-pressed={preset?.name === l.name} onClick={() => animateTo(l.kelvin, 700)}>
              {l.name}
            </button>
          ))}
        </div>

        <div className={styles.views} role="radiogroup" aria-labelledby="view-label">
          <span id="view-label">White balance</span>
          {VIEWS.map(v => (
            <label key={v.id}>
              <input type="radio" name="view" value={v.id} checked={view === v.id} onChange={() => setView(v.id)} />
              <span>{v.label}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
