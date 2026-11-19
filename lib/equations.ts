// Equations from the lab's 1999 research pages, retyped as MathML from the original GIF images.
// Content markdown refers to them by id: `eq:id` inline, `eqb:id` as a display equation.
// The comment on each names the GIF it replaces (https://www.cs.sfu.ca/~colour/research/).

const lambda = "<mi>λ</mi>";
const lambda0 = "<msub><mi>λ</mi><mn>0</mn></msub>";
const of = (body: string, arg = lambda) => `<mrow>${body}<mo stretchy="false">(</mo>${arg}<mo stretchy="false">)</mo></mrow>`;
const E = (arg?: string) => of("<mi>E</mi>", arg);
const S = (sub?: string, arg?: string) => of(sub ? `<msub><mi>S</mi><mi>${sub}</mi></msub>` : "<mi>S</mi>", arg);
const Rk = (arg?: string) => of("<msup><mi>R</mi><mi>k</mi></msup>", arg);
const rho = (sub?: string) => (sub ? `<msubsup><mi>ρ</mi><mi>${sub}</mi><mi>k</mi></msubsup>` : "<msup><mi>ρ</mi><mi>k</mi></msup>");
const integral = (body: string) => `<mo>∫</mo>${body}<mspace width="0.17em"/><mi>d</mi><mi>λ</mi>`;
const frac = (top: string, bottom: string) => `<mfrac><mrow>${top}</mrow><mrow>${bottom}</mrow></mfrac>`;

const EQUATIONS: Record<string, string> = {
  // CCCI-math-images/image1.gif
  response: `${rho()}<mo>=</mo>${integral(E() + S() + Rk())}`,
  // image2.gif
  rho: rho(),
  // image3.gif, image9.gif, image58.gif, image66.gif
  E: E(),
  // image4.gif, image67.gif
  S: S(),
  // image5.gif
  Rk: Rk(),
  // image6.gif, image55.gif
  ratio: `${frac(rho("A"), rho("B"))}<mo>=</mo>${frac(integral(E() + S("A") + Rk()), integral(E() + S("B") + Rk()))}`,
  // image7.gif, image56.gif
  SA: S("A"),
  // image8.gif, image57.gif
  SB: S("B"),
  // image10.gif, image59.gif
  R: of("<mi>R</mi>"),
  // image11.gif, image60.gif
  lambda0,
  // image12.gif, image61.gif, transcribed as drawn
  sifted: `${frac(rho("A"), rho("B"))}<mo>=</mo>${frac(
    integral(E(lambda0) + S("A", lambda0) + Rk(lambda0)),
    integral(E(lambda0) + S("B", lambda0) + Rk(lambda0)),
  )}<mo>=</mo>${frac(S("A", lambda0), S("B", lambda0))}`,
  // image62.gif, image63.gif
  rhoA: rho("A"),
  rhoB: rho("B"),
  // image64.gif
  K: "<msubsup><mi>K</mi><mrow><mi>A</mi><mo>,</mo><mi>B</mi></mrow><mi>k</mi></msubsup>",
  // image65.gif
  scaling: `${rho("A")}<mo>=</mo><msubsup><mi>K</mi><mrow><mi>A</mi><mo>,</mo><mi>B</mi></mrow><mi>k</mi></msubsup>${rho("B")}`,
};

/** MathML markup for an equation id, or null when the id is unknown. */
export function mathml(id: string, display: "inline" | "block"): string | null {
  const body = EQUATIONS[id];
  return body ? `<math display="${display}"><mrow>${body}</mrow></math>` : null;
}
