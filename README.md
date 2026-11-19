# Computational Vision Lab website

The website of the Computational Vision Lab, School of Computing Science, Simon Fraser University. It replaces
the lab's earlier pages at https://www.cs.sfu.ca/~colour/.

A static Next.js site. The home page computes every colour it shows from measured Munsell spectra, the
spectrum of the light and the CIE 1931 observer, and runs the lab's retinex in the browser.

## Build

```sh
npm ci
npm run build   # fetches fresh data first, then writes the site to out/
```

`npm run dev` serves it at http://localhost:3000 while you edit.

The build fetches the lab's data before it builds. If a source can't be reached, the copy saved in `data/` is used:

| Source | Script | Saved as |
|---|---|---|
| Code: public repositories in the `sfu-cs-vision-lab` GitHub organisation, with their READMEs | `scripts/fetch_github.mjs` | `data/github.json` |
| Publications: Brian Funt's ORCID record, and current members' records from the year they joined | `scripts/fetch_orcid.mjs` | `data/publications.json` |
| Data: the lab's Zenodo community | `scripts/fetch_zenodo.mjs` | `data/zenodo.json` |

People, funding and the lab's earlier datasets are edited by hand in `data/people.json`, `data/funding.json`
and `data/legacy-datasets.json`.

## Publishing

`.github/workflows/rebuild.yml` rebuilds the site every day, on every push to `main`, and on demand from the
Actions tab. It commits refreshed data back to `data/` when something changed and publishes the site to
GitHub Pages.

## Licence

The site's code is under the GNU Affero General Public License v3.0 (`LICENSE`), which also covers the port of
the lab's retinex in `lib/retinex.ts`. Other parts keep their own terms:

- CIE colour-matching functions and daylight components: CC BY-SA 4.0 (CIE).
- Munsell matte spectra: Computational Spectral Imaging Research Group, University of Eastern Finland
  (https://zenodo.org/records/3269912).
- Archivo font: SIL Open Font License (`app/fonts/OFL.txt`).
- The text and images of the lab's earlier research pages remain with their authors.
