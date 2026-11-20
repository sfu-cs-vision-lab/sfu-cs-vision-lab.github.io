// scripts/fetch_orcid.mjs
// Builds data/publications.json from ORCID: the lab director's works in full, and each current member's
// works from the year they joined the lab ("joined" in data/people.json). Records that share a DOI, or a
// title and year, merge into one. Each paper links to its old-site page (data/legacy-publications.json),
// to code whose repo cites its DOI, and to a lab dataset whose record names its DOI.
// If ORCID can't be reached, the last saved copy is kept so the build still works.
import fs from "node:fs/promises";

const OUT = "data/publications.json";
const headers = { Accept: "application/json", "User-Agent": "static-site-data-fetch/1.0" };

const TYPES = {
  "journal-article": "Journal article", "conference-paper": "Conference paper", "conference-abstract": "Conference abstract",
  "book-chapter": "Book chapter", book: "Book", "data-set": "Dataset", preprint: "Preprint", report: "Report",
  "technical-standard": "Standard", patent: "Patent", "dissertation-thesis": "Thesis",
  "conference-presentation": "Talk", "public-speech": "Talk", "lecture-speech": "Talk",
};
const ORDER = ["Journal article", "Conference paper", "Book chapter", "Book", "Conference abstract", "Dataset",
  "Preprint", "Report", "Standard", "Patent", "Talk", "Thesis", "Other"];

const norm = s => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

// Word overlap (Dice) between two titles, with British and American spellings treated alike.
const words = s => new Set(norm(s).replace(/colour/g, "color").replace(/modell/g, "model").split(" "));
function similarity(a, b) {
  const A = words(a), B = words(b);
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return (2 * shared) / (A.size + B.size);
}
const orcidId = url => url?.match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/)?.[0];
const readJson = async path => JSON.parse(await fs.readFile(path, "utf8"));

async function get(path) {
  const res = await fetch(`https://pub.orcid.org/v3.0/${path}`, { headers, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`ORCID returned ${res.status} for ${path}`);
  return res.json();
}

async function worksOf(id) {
  const codes = (await get(`${id}/works`)).group.map(g => g["work-summary"][0]["put-code"]);
  const works = [];
  for (let i = 0; i < codes.length; i += 100) {
    works.push(...(await get(`${id}/works/${codes.slice(i, i + 100).join(",")}`)).bulk.map(b => b.work).filter(Boolean));
  }
  return works;
}

// "Funt, Brian V." -> "Brian V. Funt" for display; "Brian V. Funt" -> "Funt, Brian V." for BibTeX.
const displayName = n => { const p = n.split(","); return p.length === 2 ? `${p[1].trim()} ${p[0].trim()}` : n.trim(); };
const bibName = n => {
  if (n.includes(",")) return n.trim();
  const p = n.trim().split(/\s+/);
  return p.length > 1 ? `${p.at(-1)}, ${p.slice(0, -1).join(" ")}` : n.trim();
};

function authorsOf(w, owner) {
  // ORCID shows "Name is private" for a contributor who hid their name; on their own record that is the owner.
  const names = (w.contributors?.contributor ?? [])
    .map(c => c["credit-name"]?.value)
    .filter(Boolean)
    .map(n => (/^name is private$/i.test(n.trim()) ? owner : n));
  if (names.length) return names;
  // No contributor list: fall back to the record's own BibTeX author field, if it has one.
  const bib = w.citation?.["citation-type"] === "bibtex" ? w.citation["citation-value"] : "";
  const field = bib.match(/author\s*=\s*\{([^}]*)\}/i)?.[1];
  return field ? field.split(/\s+and\s+/i).map(s => s.trim()).filter(Boolean) : [];
}

