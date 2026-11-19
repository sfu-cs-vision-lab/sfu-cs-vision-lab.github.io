import Link from "next/link";
import github from "@/data/github.json";
import { REPOS, groupedRepos } from "@/lib/github";

export const metadata = { title: "Code" };

const anchor = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-");

export default function CodePage() {
  const groups = groupedRepos();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6 md:pt-20">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink [font-stretch:112.5%] md:text-[34px]">
        Code
      </h1>
      <p className="mt-4 max-w-[65ch] text-[17px] leading-[1.65] text-ink-2 md:text-[18px]">
        Toolboxes and other code from the lab, each with the paper or dataset it accompanies where the repository
        names one. All {REPOS.length} repositories are public on <a href={`https://github.com/${github.org}`}>GitHub</a>.
      </p>

      {groups.length === 0 ? (
        <p className="mt-10 text-[17px]">
          No repositories are listed here right now. The lab&apos;s code is on{" "}
          <a href={`https://github.com/${github.org}`}>GitHub</a>.
        </p>
      ) : (
        groups.map(g => (
          <section
            key={g.name}
            aria-labelledby={anchor(g.name)}
            className="mt-14 grid gap-x-12 border-t border-rule pt-6 md:mt-20 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
          >
            <h2 id={anchor(g.name)} className="self-start text-[19px] font-semibold leading-snug text-ink md:sticky md:top-24">
              {g.name}
              <span className="ml-2 font-normal text-ink-2">{g.repos.length}</span>
            </h2>
            <ol className="mt-4 md:mt-0">
              {g.repos.map(r => (
                <li key={r.name} className="border-b border-rule py-6 first:pt-0 last:border-b-0">
                  <h3 className="text-[17px] font-semibold leading-snug">
                    <Link href={`/code/${r.name}/`}>{r.title}</Link>
                  </h3>
                  {r.summary && <p className="mt-2 max-w-[65ch] text-[16px] leading-[1.6] text-ink-2">{r.summary}</p>}
                  <p className="mt-2 flex flex-wrap gap-x-5 text-[15px] leading-[2]">
                    {r.paper && <a href={r.paper}>Paper</a>}
                    {r.data && <a href={r.data.url}>Data</a>}
                    <a href={r.github}>GitHub</a>
                    {r.language && <span className="text-ink-2">{r.language}</span>}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}

      <section
        aria-labelledby="elsewhere"
        className="mt-14 grid gap-x-12 border-t border-rule pt-6 md:mt-20 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
      >
        <h2 id="elsewhere" className="self-start text-[19px] font-semibold leading-snug text-ink md:sticky md:top-24">
          Elsewhere
        </h2>
        <ul className="mt-4 md:mt-0">
          <li className="py-0">
            <h3 className="text-[17px] font-semibold leading-snug">
              <a href="https://ivilab.cs.arizona.edu/kobus/research/code/colour_constancy/index.html">
                Computational colour constancy
              </a>
            </h3>
            <p className="mt-2 max-w-[65ch] text-[16px] leading-[1.6] text-ink-2">
              Kobus Barnard’s colour constancy source code, from his research in the lab, on his own site at the
              University of Arizona.
            </p>
          </li>
        </ul>
      </section>
    </div>
  );
}
