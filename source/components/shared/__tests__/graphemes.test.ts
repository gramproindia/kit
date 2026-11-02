import { afterEach, describe, expect, it, vi } from "vitest";

// Hermes on Android has no Intl.Segmenter (measured on a phone, 2026-11-02), so
// the fallback is what React Native users get. Node's Segmenter is the oracle.
const CORPUS = [
  "abc",
  "é",
  "👍🏽",
  "👨‍👩‍👧",
  "👩🏽‍💻 at work",
  "🏳️‍🌈",
  "🇮🇳🇺🇸",
  "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "1️⃣",
  "a\r\nb",
  "അനന്തു രമണൻ", // Malayalam conjunct (virama joins)
  "क्षत्रिय हिन्दी", // Devanagari conjuncts
  "தமிழ்", // Tamil virama does not join (not a GB9c linker)
  "ক্ষ", // Bengali
  "日本語テキスト",
  "Ελληνικά",
  "Zalgo: Z̵̢͎a̶l̷g̸o̵",
  "",
];

const oracle = new Intl.Segmenter();
const expected = (text: string) => Array.from(oracle.segment(text), (s) => s.segment);

async function fallbackGraphemes() {
  vi.resetModules();
  // `"Segmenter" in Intl` must be false, not just undefined. Intl's members are
  // not enumerable, so they are copied by name.
  const withoutSegmenter = Object.fromEntries(
    Object.getOwnPropertyNames(Intl).filter((k) => k !== "Segmenter").map((k) => [k, (Intl as never)[k]]),
  );
  vi.stubGlobal("Intl", withoutSegmenter);
  return (await import("../core/text")).graphemes;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("graphemes", () => {
  it("uses Intl.Segmenter where it exists", async () => {
    const { graphemes } = await import("../core/text");
    for (const text of CORPUS) expect(graphemes(text)).toEqual(expected(text));
  });

  it.each(CORPUS)("without Segmenter, splits %j like Segmenter does", async (text) => {
    const graphemes = await fallbackGraphemes();
    expect("Segmenter" in Intl).toBe(false);
    expect(graphemes(text)).toEqual(expected(text));
  });

  it("without Segmenter, still counts emoji as one character", async () => {
    await fallbackGraphemes();
    const { countCharacters } = await import("../core/text");
    expect(countCharacters("👨‍👩‍👧 é 👍🏽")).toBe(5);
  });
});
