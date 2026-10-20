/*
 * What a component looked like when it was installed, and whether it still does.
 *
 * Components are copied into a project to be edited — that is the point of
 * copy-in. Until 2.7.2 nothing recorded what was copied, so `add` could not
 * tell a pristine Button from one somebody had spent a week on, and it
 * overwrote both. This is the record.
 *
 * Each installed component gets `.install-manifest.json` beside its files:
 * the kit version it came from, a hash of every file as written, and a
 * compact copy of its contract. The contract is stored here, not just in
 * passport.json, because the `passport` command regenerates passport.json
 * from the project's own source — after which it describes the edits, not the
 * baseline. Nothing rewrites the manifest except installing the component.
 *
 * Components installed before 2.7.2 have no manifest. For those the
 * passport's own `sourceHash` is still usable: it was computed over the
 * kit's files with the kit's path labels, and recomputing it over the
 * project's copy with those same labels says whether anything changed.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { componentHash } = require("../passport/hash.cjs");
const { compactContract } = require("./contract.cjs");

const MANIFEST = ".install-manifest.json";
const PASSPORT = "passport.json";
const TESTS_DIR = "__tests__";
const MANIFEST_VERSION = 1;

/*
 * passport.json is derived, and the `passport` command regenerates it on
 * purpose. Counting that as an edit would flag every project that ever ran
 * it, so it is left out of change detection; the manifest carries the
 * baseline contract instead.
 */
const DERIVED = new Set([PASSPORT]);

/* The consumer's own overlay, which the CLI never writes. Adding it is not an edit. */
const OWNED = new Set(["passport.local.json"]);

const TEXT = /\.(tsx?|jsx?|mjs|cjs|css|md|json|svg|html?)$/i;

/** A file's hash, ignoring line endings for text — autocrlf is not an edit. */
function hashFile(file) {
  const bytes = fs.readFileSync(file);
  const content = TEXT.test(file) ? bytes.toString("utf8").replace(/\r\n/g, "\n") : bytes;
  return crypto.createHash("sha256").update(content).digest("hex");
}

/** Every file in a component folder, relative and "/"-separated, minus the manifest and tests. */
function listFiles(dir, prefix = "") {
  if (!fs.existsSync(path.join(dir, prefix))) return [];
  return fs
    .readdirSync(path.join(dir, prefix), { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.name === MANIFEST || entry.name === TESTS_DIR) return [];
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) return []; // never follow a link out of the folder
      return entry.isDirectory() ? listFiles(dir, relative) : [relative];
    })
    .sort();
}

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

/**
 * Record a component as just installed. Hashes are taken from the source the
 * kit copied, so the record describes what the kit wrote, whatever happened
 * to the copy between the copy and this call.
 */
