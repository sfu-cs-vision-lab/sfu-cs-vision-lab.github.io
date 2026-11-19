// scripts/build_legacy_links.mjs
// One-time copy of the old site's paper-page links into data/legacy-publications.json, so Publications
// can link "Paper page" even if https://www.cs.sfu.ca/~colour/publications/ changes. Run by hand:
//   node scripts/build_legacy_links.mjs
import fs from "node:fs/promises";

const PAGE = "https://www.cs.sfu.ca/~colour/publications/";

const decode = s => s
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'")
  .replace(/&ldquo;|&rdquo;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
const text = s => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

async function main() {
  const res = await fetch(PAGE, { headers: { "User-Agent": "static-site-data-fetch/1.0" }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${PAGE} returned ${res.status}`);
  const html = new TextDecoder("latin1").decode(await res.arrayBuffer());

  const links = [];
  const anchor = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (let m; (m = anchor.exec(html)); ) {
    const href = m[1].replace(/%7E/gi, "~").replace(/^http:/, "https:");
    // Paper pages live under /~colour/publications/<venue-year>/; the bare list page and other links are not papers.
    if (!/~colour\/publications\/[^/]+\/.+/.test(href)) continue;
    const title = text(m[2]).replace(/[",]+$/, "").trim();
    // The year is the first one in the citation that follows the title.
    const year = text(html.slice(anchor.lastIndex, anchor.lastIndex + 600)).match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
    if (title) links.push({ title, year, url: href });
  }

  await fs.writeFile("data/legacy-publications.json", JSON.stringify({ source: PAGE, savedAt: new Date().toISOString(), links }, null, 2) + "\n");
  console.log(`Wrote data/legacy-publications.json with ${links.length} paper pages`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
