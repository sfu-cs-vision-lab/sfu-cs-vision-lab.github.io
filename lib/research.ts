// The Research section: current areas (drafted descriptions plus papers, code and data drawn from the site's
// own data) and the lab's earlier topic pages (content/research/*.md, from the old site, kept as written).
import publications from "@/data/publications.json";
import zenodo from "@/data/zenodo.json";
import { REPOS } from "@/lib/github";
import { matchesQuery, publicationText } from "@/lib/search";

export type Area = {
  slug: string;
  name: string;
  /** Publications filter query: the area's papers are exactly what /publications/?q= shows for it. */
  query: string;
  repos: RegExp; // matched against a repo's title and summary
  datasets: RegExp; // matched against a Zenodo dataset's title
  /** True until the owner approves the description. */
  draft: boolean;
  description: string[];
  /** Where each sentence of the description comes from. */
  sources: { label: string; href: string }[];
};

export const AREAS: Area[] = [
  {
    slug: "metamer-mismatching",
    name: "Metamer mismatching",
    query: "metamer",
    repos: /metamer/i,
    datasets: /metamer/i,
    draft: true,
    description: [
      "Two surfaces that match under one light can differ under another. The set of colours a surface can take under a second light, given its colour under the first, is its metamer mismatch body.",
      "The lab computes these bodies exactly, by zonotope tiling, and studies what they predict: colour difference ellipsoids, and how accurately a camera's sensors record colour. Related work describes the object-colour solid, the set of all colours surfaces can have under a light.",
    ],
    sources: [
      { label: "mmb-zonotope-tiling README", href: "/code/mmb-zonotope-tiling/" },
      { label: "Exact Discrete Metamer Mismatch Bodies from Zonotope Tiling (2026)", href: "https://doi.org/10.5281/zenodo.22683532" },
      { label: "Metamer Mismatching Predicts Color Difference Ellipsoids (2025)", href: "/publications/?q=ellipsoids" },
      { label: "CMMRI README", href: "/code/CMMRI/" },
      { label: "The object-color solid (2025)", href: "/publications/?q=object-color" },
      { label: "ColorMechanism README", href: "/code/ColorMechanism/" },
    ],
  },
  {
    slug: "illumination-estimation",
    name: "Illumination estimation",
    query: "illumin|constancy",
    repos: /illumination|retinex|white balanc|constancy/i,
    datasets: /illumin|constancy/i,
    draft: true,
    description: [
      "The lab estimates the chromaticity of the scene illumination from an image, which can be used to provide colour constancy and automatic white balancing. Its methods include thin-plate spline interpolation of that chromaticity across a training set of images, and MATLAB implementations of retinex.",
      "More recent work proposes the Laplacian of the logarithm of an image as an illuminant-invariant input space.",
    ],
    sources: [
      { label: "Colour Constancy Algorithms (1999)", href: "/research/colour-constancy/" },
      { label: "tps README and JOSA A 2011 paper", href: "/code/tps/" },
      { label: "Retinex in MATLAB", href: "/code/retinex-matlab/" },
      { label: "Laplacian of Logarithm as Illuminant-Invariant Input Space (2022)", href: "/publications/?q=laplacian" },
    ],
  },
  {
    slug: "cinema-colour",
    name: "Cinema colour",
    query: "cinema|aces",
    repos: /color transformation language|cinema|\bACES\b/i,
    datasets: /cinema|\bACES\b/i,
    draft: true,
    description: [
      "Recent work assesses colour-rendering differences in cinematic lighting with a new metamer mismatch metric, and modernizes the Color Transformation Language (CTL).",
    ],
    sources: [
      { label: "Assessing color-rendering Differences in Cinematic Lighting with a New Metamer Mismatch Metric (2024)", href: "/publications/?q=cinematic" },
      { label: "mts2026-ctl README", href: "/code/mts2026-ctl/" },
    ],
  },
];

/** An area's papers (newest first), repos and datasets, all drawn from the site's data. */
export function areaContent(area: Area) {
  const papers = publications.publications.filter(p => matchesQuery(publicationText(p), area.query));
  return {
    papers,
    recent: papers.filter(p => p.type !== "Dataset").slice(0, 4),
    repos: REPOS.filter(r => area.repos.test(`${r.title} ${r.summary}`)),
    datasets: zenodo.datasets.filter(d => area.datasets.test(d.title)),
  };
}

export type Topic = { slug: string; title: string; written: string; summary: string };

