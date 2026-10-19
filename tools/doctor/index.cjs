/*
 * `grampro-kit doctor` — what has changed in the components you installed,
 * what has changed upstream, and what an update would break.
 *
 * Copy-in means you own the code, which means you will edit it, which means
 * you leave the upgrade path the moment you do. A text diff against upstream
 * shows which lines moved but not what breaks. This compares contracts — the
 * props, values, handlers, exports and agent operations each component
 * promises — between the version you installed, your copy, and the version
 * this CLI carries, and then finds the call sites in your code that depend on
 * the difference.
 *
 * Three levels, each needing more than the last:
 *   files      always — from the install manifest, no TypeScript needed
 *   contracts  needs TypeScript in the project, to read your edited copy
 *   impact     scans your source for the components' JSX
 *
 * Read-only. It never writes a file.
 */
const fs = require("fs");
const path = require("path");
const { inspect } = require("./baseline.cjs");
const { compactContract, threeWay, acceptedNames } = require("./contract.cjs");
const { scanUsage } = require("./usage.cjs");

const PASSPORT = "passport.json";
const SHARED = "shared";

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

const normalise = (name) => String(name).toLowerCase().replace(/[^a-z0-9]/g, "");

/** -1, 0 or 1 for dotted versions; unknown sorts as oldest. */
function compareVersions(a, b) {
  if (!a) return -1;
  const left = String(a).split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  const right = String(b).split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] || 0) - (right[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/** Component folders installed in `dest` that this CLI also knows. */
function installedFolders(dest, kitRoot) {
  if (!fs.existsSync(dest)) return [];
  const known = new Set(
    fs.readdirSync(kitRoot, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name),
  );
  return fs
    .readdirSync(dest, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== SHARED && known.has(e.name))
    .map((e) => e.name)
    .sort();
}

/** "Button", "datepicker", "date-picker" or "MultiSelect" → the folder that holds it. */
function folderFor(name, kitRoot, folders) {
  const wanted = normalise(name);
  for (const folder of folders) {
    if (normalise(folder) === wanted) return folder;
    const passport = readJson(path.join(kitRoot, folder, PASSPORT));
    const names = [passport?.identity?.component, ...(passport?.identity?.exports || [])].filter(Boolean);
    if (names.some((n) => normalise(n) === wanted)) return folder;
  }
  return null;
}

/**
 * Read the project's own copies as contracts.
 *
 * Uses the same generator the kit uses on itself, pointed at the project, so
 * "your contract" means exactly what the kit would have written had it shipped
 * your edits. Needs TypeScript resolvable from the project; when it is not,
 * the report says so and stays at the file level instead of guessing.
 */
function readProjectContracts(dest, cwd) {
  let passport;
  try {
    passport = require("../passport/index.cjs");
  } catch (error) {
    return { error: `Passport tooling unavailable: ${error.message}` };
  }
  try {
    const { results, reactTypes } = passport.buildAll({
      libRoot: dest,
      repoRoot: cwd,
      libraryVersion: "local",
      includeLocal: false,
    });
    const contracts = new Map();
    for (const result of results) contracts.set(result.name, compactContract(result.effective));
    return { contracts, reactTypes: Boolean(reactTypes) };
  } catch (error) {
    if (error && (error.code === "ETYPESCRIPT_MISSING" || error.code === "ETYPESCRIPT_API")) {
      // The loader's own message says which case this is and the exact fix.
      return {
        error: `Contracts not compared — file-level changes only. ${error.message.replace(/\n\s*/g, " ")}`,
      };
    }
    return { error: `Could not read your components as contracts: ${error.message}` };
  }
}

/** Props and handlers an attribute list uses that `lost` takes away. */
const brokenProps = (props, lost) =>
  props.filter((p) => lost.has(p) && !p.startsWith("data-") && !p.startsWith("aria-") && p !== "key");

/**
 * @param {object} options
 * @param {string} options.cwd        project root
 * @param {string} options.dest       the installed component library, e.g. <root>/component-lib
 * @param {string} options.kitRoot    this CLI's source/components
 * @param {string} options.kitVersion this CLI's version
 * @param {string[]} [options.only]   component names to limit the report to
 * @param {boolean} [options.contracts=true] read edited copies as contracts (needs TypeScript)
 * @param {boolean} [options.impact=true]    scan the project for call sites
 */
function runDoctor(options) {
  const { cwd, dest, kitRoot, kitVersion, only, contracts = true, impact = true } = options;
  const installed = installedFolders(dest, kitRoot);

  let folders = installed;
  const notInstalled = [];
  if (only && only.length) {
    folders = [];
    for (const name of only) {
      const folder = folderFor(name, kitRoot, installed);
      if (folder) {
        if (!folders.includes(folder)) folders.push(folder);
      } else notInstalled.push(name);
    }
  }

  const rows = folders.map((folder) => {
    const dir = path.join(dest, folder);
    const kitDir = path.join(kitRoot, folder);
    const kitPassport = readJson(path.join(kitDir, PASSPORT));
    const theirs = compactContract(kitPassport);
    const status = inspect(dir, { folder, kitDir, kitVersion });
    const behind = compareVersions(status.installedVersion, kitVersion) < 0;
    return {
      folder,
      component: theirs?.component || folder,
      names: [theirs?.component, ...(theirs?.exports || [])].filter(Boolean),
      ...status,
      kitVersion,
      behind,
      theirs,
    };
  });

  // Contracts for edited copies only: a pristine copy's contract is its baseline.
  let contractNote = null;
  let reactTypes = true;
  const needContracts = contracts && rows.some((row) => row.state !== "pristine");
  if (needContracts) {
    const read = readProjectContracts(dest, cwd);
    if (read.error) contractNote = read.error;
    else {
      reactTypes = read.reactTypes;
      for (const row of rows) {
        if (row.state !== "pristine") row.mine = read.contracts.get(row.folder) || null;
      }
    }
  }

  for (const row of rows) {
    const mine = row.state === "pristine" ? row.baseContract : row.mine;
    if (row.state !== "pristine" && mine && row.theirs) {
      row.comparison = threeWay(row.baseContract, mine, row.theirs);
    } else if (row.state === "pristine" && row.behind && row.baseContract && row.theirs) {
      // Untouched but behind: what upstream changed since you installed.
      row.comparison = threeWay(row.baseContract, row.baseContract, row.theirs);
    }
    // Everything your copy accepts that upstream would not: what an update takes away.
    if (mine && row.theirs) {
      const keep = acceptedNames(row.theirs);
      row.lost = new Set([...acceptedNames(mine)].filter((name) => !keep.has(name)));
      row.lostExports = mine.exports.filter((name) => !row.theirs.exports.includes(name));
    }
  }

  // One walk of the project for every component that has something to lose.
  let truncated = false;
  const relevant = rows.filter((row) => (row.lost && row.lost.size) || (row.lostExports && row.lostExports.length));
  if (impact && relevant.length) {
    const names = [...new Set(relevant.flatMap((row) => [...row.names, ...(row.lostExports || [])]))];
    const scan = scanUsage(cwd, names, { skip: [dest] });
    truncated = scan.truncated;
    for (const row of relevant) {
      const mine = new Set([...row.names, ...(row.lostExports || [])]);
      row.breaks = scan.usages
        .filter((use) => mine.has(use.component))
        .map((use) => ({
          ...use,
          props: (row.lostExports || []).includes(use.component)
            ? use.props
            : brokenProps(use.props, row.lost || new Set()),
          lostExport: (row.lostExports || []).includes(use.component),
        }))
        .filter((use) => use.lostExport || use.props.length > 0);
    }
  }

  for (const row of rows) row.verdict = verdictOf(row);

  return {
    kitVersion,
    dest,
    rows,
    notInstalled,
    contractNote,
    reactTypes,
    truncated,
  };
}

/** One line on what to do, for a person and for an agent reading the JSON. */
function verdictOf(row) {
  const breaks = row.breaks?.length || 0;
  const conflicts = row.comparison?.conflicts?.length || 0;
  if (row.state === "pristine") {
    if (!row.behind) return { status: "up-to-date", action: null };
    return {
      status: breaks ? "update-breaks-callers" : "update-available",
      action: `npx @grampro/kit add ${row.component}`,
    };
  }
  return {
    status: conflicts ? "conflict" : breaks ? "update-breaks-callers" : row.state === "unknown" ? "unverified" : "edited",
    // Never suggested as the fix: it discards the user's work, so it is only
    // ever presented as the choice it is.
    action: null,
    force: `npx @grampro/kit add ${row.component} --force`,
  };
}

module.exports = { runDoctor, compareVersions, installedFolders, folderFor };
