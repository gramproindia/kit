/*
 * The React Native install (beta), end to end in throwaway projects.
 *
 * A native install must copy the native view and never the web one, write the
 * native entry as index.ts, and bring only the DOM-free part of shared/. A web
 * install must not pick up the native files, which import react-native.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const CLI = fileURLToPath(new URL("../../index.cjs", import.meta.url));
const KIT = fileURLToPath(new URL("../../", import.meta.url));
const require = createRequire(import.meta.url);
const native = require("../native.cjs") as {
  detectPlatform(cwd: string, requested?: string): { platform?: string; reason?: string; error?: string };
  nativeOnlyComponents(): { name: string; folder: string; exports: string[] }[];
  rewriteSharedImports(text: string, file: string, componentDir: string, folder: string): string;
};

const projects: string[] = [];

function project(pkg: Record<string, unknown>) {
  const dir = mkdtempSync(join(tmpdir(), "kit-native-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "scratch", version: "1.0.0", ...pkg }));
  projects.push(dir);
  return dir;
}

const run = (cwd: string, ...args: string[]) => {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120000,
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "" },
    });
    return { code: 0, stdout, stderr: "" };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, stdout: String(e.stdout ?? ""), stderr: String(e.stderr ?? "") };
  }
};

const walk = (dir: string, prefix = ""): string[] =>
  readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(dir, rel) : [rel];
  });

afterAll(() => {
  for (const dir of projects) rmSync(dir, { recursive: true, force: true });
});

describe("platform detection", () => {
  it("is native when package.json has react-native or expo", () => {
    expect(native.detectPlatform(project({ dependencies: { "react-native": "0.88.1" } })).platform).toBe("native");
    expect(native.detectPlatform(project({ devDependencies: { expo: "~58.0.0" } })).platform).toBe("native");
  });

  it("is web otherwise", () => {
    expect(native.detectPlatform(project({ dependencies: { react: "19.2.0" } })).platform).toBe("web");
  });

  it("reads the nearest package.json from a subfolder", () => {
    const root = project({ dependencies: { expo: "~58.0.0" } });
    mkdirSync(join(root, "src", "screens"), { recursive: true });
    expect(native.detectPlatform(join(root, "src", "screens")).platform).toBe("native");
  });

  it("lets --platform win, and names a bad value", () => {
    const web = project({ dependencies: { react: "19.2.0" } });
    expect(native.detectPlatform(web, "native")).toMatchObject({ platform: "native", reason: "--platform" });
    expect(native.detectPlatform(web, "ios").error).toMatch(/Unknown --platform/);
  });
});

describe("native install", () => {
  let app = "";
  let first: ReturnType<typeof run>;

  beforeAll(() => {
    app = project({ dependencies: { expo: "~58.0.0", "react-native": "0.88.1" } });
    first = run(app, "add", "Button", "Toaster", "DataGrid", "--dest", "ui");
  }, 180000);

  it("says which platform it chose", () => {
    expect(first.stdout).toMatch(/Platform: native/);
  });

  it("skips DataGrid by name, and still installs the rest", () => {
    expect(first.code).toBe(1);
    expect(first.stderr).toMatch(/DataGrid is not available on native yet/);
    expect(existsSync(join(app, "ui", "data-grid"))).toBe(false);
    expect(existsSync(join(app, "ui", "button"))).toBe(true);
  });

  it("writes the native entry as index.ts", () => {
    const installed = readFileSync(join(app, "ui", "button", "index.ts"), "utf8");
    const source = readFileSync(join(KIT, "source", "components", "button", "index.native.ts"), "utf8");
    expect(installed).toBe(source);
    expect(existsSync(join(app, "ui", "button", "index.native.ts"))).toBe(false);
  });

  it("copies the native view and the shared logic, never the web view or its CSS", () => {
    const files = walk(join(app, "ui", "button"));
    expect(files).toContain("native/Button.tsx");
    expect(files.some((f) => f.startsWith("core/"))).toBe(true);
    expect(files.some((f) => f.startsWith("react/"))).toBe(false);
    expect(files).not.toContain("styles.css");
  });

  it("copies hooks/ when a component has one", () => {
    expect(existsSync(join(app, "ui", "toaster", "hooks", "useToasts.ts"))).toBe(true);
  });

  it("brings only the DOM-free part of shared/", () => {
    const files = walk(join(app, "ui", "shared"));
    expect(files.filter((f) => f.startsWith("react/"))).toEqual(["react/useControllableState.ts"]);
    expect(files.some((f) => f.startsWith("native/"))).toBe(true);
    expect(files).not.toContain("styles.css");
    const manifest = JSON.parse(readFileSync(join(app, "ui", "shared", ".install-manifest.json"), "utf8"));
    expect(manifest.platform).toBe("native");
  });

  it("writes gbs.theme.ts instead of gbs.css, once", () => {
    expect(existsSync(join(app, "ui", "gbs.theme.ts"))).toBe(true);
    expect(existsSync(join(app, "ui", "gbs.css"))).toBe(false);
    expect(first.stdout).toMatch(/KitProvider/);
  });

  it("records the platform, and a second add is a no-op", () => {
    const manifest = JSON.parse(readFileSync(join(app, "ui", "button", ".install-manifest.json"), "utf8"));
    expect(manifest.platform).toBe("native");
    const again = run(app, "add", "Button", "--dest", "ui");
    expect(again.code).toBe(0);
    expect(again.stdout).toMatch(/Button already up to date/);
  }, 120000);

  it("refuses to mix a web install into the same folder", () => {
    const mixed = run(app, "add", "Button", "--dest", "ui", "--platform", "web");
    expect(mixed.code).toBe(1);
    expect(mixed.stderr).toMatch(/already holds a native install/);
  }, 120000);

  it("finds the earlier native install without --dest", () => {
    const again = run(app, "add", "Toaster");
    expect(again.stdout).toMatch(/Toaster already up to date/);
    expect(existsSync(join(app, "component-lib"))).toBe(false);
  }, 120000);
});

describe("mobile-only components", () => {
  const mobile = native.nativeOnlyComponents();

  it.runIf(mobile.length > 0)("install with shared imports rewritten to the project layout", () => {
    const app = project({ dependencies: { "react-native": "0.88.1" } });
    const [first] = mobile;
    const result = run(app, "add", first.exports[0] ?? first.name, "--dest", "ui");
    expect(result.code).toBe(0);
    const files = walk(join(app, "ui", first.folder)).filter((f) => /\.tsx?$/.test(f));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(join(app, "ui", first.folder, file), "utf8")).not.toMatch(/components\/shared/);
    }
  }, 120000);

  it.runIf(mobile.length > 0)("are refused in a web project, by name", () => {
    const app = project({ dependencies: { react: "19.2.0" } });
    const result = run(app, "add", mobile[0].name, "Button");
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/is native only/);
    expect(existsSync(join(app, "component-lib", "button"))).toBe(true);
  }, 120000);

  it("rewrites ../../../components/shared/ to ../../shared/ by path, not by spelling", () => {
    const componentDir = join(KIT, "source", "native", "fixture");
    const file = join(componentDir, "native", "Thing.tsx");
    const text = [
      'import { useKitTheme } from "../../../components/shared/native/KitProvider";',
      'import { cx } from "../../../components/shared/core/cx";',
      'import { local } from "./local";',
      'export * from "../../../components/shared/native";',
    ].join("\n");
    const out = native.rewriteSharedImports(text, file, componentDir, "fixture");
    expect(out).toContain('from "../../shared/native/KitProvider"');
    expect(out).toContain('from "../../shared/core/cx"');
    expect(out).toContain('from "./local"');
    expect(out).toContain('export * from "../../shared/native"');
    // One level up (index.ts) lands one level closer.
    const index = native.rewriteSharedImports(
      'export { x } from "../../components/shared/native/theme";',
      join(componentDir, "index.ts"),
      componentDir,
      "fixture",
    );
    expect(index).toContain('from "../shared/native/theme"');
  });
});

describe("web install", () => {
  it("leaves the native view and shared/native out", () => {
    const app = project({ dependencies: { react: "19.2.0" } });
    const result = run(app, "add", "Button");
    expect(result.code).toBe(0);
    const button = walk(join(app, "component-lib", "button"));
    expect(button.some((f) => f.startsWith("native/"))).toBe(false);
    expect(button).not.toContain("index.native.ts");
    expect(button).toContain("react/Button.tsx");
    const shared = walk(join(app, "component-lib", "shared"));
    expect(shared.some((f) => f.startsWith("native/"))).toBe(false);
    expect(existsSync(join(app, "component-lib", "gbs.css"))).toBe(true);
  }, 120000);
});
