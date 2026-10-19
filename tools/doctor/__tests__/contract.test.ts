/*
 * Contract comparison: what counts as breaking, and when two sides' edits
 * conflict versus merge. The cases are the ones a real upgrade produces.
 */
import { describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { compactContract, diffContracts, threeWay, acceptedNames } = require("../contract.cjs");

type Prop = { name: string; typeText?: string; required?: boolean; origin?: string; values?: string[]; default?: string };
const passport = (props: Prop[], extra: Record<string, unknown> = {}) => ({
  identity: { component: "Button", exports: ["Button"] },
  source: { libraryVersion: "2.7.0" },
  props: props.map((p) => ({ origin: "derived", required: false, typeText: "string | undefined", ...p })),
  events: [],
  operations: {},
  ...extra,
});
const variant = (values: string[]) => ({ name: "variant", typeText: "ButtonVariant | undefined", values });

describe("compactContract", () => {
  it("keeps what a caller depends on and sorts values", () => {
    const c = compactContract(passport([variant(["primary", "ghost"])]));
    expect(c.props.variant.values).toEqual(["ghost", "primary"]);
    expect(c.exports).toEqual(["Button"]);
  });

  it("returns null for nothing", () => {
    expect(compactContract(null)).toBeNull();
  });
});

describe("diffContracts", () => {
  const a = compactContract(passport([variant(["primary", "ghost"]), { name: "size" }]));

  it("calls a removed prop breaking", () => {
    const b = compactContract(passport([variant(["primary", "ghost"])]));
    const { changes } = diffContracts(a, b);
    expect(changes).toContainEqual(expect.objectContaining({ name: "size", change: "removed", severity: "breaking" }));
  });

  it("calls removed union values breaking and added ones additive", () => {
    const b = compactContract(passport([variant(["primary", "link"]), { name: "size" }]));
    const { changes } = diffContracts(a, b);
    expect(changes).toContainEqual(expect.objectContaining({ change: "values removed", values: ["ghost"], severity: "breaking" }));
    expect(changes).toContainEqual(expect.objectContaining({ change: "values added", values: ["link"], severity: "added" }));
  });

  it("reads values, not the alias text, when a union changes", () => {
    // typeText stays "ButtonVariant | undefined" while the members change.
    const b = compactContract(passport([variant(["primary"]), { name: "size" }]));
    const { changes } = diffContracts(a, b);
    expect(changes.some((c: { change: string }) => c.change === "type changed")).toBe(false);
    expect(changes).toContainEqual(expect.objectContaining({ change: "values removed" }));
  });

  it("calls a newly required prop breaking", () => {
    const b = compactContract(passport([variant(["primary", "ghost"]), { name: "size", required: true }]));
    expect(diffContracts(a, b).changes).toContainEqual(expect.objectContaining({ change: "now required", severity: "breaking" }));
  });

  it("calls an added required prop breaking, an added optional one additive", () => {
    const base = compactContract(passport([]));
    const opt = compactContract(passport([{ name: "tone" }]));
    const req = compactContract(passport([{ name: "tone", required: true }]));
    expect(diffContracts(base, opt).changes[0]).toMatchObject({ change: "added", severity: "added" });
    expect(diffContracts(base, req).changes[0]).toMatchObject({ change: "added", severity: "breaking" });
  });

  it("calls a removed agent operation breaking", () => {
    const withOp = compactContract(passport([], { operations: { setValue: {} } }));
    const without = compactContract(passport([]));
    expect(diffContracts(withOp, without).changes).toContainEqual(
      expect.objectContaining({ kind: "operation", name: "setValue", severity: "breaking" }),
    );
  });

  it("ignores inherited props when only one side could resolve them", () => {
    // A project without @types/react has no inherited props at all; that is not 30 removals.
    const resolved = compactContract(passport([{ name: "onFocus", origin: "inherited" }, { name: "size" }]));
    const unresolved = compactContract(passport([{ name: "size" }]));
    const { changes, ownPropsOnly } = diffContracts(resolved, unresolved);
    expect(ownPropsOnly).toBe(true);
    expect(changes).toEqual([]);
  });
});

describe("threeWay", () => {
  const base = compactContract(passport([variant(["primary", "ghost"]), { name: "size", values: ["sm", "xl"] }]));

  it("merges value edits from both sides instead of calling them a conflict", () => {
    const mine = compactContract(passport([variant(["primary"]), { name: "size", values: ["sm", "xl"] }])); // removed ghost
    const theirs = compactContract(passport([variant(["primary", "ghost", "link"]), { name: "size", values: ["sm", "xl"] }])); // added link
    const result = threeWay(base, mine, theirs);
    expect(result.conflicts).toEqual([]);
    expect(result.merges).toContainEqual(expect.objectContaining({ name: "variant", values: ["link", "primary"] }));
  });

  it("calls it a conflict when one side removed what the other changed", () => {
    const mine = compactContract(passport([variant(["primary", "ghost"])])); // removed size
    const theirs = compactContract(passport([variant(["primary", "ghost"]), { name: "size", values: ["sm"] }])); // changed size
    expect(threeWay(base, mine, theirs).conflicts).toContainEqual(expect.objectContaining({ name: "size" }));
  });

  it("calls diverging defaults a conflict and matching ones agreement", () => {
    const b = compactContract(passport([{ name: "size", default: "md" }]));
    const m = compactContract(passport([{ name: "size", default: "sm" }]));
    const t1 = compactContract(passport([{ name: "size", default: "lg" }]));
    const t2 = compactContract(passport([{ name: "size", default: "sm" }]));
    expect(threeWay(b, m, t1).conflicts).toHaveLength(1);
    expect(threeWay(b, m, t2).conflicts).toHaveLength(0);
  });

  it("does not report a conflict when both sides made the same removal", () => {
    const mine = compactContract(passport([variant(["primary", "ghost"])]));
    const theirs = compactContract(passport([variant(["primary", "ghost"])]));
    expect(threeWay(base, mine, theirs).conflicts).toEqual([]);
  });

  it("falls back to an honest two-way comparison without a base", () => {
    const mine = compactContract(passport([{ name: "tone" }]));
    const theirs = compactContract(passport([]));
    const result = threeWay(null, mine, theirs);
    expect(result.mode).toBe("two-way");
    expect(result.differences).toContainEqual(expect.objectContaining({ name: "tone", change: "added" }));
  });
});

describe("acceptedNames", () => {
  it("covers props and handlers", () => {
    const c = compactContract(passport([{ name: "size" }], { events: [{ name: "onClick", signature: "() => void" }] }));
    expect([...acceptedNames(c)].sort()).toEqual(["onClick", "size"]);
  });
});