// Venue names arrive mangled by the indexes ORCID imports from (Scopus writes "IS&T" as "is and T";
// Web of Science writes in capitals). These rules restore the names researchers know.
const VENUE_FIXES = [
  [/\bis and T\b/gi, "IS&T"],
  [/IS&T SID\b/g, "IS&T/SID"],
  [/^Proceedings of SPIE the International Society for Optical Engineering$/i, "Proceedings of SPIE"],
  [/^Journal of the Optical Society of America A Optics and Image Science and Vision$/i, "Journal of the Optical Society of America A"],
  [/^Lecture Notes in Computer Science Including Subseries.*$/i, "Lecture Notes in Computer Science"],
  [/^Sensors Switzerland$/i, "Sensors"],
  [/^Plos One$/i, "PLOS ONE"],
  [/^Arxiv$/i, "arXiv"],
  [/\b(Bmvc|Crv|Mcs|Icmc|Cgiv|Eccv)\b/g, m => m.toUpperCase()],
  [/\b(\d+)(ST|ND|RD|TH)\b/g, (_, n, suffix) => n + suffix.toLowerCase()],
  [/\.$/, ""],
];
const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);
const ACRONYM = /^(IEEE|ECCV|NIP\d*|CGIV|VISAPP|IU|MTSV|SID|IS&T|PT|II|III|IV)$/;

/** Title case for text written in capitals, keeping acronyms, short letter groups (CT) and anything with digits. */
function unshout(text) {
  if (text !== text.toUpperCase() || !/[A-Z]{3}/.test(text)) return text;
  return text.split(" ").map((word, i) => word.split(/([/-])/).map(part => {
    const bare = part.replace(/[,:;.?]/g, "");
    if (!/[A-Z]/.test(bare) || ACRONYM.test(bare) || /\d/.test(bare)) return part;
    if (i > 0 && SMALL_WORDS.has(bare.toLowerCase())) return part.toLowerCase();
    if (bare.length <= 2) return part;
    return part.charAt(0) + part.slice(1).toLowerCase();
  }).join("")).join(" ");
}

// The lab's two main conferences appear under many names; each gets the one researchers search for.
const CIC = "IS&T Color Imaging Conference (CIC)";
const CGIV = "European Conference on Colour in Graphics, Imaging and Vision (CGIV)";

function cleanVenue(raw) {
  let v = unshout(raw);
  for (const [pattern, replacement] of VENUE_FIXES) v = v.replace(pattern, replacement);
  if (/colou?r (and )?imaging conference/i.test(v)) return CIC;
  if (/colou?r in graphics,? imaging,? and vision|\bCGIV\b/i.test(v)) return CGIV;
  return v.trim();
}

// A recording of a talk, which duplicates the paper it presents.
const RECORDING = /\bTV\b|video/i;

// Titles that arrive damaged from the index ORCID imported them from. Keep this list short: fix the record
// at its source when possible.
const TITLE_FIXES = [[/\bballmulti-illuminant\b/i, "ball multi-illuminant"]];

// Old-site papers whose titles there are worded too differently for the title match, tied by DOI.
const OLD_PAGE_FOR_DOI = {
  "10.1109/tip.2002.802531": "IEEE_TIP-2002/IEEE_TIP-2002A.html",
  "10.1109/tip.2002.802529": "IEEE_TIP-2002/IEEE_TIP-2002B.html",
  "10.1002/col.10050": "CRA-2002/CameraCalibration.html",
  "10.2352/cic.1997.5.1.art00043": "IST-97/index.html",
  "10.2352/cgiv.2004.2.1.art00110": "CGIV-2004/index.html",
};

function normalise(w, owner) {
  const raw = w["journal-title"]?.value?.trim();
  const venue = raw && !/^undefined$/i.test(raw) ? cleanVenue(raw) : null;
  const date = w["publication-date"] ?? {};
  let type = TYPES[w.type] ?? "Other";
  // Proceedings are often recorded as journal articles. A proceedings venue (not a journal's own name) or an
  // SPIE proceedings DOI (10.1117/12.) says otherwise.
  const doi = (w["external-ids"]?.["external-id"] ?? []).find(e => e["external-id-type"] === "doi")?.["external-id-value"]?.trim() ?? "";
  const proceedings = venue && /conference|proceedings|symposium|workshop|colloquium|digest/i.test(venue) && !/^journal\b/i.test(venue);
  if (type === "Journal article" && (proceedings || /^10\.1117\/12\./.test(doi))) type = "Conference paper";
  return {
    title: TITLE_FIXES.reduce((t, [p, r]) => t.replace(p, r), unshout((w.title?.title?.value ?? "").trim().replace(/\.$/, ""))),
    year: Number(date.year?.value) || null,
    month: Number(date.month?.value) || null,
    type,
    venue,
    authors: authorsOf(w, owner),
    doi: (w["external-ids"]?.["external-id"] ?? []).find(e => e["external-id-type"] === "doi")?.["external-id-value"]?.trim() || null,
  };
}

