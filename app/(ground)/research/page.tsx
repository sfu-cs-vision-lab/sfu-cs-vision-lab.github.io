import Link from "next/link";
import { AREAS, TOPICS, areaContent } from "@/lib/research";

export const metadata = { title: "Research" };

const subheading = "mt-8 text-[15px] font-semibold text-ink";

export default function ResearchPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 md:pt-16">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink [font-stretch:112.5%] md:text-[34px]">
        Research
      </h1>
      <p className="mt-4 max-w-[65ch] text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">
        What the lab works on now, with its papers, code and data, and the earlier work it grew from.
      </p>

      {AREAS.map(area => {
        const { papers, recent, repos, datasets } = areaContent(area);
        return (
          <section
            key={area.slug}
            aria-labelledby={area.slug}
            className="mt-14 grid gap-x-12 border-t border-rule pt-6 md:mt-20 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
          >
            <h2 id={area.slug} className="self-start text-[19px] font-semibold leading-snug text-ink md:sticky md:top-24">
              {area.name}
            </h2>
            <div className="mt-4 md:mt-0">
              <div className="max-w-[62ch] space-y-4 text-[17px] leading-[1.65] md:text-[18px]">
                {area.description.map(text => <p key={text}>{text}</p>)}
              </div>
              {area.draft && (
                <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-ink-2">
                  Draft description, written from:{" "}
                  {area.sources.map((s, i) => (
                    <span key={s.href}>
                      <a href={s.href}>{s.label}</a>
                      {i < area.sources.length - 1 ? " · " : "."}
                    </span>
                  ))}
                </p>
              )}

              {recent.length > 0 && (
                <>
                  <h3 className={subheading}>Recent papers</h3>
                  <ul className="mt-2">
                    {recent.map(p => (
                      <li key={`${p.year}-${p.title}`} className="max-w-[62ch] border-t border-rule py-3 first:border-t-0 first:pt-1">
                        <p className="text-[16px] font-semibold leading-snug text-ink">{p.title}</p>
                        <p className="text-[15px] leading-[1.6] text-ink-2">
                          {p.year}
                          {p.venue && <>&nbsp;· {p.venue}</>}
                        </p>
                        {p.links.doi && (
                          <p className="text-[15px] leading-[2]">
                            <a href={p.links.doi}>DOI</a>
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[15px] leading-[2]">
                    <Link href={`/publications/?q=${encodeURIComponent(area.query)}`}>
                      All {papers.length} {area.name.toLowerCase()} papers
                    </Link>
                  </p>
                </>
              )}

              {repos.length > 0 && (
                <>
                  <h3 className={subheading}>Code</h3>
                  <ul className="mt-2 space-y-1 text-[15px] leading-[2]">
                    {repos.map(r => (
                      <li key={r.name}><Link href={`/code/${r.name}/`}>{r.title}</Link></li>
                    ))}
                  </ul>
                </>
              )}

              {datasets.length > 0 && (
                <>
                  <h3 className={subheading}>Data</h3>
                  <ul className="mt-2 space-y-1 text-[15px] leading-[2]">
                    {datasets.map(d => (
                      <li key={d.doi}><a href={`https://doi.org/${d.doi}`}>{d.title}</a></li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>
        );
      })}

      <section
        aria-labelledby="earlier"
        className="mt-14 grid gap-x-12 border-t border-rule pt-6 md:mt-20 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
      >
        <h2 id="earlier" className="self-start text-[19px] font-semibold leading-snug text-ink md:sticky md:top-24">
          Earlier work
        </h2>
        <div className="mt-4 md:mt-0">
          <p className="max-w-[62ch] text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">
            Pages from the lab’s earlier website, kept as they were written.
          </p>
          <ol className="mt-4">
            {TOPICS.map(t => (
              <li key={t.slug} className="max-w-[62ch] border-t border-rule py-5">
                <h3 className="text-[17px] font-semibold leading-snug">
                  <Link href={`/research/${t.slug}/`}>{t.title}</Link>
                </h3>
                <p className="mt-1 text-[16px] leading-[1.6] text-ink-2">{t.summary}</p>
                <p className="mt-1 text-[14px] text-ink-2">Written in {t.written}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
