/*
 * The React Native skill (beta): `skill` follows the project's platform the
 * way `add` does, the two skills coexist in one project, and the MCP server
 * serves the native guidance, examples and usage checks.
 *
 * A fixture .gbs stands in for the shipped one (GRAMPRO_KIT_SKILL_SOURCE), so
 * these tests do not depend on the native skill's wording. The last block runs
 * against the real gbs-native once it ships.
 */
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const CLI = fileURLToPath(new URL("../../index.cjs", import.meta.url));
const KIT = fileURLToPath(new URL("../../", import.meta.url));
const REAL_NATIVE_SKILL = join(KIT, ".gbs", "skills", "gbs-native", "SKILL.md");

const temp: string[] = [];
let fixture = "";

function project(pkg: Record<string, unknown>) {
  const dir = mkdtempSync(join(tmpdir(), "kit-skill-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "scratch", version: "1.0.0", ...pkg }));
  temp.push(dir);
  return dir;
}

const run = (cwd: string, args: string[], env: Record<string, string> = { GRAMPRO_KIT_SKILL_SOURCE: fixture }) => {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120000,
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "", ...env },
    });
    return { code: 0, stdout, stderr: "" };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, stdout: String(e.stdout ?? ""), stderr: String(e.stderr ?? "") };
  }
};

const NATIVE_SKILL = [
  "---",
  "name: gbs-native",
  "description: Fixture native skill.",
  'autoAttach: ["app/**/*.tsx"]',
  "---",
  "",
  "# Fixture native skill",
  "",
].join("\n");

const NATIVE_FORMS = [
  "# Forms (native)",
  "",
  "```tsx",
  '<Button variant="primary" onPress={save}>Save</Button>',
  "```",
  "",
  "```tsx",
  '<Input label="Name" onChangeText={setName} />',
  "```",
  "",
].join("\n");

beforeAll(() => {
  fixture = mkdtempSync(join(tmpdir(), "kit-skill-fixture-"));
  temp.push(fixture);
  cpSync(join(KIT, ".gbs", "skills", "gbs-components"), join(fixture, "skills", "gbs-components"), {
    recursive: true,
  });
  mkdirSync(join(fixture, "skills", "gbs-native", "references"), { recursive: true });
  writeFileSync(join(fixture, "skills", "gbs-native", "SKILL.md"), NATIVE_SKILL);
  writeFileSync(join(fixture, "skills", "gbs-native", "references", "forms.md"), NATIVE_FORMS);
  writeFileSync(join(fixture, "skills", "gbs-native", "references", "setup.md"), "# Setup\n\nOne KitProvider.\n");
});

afterAll(() => {
  for (const dir of temp) rmSync(dir, { recursive: true, force: true });
});

