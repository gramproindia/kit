/*
 * A TypeScript that has the compiler API, whatever the project has installed.
 *
 * Reading a component's contract means resolving types — following
 * `ButtonVariant` to its string literals, expanding
 * `Omit<ButtonHTMLAttributes<…>, "onClick">` into the props it leaves — and
 * that is the type checker's job. The kit has always borrowed the project's
 * TypeScript for it rather than shipping one, so that `npx @grampro/kit add`
 * stays a small download.
 *
 * TypeScript 7 broke the borrowing. It is a native rewrite, its npm package
 * does not expose the JavaScript compiler API (`createProgram` and the rest
 * are absent), and it is what `npm i -D typescript` installs now. So when the
 * project's TypeScript cannot do the job, the exact version the kit itself is
 * built and tested with is fetched once, cached per user, and used from then
 * on. Same extractor, same result, on any TypeScript the project happens to
 * use — or none.
 *
 * Fetching code at run time is a supply-chain surface, so it is narrow:
 *   - one exact version, never a range, so what runs is what was tested;
 *   - installed by the npm the user already runs `npx` with, so the registry,
 *     proxy, mirror and integrity checks are theirs, unchanged;
 *   - `--ignore-scripts`, so nothing executes during the install;
 *   - written to a temporary folder and moved into place only once complete,
 *     so an interrupted download never leaves a half-cache that loads;
 *   - checked after install: the version must be the pinned one and the API
 *     must be present, or it is not used;
 *   - `GRAMPRO_KIT_OFFLINE=1`, or npm's own offline setting, turns it off, and
 *     the callers fall back to what needs no TypeScript.
 * Nothing about the project changes: no package.json edit, no node_modules.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

/** The kit's own TypeScript. A test fails if this drifts from the devDependency. */
const PINNED_VERSION = "6.0.3";

/** Older names a project may have installed TypeScript 6 under, to sit beside 7. */
const ALIASES = ["typescript-6", "typescript6"];

const hasCompilerApi = (ts) => Boolean(ts && typeof ts.createProgram === "function" && ts.JsxEmit);

function tryRequire(name, paths) {
  try {
    return require(require.resolve(name, { paths }));
  } catch {
    return null;
  }
}

/** The per-user cache, where the operating system expects caches to live. */
function cacheRoot(env = process.env, platform = process.platform, home = os.homedir()) {
  if (env.GRAMPRO_KIT_CACHE_DIR) return path.resolve(env.GRAMPRO_KIT_CACHE_DIR);
  if (platform === "win32") {
    return path.join(env.LOCALAPPDATA || path.join(home, "AppData", "Local"), "grampro-kit", "Cache");
  }
  if (platform === "darwin") return path.join(home, "Library", "Caches", "grampro-kit");
  return path.join(env.XDG_CACHE_HOME || path.join(home, ".cache"), "grampro-kit");
}

const cacheDirFor = (version = PINNED_VERSION, env = process.env) =>
  path.join(cacheRoot(env), `typescript-${version}`);

/** The pinned TypeScript, if a previous run already fetched it. */
function fromCache(dir) {
  const pkg = path.join(dir, "node_modules", "typescript", "package.json");
  try {
    if (JSON.parse(fs.readFileSync(pkg, "utf8")).version !== PINNED_VERSION) return null;
    const ts = require(path.join(dir, "node_modules", "typescript"));
    return hasCompilerApi(ts) ? ts : null;
  } catch {
    return null;
  }
}

/*
 * The npm CLI's own entry point, run with the current node — never through a
 * shell. `npm_execpath` is set when this is running under npm or npx; failing
 * that, npm sits next to node in every standard install.
 */
function findNpmCli(env = process.env, execPath = process.execPath) {
  const candidates = [];
  if (env.npm_execpath) {
    const given = env.npm_execpath;
    candidates.push(given.replace(/npx-cli\.js$/, "npm-cli.js"), given);
  }
  const bin = path.dirname(execPath);
  candidates.push(
    path.join(bin, "node_modules", "npm", "bin", "npm-cli.js"), // Windows
    path.join(bin, "..", "lib", "node_modules", "npm", "bin", "npm-cli.js"), // macOS, Linux
  );
  return candidates.find((file) => /npm-cli\.js$/.test(file) && fs.existsSync(file)) || null;
}

