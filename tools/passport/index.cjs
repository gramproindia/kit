/*
 * Passport orchestration: generate, check, regen.
 *
 * `generate` and `regen` write passport.json. `check` writes nothing and exits
 * non-zero on drift — that is the CI gate.
 */

const fs = require("fs");
const path = require("path");

const {
  PASSPORT_VERSION, loadTypeScript, createProgram, extractComponent, posix,
} = require("./extract.cjs");
const { mergePassport } = require("./merge.cjs");
const { resolveReactTypes } = require("./typescript.cjs");
const {
  validateStructure, validateReferences, coverageIssues, textIssues,
} = require("./validate.cjs");

const MANUAL_FILE = "passport.manual.json";
const LOCAL_FILE = "passport.local.json";
const PASSPORT_FILE = "passport.json";

const readJson = (file) => {
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    const e = new Error(`${file} is not valid JSON: ${error.message}`);
    e.code = "EBADJSON";
    throw e;
  }
};

/** Stable key order + trailing newline, so writes are byte-identical run to run. */
function serialise(passport) {
  const ORDER = [
    "passportVersion", "identity", "source", "purpose", "props", "inherits", "events",
    "slots", "states", "accessibility", "composition", "operations", "intentDomains",
    "safeMutations", "examples", "coverage",
  ];
  const ordered = {};
  for (const key of ORDER) if (passport[key] !== undefined) ordered[key] = passport[key];
  for (const key of Object.keys(passport)) if (!(key in ordered)) ordered[key] = passport[key];
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

/** Components in a components root, excluding `shared`. */
function listComponents(libRoot) {
  return fs
    .readdirSync(libRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "shared")
    .map((e) => e.name)
    .sort();
}

/** Best-effort locate React's types so the checker can resolve DOM attributes. */
function findReactTypes(startDir) {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, "node_modules", "@types", "react");
    if (fs.existsSync(candidate)) return posix(candidate);
    const nested = path.join(dir, "playground", "node_modules", "@types", "react");
    if (fs.existsSync(nested)) return posix(nested);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Build the effective passport for every component.
 *
 * @param {object} opts
 * @param {string} opts.libRoot  directory holding the component folders
 * @param {string} opts.repoRoot for stable relative paths in the hash
 * @param {string} opts.libraryVersion
 * @param {boolean} [opts.includeLocal] read passport.local.json (consumer side)
 * @param {number} [opts.coverageThreshold]
 */
function buildAll(opts) {
  const { libRoot, repoRoot, libraryVersion, includeLocal = false, coverageThreshold } = opts;
  const ts = loadTypeScript([repoRoot, path.join(repoRoot, "playground")]);
  const components = listComponents(libRoot);
  // The project's own React types, else the pinned copy the kit generates with.
  // `opts.reactTypes: null` stands in for a project without them, in tests.
  let reactTypes = opts.reactTypes === null ? null : findReactTypes(repoRoot) || findReactTypes(__dirname);
  let reactTypesMissing = opts.reactTypes === null ? "@types/react is not installed." : null;
  if (!reactTypes && opts.reactTypes !== null) {
    const resolved = resolveReactTypes({ log: (message) => process.stderr.write(`${message}\n`) });
    reactTypes = resolved.dir;
    reactTypesMissing = resolved.dir ? null : resolved.reason;
  }
  const program = createProgram(ts, libRoot, components, reactTypes);
  const checker = program.getTypeChecker();

  const results = [];
  for (const name of components) {
    const dir = path.join(libRoot, name);
    const { passport: derived, api, stats } = extractComponent(ts, program, checker, {
      name, dir, libRoot, libraryVersion, repoRoot,
    });

    const manual = readJson(path.join(dir, MANUAL_FILE));
    const local = includeLocal ? readJson(path.join(dir, LOCAL_FILE)) : {};
    const effective = mergePassport(derived, manual, local);

    /*
     * Without React's type definitions the checker cannot resolve
     * ButtonHTMLAttributes and friends, so every inherited prop silently
     * disappears — and the reference check then blames the manual file for
     * naming props that "no longer exist". Say what actually happened.
     */
    const unresolvedInherits =
      !reactTypes && Array.isArray(effective.inherits) && effective.inherits.length > 0;

    const issues = [
      ...validateStructure(effective, name),
      // Every component, inherits or not: none of their React types resolved,
      // so none of their contracts could be fully verified.
      ...(!reactTypes
        ? [{
            level: "warn",
            code: "react-types-unresolved",
            component: name,
            message:
              `contract not verified — ${reactTypesMissing || "React type definitions were not found."} ` +
              "Run once while online, or `npm i -D @types/react @types/react-dom`.",
          }]
        : []),
      ...(unresolvedInherits ? [] : validateReferences(effective, { manual, local, component: name, api })),
      ...textIssues(effective, name),
      ...coverageIssues(effective, name, coverageThreshold),
    ];

    results.push({ name, dir, derived, manual, local, effective, issues, stats, api });
  }
  return { results, reactTypes, reactTypesMissing, components };
}

/** Write passport.json for each component. Returns the paths written. */
function generate(opts) {
  const { results, reactTypes, reactTypesMissing } = buildAll(opts);
  /*
   * Without React's types every inherited prop is missing from what was just
   * built. Writing it would replace complete passports with hollow ones, so
   * nothing is written; the caller says why and how to fix it.
   */
  if (!reactTypes) {
    const error = new Error(
      `Passports not written: ${reactTypesMissing || "React type definitions were not found."} ` +
        "Without them every inherited prop would be dropped from the passports. " +
        "Run this once while online, or install them: npm i -D @types/react @types/react-dom",
    );
    error.code = "EREACT_TYPES";
    throw error;
  }
  const written = [];
  for (const r of results) {
    const file = path.join(r.dir, PASSPORT_FILE);
    const next = serialise(r.effective);
    const prev = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
    if (prev !== next) {
      fs.writeFileSync(file, next);
      written.push(posix(path.relative(opts.repoRoot, file)));
    }
  }
  return { results, written };
}

/**
 * A passport with every enum's `typeText` rewritten from its sorted values.
 *
 * Until 2.7.4 that text was TypeScript's own, whose union order depends on
 * what else is in the program, so the same component printed differently in
 * the kit and in a project. 2.7.4 writes it sorted; comparing in this form
 * keeps a passport shipped before then from reading as stale under a newer CLI.
 */
function canonical(text) {
  const passport = JSON.parse(text);
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return undefined;
    if (node.type === "enum" && Array.isArray(node.values) && typeof node.typeText === "string") {
      const optional = /(^|\|)\s*undefined\s*($|\|)/.test(node.typeText);
      node.typeText = [
        ...[...node.values].sort().map((value) => `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`),
        ...(optional ? ["undefined"] : []),
      ].join(" | ");
    }
    return Object.values(node).forEach(walk);
  };
  walk(passport);
  return serialise(passport);
}

