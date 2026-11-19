"use client";

import { useEffect, useState } from "react";
import { matchesQuery } from "@/lib/search";

/**
 * Narrows the server-rendered Publications list as the visitor types. It renders on the server too, so the
 * page does not shift when it hydrates; without JavaScript a <noscript> rule hides it and the full list stays.
 * Matching is lib/search.ts (shared with the Research areas). A ?q= in the address fills the filter, which is
 * how a Research area links to its papers.
 */
export default function PublicationFilter({ total }: { total: number }) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(total);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  useEffect(() => {
    const show = (el: HTMLElement, visible: boolean) => { el.style.display = visible ? "" : "none"; };
    let count = 0;
    document.querySelectorAll<HTMLElement>("[data-year]").forEach(year => {
      let inYear = 0;
      year.querySelectorAll<HTMLElement>("[data-pub]").forEach(pub => {
        const hit = matchesQuery(pub.dataset.text ?? "", query);
        show(pub, hit);
        if (hit) inYear++;
      });
      show(year, inYear > 0);
      count += inYear;
    });
    document.querySelectorAll<HTMLElement>("[data-decade]").forEach(decade => {
      show(decade, Array.from(decade.querySelectorAll<HTMLElement>("[data-year]")).some(y => y.style.display !== "none"));
    });
    const decades = document.querySelector<HTMLElement>("[data-decades]");
    if (decades) show(decades, query.trim() === "");
    setShown(count);
  }, [query]);

  return (
    <div className="mt-8" data-filter>
      <noscript dangerouslySetInnerHTML={{ __html: "<style>[data-filter]{display:none}</style>" }} />
      <label htmlFor="filter" className="block text-[15px] text-ink-2">
        Filter by title, author, venue or year
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
        <input
          id="filter"
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="h-11 w-full max-w-md border border-rule bg-transparent px-3 text-[16px] text-ink focus:border-ink"
        />
        <p aria-live="polite" className="text-[15px] tabular-nums text-ink-2">
          {query.trim() ? `${shown} of ${total}` : `${total} publications`}
        </p>
      </div>
      {query.trim() && shown === 0 && (
        <p className="mt-8 text-[17px] text-ink">
          No publications match &ldquo;{query.trim()}&rdquo;.{" "}
          <button
            type="button"
            onClick={() => setQuery("")}
            className="cursor-pointer bg-transparent p-0 text-ink underline decoration-ink-2 underline-offset-4 hover:decoration-2"
          >
            Clear the filter
          </button>
        </p>
      )}
    </div>
  );
}
