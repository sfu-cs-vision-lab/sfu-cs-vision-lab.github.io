import Image from "next/image";
import type { Person, PeopleData } from "@/lib/types";
import people from "@/data/people.json";
import publications from "@/data/publications.json";
import { matchesQuery, publicationText } from "@/lib/search";

export const metadata = { title: "People" };

const pubs = publications.publications;
const count = (q: string) => pubs.filter(p => matchesQuery(publicationText(p), q)).length;
const plainName = (name: string) => name.replace(/^Dr\.?\s+/, "");

/**
 * The Publications filter that lists a person's papers, and how many it finds. The surname alone when it finds
 * exactly the papers they wrote; otherwise their author names as quoted phrases, so another author with the
 * same surname is left out.
 */
function papersBy(name: string) {
  const words = plainName(name).replace(/\s*\([^)]*\)/g, "").split(/\s+/);
  const surname = words[words.length - 1].toLowerCase();
  const initial = words[0][0].toLowerCase();
  const forms = [...new Set(pubs.flatMap(p => p.authors))].filter(a => {
    const parts = a.toLowerCase().split(/\s+/);
    return parts[parts.length - 1] === surname && a[0].toLowerCase() === initial;
  });
  if (forms.length === 0) return undefined;
  const exact = forms.map(f => `"${f}"`).join("|");
  const query = count(surname) === count(exact) ? words[words.length - 1] : exact;
  return { query, count: count(query) };
}

/** Former students with two degrees from the lab are listed once, with both theses. */
function byPerson(former: Person[]) {
  const groups = new Map<string, Person[]>();
  for (const p of former) groups.set(plainName(p.name), [...(groups.get(plainName(p.name)) ?? []), p]);
  return [...groups.values()].map(degrees => ({
    name: degrees.find(d => d.name.startsWith("Dr"))?.name ?? degrees[0].name,
    degrees,
    site: degrees.find(d => d.links?.site)?.links?.site,
    linkedin: degrees.find(d => d.links?.linkedin)?.links?.linkedin,
    orcid: degrees.find(d => d.links?.orcid)?.links?.orcid,
  }));
}

const linkRow = "mt-2 flex flex-wrap gap-x-5 text-[15px] leading-[2] empty:hidden";

function PapersLink({ name }: { name: string }) {
  const papers = papersBy(name);
  if (!papers) return null;
  return (
    <a href={`/publications/?q=${encodeURIComponent(papers.query)}`}>
      {papers.count} {papers.count === 1 ? "publication" : "publications"}
    </a>
  );
}

function Portrait({ src, name }: { src: string; name: string }) {
  return (
    <Image src={src} alt={name} width={480} height={628} className="aspect-[3/4] w-[112px] shrink-0 object-cover md:w-[144px]" />
  );
}

function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-14 grid gap-x-12 border-t border-rule pt-6 md:mt-20 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <h2 id={id} className="self-start text-[19px] font-semibold leading-snug text-ink md:sticky md:top-24">
        {title}
        {count !== undefined && <span className="ml-2 font-normal text-ink-2">{count}</span>}
      </h2>
      <div className="mt-4 md:mt-0">{children}</div>
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-[15px] font-semibold text-ink">{title}</h4>
      <ul className="mt-1 text-[15px] leading-[1.6] text-ink-2">
        {items.map(x => <li key={x} className="mt-1">{x}</li>)}
      </ul>
    </div>
  );
}

export default function PeoplePage() {
  const { director, current, former } = people as PeopleData;
  const alumni = byPerson(former);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 md:pt-16">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink [font-stretch:112.5%] md:text-[34px]">
        People
      </h1>
      <p className="mt-4 max-w-[65ch] text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">
        The lab’s director, its current students, and the students who earned their degrees here, each with their
        thesis and their papers with the lab.
      </p>

      <Section id="director" title="Director">
        <div className="flex gap-5 md:gap-6">
          {director.image && <Portrait src={director.image} name={plainName(director.name)} />}
          <div>
            <h3 className="text-[17px] font-semibold leading-snug text-ink">{director.name}</h3>
            <p className="text-[16px] leading-[1.6] text-ink-2">{director.title}</p>
            <p className={linkRow}>
              <a href="/publications/">All {pubs.length} publications</a>
              {director.links?.orcid && <a href={director.links.orcid}>ORCID</a>}
              {director.links?.scholar && <a href={director.links.scholar}>Google Scholar</a>}
              {director.links?.github && <a href={director.links.github}>GitHub</a>}
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <List title="Research interests" items={director.researchInterests} />
          <List title="Education" items={director.education} />
        </div>
      </Section>

      <Section id="current" title="Current students" count={current.length}>
        {current.length === 0 ? (
          <p className="text-[17px]">No current students are listed.</p>
        ) : (
          <ol>
            {current.map(p => (
              <li key={p.name} className="flex gap-5 border-b border-rule py-6 first:pt-0 last:border-b-0 md:gap-6">
                {p.image && <Portrait src={p.image} name={p.name} />}
                <div className="max-w-[60ch]">
                  <h3 className="text-[17px] font-semibold leading-snug text-ink">{p.name}</h3>
                  <p className="text-[16px] leading-[1.6] text-ink-2">
                    {p.role}
                    {p.joined && <>, since {p.joined}</>}
                  </p>
                  {p.bio && <p className="mt-2 text-[16px] leading-[1.6] text-ink">{p.bio}</p>}
                  <p className={linkRow}>
                    <PapersLink name={p.name} />
                    {p.links?.orcid && <a href={p.links.orcid}>ORCID</a>}
                    {p.links?.github && <a href={p.links.github}>GitHub</a>}
                    {p.links?.site && <a href={p.links.site}>Website</a>}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section id="former" title="Former students" count={alumni.length}>
        <ol>
          {alumni.map(a => (
            <li key={a.name} className="border-b border-rule py-5 first:pt-0 last:border-b-0 [&>*]:max-w-[60ch]">
              <h3 className="text-[17px] font-semibold leading-snug text-ink">{a.name}</h3>
              {a.degrees.map(d => (
                <p key={d.role} className="mt-1 text-[16px] leading-[1.6] text-ink-2">
                  {d.role}
                  {d.thesisYear && <>, {d.thesisYear}</>}
                  {d.thesisTitle && (
                    <>
                      :{" "}
                      <cite className="text-ink">
                        {d.links?.thesis ? <a href={d.links.thesis}>{d.thesisTitle}</a> : d.thesisTitle}
                      </cite>
                    </>
                  )}
                </p>
              ))}
              <p className={linkRow}>
                <PapersLink name={a.name} />
                {a.site && <a href={a.site}>Website</a>}
                {a.linkedin && <a href={a.linkedin}>LinkedIn</a>}
                {a.orcid && <a href={a.orcid}>ORCID</a>}
              </p>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
