import { describe, expect, it } from "vitest";
import { createTabLayoutStore } from "../native/context";

const box = { x: 0, y: 0, width: 80, height: 44 };

describe("tab layout store", () => {
  it("tells subscribers about a new or changed layout", () => {
    const store = createTabLayoutStore();
    let calls = 0;
    store.subscribe(() => calls++);
    store.set("a", box);
    store.set("a", { ...box, width: 90 });
    expect(calls).toBe(2);
    expect(store.get().a.width).toBe(90);
  });

  it("stays quiet, and keeps the same snapshot, when a tab reports the same layout", () => {
    const store = createTabLayoutStore();
    store.set("a", box);
    const before = store.get();
    let calls = 0;
    store.subscribe(() => calls++);
    store.set("a", { ...box });
    expect(calls).toBe(0);
    expect(store.get()).toBe(before);
  });

  it("stops calling a listener once it unsubscribes", () => {
    const store = createTabLayoutStore();
    let calls = 0;
    const stop = store.subscribe(() => calls++);
    stop();
    store.set("a", box);
    expect(calls).toBe(0);
  });
});
