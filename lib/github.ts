// The lab's repos as the site shows them. Raw data: data/github.json (scripts/fetch_github.mjs).
import github from "@/data/github.json";
import zenodo from "@/data/zenodo.json";

export type Repo = {
  name: string;
  fullName: string; // owner/name, for resolving the README's relative links
  title: string; // the README's first heading, or the repo name
  summary: string; // the README's opening sentences, plain text
  readme: string; // README markdown without badges or its title
  github: string;
  paper: string | null; // the repo's GitHub website field, when it is not a dataset
  data: { title: string; url: string } | null; // a dataset from the lab's Zenodo community the repo names
  language: string | null;
  updated: string;
  group: string;
};

// Groups come from each repo's GitHub topics, then its title and opening sentences.
// Adding a topic on GitHub moves a repo; nothing here lists repos by hand.
const GROUPS = [
  { name: "Metamer mismatching", match: /metamer/ },
  { name: "Colour constancy", match: /constancy|retinex|white balanc|illumination estimation/ },
  { name: "Colour matching and observers", match: /cone[- ]fundamental|colou?r[- ]matching|\bcmfs?\b/ },
];
const OTHER = "Other code";

// Status badges (CI, licence, CLA) say nothing a visitor needs here.
const STATUS_BADGE = /shields\.io|badge\.svg|\/badges?\/|actions\/workflows/i;

/**
 * README as the repo page shows it, without the first H1 (the page's title).
 * Only prose is rewritten; fenced code blocks (the odd segments of the split) pass through untouched.
 */
function cleanReadme(md: string) {
  const text = (md.charCodeAt(0) === 0xfeff ? md.slice(1) : md) // drop a byte-order mark
    .split(/(```[\s\S]*?```)/g)
    .map((part, i) => (i % 2 ? part : cleanProse(part)))
    .join("");
  const lines = text.split("\n");
  const h1 = lines.findIndex(l => /^#\s+/.test(l));
  if (h1 >= 0) lines.splice(h1, 1);
  return lines.join("\n").replace(/^\s+/, "");
}

/**
 * Status badges go; MathWorks badges become text links (their images are blocked off GitHub);
 * figures written as HTML <img> tags become markdown images; <em>/<strong> become markdown emphasis;
 * every other HTML tag is dropped, so README HTML is never rendered.
 */
function cleanProse(md: string) {
  return md
    .replace(/\[!\[([^\]]*)\]\(([^)]*)\)\]\(([^)]*)\)/g, (badge, alt: string, img: string, href: string) =>
      STATUS_BADGE.test(img) ? "" : /mathworks\.com/i.test(img) ? `[${alt}](${href})` : badge)
    .replace(/!\[[^\]]*\]\(([^)]*)\)/g, (image, img: string) => (STATUS_BADGE.test(img) ? "" : image))
    .replace(/<img\b[^>]*>/gi, tag => {
      const src = /\bsrc="([^"]+)"/i.exec(tag)?.[1];
      const alt = (/\balt="([^"]*)"/i.exec(tag)?.[1] ?? "").replace(/[[\]]/g, "");
      return src ? `\n\n![${alt}](${src})\n\n` : "";
    })
    .replace(/<\/?(?:em|i)>/gi, "*")
    .replace(/<\/?(?:strong|b)>/gi, "**")
    .replace(/<\/?(?:p|div|br|center|picture|source)\b[^>]*>/gi, "\n")
    .replace(/<\/?[a-z][a-z0-9-]*\b[^>]*>/gi, "");
}

/** Markdown down to plain text. */
function plain(md: string) {
  return md
    .replace(/<[^>]+>/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s*\[\d+\]/g, "")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whole sentences up to about max characters. */
function firstSentences(text: string, max = 240) {
  let out = "";
  for (const s of text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text]) {
    if (out && (out + s).length > max) break;
    out += s;
  }
  return out.trim();
}

/**
 * The README's first real paragraph of prose, cut to whole sentences. Headings, code, lists, licence
 * and "please cite" lines and "for more information" pointers are not a description, so they are skipped.
 * Empty when the README has no such paragraph; the page then shows no summary rather than a made-up one.
 */
function summaryOf(readme: string) {
  const prose = readme
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s.*$/gm, "")
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p && !/^(?:[-*+]|\d+\.)\s/.test(p) && !/^(?:\s*\[[^\]]+\]\([^)]*\))+\s*$/.test(p))
    .map(plain)
    .filter(p => p.length >= 60 && !/licen[cs]e|copyright|should cite|for more information/i.test(p));
  return prose[0] ? firstSentences(prose[0]) : "";
}

export const REPOS: Repo[] = github.repos.map(r => {
  const md = r.readme?.content ?? "";
  const title = plain(md.match(/^#\s+(.+)$/m)?.[1] ?? r.name);
  const readme = cleanReadme(md);
  const summary = summaryOf(readme);
  const homepage = r.homepage ?? "";
  const dataset = zenodo.datasets.find(d => homepage.endsWith(d.doi) || md.includes(d.doi));
  const text = [...r.topics, title, summary].join(" ").toLowerCase();
  return {
    name: r.name,
    fullName: r.full_name,
    title,
    summary,
    readme,
    github: r.html_url,
    paper: homepage && !homepage.includes("zenodo") ? homepage : null,
    data: dataset ? { title: dataset.title, url: `https://doi.org/${dataset.doi}` } : null,
    language: r.language,
    updated: r.updated_at,
    group: GROUPS.find(g => g.match.test(text))?.name ?? OTHER,
  };
});

/** Repos in their groups, largest group first and "Other code" last; newest first within a group. */
export function groupedRepos() {
  const names = [...GROUPS.map(g => g.name), OTHER];
  return names
    .map(name => ({ name, repos: REPOS.filter(r => r.group === name) }))
    .filter(g => g.repos.length > 0)
    .sort((a, b) => (a.name === OTHER ? 1 : b.name === OTHER ? -1 : b.repos.length - a.repos.length));
}
