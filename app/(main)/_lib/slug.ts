/**
 * Heading ids, matching the anchors the docs already link to
 * (e.g. "Imperative API (ref)" -> "imperative-api-ref").
 * Repeated headings on one page get "-1", "-2", ... suffixes.
 */
export function createSlugger() {
  const seen = new Map<string, number>();

  return (text: string) => {
    const base =
      text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-") || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}