const offline = (env) =>
  env.GRAMPRO_KIT_OFFLINE === "1" || String(env.npm_config_offline).toLowerCase() === "true";

/**
 * Install one exact package version into a cache folder, under the rules at
 * the top of this file: the user's own npm, no scripts, staged, verified, then
 * moved into place. `verify(folder)` returns what to hand back, or null when
 * the install is not to be trusted. Throws with `code`.
 */
function fetchIntoCache({ spec, label, dir, verify, code, env = process.env, log = () => {} }) {
  const specs = Array.isArray(spec) ? spec : [spec];
  const npmCli = findNpmCli(env);
  if (!npmCli) {
    const error = new Error(`npm was not found next to node, so ${label} could not be fetched.`);
    error.code = code;
    throw error;
  }

  const staging = `${dir}.partial-${process.pid}`;
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });
  // A minimal manifest so npm treats the folder as its own project, not the user's.
  fs.writeFileSync(path.join(staging, "package.json"), '{"name":"grampro-kit-cache","private":true}\n');

  log(`Fetching ${label} once, to read component contracts (cached in ${path.dirname(dir)}).`);
  try {
    execFileSync(
      process.execPath,
      [
        npmCli,
        "install",
        ...specs,
        "--prefix",
        staging,
        "--no-save",
        "--no-package-lock",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--loglevel=error",
      ],
      { stdio: ["ignore", "ignore", "pipe"], timeout: 180000, env },
    );
  } catch (cause) {
    fs.rmSync(staging, { recursive: true, force: true });
    const detail = String(cause.stderr || cause.message || "").trim().split("\n").slice(-2).join(" ");
    const error = new Error(`Could not fetch ${label}: ${detail || "npm failed"}`);
    error.code = code;
    throw error;
  }

  // Verified before it is trusted, then moved into place in one step.
  const fetched = verify(staging);
  if (!fetched) {
    fs.rmSync(staging, { recursive: true, force: true });
    const error = new Error(`The fetched ${label} did not pass verification.`);
    error.code = code;
    throw error;
  }
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.renameSync(staging, dir);
  } catch {
    // Another run finished first, or the rename is not allowed here; the
    // verified staging copy is still fine to use for this run.
    return fetched;
  }
  return verify(dir) || fetched;
}

/** Fetch the pinned TypeScript into the cache. Returns the loaded module, or throws. */
function download({ env = process.env, log = () => {} } = {}) {
  return fetchIntoCache({
    spec: `typescript@${PINNED_VERSION}`,
    label: `TypeScript ${PINNED_VERSION}`,
    dir: cacheDirFor(PINNED_VERSION, env),
    verify: fromCache,
    code: "ETYPESCRIPT_FETCH",
    env,
    log,
  });
}

/* ------------------------------------------------------------ React's types */

/*
 * The type checker needs React's type definitions to see what a component
 * inherits — `ButtonHTMLAttributes` and the props it brings. Without them the
 * inherited props silently vanish, and a passport generated that way differs
 * from the one the component shipped with for no reason in the source: `check`
 * called every component stale, `doctor` saw contract changes nobody made, and
 * plain `passport` would have overwritten good passports with the hollow ones.
 *
 * So a project without @types/react gets the exact version the kit's passports
 * are generated with, by the same route as TypeScript. Pinned, so that a
 * passport regenerated here is byte-for-byte the one the kit shipped.
 */
const PINNED_REACT_TYPES = "19.3.0";

const reactTypesCacheDir = (env = process.env) =>
  path.join(cacheRoot(env), `types-react-${PINNED_REACT_TYPES}`);

/**
 * The folder holding @types/react inside a cache install, if both it and
 * @types/react-dom beside it are the pinned version. (Toaster imports
 * react-dom; the program maps it to the sibling folder.)
 */