// Titles and summaries are the old site's own words.
export const TOPICS: Topic[] = [
  {
    slug: "the-colour-problem",
    title: "The Colour Problem",
    written: "2007",
    summary: "A discussion of how colour is a perceptual experience.",
  },
  {
    slug: "colour-constancy",
    title: "Colour Constancy Algorithms",
    written: "1999",
    summary: "This property of compensating for illumination is called colour constancy.",
  },
  {
    slug: "colour-indexing",
    title: "Object Recognition Using Colour Indexing",
    written: "1999",
    summary: "One of the reasons humans might need colour constancy is for object recognition.",
  },
  {
    slug: "sensor-sharpening",
    title: "Sensor Sharpening",
    written: "1999",
    summary: "The idea that narrow band sensors result in illumination independent ratios of adjacent pixel channel values led Computational Vision Lab researchers to consider the general conditions that lead to stable ratios.",
  },
];

/** The old site's reference list (1999), as written there. Topic pages cite these by key. */
export const REFERENCES: Record<string, string> = {
  BARNARD95: "Barnard, K., Computational Colour Constancy: Taking Theory into Practice, MSc thesis, Simon Fraser Univ., School of Computing Science, 1995.",
  BARNARD96: "Barnard. K., Finlayson, G., Funt, B., Colour Constancy for Scenes with Spectrally Varying Illumination, ECCV’96 Fourth European Conference on Computer Vision, Vol. II, pages 3-15, April 1996.",
  BARNARD98: "Kobus Barnard, K., Funt, B. “Experiments in Sensor Sharpening for Color Constancy,” Proceedings of the IS&T/SID Sixth Color Imaging Conference: Color Science, Systems and Applications, 1998",
  BRAINARD92: "Brainard, D.H. and Wandell, B.A., Asymmetric color matching: how color appearance depends on the illuminant. J. Opt. Soc. Am. A, 9, 1433-1448, 1992.",
  COHEN64: "Cohen, J., Dependency of The Spectral Reflectance Curves of The Munsell Color Chips, Psychon. Sci. 1:369-370, 1964.",
  FINLAY94a: "Finlayson, G., Drew M., and Funt, B., Spectral Sharpening: Sensor Transformations for Improved Color. J. Opt. Soc. Am. A, 11(5):1553-1563, 1994",
  FINLAY94b: "Finlayson, G., Drew, M., and Funt., B., Color Constancy: Generalized Diagonal Transforms Suffice, J. Opt. Soc. Am. A, 11(11):3011-3020,1994",
  FINLAY95: "Finlayson, G., Funt, B. and Barnard, J., Colour Constancy Under a Varying Illumination, Proc. Fifth Intl. Conf. on Comp. Vis., Jun 1995.",
  FINLAY96: "Finlayson, G. Color in Perspective, PAMI Oct 1996. Vol 18 number 10, p1034-1038",
  FORSY90: "Forsyth, D., A novel algorithm for color constancy, Intl. Journal of Computer Vision 5:5-36, 1990.",
  FUNT91: "Funt, B.V., Drew, M.S., and Ho, J., Color Constancy from Mutual Reflection. Intl. Journal of Computer Vision, 6(1):5-24, April 1991.",
  FUNT93: "Funt, B.V. and Drew, M.S., Color space analysis of mutual illumination, IEEE Trans. Patt. Anal. and Mach. Intell., 15(12):1319-1325, 1993.",
  FUNT95: "Funt, B.V., and Finlayson G.D., Color Constant Color Indexing, IEEE Trans. Patt. Anal. and Mach. Intell, 17(5), May 1995.",
  HERTZ91: "Hertz, J., Krogh, A., and Palmer, R.G. Introduction to the Theory of Neural Computation, Addison-Wesley Publishing Company, 1991.",
  LAND71: "Land, E.H., and McCann, J.J., Lightness and retinex theory, J. Opt. Soc. Am, 61:1-11, 1971.",
  RUMEL: "Rumelhart, D.E., Hinton, G.E., and. Williams, R.J, Learning Internal Representations by Error Propagation in D.E. Rumelhart & J.L. McClelland (Eds.), Parallel Distributed Processing: Explorations in the Microstructure of Cognition. Vol.1: Foundations. MIT.",
  SWAIN91: "Swain, M.J., Ballard, D.H., Colour Indexing, Intl. Journal of Computer Vision, 7(1):11-32, 1991.",
  WYSZ82: "Wyszecki, G. and Stiles, W., Color Science: Concepts and Methods Quantitative Data and Formulas 2nd ed., Wiley New York, 1982.",
};

/** The reference keys a page cites, in order of first citation. */
export function citedKeys(markdown: string): string[] {
  return [...new Set(Array.from(markdown.matchAll(/\(#ref-([A-Za-z0-9]+)\)/g), m => m[1]))].filter(k => k in REFERENCES);
}
