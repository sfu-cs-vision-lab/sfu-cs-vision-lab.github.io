import Link from "next/link";
import Mondrian from "@/components/Mondrian";
import { REPOS } from "@/lib/github";

// The four most recently updated repos.
const recent = REPOS.slice(0, 4);

const sources = [
  { label: "Retinex in MATLAB (2004)", href: "https://doi.org/10.1117/1.1636761" },
  { label: "retinex-matlab code", href: "https://github.com/sfu-cs-vision-lab/retinex-matlab" },
  { label: "Munsell matte spectra, University of Eastern Finland", href: "https://zenodo.org/records/3269912" },
  { label: "CIE 1931 colour-matching functions", href: "https://doi.org/10.25039/CIE.DS.xvudnb9b" },
];

export default function Home() {
  return (
    <main id="content" className="on-ground bg-ground font-archivo text-ink">
      <Mondrian />

      {/* About: reached from the menu and the About paper at /#about; it has no page of its own. */}
      <section id="about" aria-labelledby="about-heading" className="mx-auto grid max-w-6xl gap-x-12 gap-y-6 px-4 pt-24 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:pt-32">
        <h2 id="about-heading" className="text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink [font-stretch:112.5%] [text-wrap:balance] md:text-[34px]">
          About the lab
        </h2>
        <div className="max-w-[40ch] space-y-6 text-[22px] leading-[1.45] text-ink md:text-[28px] md:leading-[1.4]">
          <p>
            The Computational Vision Lab is part of the{" "}
            <a href="https://www.sfu.ca/computing.html">School of Computing Science</a> at{" "}
            <a href="https://www.sfu.ca/">Simon Fraser University</a> in Burnaby, British Columbia, and is directed by{" "}
            <Link href="/people/">Dr. Brian Funt</Link>.
          </p>
          <p>
            Since 1988 members of the lab have worked on how a camera or an eye can recover the colours of surfaces when
            the light changes. Major areas of research have been{" "}
            <Link href="/research/#illumination-estimation">colour constancy and the estimation of the scene illumination</Link>,
            including <Link href="/code/retinex-matlab/">retinex</Link>; the calculation of the physical extent of
            metamerism using <Link href="/research/#metamer-mismatching">metamer mismatch bodies</Link>; models of surface
            reflectance and illumination spectra; <Link href="/research/sensor-sharpening/">spectral sharpening</Link> of
            camera sensors; <Link href="/research/colour-indexing/">colour-based object recognition</Link>; camera and
            display calibration; and, more recently, <Link href="/research/#cinema-colour">colour for cinema</Link>. Much
            of this work applies directly to photographic imaging systems: automatic white balance and colour correction
            in digital cameras, camera calibration and the accuracy of colour sensors, and the colour pipelines of film
            production. The lab publishes its{" "}
            <Link href="/data/">datasets</Link> and <Link href="/code/">code</Link> openly.
          </p>
        </div>
      </section>

      <section aria-labelledby="looking" className="mx-auto grid max-w-6xl gap-x-12 gap-y-6 px-4 pb-16 pt-20 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:pb-24 md:pt-28">
        <h2 id="looking" className="text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink [font-stretch:112.5%] [text-wrap:balance] md:text-[34px]">
          What you&rsquo;re looking at
        </h2>
        <div className="max-w-[65ch] space-y-5 text-[17px] leading-[1.65] md:text-[18px]">
          <p>
            Every colour on this display is computed from measured spectra. Move the light and, with the white balance
            fixed, the colours shift with it; switch the white balance to Retinex and the lab&rsquo;s own code keeps them
            nearly steady.
          </p>
          <p>
            Twelve papers from the Munsell Book of Color, matte collection, on a black ground of flat 1.2% reflectance.
            The colour of each paper on your screen is computed from its measured reflectance spectrum, the spectrum of
            the light, and the CIE 1931 standard observer, then converted to sRGB. None of them is a picked colour.
            Lights below 4000&nbsp;K are blackbody radiators, lights above 5000&nbsp;K are CIE daylight, and lights in
            between are a blend of the two.
          </p>
          <p>
            Move the light and the signal from every paper changes. With the white balance <em>Fixed (D65)</em>, the
            papers look as a camera with the CIE 1931 sensitivities records them when set for D65, so the colour of the
            light shows.{" "}
            <em>Grey world</em> assumes the scene averages to grey and scales each cone channel to match.{" "}
            <em>Retinex</em> builds the lightness of each area from ratios with its neighbours, at several scales, so the
            brightest area in each channel becomes white. Neither is told what the light is. Both show their result as
            colours under D65, so the colours they aim for are the ones <em>Fixed (D65)</em> shows with the light at
            D65. They don&rsquo;t reach them exactly, but their colours change far less than the fixed white
            balance&rsquo;s when the light moves.
          </p>
          <p>
            Edwin Land and John McCann used displays like this, which they called Mondrians, to study why colours look
            stable when the light changes. In 1988 Brian Funt and Mark Drew published{" "}
            <a href="https://doi.org/10.1109/CVPR.1988.196288"><cite>Color constancy computation in near-Mondrian scenes
            using a finite dimensional linear model</cite></a> (CVPR). The Retinex white balance runs the lab&rsquo;s
            own code: the McCann99 retinex from Funt, Ciurea and McCann&rsquo;s <cite>Retinex in MATLAB</cite>, ported
            to run in your browser.
          </p>
          <p className="max-w-[58ch] pt-2 text-[14px] leading-relaxed text-ink-2">
            Sources:{" "}
            {sources.map((s, i) => (
              <span key={s.href}>
                <a href={s.href}>{s.label}</a>
                {i < sources.length - 1 ? " · " : "."}
              </span>
            ))}{" "}
            Grey world and retinex run on Hunt&ndash;Pointer&ndash;Est&eacute;vez cone signals. CIE data under CC BY-SA 4.0;
            the retinex port under AGPL-3.0.
          </p>
        </div>
      </section>

      <section aria-labelledby="recent" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:pb-32">
        <h2 id="recent" className="mb-8 text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink [font-stretch:112.5%] [text-wrap:balance] md:text-[34px]">
          Recent code and data
        </h2>
        <ol>
          {recent.map(r => (
            <li key={r.name} className="grid gap-x-12 gap-y-2 border-t border-rule py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <h3 className="text-[19px] font-semibold leading-snug text-ink">
                <Link href={`/code/${r.name}/`}>{r.title}</Link>
              </h3>
              <div className="max-w-[65ch]">
                {r.summary && <p className="text-[16px] leading-[1.6] text-ink-2">{r.summary}</p>}
                <p className="mt-2 flex flex-wrap gap-x-5 text-[15px] leading-[2]">
                  {r.paper && <a href={r.paper}>Paper</a>}
                  {r.data && <a href={r.data.url}>Data</a>}
                  <a href={r.github}>GitHub</a>
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-2 flex gap-x-6 border-t border-rule pt-6 text-[15px] leading-[2]">
          <Link href="/code/">All code</Link>
          <Link href="/data/">All datasets</Link>
        </p>
      </section>
    </main>
  );
}
