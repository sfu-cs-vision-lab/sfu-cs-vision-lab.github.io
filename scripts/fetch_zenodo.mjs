// scripts/fetch_zenodo.mjs
// Saves the lab's Zenodo records to data/zenodo.json.
// If Zenodo can't be reached, the last saved copy is kept so the build still works.
import fs from "node:fs/promises";

try { process.loadEnvFile(".env.local"); } catch {}

const community = process.env.NEXT_PUBLIC_ZENODO_COMMUNITY || "sfu-cs-vision-lab";
const OUT = "data/zenodo.json";
// The community endpoint returns 404 for an unknown slug; the generic /api/records?communities=
// filter silently ignores it and pages through all of Zenodo.
// Zenodo caps unauthenticated pages at 25 records, so follow links.next.
const API = `https://zenodo.org/api/communities/${encodeURIComponent(community)}/records?size=25&all_versions=true&sort=mostrecent`;

// Zenodo rejects Node's default "node" User-Agent with a 403.
const headers = { "User-Agent": "static-site-data-fetch/1.0" };
if (process.env.ZENODO_TOKEN) headers.Authorization = `Bearer ${process.env.ZENODO_TOKEN}`;

// Creator names recorded the wrong way round on Zenodo. Fix the record on Zenodo too; this keeps the site right meanwhile.
const CREATOR_FIXES = { "Hamidreza, Mirzaei": "Mirzaei, Hamidreza" };

function toDataset(hit) {
  const md = hit.metadata || {};
  const links = hit.links || {};
  const files = Array.isArray(hit.files)
    ? hit.files.map(f => ({ name: f.key, size: f.size, url: f.links.self }))
    : [];

  return {
    id: String(hit.id),
    conceptdoi: hit.conceptdoi ?? null,
    doi: md.doi || (hit.doi && hit.doi.replace("https://doi.org/", "")),
    title: md.title,
    version: md.version,
    url: links?.html || links?.latest_html || links?.doi || links?.conceptdoi || "",
    publishedAt: md.publication_date,
    creators: (md.creators || [])
      .map(c => c.name || [c.familyname, c.givenname].filter(Boolean).join(", "))
      .filter(Boolean)
      .map(n => CREATOR_FIXES[n] ?? n),
    license: md.license?.id ?? null,
    description: md.description,
    files,
  };
}

async function main() {
  const hits = [];
  for (let url = API; url; ) {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`Zenodo returned ${res.status}`);
    const page = await res.json();
    hits.push(...(page.hits?.hits || []));
    url = page.links?.next;
  }
  const datasets = hits.map(toDataset);
  // Zenodo's own BibTeX for each record, for the Copy BibTeX button.
  for (const d of datasets) {
    const res = await fetch(`https://zenodo.org/records/${d.id}/export/bibtex`, { headers, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`Zenodo returned ${res.status} for the BibTeX of record ${d.id}`);
    d.bibtex = Object.entries(CREATOR_FIXES).reduce((b, [from, to]) => b.replaceAll(from, to), (await res.text()).trim());
  }
  if (datasets.length === 0) throw new Error(`Zenodo community "${community}" returned no records`);

  await fs.mkdir("data", { recursive: true });
  await fs.writeFile(OUT, JSON.stringify({ community, fetchedAt: new Date().toISOString(), datasets }, null, 2));
  console.log(`Wrote ${OUT} with ${datasets.length} records`);
}

main().catch(async err => {
  try {
    await fs.access(OUT);
    console.warn(`${process.env.GITHUB_ACTIONS ? "::warning::" : ""}Could not refresh ${OUT} (${err.message}). Keeping the last saved copy.`);
  } catch {
    console.error(`Could not fetch Zenodo records and there is no saved copy: ${err.message}`);
    process.exit(1);
  }
});
