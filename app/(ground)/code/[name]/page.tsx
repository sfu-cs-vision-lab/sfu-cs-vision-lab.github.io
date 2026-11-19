import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import Readme from "@/components/Readme";
import { REPOS } from "@/lib/github";

export const dynamicParams = false;

export function generateStaticParams() {
  return REPOS.map(r => ({ name: r.name }));
}

export function generateMetadata({ params }: { params: { name: string } }) {
  return { title: REPOS.find(r => r.name === params.name)?.title ?? "Code" };
}

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function RepoPage({ params }: { params: { name: string } }) {
  const repo = REPOS.find(r => r.name === params.name);
  if (!repo) notFound();

  const facts: [string, ReactNode][] = [];
  if (repo.paper) facts.push(["Paper", <a href={repo.paper}>{repo.paper.replace(/^https?:\/\/(dx\.)?doi\.org\//, "doi:")}</a>]);
  if (repo.data) facts.push(["Data", <a href={repo.data.url}>{repo.data.title}</a>]);
  facts.push([
    "Code",
    <span className="flex flex-wrap gap-x-5">
      <a href={repo.github}>{repo.fullName}</a>
      <a href={`${repo.github}/archive/HEAD.zip`}>Download ZIP</a>
    </span>,
  ]);
  if (repo.language) facts.push(["Language", repo.language]);
  facts.push(["Updated", date(repo.updated)]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 md:pt-14">
      <p className="text-[15px] leading-[2]">
        <Link href="/code/">All code</Link>
      </p>
      <h1 className="mt-8 max-w-[26ch] text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink [font-stretch:112.5%] md:text-[34px]">
        {repo.title}
      </h1>

      <dl className="mt-10 border-t border-rule">
        {facts.map(([label, value]) => (
          <div key={label} className="grid gap-x-12 border-b border-rule py-3 text-[15px] leading-[1.6] md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <dt className="text-ink-2">{label}</dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>

      {repo.readme && (
        <section aria-labelledby="readme" className="mt-16 grid gap-x-12 gap-y-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <h2 id="readme" className="self-start text-[19px] font-semibold leading-snug text-ink md:sticky md:top-24">
            README
          </h2>
          <Readme markdown={repo.readme} fullName={repo.fullName} />
        </section>
      )}
    </div>
  );
}
