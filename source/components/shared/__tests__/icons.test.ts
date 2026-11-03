import { describe, expect, it } from "vitest";
import { mergeIcons } from "../native/icons-merge";
import type { KitIconRender } from "../native/icons";

const close: KitIconRender = () => "close";
const check: KitIconRender = () => "check";
const close2: KitIconRender = () => "close2";

describe("mergeIcons", () => {
  it("keeps the outer set when a nested provider gives none", () => {
    const outer = { close };
    expect(mergeIcons(outer)).toBe(outer);
  });

  it("starts empty, so every mark falls back to Kit's drawing", () => {
    expect(mergeIcons({}, undefined)).toEqual({});
  });

  it("adds a nested provider's marks and keeps the outer ones", () => {
    const merged = mergeIcons({ close }, { check });
    expect(merged.close).toBe(close);
    expect(merged.check).toBe(check);
  });

  it("lets a nested provider replace one mark", () => {
    expect(mergeIcons({ close, check }, { close: close2 }).close).toBe(close2);
  });
});
