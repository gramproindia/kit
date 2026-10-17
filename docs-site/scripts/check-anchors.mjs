/*
 * Every in-site link with a #fragment, checked against the headings that
 * actually exist on the page it points at.
 *
 * A dead anchor does not 404 — the page loads and silently ignores the
 * fragment — so nothing catches these except looking.
 *
 * Pages are keyed by their full path under content/, not by basename: there
 * are two of most pages (English and the `ml/` translation) and collapsing
 * them checks each page's own links against the other one's headings, which
 * reports every translated heading as a dead anchor.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, posix, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const CONTENT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "app",
  "content",
);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".mdx") || name.endsWith(".md")) out.push(p);
  }
  return out;
}

/*
 * Must stay identical to createSlugger in app/(main)/_lib/slug.ts, or this
 * reports the difference between the two rules rather than real dead links.
 */
const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, "")
    .replace(/\s+/g, "-") || "section";

const files = walk(CONTENT);

// "2.0.0-beta/spinner" -> the anchors that page offers
const pages = new Map();
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const anchors = new Set();
  for (const m of text.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) anchors.add(slugify(m[1]));
  for (const m of text.matchAll(/\{#([^}\s]+)\}/g)) anchors.add(m[1]);
  const key = relative(CONTENT, file).replace(/\\/g, "/").replace(/\.mdx?$/, "");
  pages.set(key, anchors);
}

/*
 * A link href is a site path, not a content path: /button on the English site
 * is 2.0.0-beta/button.mdx, and /ml/button is 2.0.0-beta/ml/button.mdx. Try
 * the candidates that could produce this href, preferring one in the same
 * directory as the linking page.
 */
function resolve(href, fromKey) {
  const dir = posix.dirname(fromKey);
  const bare = href.replace(/^\//, "").replace(/\/$/, "");
  const candidates = [
    posix.join(dir, bare),            // sibling
    `2.0.0-beta/${bare}`,             // English root
    bare,                             // already a content path
  ];
  for (const c of candidates) if (pages.has(c)) return c;
  return null;
}

let dead = 0;
let checked = 0;
let unknown = 0;

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const key = relative(CONTENT, file).replace(/\\/g, "/").replace(/\.mdx?$/, "");

  // Fragments are not ASCII-only: a translated heading slugs to its own script.
  for (const m of text.matchAll(/\]\((\/[^)\s]*?)?#([^)\s]+)\)/g)) {
    const [, href, frag] = m;
    checked += 1;
    const targetKey = href ? resolve(href, key) : key;
    if (!targetKey) {
      unknown += 1;
      console.log(`?    ${key}: href ${href} does not resolve to a content page (#${frag})`);
      continue;
    }
    if (!pages.get(targetKey).has(frag)) {
      dead += 1;
      console.log(`DEAD ${key} -> ${href || "(self)"}#${frag}   [checked against ${targetKey}]`);
    }
  }
}

console.log(`\n${checked} anchor link(s) checked, ${dead} dead, ${unknown} unresolved`);
process.exit(dead ? 1 : 0);
