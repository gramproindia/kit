/*
 * Finding a TypeScript with the compiler API on any project.
 *
 * The download itself needs the network and is exercised by hand; these
 * cover everything around it with fake packages: which candidate wins, that
 * a TypeScript 7 is passed over, that a cache with the wrong version is not
 * trusted, and that turning fetching off fails with the right reason.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ts = require("../typescript.cjs");

const scratch: string[] = [];
const dir = () => {
  const d = mkdtempSync(join(tmpdir(), "kit-ts-"));
  scratch.push(d);
  return d;
};
afterEach(() => {
  for (const d of scratch.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** A fake `typescript` package: version 7 has no compiler API, a "real" one does. */
function fakeTypeScript(root: string, version: string, withApi: boolean, name = "typescript") {
  const pkg = join(root, "node_modules", name);
  mkdirSync(pkg, { recursive: true });
  writeFileSync(join(pkg, "package.json"), JSON.stringify({ name, version, main: "index.js" }));
  writeFileSync(
    join(pkg, "index.js"),
    withApi
      ? `module.exports = { version: ${JSON.stringify(version)}, createProgram() {}, JsxEmit: {} };`
      : `module.exports = { version: ${JSON.stringify(version)} };`,
  );
}

const offlineIn = (cache: string) => ({ GRAMPRO_KIT_CACHE_DIR: cache, GRAMPRO_KIT_OFFLINE: "1" });

describe("the pinned version", () => {
  it("is the TypeScript the kit itself is built and tested with", () => {
    const installed = JSON.parse(
      readFileSync(fileURLToPath(new URL("../../../node_modules/typescript/package.json", import.meta.url)), "utf8"),
    ).version;
    expect(ts.PINNED_VERSION).toBe(installed);
  });
});

describe("resolveTypeScript", () => {
  it("uses the project's TypeScript when it has the API", () => {
    const project = dir();
    fakeTypeScript(project, "5.9.0", true);
    const result = ts.resolveTypeScript({ searchFrom: [project], env: offlineIn(dir()) });
    expect(result).toMatchObject({ source: "project" });
    expect(result.ts.version).toBe("5.9.0");
  });

  it("passes over TypeScript 7 for a TypeScript 6 installed under an alias", () => {
    const project = dir();
    fakeTypeScript(project, "7.0.2", false);
    fakeTypeScript(project, "6.0.3", true, "typescript-6");
    expect(ts.resolveTypeScript({ searchFrom: [project], env: offlineIn(dir()) }).source).toBe("alias");
  });

  it("uses the cached copy without going to the network", () => {
    const project = dir();
    const cache = dir();
    fakeTypeScript(project, "7.0.2", false);
    fakeTypeScript(join(cache, `typescript-${ts.PINNED_VERSION}`), ts.PINNED_VERSION, true);
    const result = ts.resolveTypeScript({ searchFrom: [project], env: offlineIn(cache) });
    expect(result.source).toBe("cache");
  });

  it("does not trust a cached copy of the wrong version", () => {
    const project = dir();
    const cache = dir();
    fakeTypeScript(project, "7.0.2", false);
    fakeTypeScript(join(cache, `typescript-${ts.PINNED_VERSION}`), "6.0.2", true);
    expect(() => ts.resolveTypeScript({ searchFrom: [project], env: offlineIn(cache) })).toThrow(
      expect.objectContaining({ code: "ETYPESCRIPT_API" }),
    );
  });

  it("does not trust a cached copy without the API", () => {
    const project = dir();
    const cache = dir();
    fakeTypeScript(project, "7.0.2", false);
    fakeTypeScript(join(cache, `typescript-${ts.PINNED_VERSION}`), ts.PINNED_VERSION, false);
    expect(() => ts.resolveTypeScript({ searchFrom: [project], env: offlineIn(cache) })).toThrow();
  });

  it("says why when offline: TypeScript 7 present, nothing usable", () => {
    const project = dir();
    fakeTypeScript(project, "7.0.2", false);
    try {
      ts.resolveTypeScript({ searchFrom: [project], env: offlineIn(dir()) });
      throw new Error("should have thrown");
    } catch (error) {
      const e = error as { code: string; message: string };
      expect(e.code).toBe("ETYPESCRIPT_API");
      expect(e.message).toMatch(/7\.0\.2/);
      expect(e.message).toMatch(/offline/);
      expect(e.message).toMatch(/typescript-6@npm:typescript@/);
    }
  });

  it("also honours npm's own offline setting", () => {
    const project = dir();
    fakeTypeScript(project, "7.0.2", false);
    expect(() =>
      ts.resolveTypeScript({ searchFrom: [project], env: { GRAMPRO_KIT_CACHE_DIR: dir(), npm_config_offline: "true" } }),
    ).toThrow(/offline/);
  });
});

describe("cacheRoot", () => {
  it("follows each platform's convention", () => {
    expect(ts.cacheRoot({ LOCALAPPDATA: "C:\\Users\\a\\AppData\\Local" }, "win32", "C:\\Users\\a")).toMatch(/grampro-kit.Cache$/);
    expect(ts.cacheRoot({}, "darwin", "/Users/a")).toMatch(/Library.Caches.grampro-kit$/);
    expect(ts.cacheRoot({ XDG_CACHE_HOME: "/x" }, "linux", "/home/a")).toMatch(/x.grampro-kit$/);
    expect(ts.cacheRoot({}, "linux", "/home/a")).toMatch(/\.cache.grampro-kit$/);
  });

  it("can be redirected", () => {
    expect(ts.cacheRoot({ GRAMPRO_KIT_CACHE_DIR: "/opt/cache" }, "linux", "/home/a")).toMatch(/opt.cache$/);
  });
});

describe("findNpmCli", () => {
  it("prefers the npm that launched this process, turning npx into npm", () => {
    const root = dir();
    const bin = join(root, "npm", "bin");
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(bin, "npm-cli.js"), "");
    writeFileSync(join(bin, "npx-cli.js"), "");
    expect(ts.findNpmCli({ npm_execpath: join(bin, "npx-cli.js") }, join(root, "node"))).toBe(join(bin, "npm-cli.js"));
  });

  it("returns null rather than guessing when there is no npm", () => {
    expect(ts.findNpmCli({}, join(dir(), "node"))).toBeNull();
  });
});
