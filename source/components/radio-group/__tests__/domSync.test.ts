import { describe, expect, it } from "vitest";
import { watchProperty } from "../react/domSync";

// A stand-in for an <input>: `checked` is an accessor on the prototype.
class FakeInput {
  #checked = false;
  get checked() {
    return this.#checked;
  }
  set checked(value: boolean) {
    this.#checked = Boolean(value);
  }
}

describe("watchProperty", () => {
  it("reports a script's write after it lands", () => {
    const input = new FakeInput();
    const seen: boolean[] = [];
    watchProperty(input, "checked", (value) => seen.push(value));
    input.checked = true;
    expect(input.checked).toBe(true);
    expect(seen).toEqual([true]);
  });

  it("keeps a setter already on the element, as React's value tracker is", () => {
    const input = new FakeInput();
    const tracked: unknown[] = [];
    const proto = Object.getOwnPropertyDescriptor(FakeInput.prototype, "checked")!;
    Object.defineProperty(input, "checked", {
      configurable: true,
      get() {
        return proto.get!.call(this);
      },
      set(value) {
        tracked.push(value);
        proto.set!.call(this, value);
      },
    });
    const seen: boolean[] = [];
    const stop = watchProperty(input, "checked", (value) => seen.push(value));
    input.checked = true;
    expect(tracked).toEqual([true]);
    expect(seen).toEqual([true]);

    stop();
    input.checked = false;
    expect(tracked).toEqual([true, false]);
    expect(seen).toEqual([true]);
  });

  it("removes itself completely when nothing was there before", () => {
    const input = new FakeInput();
    const stop = watchProperty(input, "checked", () => undefined);
    expect(Object.hasOwn(input, "checked")).toBe(true);
    stop();
    expect(Object.hasOwn(input, "checked")).toBe(false);
  });

  it("does nothing to a property without an accessor", () => {
    const plain = { checked: false };
    const seen: boolean[] = [];
    watchProperty(plain, "checked", (value) => seen.push(value));
    plain.checked = true;
    expect(seen).toEqual([]);
  });
});
