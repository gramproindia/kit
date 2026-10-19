/*
 * get_guidance must not read outside the references folder.
 *
 * It took a caller-controlled `topic`, appended ".md", and joined it onto the
 * references path. A VAPT pass turned that into an arbitrary-.md-file read:
 * `topic = "../../../../CHANGELOG"` resolved to the repo's CHANGELOG.md and
 * returned it, and the same trick reached any .md file the server process
 * could open. The server runs with the user's own authority, so this is a
 * confused-deputy hole rather than a privilege escalation — but a tool that
 * advertises nine fixed topics should not be a file-exfiltration primitive in
 * the hands of a prompt-injected agent.
 *
 * The fix is an allowlist (only names readdir actually produced) plus a
 * resolved-prefix check. These assert both halves hold.
 */
import { describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const server = require("../server.cjs") as {
  getGuidance: (topic?: string) => { topic?: string; text?: string; error?: string; topics?: string[] };
};

describe("get_guidance", () => {
  it("serves a real topic", () => {
    const result = server.getGuidance("forms");
    expect(result.error).toBeUndefined();
    expect(result.text && result.text.length).toBeGreaterThan(1000);
  });

  it("lists the available topics when asked for none", () => {
    const result = server.getGuidance();
    expect(Array.isArray(result.topics)).toBe(true);
    expect(result.topics).toContain("forms");
  });

  it.each([
    "../../../../CHANGELOG",
    "../../../../README",
    "..\\..\\..\\..\\package",
    "../../../../../../etc/passwd",
    "....//....//....//CHANGELOG",
    "forms/../../../../CHANGELOG",
  ])("refuses the traversal %j without returning a file", (topic) => {
    const result = server.getGuidance(topic);
    expect(result.text).toBeUndefined();
    expect(result.error).toMatch(/No guidance for/);
  });

  it("refuses a topic that is not in the shipped set even if it looks innocent", () => {
    // A sibling .md that is not one of the published guidance files.
    const result = server.getGuidance("SKILL");
    expect(result.text).toBeUndefined();
    expect(result.error).toMatch(/No guidance for/);
  });
});