const isRecording = p => RECORDING.test(p.venue ?? "");
// Which of two records of one work to keep: a paper over a recording, a typed record over "Other", one with a DOI.
const weight = p => (isRecording(p) ? 0 : 4) + (p.type === "Other" ? 0 : 2) + (p.doi ? 1 : 0);

function sameWork(p, q) {
  if (p.doi && q.doi && p.doi.toLowerCase() === q.doi.toLowerCase()) return true;
  if (norm(p.title) !== norm(q.title) || !p.year || !q.year) return false;
  if (p.year === q.year) return true;
  // A conference paper and its later journal version share a title; they stay separate unless the venue matches
  // (one paper recorded twice) or one of them is a recording of the talk.
  return Math.abs(p.year - q.year) <= 1 && (p.venue === q.venue || isRecording(p) || isRecording(q));
}

function merge(list) {
  const out = [];
  for (const p of list) {
    if (!p.title) continue;
    const i = out.findIndex(q => sameWork(p, q));
    if (i < 0) { out.push({ ...p }); continue; }
    const q = out[i];
    const keep = weight(p) > weight(q) || (weight(p) === weight(q) && (p.year ?? 9999) < (q.year ?? 9999)) ? { ...p } : q;
    const other = keep === q ? p : q;
    keep.doi ??= other.doi;
    keep.venue ??= other.venue;
    keep.month ??= other.month;
    if (other.authors.length > keep.authors.length) keep.authors = other.authors;
    if (keep.type === "Other") keep.type = other.type;
    out[i] = keep;
  }
  return out;
}

// Theses are listed on People. ORCID dates digitised theses by their upload, and records them as "Other".
const isThesis = p => p.type === "Thesis" || (p.type === "Other" && /^university of\b/i.test(p.venue ?? ""));

function bibtex(p) {
  const kind = { "Journal article": "article", "Conference paper": "inproceedings", "Book chapter": "incollection", Book: "book" }[p.type] ?? "misc";
  const surname = (p.authors[0] ? bibName(p.authors[0]).split(",")[0] : "anon").toLowerCase().normalize("NFKD").replace(/[^a-z]/g, "");
  const key = `${surname}${p.year ?? ""}${norm(p.title).split(" ").find(w => w.length > 3) ?? ""}`;
  const venueField = kind === "article" ? "journal" : kind === "misc" ? "howpublished" : "booktitle";
  const fields = [
    ["title", `{${p.title}}`],
    ["author", p.authors.map(bibName).join(" and ")],
    [venueField, p.venue],
    ["year", p.year],
    ["doi", p.doi],
  ].filter(([, v]) => v);
  return `@${kind}{${key},\n${fields.map(([k, v]) => `  ${k} = {${v}}`).join(",\n")}\n}`;
}

