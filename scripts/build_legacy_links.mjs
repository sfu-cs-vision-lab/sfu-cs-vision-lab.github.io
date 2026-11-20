// scripts/build_legacy_links.mjs
// One-time copy of the papers on the old site (https://www.cs.sfu.ca/~colour/publications/), which this site
// replaces: each old paper page's PDF is saved under public/papers/ and recorded in
// data/legacy-publications.json, so Publications can offer the PDF from this site once the old one is gone.
// Pages with only PostScript are converted to PDF, which needs Ghostscript (brew install ghostscript).
// The old pages themselves are not linked. Run by hand:
//   node scripts/build_legacy_links.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

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

  // The paper's PDF on each page, if it has one (not the publisher's copyright form some pages also carry).
  for (const link of links) {
    try {
      const page = await fetch(link.url, { headers: { "User-Agent": "static-site-data-fetch/1.0" }, signal: AbortSignal.timeout(30000) });
      const body = new TextDecoder("latin1").decode(await page.arrayBuffer());
      const pdf = [...body.matchAll(/href\s*=\s*["']?([^"'\s>#]+\.pdf)\b/gi)].map(m => new URL(m[1], link.url).href)
        .find(u => !/copyrigh/i.test(u));
      const url = pdf ? pdf.replace(/%7E/gi, "~").replace(/^http:/, "https:") : null;
      // Only a link that opens as a PDF: some pages point at copies on hosts that no longer have them.
      const check = url && await fetch(url, { method: "HEAD", headers: { "User-Agent": "static-site-data-fetch/1.0" }, signal: AbortSignal.timeout(30000) }).catch(() => null);
      link.pdf = null;
      if (check?.ok && /pdf/i.test(check.headers.get("content-type") ?? "")) {
        // Saved at its path under the old publications folder, e.g. public/papers/JOSA-2002/JOSA-2002.pdf.
        const rel = decodeURIComponent(new URL(url).pathname.replace(/^.*?\/publications\//, ""));
        const file = await fetch(url, { headers: { "User-Agent": "static-site-data-fetch/1.0" }, signal: AbortSignal.timeout(120000) });
        await fs.mkdir(path.join("public/papers", path.dirname(rel)), { recursive: true });
        await fs.writeFile(path.join("public/papers", rel), Buffer.from(await file.arrayBuffer()));
        link.pdf = `/papers/${rel}`;
      }
      // Older pages offer only PostScript (.ps or .ps.gz): convert it to PDF with Ghostscript's ps2pdf.
      const ps = !link.pdf && body.match(/href\s*=\s*["']?([^"'\s>#]+\.ps(?:\.gz)?)["'\s>]/i)?.[1];
      if (ps) {
        const psUrl = new URL(ps, link.url).href.replace(/%7E/gi, "~").replace(/^http:/, "https:");
        const file = await fetch(psUrl, { headers: { "User-Agent": "static-site-data-fetch/1.0" }, signal: AbortSignal.timeout(120000) });
        if (!file.ok) throw new Error(`${psUrl} returned ${file.status}`);
        let bytes = Buffer.from(await file.arrayBuffer());
        if (psUrl.endsWith(".gz")) bytes = zlib.gunzipSync(bytes);
        const rel = decodeURIComponent(new URL(psUrl).pathname.replace(/^.*?\/publications\//, "")).replace(/\.ps(\.gz)?$/, ".pdf");
        const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "legacy-ps-"));
        await fs.writeFile(path.join(tmp, "paper.ps"), bytes);
        await fs.mkdir(path.join("public/papers", path.dirname(rel)), { recursive: true });
        execFileSync("ps2pdf", ["-dSAFER", path.join(tmp, "paper.ps"), path.join("public/papers", rel)]);
        await fs.rm(tmp, { recursive: true });
        link.pdf = `/papers/${rel}`;
      }
    } catch {
      link.pdf = null;
    }
  }

  await fs.writeFile("data/legacy-publications.json", JSON.stringify({ source: PAGE, savedAt: new Date().toISOString(), links }, null, 2) + "\n");
  console.log(`Wrote data/legacy-publications.json with ${links.length} papers; saved ${links.filter(l => l.pdf).length} PDFs under public/papers/`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
