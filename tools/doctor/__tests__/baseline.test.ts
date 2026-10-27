/*
 * Telling an untouched component from an edited one.
 *
 * The first test is the one every existing project depends on: components
 * installed before 2.7.2 have no manifest, and are only recognised as
 * untouched if recomputing the passport's sourceHash over the installed copy
 * reproduces it exactly. If that drifts for one component, every project that
 * has it is told its copy "may hold your changes" and `add` refuses to update it.
 */
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, appendFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { inspect, writeManifest, kitRelativeHash, MANIFEST } = require("../baseline.cjs");

const KIT = fileURLToPath(new URL("../../../source/components", import.meta.url));
const folders = readdirSync(KIT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== "shared")
  .map((e) => e.name);

const scratch: string[] = [];
const install = (folder: string) => {
  const root = mkdtempSync(join(tmpdir(), "kit-baseline-"));
  scratch.push(root);
  const dir = join(root, folder);
  cpSync(join(KIT, folder), dir, { recursive: true, filter: (src) => !src.includes("__tests__") });
  return dir;
};
afterEach(() => {
  for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("kitRelativeHash", () => {
  // Copying and hashing data-grid, the largest folder, can pass the default
  // 5 s while every other test file runs alongside — as under prepublishOnly.
  it.each(folders)(
    "reproduces %s's shipped sourceHash from an installed copy",
    (folder) => {
      const passport = JSON.parse(readFileSync(join(KIT, folder, "passport.json"), "utf8"));
      expect(kitRelativeHash(install(folder), folder, passport)).toBe(passport.source.sourceHash);
    },
    30_000,
  );

  it("refuses a file list that climbs out of the folder", () => {
    const dir = install("button");
    expect(kitRelativeHash(dir, "button", { source: { files: ["../../etc/passwd"] } })).toBeNull();
  });
});

describe("inspect, with a manifest", () => {
  const fresh = (folder = "button") => {
    const dir = install(folder);
    writeManifest(dir, { component: "Button", version: "2.7.2", sourceDir: join(KIT, folder) });
    return dir;
  };

  it("calls a fresh install pristine and not destructive", () => {
    const status = inspect(fresh(), { folder: "button" });
    expect(status).toMatchObject({ baseline: "manifest", state: "pristine", destructive: false, installedVersion: "2.7.2" });
    expect(status.baseContract.component).toBe("Button");
  });

  it("names a changed file and marks the update destructive", () => {
    const dir = fresh();
    appendFileSync(join(dir, "react", "Button.tsx"), "\n// local edit\n");
    expect(inspect(dir, { folder: "button" })).toMatchObject({
      state: "edited",
      changed: ["react/Button.tsx"],
      destructive: true,
    });
  });

  it("names a deleted file", () => {
    const dir = fresh();
    unlinkSync(join(dir, "README.md"));
    expect(inspect(dir, { folder: "button" })).toMatchObject({ state: "edited", missing: ["README.md"], destructive: true });
  });

  it("reports an added file without calling the update destructive", () => {
    // Updating copies over the folder; it never deletes a file the user added.
    const dir = fresh();
    writeFileSync(join(dir, "react", "useAnalytics.ts"), "export {};\n");
    expect(inspect(dir, { folder: "button" })).toMatchObject({
      state: "edited",
      added: ["react/useAnalytics.ts"],
      destructive: false,
    });
  });

  it("does not count a regenerated passport.json as an edit", () => {
    // The `passport` command rewrites it from the project's own source.
    const dir = fresh();
    writeFileSync(join(dir, "passport.json"), "{}\n");
    expect(inspect(dir, { folder: "button" }).state).toBe("pristine");
  });

  it("does not count the consumer's passport.local.json as an edit", () => {
    const dir = fresh();
    writeFileSync(join(dir, "passport.local.json"), "{}\n");
    expect(inspect(dir, { folder: "button" }).state).toBe("pristine");
  });

  it("does not count line endings as an edit", () => {
    const dir = fresh();
    const file = join(dir, "react", "Button.tsx");
    writeFileSync(file, readFileSync(file, "utf8").replace(/\r?\n/g, "\r\n"));
    expect(inspect(dir, { folder: "button" }).state).toBe("pristine");
  });

  it("keeps the baseline contract even after passport.json is overwritten", () => {
    const dir = fresh();
    writeFileSync(join(dir, "passport.json"), "{}\n");
    expect(inspect(dir, { folder: "button" }).baseContract.props.variant).toBeDefined();
  });
});

describe("inspect, before 2.7.2 (no manifest)", () => {
  it("recognises an untouched copy from the passport hash", () => {
    const dir = install("switch");
    expect(inspect(dir, { folder: "switch" })).toMatchObject({ baseline: "passport", state: "pristine", destructive: false });
  });

  it("treats an edited copy as unknown, and so as destructive to replace", () => {
    const dir = install("switch");
    appendFileSync(join(dir, "react", "Switch.tsx"), "\n// local edit\n");
    const status = inspect(dir, { folder: "switch", kitDir: join(KIT, "switch") });
    expect(status).toMatchObject({ baseline: "none", state: "unknown", destructive: true });
    expect(status.changed).toEqual(["react/Switch.tsx"]);
  });

  it("treats a copy whose passport was regenerated, but whose files match the kit, as pristine", () => {
    const dir = install("switch");
    writeFileSync(join(dir, "passport.json"), JSON.stringify({ source: { sourceHash: "sha256:regenerated" } }));
    expect(inspect(dir, { folder: "switch", kitDir: join(KIT, "switch") })).toMatchObject({ baseline: "kit", state: "pristine" });
  });

  it("does not write anything", () => {
    const dir = install("switch");
    inspect(dir, { folder: "switch" });
    expect(readdirSync(dir)).not.toContain(MANIFEST);
  });
});
