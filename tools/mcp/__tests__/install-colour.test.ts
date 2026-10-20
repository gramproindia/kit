/*
 * install_component reads the installer's output by pattern ("✓ Component X",
 * "✗ X was not replaced"). Since 2.7.3 that output is coloured for a terminal,
 * and a host that sets FORCE_COLOR — some agent hosts and CI runners do —
 * would colour it even through a pipe. The tool must still see what happened,
 * above all a refusal: an agent that misses one is an agent that retries.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, expect, it } from "vitest";

const SERVER = fileURLToPath(new URL("../server.cjs", import.meta.url));
const project = mkdtempSync(join(tmpdir(), "kit-mcp-colour-"));
writeFileSync(join(project, "package.json"), JSON.stringify({ name: "scratch", version: "1.0.0" }));
afterAll(() => rmSync(project, { recursive: true, force: true }));

/* In a child, so the server's process.cwd() is the scratch project. */
const install = (name: string) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      ["-e", `process.chdir(${JSON.stringify(project)}); console.log(JSON.stringify(require(${JSON.stringify(SERVER)}).installComponents([${JSON.stringify(name)}])))`],
      { encoding: "utf8", env: { ...process.env, FORCE_COLOR: "1" }, timeout: 120000 },
    ),
  );

it("reports installs and refusals with FORCE_COLOR set", () => {
  expect(install("Button").installed).toEqual(["Button"]);

  appendFileSync(join(project, "component-lib", "button", "react", "Button.tsx"), "\n// ours\n");
  const second = install("Button");
  expect(second.kept).toEqual(["Button"]);
  expect(JSON.stringify(second)).not.toMatch(/\\u001b/);
}, 180000);