describe("skill follows the platform", () => {
  it("installs gbs-native, and only it, in a React Native project", () => {
    const app = project({ dependencies: { expo: "~58.0.0" } });
    const result = run(app, ["skill"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/Platform: native/);
    expect(existsSync(join(app, ".gbs", "skills", "gbs-native", "SKILL.md"))).toBe(true);
    expect(existsSync(join(app, ".gbs", "skills", "gbs-components"))).toBe(false);
    const claude = readFileSync(join(app, ".claude", "skills", "gbs-native", "SKILL.md"), "utf8");
    expect(claude).toMatch(/^paths: \["app\/\*\*\/\*\.tsx"\]$/m);
    expect(readFileSync(join(app, ".agents", "rules", "gbs-native.md"), "utf8")).toMatch(/React Native UI files/);
    const agents = readFileSync(join(app, "AGENTS.md"), "utf8");
    expect(agents).toContain("<!-- @grampro/kit-native:start -->");
    expect(agents).not.toContain("<!-- @grampro/kit:start -->");
  }, 120000);

  it("installs gbs-components in a web project, as before", () => {
    const app = project({ dependencies: { react: "19.2.0" } });
    const result = run(app, ["skill"]);
    expect(result.code).toBe(0);
    expect(existsSync(join(app, ".gbs", "skills", "gbs-components", "SKILL.md"))).toBe(true);
    expect(existsSync(join(app, ".gbs", "skills", "gbs-native"))).toBe(false);
    expect(readFileSync(join(app, "AGENTS.md"), "utf8")).toContain("<!-- @grampro/kit:start -->");
  }, 120000);

  it("keeps both side by side: adding one never removes the other", () => {
    const app = project({ dependencies: { "react-native": "0.88.1" } });
    expect(run(app, ["skill"]).code).toBe(0);
    expect(run(app, ["skill", "--platform", "web"]).code).toBe(0);
    expect(existsSync(join(app, ".gbs", "skills", "gbs-native", "SKILL.md"))).toBe(true);
    expect(existsSync(join(app, ".gbs", "skills", "gbs-components", "SKILL.md"))).toBe(true);
    const agents = readFileSync(join(app, "AGENTS.md"), "utf8");
    expect(agents).toContain("<!-- @grampro/kit:start -->");
    expect(agents).toContain("<!-- @grampro/kit-native:start -->");
    const manifest = JSON.parse(readFileSync(join(app, ".gbs", ".install-manifest.json"), "utf8"));
    expect(manifest.skills.sort()).toEqual(["gbs-components", "gbs-native"]);
    expect(Object.keys(manifest.files).some((f) => f.includes("gbs-native"))).toBe(true);
    // Re-running the native skill leaves the web one's record alone.
    expect(run(app, ["skill"]).code).toBe(0);
    const again = JSON.parse(readFileSync(join(app, ".gbs", ".install-manifest.json"), "utf8"));
    expect(Object.keys(again.files).some((f) => f.includes("gbs-components"))).toBe(true);
  }, 180000);

  it("--platform both installs both, for a monorepo", () => {
    const app = project({ dependencies: { react: "19.2.0" } });
    const result = run(app, ["skill", "--platform", "both", "--for", "none"]);
    expect(result.code).toBe(0);
    expect(existsSync(join(app, ".gbs", "skills", "gbs-components", "SKILL.md"))).toBe(true);
    expect(existsSync(join(app, ".gbs", "skills", "gbs-native", "SKILL.md"))).toBe(true);
    expect(existsSync(join(app, "AGENTS.md"))).toBe(false);
  }, 120000);

  it("an edit to the web skill does not block installing the native one", () => {
    const app = project({ dependencies: { react: "19.2.0" } });
    expect(run(app, ["skill", "--for", "none"]).code).toBe(0);
    appendFileSync(join(app, ".gbs", "skills", "gbs-components", "SKILL.md"), "\nour own note\n");
    const native = run(app, ["skill", "--platform", "native", "--for", "none"]);
    expect(native.code).toBe(0);
    // ...but it still blocks the web one.
    const web = run(app, ["skill", "--for", "none"]);
    expect(web.code).toBe(1);
    expect(web.stderr).toMatch(/local changes/);
  }, 180000);

  it("--platform both is refused outside skill", () => {
    const app = project({ dependencies: { react: "19.2.0" } });
    const result = run(app, ["add", "Button", "--platform", "both"]);
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/applies to `skill` only/);
  });

  it("a native add suggests the native skill", () => {
    const app = project({ dependencies: { "react-native": "0.88.1" } });
    const result = run(app, ["add", "Button"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/npx @grampro\/kit@native skill/);
  }, 120000);
});

describe("MCP server, native", () => {
  type Server = {
    getGuidance(topic?: string, platform?: string): { topics?: string[]; text?: string; error?: string };
    getExample(name: string, platform?: string): {
      examples?: { code: string; source?: string }[];
      note?: string;
      error?: string;
    };
    validateUsage(code: string, platform?: string): {
      ok: boolean;
      issues: { component: string; prop: string; didYouMean?: string[] }[];
      error?: string;
    };
  };
  let server: Server;

  beforeAll(() => {
    process.env.GRAMPRO_KIT_SKILL_SOURCE = fixture;
    const require = createRequire(import.meta.url);
    const file = require.resolve("../mcp/server.cjs");
    delete require.cache[file];
    server = require(file) as Server;
  });

  afterAll(() => {
    delete process.env.GRAMPRO_KIT_SKILL_SOURCE;
  });

  it("serves the native skill's references", () => {
    expect(server.getGuidance(undefined, "native").topics?.sort()).toEqual(["forms", "setup"]);
    expect(server.getGuidance("forms", "native").text).toMatch(/onPress/);
    expect(server.getGuidance("../../SKILL", "native").error).toBeDefined();
    // The web topics are unchanged.
    expect(server.getGuidance().topics).toContain("forms");
    expect(server.getGuidance("styling").text).toBeDefined();
  });

  it("returns native examples from the native skill, which ships in the package", () => {
    const button = server.getExample("Button", "native");
    expect(button.examples?.length).toBe(1);
    expect(button.examples?.[0].code).toMatch(/onPress/);
    expect(button.examples?.[0].source).toBe("gbs-native/references/forms.md");
  });

  it("falls back to the web usage, said so, when there is no native example", () => {
    const tabs = server.getExample("Tabs", "native");
    expect(tabs.note).toMatch(/No native example/);
    expect(server.getExample("DataGrid", "native").error).toMatch(/not available on native/);
  });

  it("flags web-only props on native components", () => {
    const result = server.validateUsage(
      '<Button className="x" onClick={go}>Go</Button>\n<Input label="Name" onChangeText={set} />',
      "native",
    );
    expect(result.ok).toBe(false);
    expect(result.issues.map((i) => i.prop).sort()).toEqual(["className", "onClick"]);
    expect(result.issues.find((i) => i.prop === "onClick")?.didYouMean).toEqual(["onPress"]);
    expect(server.validateUsage('<Button onPress={go} style={{ margin: 4 }}>Go</Button>', "native").ok).toBe(true);
  });

  it("checks mobile-only components too", () => {
    const result = server.validateUsage('<AppBar title="Pay" classNames={{ root: "x" }} />', "native");
    expect(result.issues.map((i) => i.prop)).toEqual(["classNames"]);
  });

  it("leaves the web check as it was", () => {
    expect(server.validateUsage('<Button className="x" onClick={go}>Go</Button>').ok).toBe(true);
  });
});

describe.runIf(existsSync(REAL_NATIVE_SKILL))("the shipped gbs-native skill", () => {
  it("installs into a React Native project", () => {
    const app = project({ dependencies: { expo: "~58.0.0" } });
    const result = run(app, ["skill"], {});
    expect(result.code).toBe(0);
    expect(existsSync(join(app, ".gbs", "skills", "gbs-native", "SKILL.md"))).toBe(true);
    expect(existsSync(join(app, ".agents", "rules", "gbs-native.md"))).toBe(true);
  }, 120000);

  it("fits Antigravity's 12,000-character rule limit", () => {
    const characters = [...readFileSync(REAL_NATIVE_SKILL, "utf8")].length;
    expect(characters + 400).toBeLessThan(12000);
  });
});
