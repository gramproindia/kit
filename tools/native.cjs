/*
 * The React Native edition (beta): which platform a project is, which
 * components exist on it, and what a native install copies.
 *
 * A cross-platform component keeps its native view beside the web one, in
 * source/components/<folder>/native/. A native install copies core/, native/,
 * hooks/ and the docs, never react/ or styles.css, and writes the folder's
 * index.ts from index.native.ts, so a project resolves the native entry without
 * TypeScript's moduleSuffixes. Mobile-only components (app bars, FABs, ...)
 * live in source/native/<folder>/ and are copied whole, with their imports of
 * shared/ rewritten to the project's layout.
 *
 * Everything that changes the files is done in a staging folder first, so the
 * rest of the installer (edit protection, manifests, doctor) works on exactly
 * what is written, unchanged. Only fs and path: the MCP server loads this too,
 * and its start-up is kept to an empty Node process.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const COMPONENTS = path.join(ROOT, "source", "components");
const NATIVE_ONLY = path.join(ROOT, "source", "native");
const SHARED = path.join(COMPONENTS, "shared");
const TESTS_DIR = "__tests__";

const PLATFORMS = ["web", "native"];
const NATIVE_DOCS = "https://kit.gramproindia.com/native/docs";
const THEME_FILE = "gbs.theme.ts";
const CSS_BARREL = "gbs.css";

/* -------------------------------------------------------------- detection */

