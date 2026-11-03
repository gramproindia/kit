import { describe, expect, it } from "vitest";
import { filterOptions, matchRanges } from "../core/filter";
import type { ComboboxOption } from "../core/types";

describe("highlights when lowercasing changes length", () => {
  it("matches but does not highlight wrong characters", () => {
    // "İ".toLocaleLowerCase() is two code units, which would shift every range after it.
    const label = "İstanbul";
    expect(label.toLocaleLowerCase().length).not.toBe(label.length);
    expect(matchRanges(label, ["bul"])).toEqual([]);
    expect(matchRanges(label, ["xyz"])).toBeNull();
    const [entry] = filterOptions([{ value: 1, label }], "bul");
    expect(entry.matches).toEqual([]);
  });

  it("still highlights ordinary labels", () => {
    expect(matchRanges("Istanbul", ["bul"])).toEqual([[5, 8]]);
  });
});

describe("cached search text", () => {
  it("matches description and keywords across searches", () => {
    const options: ComboboxOption<string>[] = [
      { value: "fr", label: "France", description: "Europe", keywords: ["Paris"] },
      { value: "jp", label: "Japan", keywords: ["Tokyo"] },
    ];
    expect(filterOptions(options, "paris").map((e) => e.option.value)).toEqual(["fr"]);
    expect(filterOptions(options, "tokyo").map((e) => e.option.value)).toEqual(["jp"]);
    expect(filterOptions(options, "europe paris").map((e) => e.option.value)).toEqual(["fr"]);
    expect(filterOptions(options, "europe tokyo")).toEqual([]);
  });

  it("sees a replaced option's new text", () => {
    const first: ComboboxOption<string> = { value: "a", label: "Alpha" };
    expect(filterOptions([first], "beta")).toEqual([]);
    expect(filterOptions([{ ...first, label: "Beta" }], "beta")).toHaveLength(1);
  });
});
