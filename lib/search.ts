// The one matching rule for publications, shared by the Publications filter and the Research areas so their
// counts agree. A query is alternatives separated by "|"; an alternative matches when every word in it starts
// a word in the text ("illumin" matches "illumination"; "aces" does not match "surfaces"). A quoted alternative
// matches as one phrase ("B. Bastani" finds that author, not every paper with a "B." and a "Bastani").

const escape = (s: string) => s.replace(/[.*+?^${}()[\]\\]/g, "\\$&");

export function matchesQuery(text: string, query: string): boolean {
  const alternatives = query.toLowerCase().split("|").map(a => a.trim()).filter(a => a.replace(/"/g, ""));
  if (alternatives.length === 0) return true;
  const haystack = text.toLowerCase();
  const startsWord = (w: string) => new RegExp(`(?<![\\p{L}\\p{N}])${escape(w)}`, "u").test(haystack);
  return alternatives.some(a =>
    /^".+"$/.test(a) ? startsWord(a.slice(1, -1).trim()) : a.replace(/"/g, "").split(/\s+/).filter(Boolean).every(startsWord));
}

/** The text a publication is searched by: title, authors, venue, type and year. */
export const publicationText = (p: { title: string; authors: string[]; venue: string | null; type: string; year: number | null }) =>
  [p.title, p.authors.join(" "), p.venue, p.type, p.year].filter(Boolean).join(" ");
