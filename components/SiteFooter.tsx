import Link from "next/link";
import { SECTIONS } from "@/lib/mondrian";

const elsewhere = [
  { label: "GitHub", href: "https://github.com/sfu-cs-vision-lab" },
  { label: "Zenodo", href: "https://zenodo.org/communities/sfu-cs-vision-lab" },
];

export default function SiteFooter() {
  return (
    <footer className="on-ground border-t border-rule bg-ground font-archivo text-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="text-[19px] font-semibold [font-stretch:112.5%]">Computational Vision Lab</p>
          <address className="mt-3 text-[15px] not-italic leading-relaxed text-ink-2">
            <a href="https://www.sfu.ca/computing.html">School of Computing Science</a>
            <br />
            <a href="https://www.sfu.ca/">Simon Fraser University</a>
            <br />
            <a href="https://maps.app.goo.gl/NWBZUYLgQrukSJ918">Burnaby, BC V5A 1S6, Canada</a>
          </address>
        </div>
        <nav aria-label="Sections">
          <ul className="space-y-1 text-[15px] leading-[2]">
            {SECTIONS.map(s => (
              <li key={s.href}><Link href={s.href} className="inline-block">{s.name}</Link></li>
            ))}
          </ul>
        </nav>
        <ul className="space-y-1 text-[15px] leading-[2]">
          {elsewhere.map(e => (
            <li key={e.href}><a href={e.href} className="inline-block">{e.label}</a></li>
          ))}
        </ul>
      </div>
      <div className="mx-auto max-w-6xl border-t border-rule px-4 py-6 text-[14px] text-ink-2 sm:px-6">
        © {new Date().getFullYear()} Computational Vision Lab, Simon Fraser University
      </div>
    </footer>
  );
}
