/*
 * The tag scanner shared by validate_usage and doctor. It reads untrusted
 * text from a model, so the last test holds it to linear time.
 */
import { describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { jsxOpenings } = require("../jsx-tags.cjs");

const attrs = (source: string) => jsxOpenings(source)[0]?.attrs;

describe("jsxOpenings", () => {
  it("reads attributes, including boolean ones", () => {
    expect(attrs('<Button variant="primary" disabled onClick={() => go()} />')).toEqual(["variant", "disabled", "onClick"]);
  });

  it("does not read words inside an expression as attributes", () => {
    expect(attrs('<Input title={ok ? first : second} label="x" />')).toEqual(["title", "label"]);
  });

  it("does not read words inside a string as attributes", () => {
    expect(attrs('<Input placeholder="search by name or email" />')).toEqual(["placeholder"]);
  });

  it("skips spreads", () => {
    expect(attrs("<Select {...rest} value={v} />")).toEqual(["value"]);
  });

  it("finds the tag's own end past an arrow function", () => {
    expect(attrs("<Alert onDismiss={() => { if (a > b) close(); }} title=\"Hi\" />")).toEqual(["onDismiss", "title"]);
  });

  it("reports line numbers", () => {
    const tags = jsxOpenings("const a = 1;\n\n<Card>\n  <Badge count={3} />\n</Card>");
    expect(tags.map((t: { name: string; line: number }) => [t.name, t.line])).toEqual([
      ["Card", 3],
      ["Badge", 4],
    ]);
  });

  it("ignores lower-case elements and unterminated fragments", () => {
    expect(jsxOpenings("<div><span>x</span>")).toEqual([]);
    expect(jsxOpenings('<Button variant="primary"')).toEqual([]);
  });

  it("stays linear on hostile input", () => {
    const start = Date.now();
    jsxOpenings("<Button>".repeat(125000));
    jsxOpenings(`<Input ${"x ".repeat(100000)}/>`);
    expect(Date.now() - start).toBeLessThan(2000);
  });
});
