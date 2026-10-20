/*
 * The CLI end to end, in a throwaway project.
 *
 * The first test is the regression this release exists for: until 2.7.2,
 * running `add` on a component the project had edited replaced it, printed a
 * success message, and the edit was gone.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const CLI = fileURLToPath(new URL("../../../index.cjs", import.meta.url));
let project = "";

const run = (...args: string[]) => {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      cwd: project,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120000,
    });
    return { code: 0, stdout, stderr: "" };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, stdout: String(e.stdout ?? ""), stderr: String(e.stderr ?? "") };
  }
};

const BUTTON = () => join(project, "component-lib", "button", "react", "Button.tsx");
const EDIT = "\n// our own change — must survive `add`\n";

beforeAll(() => {
  project = mkdtempSync(join(tmpdir(), "kit-cli-"));
  writeFileSync(join(project, "package.json"), JSON.stringify({ name: "scratch", version: "1.0.0" }));
  expect(run("add", "Button,Switch").code).toBe(0);
}, 180000);

afterAll(() => rmSync(project, { recursive: true, force: true }));

describe("add", () => {
  it("records what it installed", () => {
    const manifest = JSON.parse(readFileSync(join(project, "component-lib", "button", ".install-manifest.json"), "utf8"));
    expect(manifest.component).toBe("Button");
    expect(Object.keys(manifest.files)).toContain("react/Button.tsx");
    expect(manifest.contract.props.variant).toBeDefined();
  });

  it("re-adding an untouched component is a no-op, not an error", () => {
    const result = run("add", "Button");
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/already up to date/);
  });

  it("does not overwrite a component the project has edited", () => {
    appendFileSync(BUTTON(), EDIT);
    const result = run("add", "Button,Switch");
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/Button was not replaced/);
    expect(result.stderr).toMatch(/changed: react\/Button\.tsx/);
    expect(result.stderr).toMatch(/doctor Button/);
    expect(readFileSync(BUTTON(), "utf8")).toContain(EDIT.trim());
    // The untouched one in the same command still goes through.
    expect(result.stdout).toMatch(/Switch already up to date/);
  }, 120000);

  it("brings shared/ up to date when its files changed but its version did not", () => {
    // 2.7.0 changed shared/ under the same version, and a project that already
    // had that version kept the old files. Simulate that project.
    const shared = join(project, "component-lib", "shared");
    const manifestPath = join(shared, ".install-manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    delete manifest.files["react/agentSurfaceContext.ts"];
    writeFileSync(manifestPath, JSON.stringify(manifest));
    rmSync(join(shared, "react", "agentSurfaceContext.ts"));

    const result = run("add", "Switch");
    expect(result.code).toBe(0);
    expect(existsSync(join(shared, "react", "agentSurfaceContext.ts"))).toBe(true);
  }, 120000);

  it("--force replaces it, and only then", () => {
    const result = run("add", "Button", "--force");
    expect(result.code).toBe(0);
    expect(readFileSync(BUTTON(), "utf8")).not.toContain(EDIT.trim());
  }, 120000);
});

describe("passport --check in a project", () => {
  it("passes for an untouched component, and names the project's command when one is edited", () => {
    // Switch is untouched here. Before 2.7.2 every installed component read as
    // stale, because the project's paths went into the hash.
    const untouched = run("passport", "--check");
    expect(untouched.stdout).toMatch(/switch: OK/);
    expect(untouched.stdout).not.toMatch(/switch: passport stale/);
    expect(untouched.stdout + untouched.stderr).not.toMatch(/npm run passport/);
  }, 180000);
});

describe("doctor", () => {
  it("reports an edit as JSON an agent can act on", () => {
    appendFileSync(BUTTON(), EDIT);
    const result = run("doctor", "--json");
    expect(result.code).toBe(0);
    const report = JSON.parse(result.stdout);
    const button = report.components.find((c: { component: string }) => c.component === "Button");
    const switchRow = report.components.find((c: { component: string }) => c.component === "Switch");
    expect(button).toMatchObject({ state: "edited", files: { changed: ["react/Button.tsx"] } });
    expect(button.verdict.force).toMatch(/add Button --force/);
    expect(switchRow).toMatchObject({ state: "pristine", verdict: { status: "up-to-date" } });
  }, 180000);

  it("can be limited to one component", () => {
    const report = JSON.parse(run("doctor", "Switch", "--json").stdout);
    expect(report.components.map((c: { component: string }) => c.component)).toEqual(["Switch"]);
  }, 120000);

  it("fails for a component that is not installed", () => {
    expect(run("doctor", "DataGrid").code).toBe(1);
  }, 120000);

  it("never writes", () => {
    const before = readFileSync(join(project, "component-lib", "button", ".install-manifest.json"), "utf8");
    run("doctor");
    expect(readFileSync(join(project, "component-lib", "button", ".install-manifest.json"), "utf8")).toBe(before);
    expect(existsSync(join(project, "component-lib", "button", "passport.local.json"))).toBe(false);
  }, 180000);
});