/**
 * CI gate. Regenerates in memory and compares with what is committed.
 * Never writes.
 */
function check(opts) {
  const { results, reactTypes } = buildAll(opts);
  // In this repository it is an npm script; in a project, the CLI.
  const regenerate = opts.regenerate || "npm run passport";
  const report = [];
  let errors = 0;
  let warnings = 0;

  for (const r of results) {
    const file = path.join(r.dir, PASSPORT_FILE);
    const expected = serialise(r.effective);
    const actual = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;

    const problems = [...r.issues];
    if (actual === null) {
      problems.unshift({ level: "error", code: "missing-passport", component: r.name,
        message: `no passport.json committed; run \`${regenerate}\`` });
    } else if (actual !== expected && canonical(actual) !== canonical(expected)) {
      const sourceChanged = JSON.parse(actual).source?.sourceHash !== r.effective.source.sourceHash;
      if (sourceChanged) {
        // The source hash needs no types: a changed source is known for certain.
        problems.unshift({ level: "error", code: "stale-passport", component: r.name,
          message: `passport stale — source changed since the passport was generated; run \`${regenerate}\`` });
      } else if (!reactTypes) {
        /*
         * Same source, different output: the difference is the missing React
         * types, not the passport. Calling it stale sent people to regenerate,
         * which would have made the passport worse. The source is verified;
         * the contract is not, and the react-types warning says why.
         */
      } else {
        problems.unshift({ level: "error", code: "stale-passport", component: r.name,
          message: `passport stale — committed passport differs from generated output; run \`${regenerate}\`` });
      }
    }

    errors += problems.filter((p) => p.level === "error").length;
    warnings += problems.filter((p) => p.level === "warn").length;
    report.push({ component: r.name, ok: problems.every((p) => p.level !== "error"), problems, stats: r.stats });
  }

  return { report, errors, warnings, results };
}

module.exports = {
  PASSPORT_VERSION, MANUAL_FILE, LOCAL_FILE, PASSPORT_FILE,
  buildAll, generate, check, serialise, listComponents, readJson, findReactTypes,
};
