/**
 * Heading ids, matching the anchors the docs already link to
 * (e.g. "Imperative API (ref)" -> "imperative-api-ref").
 * Repeated headings on one page get "-1", "-2", ... suffixes.
 *
 * The character class keeps letters, digits and combining marks in any
 * script. It used to be [a-z0-9\s-], which left a Malayalam heading with
 * nothing but its spaces: every heading on a translated page fell through to
 * "section" or to "-", and then took its id from the duplicate counter
 * (id="-", id="--1", id="--2"). Those move whenever a heading is added,
 * so no link to one could be relied on. \p{M} matters as much as \p{L}:
 * Malayalam vowel signs are combining marks, and dropping them mangles the
 * text instead of emptying it. Every ASCII heading slugs to the same string
 * either way.
 */
export function createSlugger() {
  const seen = new Map<string, number>();

  return (text: string) => {
    const base =
      text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, "")
        .replace(/\s+/g, "-") || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}