function writeManifest(destDir, { component, version, sourceDir }) {
  const files = listFiles(sourceDir);
  const manifest = {
    manifestVersion: MANIFEST_VERSION,
    component,
    version,
    installedAt: new Date().toISOString(),
    files: Object.fromEntries(files.map((file) => [file, hashFile(path.join(sourceDir, file))])),
    contract: compactContract(readJson(path.join(sourceDir, PASSPORT))),
  };
  fs.writeFileSync(path.join(destDir, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

/** The passport's sourceHash, recomputed over the project's copy with the kit's labels. */
function kitRelativeHash(dir, folder, passport) {
  const files = passport?.source?.files;
  if (!Array.isArray(files)) return null;
  const entries = [];
  for (const relative of files) {
    // A path that climbs out of the folder is not one the kit ever wrote.
    if (typeof relative !== "string" || relative.split(/[\\/]/).includes("..")) return null;
    const file = path.join(dir, relative);
    if (!fs.existsSync(file)) return null; // a file the passport lists is gone: not pristine
    entries.push({ rel: relative, file });
  }
  // The generator hashes styles.css alongside the source when there is one.
  const styles = path.join(dir, "styles.css");
  if (fs.existsSync(styles)) entries.push({ rel: "styles.css", file: styles });
  // The generator's own labelling rule, not a copy of it.
  return componentHash(folder, entries);
}

/**
 * Where an installed component stands against what was installed.
 *
 * `state` is one of:
 *   pristine  every file is as the kit wrote it
 *   edited    something changed; `changed`/`missing`/`added` say what, when known
 *   unknown   installed before 2.7.2 and no longer matches what any record
 *             describes — it may hold edits, so it is treated as edited
 *
 * @param {string} dir      the installed component folder
 * @param {object} options
 * @param {string} options.folder   its name, e.g. "date-picker"
 * @param {string} [options.kitDir] the same component in the running CLI, for
 *                                  the case where versions match and the files
 *                                  can be compared directly
 * @param {string} [options.kitVersion]
 */
function inspect(dir, { folder, kitDir, kitVersion }) {
  const manifest = readJson(path.join(dir, MANIFEST));

  if (manifest && manifest.files && typeof manifest.files === "object") {
    const present = new Set(listFiles(dir));
    const changed = [];
    const missing = [];
    for (const [file, hash] of Object.entries(manifest.files)) {
      if (DERIVED.has(file)) continue;
      if (!present.has(file)) missing.push(file);
      else if (hashFile(path.join(dir, file)) !== hash) changed.push(file);
    }
    const added = [...present].filter(
      (file) => !(file in manifest.files) && !DERIVED.has(file) && !OWNED.has(file),
    );
    return {
      baseline: "manifest",
      installedVersion: manifest.version || null,
      state: changed.length || missing.length || added.length ? "edited" : "pristine",
      changed,
      missing,
      added,
      // Updating copies over the folder: it never deletes an added file, but it
      // does replace a changed one and restore a deleted one.
      destructive: changed.length > 0 || missing.length > 0,
      baseContract: manifest.contract || null,
    };
  }

  // Before 2.7.2: no manifest. Is the passport still the one the kit wrote?
  const passport = readJson(path.join(dir, PASSPORT));
  const recorded = passport?.source?.sourceHash;
  const recomputed = recorded ? kitRelativeHash(dir, folder, passport) : null;
  if (recorded && recomputed === recorded) {
    return {
      baseline: "passport",
      installedVersion: passport.source.libraryVersion || null,
      state: "pristine",
      changed: [],
      missing: [],
      added: [],
      destructive: false,
      baseContract: compactContract(passport),
    };
  }

  /*
   * No record that still applies. Compare with the running CLI's own copy:
   * identical files are pristine at this version. Any difference could be an
   * edit or simply an older version, and there is no telling which — so it is
   * reported as unknown, and `add` will not overwrite it without --force.
   * Refusing once too often costs a flag; overwriting once too often costs
   * someone's work.
   */
  if (kitDir && fs.existsSync(kitDir)) {
    const ours = new Set(listFiles(kitDir).filter((file) => !DERIVED.has(file)));
    const theirs = new Set(listFiles(dir).filter((file) => !DERIVED.has(file) && !OWNED.has(file)));
    const changed = [...ours].filter(
      (file) => theirs.has(file) && hashFile(path.join(dir, file)) !== hashFile(path.join(kitDir, file)),
    );
    const missing = [...ours].filter((file) => !theirs.has(file));
    const added = [...theirs].filter((file) => !ours.has(file));
    if (!changed.length && !missing.length && !added.length) {
      return {
        baseline: "kit",
        installedVersion: kitVersion || null,
        state: "pristine",
        changed,
        missing,
        added,
        destructive: false,
        baseContract: compactContract(readJson(path.join(kitDir, PASSPORT))),
      };
    }
    return {
      baseline: "none",
      installedVersion: passport?.source?.libraryVersion || null,
      state: "unknown",
      // Differences from the running CLI's copy — not necessarily your edits.
      changed,
      missing,
      added,
      destructive: true,
      baseContract: null,
    };
  }

  return {
    baseline: "none",
    installedVersion: null,
    state: "unknown",
    changed: [],
    missing: [],
    added: [],
    destructive: true,
    baseContract: null,
  };
}

module.exports = { MANIFEST, inspect, writeManifest, listFiles, hashFile, kitRelativeHash };