/** The nearest package.json at or above `cwd`, or null. */
function nearestPackageJson(cwd) {
  let dir = path.resolve(cwd);
  for (;;) {
    const file = path.join(dir, "package.json");
    if (fs.existsSync(file)) return file;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * `--platform` wins. Otherwise a project whose nearest package.json depends on
 * react-native or expo is native, and anything else is web.
 *
 * @returns {{ platform: "web" | "native", reason: string } | { error: string }}
 */
function detectPlatform(cwd, requested) {
  if (requested !== undefined && requested !== null && requested !== "") {
    const wanted = String(requested).trim().toLowerCase();
    if (!PLATFORMS.includes(wanted)) {
      return { error: `Unknown --platform "${requested}". Use web or native.` };
    }
    return { platform: wanted, reason: "--platform" };
  }
  const file = nearestPackageJson(cwd);
  if (file) {
    let pkg = null;
    try {
      pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      pkg = null;
    }
    const deps = { ...(pkg && pkg.dependencies), ...(pkg && pkg.devDependencies) };
    for (const name of ["react-native", "expo"]) {
      if (deps[name]) return { platform: "native", reason: `${name} in package.json` };
    }
  }
  return { platform: "web", reason: "no react-native or expo in package.json" };
}

/* -------------------------------------------------------------- catalogue */

/** "app-bar" → "AppBar". */
const pascal = (folder) =>
  folder
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");

const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");

/** Value exports named in an index file: `export { A, type B }`, `export function C`. */
function exportedNames(file) {
  let text = "";
  try {
    text = stripComments(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
  const names = new Set();
  for (const match of text.matchAll(/export\s+(type\s+)?\{([^}]*)\}/g)) {
    if (match[1]) continue;
    for (const part of match[2].split(",")) {
      const item = part.trim();
      if (!item || item.startsWith("type ")) continue;
      const name = item.split(/\s+as\s+/).pop().trim();
      if (name) names.add(name);
    }
  }
  for (const match of text.matchAll(/export\s+(?:async\s+)?(?:function|const|class|let)\s+([A-Za-z_$][\w$]*)/g)) {
    names.add(match[1]);
  }
  return [...names];
}

/** The README's first sentence of prose, as a one-line purpose. */
function readmePurpose(dir) {
  const readme = path.join(dir, "README.md");
  if (!fs.existsSync(readme)) return "";
  const line = fs
    .readFileSync(readme, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#") && !l.startsWith("<!--") && !l.startsWith(">"));
  return line ? line.replace(/\s+/g, " ") : "";
}

let nativeOnlyCache = null;

/**
 * Mobile-only components, found rather than listed: every source/native/<folder>
 * with an index.ts. Read once per process.
 *
 * @returns {{ name: string, folder: string, dir: string, exports: string[], purpose: string }[]}
 */
function nativeOnlyComponents() {
  if (nativeOnlyCache) return nativeOnlyCache;
  let folders = [];
  try {
    folders = fs
      .readdirSync(NATIVE_ONLY, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(NATIVE_ONLY, entry.name, "index.ts")))
      .map((entry) => entry.name)
      .sort();
  } catch {
    folders = [];
  }
  nativeOnlyCache = folders.map((folder) => {
    const dir = path.join(NATIVE_ONLY, folder);
    return {
      name: pascal(folder),
      folder,
      dir,
      exports: exportedNames(path.join(dir, "index.ts")).filter((name) => /^[A-Z][A-Za-z]+$/.test(name)),
      purpose: readmePurpose(dir),
    };
  });
  return nativeOnlyCache;
}

/** Whether a cross-platform component folder has a native view yet. */
const hasNative = (folder) =>
  fs.existsSync(path.join(COMPONENTS, folder, "native")) &&
  fs.existsSync(path.join(COMPONENTS, folder, "index.native.ts"));

/* --------------------------------------------------------------- staging */

const isTestPath = (relative) => relative.split(/[\\/]/).includes(TESTS_DIR) || /\.test\.tsx?$/.test(relative);

/** Every file under `dir`, relative and "/"-separated, without tests. */
function filesUnder(dir, prefix = "") {
  const here = path.join(dir, prefix);
  if (!fs.existsSync(here)) return [];
  return fs
    .readdirSync(here, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.name === TESTS_DIR || entry.isSymbolicLink()) return [];
      return entry.isDirectory() ? filesUnder(dir, relative) : [relative];
    })
    .filter((relative) => !isTestPath(relative));
}

const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(["'])(\.{1,2}\/[^"']*)\2/g;

/** Relative specifiers in a source file. */
const relativeSpecifiers = (text) => [...stripComments(text).matchAll(SPECIFIER)].map((m) => m[3]);

const RESOLVE_SUFFIXES = [".native.ts", ".native.tsx", ".ts", ".tsx", ".js", ".json", ""];

/** A relative import → the file it lands on, as Metro would resolve it, or null. */
function resolveModule(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  for (const suffix of RESOLVE_SUFFIXES) {
    const candidate = base + suffix;
    if (suffix && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const index of ["index.native.ts", "index.native.tsx", "index.ts", "index.tsx"]) {
    const candidate = path.join(base, index);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const isTextSource = (file) => /\.(tsx?|jsx?|mjs|cjs)$/.test(file);
const toPosix = (p) => p.split(path.sep).join("/");
const tempDir = (label) => fs.mkdtempSync(path.join(os.tmpdir(), `grampro-kit-${label}-`));

/**
 * Stage a cross-platform component for a native project.
 *
 * Copies core/, native/ and hooks/ whole, README and passports, then follows
 * imports from those so anything else inside the folder that native code uses
 * also arrives. A file under react/ reached that way is copied too, so the
 * install works, but reported: native code is not meant to need the web view.
 *
 * @returns {{ dir: string, warnings: string[] }}
 */
function stageCrossPlatform(folder) {
  const src = path.join(COMPONENTS, folder);
  const stage = tempDir(folder);
  const wanted = new Set();
  const warnings = [];

  for (const sub of ["core", "native", "hooks"]) {
    for (const file of filesUnder(path.join(src, sub))) wanted.add(`${sub}/${file}`);
  }
  for (const file of ["README.md", "passport.json", "passport.manual.json"]) {
    if (fs.existsSync(path.join(src, file))) wanted.add(file);
  }

  // Follow imports from everything native-side, staying inside the folder.
  const queue = [...wanted].filter(isTextSource).map((relative) => path.join(src, relative));
  queue.push(path.join(src, "index.native.ts"));
  const seen = new Set();
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    let text = "";
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const specifier of relativeSpecifiers(text)) {
      const target = resolveModule(file, specifier);
      if (!target) continue;
      const relative = toPosix(path.relative(src, target));
      if (relative.startsWith("..")) continue; // shared/, installed separately
      if (relative === "index.ts" || relative === "index.native.ts") continue;
      if (!wanted.has(relative)) {
        wanted.add(relative);
        if (relative.startsWith("react/")) {
          warnings.push(`${folder}: native code imports ${relative} (from ${toPosix(path.relative(src, file))})`);
        }
        if (isTextSource(target)) queue.push(target);
      }
    }
  }

  for (const relative of wanted) {
    const to = path.join(stage, relative);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(src, relative), to);
  }
  // The native entry, under the name every resolver finds.
  fs.copyFileSync(path.join(src, "index.native.ts"), path.join(stage, "index.ts"));
  return { dir: stage, warnings };
}

/**
 * A mobile-only component's file, with imports of the kit's shared folder
 * rewritten to where shared/ sits in a project: beside the component.
 */
function rewriteSharedImports(text, sourceFile, componentDir, folder) {
  const virtualRoot = "/__project";
  const relativeInComponent = toPosix(path.relative(componentDir, sourceFile));
  const virtualFile = `${virtualRoot}/${folder}/${relativeInComponent}`;
  return text.replace(SPECIFIER, (whole, lead, quote, specifier) => {
    const target = path.resolve(path.dirname(sourceFile), specifier);
    const inShared = toPosix(path.relative(SHARED, target));
    if (inShared.startsWith("..") || path.isAbsolute(inShared)) return whole;
    let next = path.posix.relative(path.posix.dirname(virtualFile), `${virtualRoot}/shared/${inShared}`);
    if (!next.startsWith(".")) next = `./${next}`;
    return `${lead}${quote}${next}${quote}`;
  });
}

/** Stage a mobile-only component: the whole folder, imports rewritten. */
function stageNativeOnly(entry) {
  const stage = tempDir(entry.folder);
  for (const relative of filesUnder(entry.dir)) {
    const from = path.join(entry.dir, relative);
    const to = path.join(stage, relative);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    if (isTextSource(from)) {
      fs.writeFileSync(to, rewriteSharedImports(fs.readFileSync(from, "utf8"), from, entry.dir, entry.folder));
    } else {
      fs.copyFileSync(from, to);
    }
  }
  return { dir: stage, warnings: [] };
}

/**
 * The part of shared/ a native project gets: core/ and native/, the one DOM-free
 * React hook native code uses, and the version files. Never the rest of react/
 * (react-dom, the DOM) and never the web stylesheet.
 */
function stageShared() {
  const stage = tempDir("shared");
  const wanted = [
    ...filesUnder(path.join(SHARED, "core")).map((f) => `core/${f}`),
    ...filesUnder(path.join(SHARED, "native")).map((f) => `native/${f}`),
    "react/useControllableState.ts",
    "version.json",
    "version.ts",
    "README.md",
  ].filter((relative) => fs.existsSync(path.join(SHARED, relative)));
  for (const relative of wanted) {
    const to = path.join(stage, relative);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(SHARED, relative), to);
  }
  return stage;
}

/**
 * A folder for a web project: everything except the native view. Without this
 * a web install would carry files that import react-native, and a web project
 * type-checking its component folder would fail on a package it does not have.
 *
 * @param {string} src a component folder, or shared/
 * @returns {string | null} a staged copy, or null when there is nothing native to leave out
 */
function stageWeb(src) {
  const isNative = (relative) =>
    relative === "index.native.ts" || relative.startsWith("native/") || /\.native\.tsx?$/.test(relative);
  const files = filesUnder(src);
  if (!files.some(isNative)) return null;
  const stage = tempDir(path.basename(src));
  for (const relative of files.filter((file) => !isNative(file))) {
    const to = path.join(stage, relative);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(src, relative), to);
  }
  return stage;
}

const removeStage = (dir) => {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* A temp folder left behind is the OS's to clean. */
  }
};