function reactTypesFromCache(dir) {
  const pinned = (name) => {
    const folder = path.join(dir, "node_modules", "@types", name);
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(folder, "package.json"), "utf8"));
      return pkg.name === `@types/${name}` && pkg.version === PINNED_REACT_TYPES &&
        fs.existsSync(path.join(folder, "index.d.ts"))
        ? folder
        : null;
    } catch {
      return null;
    }
  };
  const react = pinned("react");
  return react && pinned("react-dom") ? react : null;
}

/**
 * React's types for a project that has none: cached, or fetched once.
 * Never throws — without them the caller degrades and says so.
 *
 * @returns {{ dir: string | null, source?: "cache" | "downloaded", reason?: string }}
 */
function resolveReactTypes({ env = process.env, allowDownload = true, log = () => {} } = {}) {
  const cached = reactTypesFromCache(reactTypesCacheDir(env));
  if (cached) return { dir: cached, source: "cache" };
  if (!allowDownload || offline(env)) {
    return { dir: null, reason: "@types/react is not installed, and fetching it is turned off (offline)." };
  }
  try {
    const dir = fetchIntoCache({
      spec: [`@types/react@${PINNED_REACT_TYPES}`, `@types/react-dom@${PINNED_REACT_TYPES}`],
      label: `React's type definitions (@types/react ${PINNED_REACT_TYPES})`,
      dir: reactTypesCacheDir(env),
      verify: reactTypesFromCache,
      code: "EREACT_TYPES_FETCH",
      env,
      log,
    });
    return { dir, source: "downloaded" };
  } catch (error) {
    return { dir: null, reason: `@types/react is not installed, and ${error.message.replace(/^Could not/, "could not")}` };
  }
}

/**
 * The first TypeScript that has the compiler API: the project's own, a
 * TypeScript 6 the project installed under an alias, the cached copy, or a
 * freshly fetched one.
 *
 * @returns {{ ts: object, source: "project" | "alias" | "cache" | "downloaded" }}
 * @throws  ETYPESCRIPT_API when the project's TypeScript lacks the API and
 *          fetching is turned off or fails; ETYPESCRIPT_MISSING when there is
 *          no TypeScript at all and fetching is off or fails.
 */
function resolveTypeScript({ searchFrom = [], env = process.env, allowDownload = true, log = () => {} } = {}) {
  const paths = [...searchFrom, process.cwd(), __dirname].filter(Boolean);

  const project = tryRequire("typescript", paths);
  if (hasCompilerApi(project)) return { ts: project, source: "project" };
  for (const alias of ALIASES) {
    const candidate = tryRequire(alias, paths);
    if (hasCompilerApi(candidate)) return { ts: candidate, source: "alias" };
  }

  const cached = fromCache(cacheDirFor(PINNED_VERSION, env));
  if (cached) return { ts: cached, source: "cache" };

  let fetchError = null;
  if (allowDownload && !offline(env)) {
    try {
      return { ts: download({ env, log }), source: "downloaded" };
    } catch (error) {
      fetchError = error;
    }
  }

  const why = fetchError
    ? ` ${fetchError.message}`
    : offline(env)
      ? " Fetching it is turned off (offline)."
      : "";
  const error = new Error(
    (project
      ? `This project's TypeScript (${project.version || "unknown"}) has no compiler API — TypeScript 7 is a native rewrite without it — and TypeScript ${PINNED_VERSION} could not be used instead.`
      : `Reading component contracts needs TypeScript ${PINNED_VERSION}, which could not be used.`) +
      why +
      ` It is fetched automatically when online; to provide it yourself: npm i -D typescript-6@npm:typescript@${PINNED_VERSION}`,
  );
  error.code = project ? "ETYPESCRIPT_API" : "ETYPESCRIPT_MISSING";
  throw error;
}

module.exports = {
  PINNED_VERSION,
  PINNED_REACT_TYPES,
  resolveTypeScript,
  resolveReactTypes,
  reactTypesCacheDir,
  hasCompilerApi,
  cacheRoot,
  cacheDirFor,
  findNpmCli,
};
