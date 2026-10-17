/*
 * The passports and the runtime agree.
 *
 * A passport is the thing an agent reads before it acts. One that lists an
 * operation nothing performs, or describes it differently from the code, is
 * worse than one that lists nothing: the agent proceeds on it. The grid has
 * had this test since it had operations; these are the fields' version of it.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { fieldOperations } from "../../../source/components/shared/core/agent/field";
import { checkboxContract } from "../../../source/components/checkbox/core/agent";
import { comboboxContract } from "../../../source/components/combobox/core/agent";
import { datePickerContract } from "../../../source/components/date-picker/core/agent";
import { inputContract } from "../../../source/components/input/core/agent";
import { numberInputContract } from "../../../source/components/number-input/core/agent";
import { radioGroupContract } from "../../../source/components/radio-group/core/agent";
import { switchContract } from "../../../source/components/switch/core/agent";
import { textareaContract } from "../../../source/components/textarea/core/agent";

const passport = (folder: string) =>
  JSON.parse(
    readFileSync(new URL(`../../../source/components/${folder}/passport.json`, import.meta.url), "utf8"),
  ) as {
    operations: Record<string, { summary?: string; reversible?: boolean; apiMethod?: string }>;
  };

const FIELDS = [
  { folder: "input", contract: inputContract() },
  { folder: "textarea", contract: textareaContract() },
  { folder: "number-input", contract: numberInputContract() },
  { folder: "checkbox", contract: checkboxContract() },
  { folder: "switch", contract: switchContract() },
  { folder: "radio-group", contract: radioGroupContract() },
  { folder: "combobox", contract: comboboxContract() },
  { folder: "date-picker", contract: datePickerContract() },
] as const;

describe.each(FIELDS)("$folder", ({ folder, contract }) => {
  const published = passport(folder).operations;
  const runtime = fieldOperations(contract);

  it("declares the same operation set the runtime dispatches on", () => {
    expect(Object.keys(published).sort()).toEqual(Object.keys(runtime).sort());
  });

  it("describes each one the same way", () => {
    for (const [name, operation] of Object.entries(published)) {
      expect(operation.summary, `${folder}.${name} summary`).toBe(runtime[name].summary);
      expect(operation.reversible, `${folder}.${name} reversible`).toBe(runtime[name].reversible);
    }
  });

  it("claims no API method, because a field is written through its ref", () => {
    for (const [name, operation] of Object.entries(published)) {
      expect(operation.apiMethod, `${folder}.${name}`).toBeUndefined();
    }
  });

  it("exposes an operation set the contract actually lists", () => {
    expect(Object.keys(runtime).sort()).toEqual([...contract.operations].sort());
  });
});

describe("the set as a whole", () => {
  it("gives every field a way to be written and focused", () => {
    for (const { folder, contract } of FIELDS) {
      expect(contract.operations, folder).toContain("setValue");
      expect(contract.operations, folder).toContain("focus");
    }
  });

  it("gives a disclosure to exactly the two components that have one", () => {
    const withOverlay = FIELDS.filter((field) => field.contract.operations.includes("open")).map(
      (field) => field.folder,
    );
    expect(withOverlay.sort()).toEqual(["combobox", "date-picker"]);
  });

  it("does not offer clear on a Switch, which has no empty state", () => {
    const toggle = FIELDS.find((field) => field.folder === "switch")!;
    expect(toggle.contract.operations).not.toContain("clear");
  });
});
