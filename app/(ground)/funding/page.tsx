import funding from "@/data/funding.json";
import publications from "@/data/publications.json";

export const metadata = { title: "Funding" };

type Funder = {
  name: string;
  detail?: string;
  href?: string;
  papers?: string[];
  usedFor?: { label: string; href: string }[];
  onOldPage?: boolean;
};

const paperByDoi = new Map(publications.publications.map(p => [p.doi?.toLowerCase(), p]));
const anchor = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");

export default function FundingPage() {
  const funders = funding.funders as Funder[];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6 md:pt-20">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink [font-stretch:112.5%] md:text-[34px]">
        Funding
      </h1>
      <p className="mt-4 max-w-[65ch] text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">
        Organisations that have funded or supported the lab’s research, with the papers and data that credit them.
      </p>
      {funding.draft && (
        <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-ink-2">
          Placeholder, to be confirmed with Brian Funt. Gathered from the funders credited in the papers’ publisher
          records (Crossref), the lab’s <a href={funding.oldPage}>earlier funding page</a> (2007), and the computing
          settings in the lab’s code.
        </p>
      )}

      {funders.map(f => {
        const papers = (f.papers ?? []).map(doi => paperByDoi.get(doi.toLowerCase())).filter(p => p !== undefined);
        const id = anchor(f.name);
        return (
          <section
            key={f.name}
            aria-labelledby={id}
            className="mt-14 grid gap-x-12 border-t border-rule pt-6 md:mt-20 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
          >
            <h2 id={id} className="self-start text-[19px] font-semibold leading-snug text-ink md:sticky md:top-24">
              {f.href ? <a href={f.href}>{f.name}</a> : f.name}
            </h2>
            <div className="mt-2 max-w-[60ch] md:mt-0">
              {f.detail && <p className="text-[17px] leading-[1.6] text-ink">{f.detail}</p>}
              {papers.length > 0 && (
                <>
                  <p className={`${f.detail ? "mt-4" : ""} text-[15px] leading-[1.6] text-ink-2`}>
                    Credited in {papers.length} {papers.length === 1 ? "paper" : "papers"}
                    {papers.length > 1 && <>, {papers[papers.length - 1].year}–{papers[0].year}</>}
                  </p>
                  <ol className="mt-2">
                    {papers.map(p => (
                      <li key={p.doi} className="border-b border-rule py-3 last:border-b-0">
                        <a href={`https://doi.org/${p.doi}`} className="text-[16px] leading-[1.5]">{p.title}</a>
                        <p className="text-[15px] leading-[1.6] text-ink-2">
                          {p.venue}, {p.year}
                        </p>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {f.usedFor && f.usedFor.length > 0 && (
                <p className="mt-3 text-[15px] leading-[1.6] text-ink-2">
                  Used for:{" "}
                  {f.usedFor.map((u, i) => (
                    <span key={u.href}>
                      <a href={u.href}>{u.label}</a>
                      {i < f.usedFor!.length - 1 ? ", " : "."}
                    </span>
                  ))}
                </p>
              )}
              {f.onOldPage && (
                <p className="mt-3 text-[15px] leading-[1.6] text-ink-2">
                  Listed on the lab’s <a href={funding.oldPage}>earlier funding page</a> (2007).
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
