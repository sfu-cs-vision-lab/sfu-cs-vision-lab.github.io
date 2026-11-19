import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import Article, { anchorOf } from "@/components/Article";
import { REFERENCES, TOPICS, citedKeys } from "@/lib/research";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOPICS.map(t => ({ topic: t.slug }));
}

export function generateMetadata({ params }: { params: { topic: string } }) {
  return { title: TOPICS.find(t => t.slug === params.topic)?.title ?? "Research" };
}

export default function TopicPage({ params }: { params: { topic: string } }) {
  const topic = TOPICS.find(t => t.slug === params.topic);
  if (!topic) notFound();

  const markdown = fs.readFileSync(path.join(process.cwd(), "content/research", `${topic.slug}.md`), "utf8");
  const refs = citedKeys(markdown);
  const sections = [...Array.from(markdown.matchAll(/^## (.+)$/gm), m => m[1]), ...(refs.length ? ["References"] : [])];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 md:pt-14">
      <p className="text-[15px] leading-[2]">
        <Link href="/research/">All research</Link>
      </p>
      <h1 className="mt-8 max-w-[26ch] text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink [font-stretch:112.5%] md:text-[34px]">
        {topic.title}
      </h1>
      <p className="mt-3 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
        Written for the lab’s website in {topic.written} and kept as it was, with spelling corrected.
      </p>

      <div className="mt-12 grid gap-x-12 gap-y-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <nav aria-label="On this page" className="self-start md:sticky md:top-24">
          {sections.length >= 1 && (
            <>
              <p className="text-[15px] font-semibold text-ink">On this page</p>
              <ul className="mt-2 space-y-1 text-[15px] leading-[2]">
                {sections.map(s => (
                  <li key={s}><a href={`#${anchorOf(s)}`}>{s}</a></li>
                ))}
              </ul>
            </>
          )}
        </nav>

        <div className="min-w-0">
          <Article markdown={markdown} />
          {refs.length > 0 && (
            <section aria-labelledby="references" className="mt-16 border-t border-rule pt-6">
              <h2 id="references" className="scroll-mt-24 text-[19px] font-semibold leading-snug text-ink">References</h2>
              <ol className="mt-4 max-w-[62ch] space-y-3 text-[15px] leading-[1.6] text-ink-2">
                {refs.map(key => (
                  <li key={key} id={`ref-${key}`} className="scroll-mt-24">
                    <span className="text-ink">[{key}]</span> {REFERENCES[key]}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
