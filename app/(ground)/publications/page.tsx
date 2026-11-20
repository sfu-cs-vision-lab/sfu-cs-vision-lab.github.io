import Link from "next/link";
import data from "@/data/publications.json";
import CiteButton from "@/components/CiteButton";
import PublicationFilter from "@/components/PublicationFilter";
import { publicationAnchor, publicationText } from "@/lib/search";

export const metadata = { title: "Publications" };

type Publication = (typeof data.publications)[number];

const decadeOf = (year: number) => Math.floor(year / 10) * 10;

function Entry({ p }: { p: Publication }) {
  const { doi, paperPage, code, data: dataset } = p.links;
  return (
    <li
      id={publicationAnchor(p)}
      data-pub
      data-text={publicationText(p)}
      className="scroll-mt-24 border-b border-rule py-5 first:pt-0 last:border-b-0 [&>*]:max-w-[62ch]"
    >
      <h3 className="text-[17px] font-semibold leading-snug text-ink">{p.title}</h3>
      {p.authors.length > 0 && <p className="mt-1 text-[16px] leading-[1.6] text-ink-2">{p.authors.join(", ")}</p>}
      <p className="text-[15px] leading-[1.6] text-ink-2">
        {/* The non-breaking space keeps the dot with the venue when the line wraps. */}
        {p.venue && <>{p.venue}&nbsp;· </>}
        {p.type}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-5 text-[15px] leading-[2]">
        {doi && <a href={doi}>DOI</a>}
        {paperPage && <a href={paperPage}>Paper page</a>}
        {code && <Link href={code}>Code</Link>}
        {dataset && <a href={dataset}>Data</a>}
        <CiteButton
          text={p.bibtex}
          label="Copy BibTeX"
          className="cursor-pointer bg-transparent p-0 text-ink underline decoration-ink-2 decoration-1 underline-offset-4 hover:decoration-ink hover:decoration-2"
        />
      </p>
    </li>
  );
}

export default function PublicationsPage() {
  const pubs = data.publications;
  const years = [...new Set(pubs.map(p => p.year))];
  const decades = [...new Set(years.map(decadeOf))];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 md:pt-16">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink [font-stretch:112.5%] md:text-[34px]">
        Publications
      </h1>
      <p className="mt-4 max-w-[65ch] text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">
        {pubs.length} publications from {Math.min(...years)} to {Math.max(...years)}, from the ORCID records of Brian Funt
        and of current lab members since they joined. Theses are listed on <Link href="/people/">People</Link>.
      </p>

      <PublicationFilter total={pubs.length} />

      <nav aria-label="Decades" data-decades className="mt-6 flex flex-wrap gap-x-5 text-[15px] leading-[2]">
        {decades.map(d => (
          <a key={d} href={`#d${d}`}>{d}s</a>
        ))}
      </nav>

      {decades.map(d => (
        <div key={d} id={`d${d}`} data-decade className="scroll-mt-24">
          {years.filter(y => decadeOf(y) === d).map(y => (
            <section
              key={y}
              data-year
              aria-labelledby={`y${y}`}
              className="mt-12 grid gap-x-12 border-t border-rule pt-6 md:mt-16 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
            >
              <h2 id={`y${y}`} className="self-start text-[19px] font-semibold tabular-nums leading-snug text-ink md:sticky md:top-24">
                {y}
              </h2>
              <ol className="mt-4 md:mt-0">
                {pubs.filter(p => p.year === y).map(p => (
                  <Entry key={`${p.year}-${p.title}`} p={p} />
                ))}
              </ol>
            </section>
          ))}
        </div>
      ))}
    </div>
  );
}
