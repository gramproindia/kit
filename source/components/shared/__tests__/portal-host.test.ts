import { describe, expect, it } from "vitest";
import { createPortalHost, sameIcons, sameTheme } from "../native/portal-host";

describe("createPortalHost", () => {
  it("mounts, updates and unmounts entries, notifying on each change", () => {
    const host = createPortalHost<string>();
    let changes = 0;
    host.subscribe(() => changes++);
    const a = host.mount("a");
    const b = host.mount("b");
    host.update(a, "a2");
    expect(host.entries()).toEqual([
      { key: a, node: "a2" },
      { key: b, node: "b" },
    ]);
    host.unmount(a);
    expect(host.entries().map((entry) => entry.node)).toEqual(["b"]);
    expect(changes).toBe(4);
  });

  it("keeps the same entries array until something changes", () => {
    const host = createPortalHost<string>();
    host.mount("a");
    const before = host.entries();
    host.update(99, "ghost");
    host.unmount(99);
    expect(host.entries()).toBe(before);
  });

  it("gives the top layer to the newest open overlay, and back on release", () => {
    const host = createPortalHost<string>();
    expect(host.top()).toBeNull();
    const first = host.claimLayer();
    const second = host.claimLayer();
    expect(host.top()).toBe(second.layer);
    second.release();
    expect(host.top()).toBe(first.layer);
    second.release(); // twice is harmless
    expect(host.top()).toBe(first.layer);
    first.release();
    expect(host.top()).toBeNull();
  });

  it("keeps the newer layer on top when an older overlay closes first", () => {
    const host = createPortalHost<string>();
    const first = host.claimLayer();
    const second = host.claimLayer();
    first.release();
    expect(host.top()).toBe(second.layer);
  });
});

describe("sameTheme", () => {
  it("treats a fresh but equal inline theme as the same", () => {
    expect(sameTheme({ accent: "#123456" }, { accent: "#123456" })).toBe(true);
    expect(sameTheme({ light: { accent: "#1" }, dark: { accent: "#2" } }, { light: { accent: "#1" }, dark: { accent: "#2" } })).toBe(true);
  });

  it("sees a changed value, an added key, or a missing theme", () => {
    expect(sameTheme({ accent: "#1" }, { accent: "#2" })).toBe(false);
    expect(sameTheme({ light: { accent: "#1" } }, { light: { accent: "#2" } })).toBe(false);
    expect(sameTheme({ accent: "#1" }, { accent: "#1", radius: 4 })).toBe(false);
    expect(sameTheme({ accent: "#1" }, undefined)).toBe(false);
    expect(sameTheme(undefined, undefined)).toBe(true);
  });
});

describe("sameIcons", () => {
  it("compares render functions by identity", () => {
    const close = () => null;
    expect(sameIcons({ close }, { close })).toBe(true);
    expect(sameIcons({ close }, { close: () => null })).toBe(false);
  });
});