async function main() {
  const people = await readJson("data/people.json");
  const sources = [
    { name: people.director.name, orcid: orcidId(people.director.links?.orcid), since: null },
    ...people.current.filter(p => orcidId(p.links?.orcid)).map(p => ({ name: p.name, orcid: orcidId(p.links.orcid), since: Number(p.joined) || null })),
  ].filter(s => s.orcid);

  const all = [];
  for (const s of sources) {
    const works = (await worksOf(s.orcid)).map(w => normalise(w, s.name.replace(/^Dr\.?\s+/, "")));
    // Members' works count only from the year they joined; a member without a joined year contributes nothing.
    all.push(...(s.since === null && s === sources[0] ? works : works.filter(w => s.since && w.year && w.year >= s.since)));
  }
  const publications = merge(all).filter(p => !isThesis(p));
  if (publications.length === 0) throw new Error("ORCID returned no works");

  const legacy = (await readJson("data/legacy-publications.json")).links;
  const repos = (await readJson("data/github.json")).repos;
  const datasets = (await readJson("data/zenodo.json")).datasets;
  const earlierData = (await readJson("data/legacy-datasets.json")).datasets;
  // DOIs a repo asks to be cited for: its GitHub website field, and DOIs inside BibTeX blocks in its README.
  const repoDois = repos.map(r => {
    const bib = (r.readme?.content ?? "").match(/```[^\n]*\n\s*@[\s\S]*?```/g) ?? [];
    return { name: r.name, dois: [r.homepage ?? "", ...bib].join(" ").toLowerCase() };
  });

  // Each old-site paper goes to one publication at most: the closest title within a year, if close enough,
  // preferring the same year (a conference paper and its journal version often share a title). Papers whose
  // old-site title is worded too differently are tied by DOI in OLD_PAGE_FOR_DOI.
  const pageFor = new Map();
  for (const [doi, path] of Object.entries(OLD_PAGE_FOR_DOI)) {
    const l = legacy.find(l => l.url.endsWith(path));
    if (l) pageFor.set(doi, l);
  }
  const taken = new Set(pageFor.values());
  const candidates = [];
  for (const p of publications) {
    if (pageFor.has(p.doi?.toLowerCase())) continue;
    for (const l of legacy) {
      if (taken.has(l) || (l.year && p.year && Math.abs(Number(l.year) - p.year) > 1)) continue;
      const score = similarity(l.title, p.title);
      if (score >= 0.85) candidates.push({ p, l, score, yearGap: l.year && p.year ? Math.abs(Number(l.year) - p.year) : 1 });
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.yearGap - b.yearGap);
  const pageOf = new Map([...publications].filter(p => pageFor.has(p.doi?.toLowerCase())).map(p => [p, pageFor.get(p.doi.toLowerCase())]));
  for (const c of candidates) {
    if (pageOf.has(c.p) || taken.has(c.l)) continue;
    pageOf.set(c.p, c.l);
    taken.add(c.l);
  }

  const out = publications.map(p => {
    const doi = p.doi?.toLowerCase();
    const page = pageOf.get(p);
    const code = doi && repoDois.find(r => r.dois.includes(doi));
    const data = doi && datasets.find(d => d.doi.toLowerCase() !== doi && (d.description ?? "").toLowerCase().includes(doi));
    const earlier = doi && earlierData.find(d => d.papers?.some(x => x.toLowerCase() === doi));
    return {
      ...p,
      authors: p.authors.map(displayName),
      links: {
        doi: p.doi ? `https://doi.org/${p.doi}` : null,
        pdf: page?.pdf ?? null, // a copy on this site, saved from the old one
        code: code ? `/code/${code.name}/` : null,
        data: data ? `https://doi.org/${data.doi}` : (earlier?.links[0].href ?? null),
      },
      bibtex: bibtex(p),
    };
  });

  out.sort((a, b) =>
    (b.year ?? 0) - (a.year ?? 0) || (b.month ?? 0) - (a.month ?? 0) ||
    ORDER.indexOf(a.type) - ORDER.indexOf(b.type) || a.title.localeCompare(b.title));

  await fs.writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), sources, publications: out }, null, 2) + "\n");
  console.log(`Wrote ${OUT} with ${out.length} publications from ${sources.map(s => s.name).join(", ")}`);
}

main().catch(async err => {
  try {
    await fs.access(OUT);
    console.warn(`${process.env.GITHUB_ACTIONS ? "::warning::" : ""}Could not refresh ${OUT} (${err.message}). Keeping the last saved copy.`);
  } catch {
    console.error(`Could not fetch publications and there is no saved copy: ${err.message}`);
    process.exit(1);
  }
});
