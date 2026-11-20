import ReactMarkdown from "react-markdown";
import zenodo from "@/data/zenodo.json";
import earlier from "@/data/legacy-datasets.json";
import publications from "@/data/publications.json";
import CiteButton from "@/components/CiteButton";

export const metadata = { title: "Data" };

type Paper = (typeof publications.publications)[number];

const paperByDoi = new Map(publications.publications.map(p => [p.doi?.toLowerCase(), p]));

// Zenodo descriptions are HTML; they are shown as markdown so that no raw HTML reaches the page.
const toMarkdown = (html: string) =>
  html
    .replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<\/?(?:em|i)>/gi, "*")
    .replace(/<\/?(?:strong|b)>/gi, "**")
    .replace(/<\/p>|<br\s*\/?>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .trim();

/** "cc-by-sa-4.0" as "CC BY-SA 4.0", with its deed. */
function licence(id: string | null) {
  const cc = id?.match(/^cc-([a-z-]+)-(\d\.\d)$/);
  if (cc) return <a href={`https://creativecommons.org/licenses/${cc[1]}/${cc[2]}/`}>CC {cc[1].toUpperCase()} {cc[2]}</a>;
  return id;
}

const size = (bytes: number) =>
  bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)}\u00a0GB` : bytes >= 1e6 ? `${Math.round(bytes / 1e6)}\u00a0MB` : `${Math.round(bytes / 1e3)}\u00a0KB`;

const date = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

// "Forsythe, Alexander G." as "Alexander G. Forsythe", as on Publications.
const displayName = (n: string) => n.split(", ").reverse().join(" ");

// Descriptions are plain text from data/legacy-datasets.json; the university and the School are linked.
const PLACES: Record<string, string> = {
  "Simon Fraser University": "https://www.sfu.ca/",
  "School of Computing Science": "https://www.sfu.ca/computing.html",
};
const withPlaceLinks = (text: string) =>
  text.split(/(Simon Fraser University|School of Computing Science)/).map((part, i) =>
    PLACES[part] ? <a key={i} href={PLACES[part]}>{part}</a> : part,
  );

const linkRow = "mt-2 flex flex-wrap items-center gap-x-5 text-[15px] leading-[2]";
const textButton =
  "cursor-pointer bg-transparent p-0 text-ink underline decoration-ink-2 decoration-1 underline-offset-4 hover:decoration-ink hover:decoration-2";

function Papers({ papers }: { papers: Paper[] }) {
  return papers.map(p => (
    <p key={p.doi} className="mt-2 text-[15px] leading-[1.6] text-ink-2">
      Paper: <a href={`https://doi.org/${p.doi}`}>{p.title}</a>, {p.venue}, {p.year}
    </p>
  ));
}

function Section({ id, title, count, children }: { id: string; title: string; count: number; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-14 grid gap-x-12 border-t border-rule pt-6 md:mt-20 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <h2 id={id} className="self-start text-[19px] font-semibold leading-snug text-ink md:sticky md:top-24">
        {title}
        <span className="ml-2 font-normal text-ink-2">{count}</span>
      </h2>
      <div className="mt-4 md:mt-0">{children}</div>
    </section>
  );
}

const entry = "border-b border-rule py-6 first:pt-0 last:border-b-0 [&>*]:max-w-[60ch]";

export default function DataPage() {
  // The fetch lists every version, newest first; show the newest of each.
  const records = zenodo.datasets.filter((d, i, all) => all.findIndex(e => e.conceptdoi === d.conceptdoi) === i);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 md:pt-16">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink [font-stretch:112.5%] md:text-[34px]">
        Data
      </h1>
      <p className="mt-4 max-w-[65ch] text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">
        Datasets from the lab, with the papers that describe them. New datasets are published in the lab’s{" "}
        <a href={`https://zenodo.org/communities/${zenodo.community}`}>Zenodo community</a>, each with a DOI, a version and a
        licence.
      </p>

      <Section id="zenodo" title="On Zenodo" count={records.length}>
        {records.length === 0 ? (
          <p className="text-[17px]">
            No Zenodo records are listed here right now. See the lab’s{" "}
            <a href={`https://zenodo.org/communities/${zenodo.community}`}>Zenodo community</a>.
          </p>
        ) : (
          <ol>
            {records.map(d => (
              <li key={d.id} className={entry}>
                <h3 className="text-[17px] font-semibold leading-snug text-ink">{d.title}</h3>
                <p className="mt-1 text-[16px] leading-[1.6] text-ink-2">{d.creators.map(displayName).join(", ")}</p>
                <p className="text-[15px] leading-[1.6] text-ink-2">
                  Version {d.version}&nbsp;· {date(d.publishedAt)}&nbsp;· {licence(d.license)}&nbsp;· {d.files.length}&nbsp;files, {size(d.files.reduce((sum, f) => sum + f.size, 0))}
                </p>
                <div className="mt-3 space-y-3 text-[16px] leading-[1.65] text-ink">
                  <ReactMarkdown>{toMarkdown(d.description)}</ReactMarkdown>
                </div>
                <p className={linkRow}>
                  <a href={`https://doi.org/${d.doi}`}>Zenodo record</a>
                  <CiteButton text={d.bibtex} label="Copy BibTeX" className={textButton} />
                </p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section id="earlier" title="Earlier datasets" count={earlier.datasets.length}>
        <ol>
          {earlier.datasets.map(d => (
            <li key={d.title} className={entry}>
              <h3 className="text-[17px] font-semibold leading-snug text-ink">{d.title}</h3>
              {d.byline && <p className="mt-1 text-[16px] leading-[1.6] text-ink-2">{d.byline}</p>}
              {d.description.length > 0 && (
                <div className="mt-3 space-y-3 text-[16px] leading-[1.65] text-ink">
                  {d.description.map(p => <p key={p}>{withPlaceLinks(p)}</p>)}
                </div>
              )}
              <Papers papers={(d.papers ?? []).map(doi => paperByDoi.get(doi.toLowerCase())).filter(p => p !== undefined)} />
              <p className={linkRow}>
                {d.links.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="barnard" title="Barnard’s datasets" count={earlier.barnard.datasets.length}>
        <p className="max-w-[60ch] text-[16px] leading-[1.65] text-ink">{earlier.barnard.description}</p>
        <ul className="mt-4 text-[16px] leading-[2]">
          {earlier.barnard.datasets.map(d => (
            <li key={d.href}><a href={d.href}>{d.title}</a></li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
