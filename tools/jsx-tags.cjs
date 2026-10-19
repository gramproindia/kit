/*
 * Find the opening tags of capitalised JSX elements, and the attribute names
 * on each — without a parser.
 *
 * Used by `validate_usage`, which checks a fragment an agent just wrote, and by
 * `doctor`, which walks a whole project to find the call sites an upgrade
 * would break. Tolerant on purpose: both are given code that may not compile,
 * and the question is only "which props does this element receive".
 *
 * Linear in the input. Each character is visited a bounded number of times
 * and no regular expression here can backtrack, which matters because
 * `validate_usage` takes arbitrary text from a model (this was checked under
 * load in a VAPT pass: a megabyte of pathological input returns in ~70ms).
 */

// A fresh RegExp per call: a shared global one carries `lastIndex` between
// callers, which is a bug waiting for the first time two scans interleave.
const OPENING_SOURCE = "<([A-Z][A-Za-z0-9]*)(?=[\\s/>])";

/**
 * Attribute names at the top level of a tag's attribute text.
 *
 * Words inside `{...}` and inside quotes are not attributes. The previous
 * version matched names anywhere in the tag, so `title={ok ? a : b}` reported
 * `a` and `b` as attributes — a false "not a prop" from validate_usage, and,
 * worse, a false "your code uses a removed prop" from doctor.
 */
function attributeNames(raw) {
  const names = [];
  let depth = 0;
  let quote = null;
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (quote) {
      if (ch === quote) quote = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      i += 1;
      continue;
    }
    if (ch === "{") {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === "}") {
      depth = Math.max(0, depth - 1);
      i += 1;
      continue;
    }
    // A name starts at depth 0, after whitespace or the start of the text.
    if (depth === 0 && /[a-zA-Z]/.test(ch) && (i === 0 || /\s/.test(raw[i - 1]))) {
      let j = i + 1;
      while (j < raw.length && /[a-zA-Z0-9:_-]/.test(raw[j])) j += 1;
      // Followed by `=`, whitespace or the end: an attribute, or a boolean one.
      let k = j;
      while (k < raw.length && /\s/.test(raw[k])) k += 1;
      if (k >= raw.length || raw[k] === "=" || k > j || raw[k] === "/") names.push(raw.slice(i, j));
      i = j;
      continue;
    }
    i += 1;
  }
  return names;
}

/**
 * Every capitalised opening tag in `source`.
 *
 * @returns {{ name: string, index: number, line: number, attrs: string[] }[]}
 */
function jsxOpenings(source) {
  const text = String(source || "");
  const found = [];
  // Matches arrive in order, so the line count is carried forward rather than
  // recounted from the top for each tag — recounting is quadratic, and this
  // runs on untrusted input.
  let lineAt = 0;
  let line = 1;
  const OPENING = new RegExp(OPENING_SOURCE, "g");
  let match;
  while ((match = OPENING.exec(text))) {
    for (; lineAt < match.index; lineAt += 1) if (text.charCodeAt(lineAt) === 10) line += 1;
    /*
     * Scan to the tag's own `>` rather than matching one. An attribute can
     * hold an arrow function — `onDismiss={() => {}}` — so the first `>` is
     * usually inside a brace, and a regex that stops there finds nothing.
     */
    let depth = 0;
    let quote = null;
    let end = -1;
    for (let i = match.index + match[0].length; i < text.length; i += 1) {
      const ch = text[i];
      if (quote) {
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
      } else if (ch === "{") {
        depth += 1;
      } else if (ch === "}") {
        depth -= 1;
      } else if (ch === ">" && depth === 0) {
        end = i;
        break;
      }
    }
    if (end === -1) continue; // Unterminated fragment; nothing reliable to say.

    let raw = text.slice(match.index + match[0].length, end).trimEnd();
    if (raw.endsWith("/")) raw = raw.slice(0, -1); // self-closing
    found.push({ name: match[1], index: match.index, line, attrs: attributeNames(raw) });
  }
  return found;
}

module.exports = { jsxOpenings, attributeNames };
