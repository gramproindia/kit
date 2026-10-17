/*
 * The field validator is a security boundary: it is the only thing between a
 * model's proposal and a write into someone's form. These tests are mostly
 * about what it refuses.
 */
import { describe, expect, it } from "vitest";

import {
  createFieldAgent,
  domFieldExecutors,
  fieldOperations,
  handleFieldExecutors,
  setValueSchema,
  validateFieldIntent,
  type FieldContract,
} from "../index";

const text = (over: Partial<FieldContract> = {}): FieldContract => ({
  component: "Input",
  kind: "text",
  operations: ["setValue", "clear", "focus"],
  ...over,
});

const choice = (over: Partial<FieldContract> = {}): FieldContract => ({
  component: "Select",
  kind: "choice",
  operations: ["setValue", "clear", "focus", "open", "close"],
  options: [
    { value: "eng", label: "Engineering" },
    { value: "sales", label: "Sales" },
    { value: "legal", label: "Legal", disabled: true },
  ],
  ...over,
});

describe("schema layer", () => {
  it("refuses an intent with no action", () => {
    const result = validateFieldIntent({} as never, text());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.layer).toBe("schema");
  });

  it("narrows setValue to the field's own type", () => {
    expect(setValueSchema(text({ maxLength: 10 })).properties?.value).toMatchObject({
      type: "string",
      maxLength: 10,
    });
    expect(setValueSchema(choice()).properties?.value).toMatchObject({
      enum: ["eng", "sales", "legal"],
    });
  });

  it("publishes only the operations the instance exposes", () => {
    const operations = fieldOperations(text());
    expect(Object.keys(operations).sort()).toEqual(["clear", "focus", "setValue"]);
    expect(operations.setValue.input).toBeDefined();
  });
});

describe("reference layer", () => {
  it("refuses an operation the field does not have", () => {
    const result = validateFieldIntent({ action: "open" }, text());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.layer).toBe("reference");
      expect(result.code).toBe("unknown-operation");
    }
  });

  it("refuses an option that does not exist, and suggests the near miss", () => {
    const result = validateFieldIntent({ action: "setValue", value: "enginering" }, choice());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.layer).toBe("reference");
      expect(result.suggestion).toContain("eng");
    }
  });

  it("does not invent a suggestion for something unlike any option", () => {
    const result = validateFieldIntent({ action: "setValue", value: "zzzzzzzzzz" }, choice());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.suggestion).toBeUndefined();
  });
});