/* ----------------------------------------------------------- theme file */

/**
 * The native stand-in for gbs.css: a theme the app passes to KitProvider.
 * Written once and then the project's; never overwritten.
 *
 * @returns {boolean} whether it was written now
 */
function writeThemeFile(destPath) {
  const file = path.join(destPath, THEME_FILE);
  if (fs.existsSync(file)) return false;
  const text = [
    "/*",
    " * Generated once by @grampro/kit (React Native, beta). Yours to edit; never overwritten.",
    " *",
    " * The native mirror of the --gbs-* CSS tokens. Pass it to KitProvider at the app root:",
    " *",
    ' *   import { KitProvider } from "./shared/native";',
    ' *   import { theme } from "./gbs.theme";',
    " *",
    " *   <KitProvider theme={theme}>{app}</KitProvider>",
    " */",
    'import type { KitTheme } from "./shared/native";',
    "",
    "export const theme: KitTheme = {",
    "  // One set for both schemes, e.g. accent: \"#7c3aed\", radius: 10,",
    "  // or per scheme: light: { accent: \"#7c3aed\" }, dark: { accent: \"#a78bfa\" },",
    "};",
    "",
  ].join("\n");
  fs.writeFileSync(file, text);
  return true;
}

/** Printed after a native install: the one manual step. */
function nativeSetupLines(destPath, cwd, wroteTheme) {
  const where = toPosix(path.relative(cwd, destPath)) || ".";
  return [
    "",
    wroteTheme ? `Theme: wrote ${where}/${THEME_FILE} (yours to edit).` : `Theme: ${where}/${THEME_FILE} (kept as it is).`,
    "Wrap your app once, at the root:",
    "",
    `  import { KitProvider } from "./${where}/shared/native";`,
    `  import { theme } from "./${where}/gbs.theme";`,
    `  import { useSafeAreaInsets } from "react-native-safe-area-context"; // optional`,
    "",
    "  <KitProvider theme={theme} insets={useSafeAreaInsets()}>",
    "    {app}",
    "  </KitProvider>",
    "",
    "  (insets are optional: without react-native-safe-area-context, drop that prop)",
    "",
    "Teach your coding agent the native components (Claude Code, Codex, Antigravity):",
    "  npx @grampro/kit@native skill",
    "",
    "React Native support is beta: APIs may change between prereleases.",
    `Docs: ${NATIVE_DOCS}`,
  ];
}

