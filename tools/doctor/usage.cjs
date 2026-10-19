/*
 * Where a project uses the components, and with which props.
 *
 * Answers the one question a contract diff cannot answer alone: "does this
 * change break *me*?" A removed prop nobody passes is a footnote; the same
 * prop passed in forty places is the whole upgrade.
 *
 * Bounded on purpose. It walks the user's tree, so it skips everything that
 * is not their source (dependencies, build output, the component library
 * itself), refuses to follow symlinks, and stops at a file count and a file
 * size rather than trusting the tree to be reasonable.
 */
const fs = require("fs");
const path = require("path");
const { jsxOpenings } = require("../jsx-tags.cjs");

const SOURCE = /\.(tsx|jsx|ts|js|mdx)$/i;
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".turbo",
  ".vercel",
  ".cache",
  "dist",
  "build",
  "out",
  "coverage",
  "storybook-static",
]);
const MAX_FILES = 20000;
const MAX_BYTES = 1024 * 1024;

/**
 * @param {string} root            the project root
 * @param {string[]} names         component names to look for, e.g. ["Button", "Select"]
 * @param {{ skip?: string[] }} [options]  extra absolute directories to skip (the component library)
 * @returns {{ usages: { component: string, file: string, line: number, props: string[] }[], truncated: boolean }}
 */
function scanUsage(root, names, options = {}) {
  const wanted = new Set(names);
  const skip = new Set((options.skip || []).map((dir) => path.resolve(dir)));
  const usages = [];
  let files = 0;
  let truncated = false;

  const walk = (dir) => {
    if (truncated) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // unreadable: not ours to report on
    }
    for (const entry of entries) {
      if (truncated) return;
      if (entry.isSymbolicLink()) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || skip.has(path.resolve(full))) continue;
        walk(full);
        continue;
      }
      if (!SOURCE.test(entry.name) || /\.d\.ts$/.test(entry.name)) continue;
      if (++files > MAX_FILES) {
        truncated = true;
        return;
      }
      let text;
      try {
        if (fs.statSync(full).size > MAX_BYTES) continue;
        text = fs.readFileSync(full, "utf8");
      } catch {
        continue;
      }
      if (!text.includes("<")) continue;
      for (const tag of jsxOpenings(text)) {
        if (!wanted.has(tag.name)) continue;
        usages.push({
          component: tag.name,
          file: path.relative(root, full).split(path.sep).join("/"),
          line: tag.line,
          props: tag.attrs,
        });
      }
    }
  };

  walk(path.resolve(root));
  return { usages, truncated };
}

module.exports = { scanUsage };
