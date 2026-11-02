let segmenter: Intl.Segmenter | null | undefined;

function intlSegmenter(): Intl.Segmenter | null {
  if (segmenter === undefined) {
    segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter() : null;
  }
  return segmenter;
}

// Close to Unicode's extended grapheme clusters, for runtimes without
// `Intl.Segmenter` (Hermes on Android, older Firefox). One cluster is:
// - CR LF, or a pair of regional indicators (one flag), or
// - any code point, then any number of: combining marks, variation selectors,
//   skin tones, emoji tag characters, a ZWJ and the code point it joins, or an
//   Indic virama and the consonant it joins into a conjunct (Unicode 15.1, GB9c).
// Hangul jamo sequences are not joined; precomposed Hangul, the normal form, is
// one code point already.
const EXTEND = "[\\p{M}\\uFE00-\\uFE0F\\u{1F3FB}-\\u{1F3FF}\\u{E0020}-\\u{E007F}]";
const LINKER = "[\\u094D\\u09CD\\u0ACD\\u0B4D\\u0C4D\\u0D4D]";
let cluster: RegExp | null | undefined;

function clusterPattern(): RegExp | null {
  if (cluster === undefined) {
    try {
      cluster = new RegExp(
        `\\r\\n|\\p{RI}\\p{RI}|[^](?:${LINKER}\\p{L}|\\u200D[^]?|${EXTEND})*`,
        "gu",
      );
    } catch {
      // No Unicode property escapes in this runtime: code points are the best left.
      cluster = null;
    }
  }
  return cluster;
}

/**
 * Splits text into characters as a person sees them: `"👍🏽"` and `"é"` written
 * as e + accent are each one. Uses `Intl.Segmenter` where it exists; elsewhere a
 * close approximation, then code points.
 */
export function graphemes(value: string): string[] {
  if (!value) return [];
  const intl = intlSegmenter();
  if (intl) return Array.from(intl.segment(value), (part) => part.segment);
  const pattern = clusterPattern();
  return pattern ? value.match(pattern) ?? [] : Array.from(value);
}

/**
 * Characters as a person counts them. `"👍🏽".length` is 4 and `"é"` can be 2,
 * but each is one character here.
 */
export function countCharacters(value: string): number {
  return graphemes(value).length;
}
