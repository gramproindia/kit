/*
 * The skill's size is a budget, not a style preference.
 *
 * SKILL.md is copied whole into Antigravity's rule file, which Antigravity
 * caps at 12,000 characters, and it is always in an agent's context. Every
 * release adds a section; this fails before one pushes it over.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const SKILL = fileURLToPath(new URL("../../.gbs/skills/gbs-components/SKILL.md", import.meta.url));

it("leaves room under Antigravity's 12,000-character rule limit", () => {
  const characters = [...readFileSync(SKILL, "utf8")].length;
  // The installer adds a preamble of about 250 characters to the rule.
  expect(characters + 400).toBeLessThan(12000);
});