/**
 * A folder already holding the other platform's install. Mixing them in one
 * folder would leave shared/ and the components disagreeing about what they are.
 *
 * @returns {string | null} what is there, or null when it is fine
 */
function platformConflict(destPath, platform) {
  if (!fs.existsSync(destPath)) return null;
  let sharedPlatform = null;
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(destPath, "shared", ".install-manifest.json"), "utf8"));
    sharedPlatform = manifest.platform || "web";
  } catch {
    sharedPlatform = null;
  }
  if (platform === "native") {
    if (fs.existsSync(path.join(destPath, CSS_BARREL)) || sharedPlatform === "web") return "web";
  } else if (fs.existsSync(path.join(destPath, THEME_FILE)) || sharedPlatform === "native") {
    return "native";
  }
  return null;
}

module.exports = {
  COMPONENTS,
  NATIVE_ONLY,
  NATIVE_DOCS,
  THEME_FILE,
  CSS_BARREL,
  detectPlatform,
  nearestPackageJson,
  nativeOnlyComponents,
  hasNative,
  exportedNames,
  readmePurpose,
  stageCrossPlatform,
  stageNativeOnly,
  stageShared,
  stageWeb,
  removeStage,
  rewriteSharedImports,
  writeThemeFile,
  nativeSetupLines,
  platformConflict,
};
