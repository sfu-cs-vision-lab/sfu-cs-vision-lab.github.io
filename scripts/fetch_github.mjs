// scripts/fetch_github.mjs
// Saves the lab's public GitHub repos and their READMEs to data/github.json.
// If GitHub can't be reached, the last saved copy is kept so the build still works.
// Set GITHUB_TOKEN in .env.local to lift the unauthenticated limit of 60 requests an hour.
import fs from "node:fs/promises";

try { process.loadEnvFile(".env.local"); } catch {}

const org = process.env.GITHUB_ORG || "sfu-cs-vision-lab";
const OUT = "data/github.json";
const SKIP = [".github", `${org}.github.io`.toLowerCase()];

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

// Returns parsed JSON, or null for a 404. Any other failure throws.
async function get(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers, signal: AbortSignal.timeout(20000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub returned ${res.status} for ${path}`);
  return res.json();
}

async function main() {
  const all = await get(`/orgs/${encodeURIComponent(org)}/repos?type=public&per_page=100&sort=updated`);
  if (!all) throw new Error(`GitHub organization "${org}" not found`);

  const repos = all
    .filter(r => !r.private && !r.is_template && !SKIP.includes(r.name.toLowerCase()))
    .sort((a, b) =>
      new Date(b.updated_at) - new Date(a.updated_at) || b.stargazers_count - a.stargazers_count);
  if (repos.length === 0) throw new Error(`GitHub organization "${org}" has no public repos`);

  const withReadmes = await Promise.all(repos.map(async r => {
    const readme = await get(`/repos/${r.full_name}/readme`);
    return {
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      html_url: r.html_url,
      description: r.description,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      language: r.language,
      topics: r.topics || [],
      homepage: r.homepage || null,
      updated_at: r.updated_at,
      readme: readme
        ? { content: Buffer.from(readme.content, readme.encoding).toString("utf8"), sourceUrl: readme.html_url }
        : null,
    };
  }));

  await fs.mkdir("data", { recursive: true });
  await fs.writeFile(OUT, JSON.stringify({ org, fetchedAt: new Date().toISOString(), repos: withReadmes }, null, 2));
  console.log(`Wrote ${OUT} with ${withReadmes.length} repos`);
}

main().catch(async err => {
  try {
    await fs.access(OUT);
    console.warn(`${process.env.GITHUB_ACTIONS ? "::warning::" : ""}Could not refresh ${OUT} (${err.message}). Keeping the last saved copy.`);
  } catch {
    console.error(`Could not fetch GitHub repos and there is no saved copy: ${err.message}`);
    process.exit(1);
  }
});