describe("coercion layer", () => {
  it('reads "true" as a boolean, and says so', () => {
    const result = validateFieldIntent(
      { action: "setValue", value: "true" },
      { component: "Switch", kind: "boolean", operations: ["setValue"] },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.command.value).toBe(true);
      expect(result.warnings[0]?.code).toBe("coerced");
    }
  });

  it("does not guess at natural language", () => {
    const result = validateFieldIntent(
      { action: "setValue", value: "yes" },
      { component: "Switch", kind: "boolean", operations: ["setValue"] },
    );
    expect(result.ok).toBe(false);
  });

  it("refuses a date that is not a real day", () => {
    const contract: FieldContract = { component: "DatePicker", kind: "date", operations: ["setValue"] };
    expect(validateFieldIntent({ action: "setValue", value: "2025-02-31" }, contract).ok).toBe(false);
    expect(validateFieldIntent({ action: "setValue", value: "2025-02-28" }, contract).ok).toBe(true);
  });

  it("swaps a backwards range rather than refusing it", () => {
    const result = validateFieldIntent(
      { action: "setValue", value: { start: "2025-06-30", end: "2025-06-01" } },
      { component: "DateRangePicker", kind: "dateRange", operations: ["setValue"] },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.command.value).toEqual({ start: "2025-06-01", end: "2025-06-30" });
  });

  it("de-duplicates a multi-select", () => {
    const result = validateFieldIntent(
      { action: "setValue", value: ["eng", "eng", "sales"] },
      choice({ component: "MultiSelect", kind: "multiChoice" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.command.value).toEqual(["eng", "sales"]);
  });
});

describe("policy layer", () => {
  it("refuses a write to a disabled field", () => {
    const result = validateFieldIntent({ action: "setValue", value: "x" }, text({ disabled: true }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("disabled");
  });

  it("refuses a write to a read-only field but allows focus", () => {
    const contract = text({ readOnly: true });
    expect(validateFieldIntent({ action: "setValue", value: "x" }, contract).ok).toBe(false);
    expect(validateFieldIntent({ action: "focus" }, contract).ok).toBe(true);
  });

  it("refuses a disabled option", () => {
    const result = validateFieldIntent({ action: "setValue", value: "legal" }, choice());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("option-disabled");
  });

  it("enforces numeric bounds", () => {
    const contract: FieldContract = {
      component: "NumberInput",
      kind: "number",
      operations: ["setValue"],
      min: 0,
      max: 100,
    };
    expect(validateFieldIntent({ action: "setValue", value: 150 }, contract).ok).toBe(false);
    expect(validateFieldIntent({ action: "setValue", value: -1 }, contract).ok).toBe(false);
    expect(validateFieldIntent({ action: "setValue", value: 50 }, contract).ok).toBe(true);
  });

  it("enforces date bounds", () => {
    const contract: FieldContract = {
      component: "DatePicker",
      kind: "date",
      operations: ["setValue"],
      min: "2025-01-01",
      max: "2025-12-31",
    };
    expect(validateFieldIntent({ action: "setValue", value: "2024-12-31" }, contract).ok).toBe(false);
    expect(validateFieldIntent({ action: "setValue", value: "2026-01-01" }, contract).ok).toBe(false);
    expect(validateFieldIntent({ action: "setValue", value: "2025-07-04" }, contract).ok).toBe(true);
  });

  it("enforces a text length limit, as policy rather than as a shape error", () => {
    const result = validateFieldIntent({ action: "setValue", value: "abcdef" }, text({ maxLength: 3 }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.layer).toBe("policy");
      expect(result.code).toBe("too-long");
    }
  });

  it("enforces a pattern", () => {
    const contract = text({ pattern: "^[A-Z]{3}$" });
    expect(validateFieldIntent({ action: "setValue", value: "abc" }, contract).ok).toBe(false);
    expect(validateFieldIntent({ action: "setValue", value: "ABC" }, contract).ok).toBe(true);
  });

  it("does not hold an uncompilable pattern against the caller", () => {
    const result = validateFieldIntent({ action: "setValue", value: "x" }, text({ pattern: "([" }));
    expect(result.ok).toBe(true);
  });

  it("enforces the selection cap", () => {
    const result = validateFieldIntent(
      { action: "setValue", value: ["eng", "sales"] },
      choice({ component: "MultiSelect", kind: "multiChoice", maxSelected: 1 }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("too-many-selected");
  });
});

describe("plausibility layer", () => {
  it("warns rather than refuses when a value sits exactly at the limit", () => {
    const result = validateFieldIntent({ action: "setValue", value: "0123456789" }, text({ maxLength: 10 }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warnings.map((w) => w.code)).toContain("at-limit");
  });

  it("warns when clearing a required field", () => {
    const result = validateFieldIntent({ action: "clear" }, text({ required: true }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warnings.map((w) => w.code)).toContain("clearing-required-field");
  });

  it("notes a value that snaps to the step", () => {
    const result = validateFieldIntent(
      { action: "setValue", value: 7 },
      { component: "NumberInput", kind: "number", operations: ["setValue"], step: 5, min: 0 },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warnings.map((w) => w.code)).toContain("snapped-to-step");
  });
});

describe("the agent loop", () => {
  const handle = () => {
    const calls: unknown[] = [];
    const target = {
      setValue: (value: unknown) => calls.push(["setValue", value]),
      clear: () => calls.push(["clear"]),
      focus: () => calls.push(["focus"]),
      open: () => calls.push(["open"]),
    };
    return { target, calls };
  };

  it("executes only what the validator allowed", async () => {
    const { target, calls } = handle();
    const agent = createFieldAgent({
      contract: choice(),
      executors: handleFieldExecutors(() => target),
    });

    const refused = await agent.run({ action: "setValue", value: "legal" });
    expect(refused.ok).toBe(false);
    expect(calls).toHaveLength(0);

    const allowed = await agent.run({ action: "setValue", value: "eng" });
    expect(allowed.ok).toBe(true);
    expect(calls).toEqual([["setValue", "eng"]]);
  });

  it("changes nothing on a dry run", async () => {
    const { target, calls } = handle();
    const agent = createFieldAgent({
      contract: choice(),
      executors: handleFieldExecutors(() => target),
    });
    const result = await agent.run({ action: "setValue", value: "eng" }, { dryRun: true });
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("reports a failure to reach the field separately from a refusal", async () => {
    const agent = createFieldAgent({
      contract: choice(),
      executors: handleFieldExecutors(() => null),
    });
    const result = await agent.run({ action: "setValue", value: "eng" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("execution-failed");
    expect(result.reason).toContain("not mounted");
  });

  it("check() rules without performing", () => {
    const { target, calls } = handle();
    const agent = createFieldAgent({
      contract: choice(),
      executors: handleFieldExecutors(() => target),
    });
    expect(agent.check({ action: "setValue", value: "eng" }).ok).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("refuses when an operation has no executor behind it", async () => {
    const agent = createFieldAgent({
      contract: text({ operations: ["setValue", "open"] }),
      executors: domFieldExecutors(() => null),
    });
    const result = await agent.run({ action: "open" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("no-executor");
  });
});
