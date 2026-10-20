/*
 * The interactive picker, in a fake terminal.
 *
 * Raw key bytes go in, exactly as a terminal sends them, so the real keypress
 * decoder runs. What comes out is checked for the two things that made the old
 * picker unusable: it must never draw more lines than a small terminal has,
 * and each redraw must replace exactly the lines it drew before — not clear
 * the screen, which is what made it jump.
 */
import { PassThrough } from "node:stream";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { multiselect } = require("../prompt.cjs") as {
  multiselect(config: {
    message: string;
    options: { value: string; tag?: string; hint?: string; note?: string }[];
    input: unknown;
    output: unknown;
  }): Promise<string[] | null>;
};

const KEY = { up: "\x1b[A", down: "\x1b[B", space: " ", enter: "\r", esc: "\x1b", ctrlC: "\x03", ctrlA: "\x01", backspace: "\x7f" };
const OPTIONS = Array.from({ length: 27 }, (_, i) => ({
  value: `Component${String(i).padStart(2, "0")}`,
  tag: i % 2 ? "Inputs" : "Overlays",
  hint: `What component ${i} is for, in a sentence long enough to need clipping on a narrow terminal`,
}));

function terminal(columns = 80, rows = 20) {
  const input = Object.assign(new PassThrough(), { isTTY: true, setRawMode: () => input });
  const output = Object.assign(new PassThrough(), { isTTY: true, columns, rows });
  let written = "";
  output.on("data", (chunk) => (written += chunk));
  const press = async (...keys: string[]) => {
    for (const key of keys) {
      input.write(key);
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  };
  return { input, output, press, written: () => written };
}

/** Split the output into the frames drawn, each without the cursor-up that preceded it. */
const frames = (text: string) =>
  text
    .replace(/\x1b\[\?25[lh]/g, "")
    .split(/\x1b\[\d+A\r\x1b\[J/)
    .map((frame) => frame.replace(/\n$/, "").split("\n"));

const plain = (line: string) => line.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");

describe("multiselect", () => {
  it("returns what was selected, in list order", async () => {
    const t = terminal();
    const result = multiselect({ message: "Which?", options: OPTIONS, input: t.input, output: t.output });
    await t.press(KEY.down, KEY.space, KEY.up, KEY.space, KEY.enter);
    expect(await result).toEqual(["Component00", "Component01"]);
  });

  it("fits a small terminal, and scrolls instead of growing", async () => {
    const t = terminal(60, 14);
    const result = multiselect({ message: "Which?", options: OPTIONS, input: t.input, output: t.output });
    await t.press(...Array(20).fill(KEY.down), KEY.space, KEY.enter);
    expect(await result).toEqual(["Component20"]);

    for (const frame of frames(t.written())) {
      expect(frame.length).toBeLessThanOrEqual(14);
      for (const line of frame) expect(plain(line).length).toBeLessThan(60);
    }
    expect(t.written()).toMatch(/more/);
  });

  it("redraws in place: every frame replaces exactly the lines of the one before", async () => {
    const t = terminal();
    const result = multiselect({ message: "Which?", options: OPTIONS, input: t.input, output: t.output });
    await t.press(KEY.down, KEY.down, KEY.space, KEY.enter);
    await result;

    const text = t.written();
    expect(text).not.toMatch(/\x1b\[2J|\x1bc/); // never clears the screen
    const ups = [...text.matchAll(/\x1b\[(\d+)A/g)].map((m) => Number(m[1]));
    const drawn = frames(text).map((frame) => frame.length);
    expect(ups).toEqual(drawn.slice(0, -1));
  });

  it("filters as you type, and ctrl+a selects what is shown", async () => {
    const t = terminal();
    const result = multiselect({ message: "Which?", options: OPTIONS, input: t.input, output: t.output });
    await t.press(..."component2".split(""), KEY.ctrlA, KEY.enter);
    expect(await result).toEqual(["Component20", "Component21", "Component22", "Component23", "Component24", "Component25", "Component26"]);
  });

  it("will not finish with nothing selected, and says why", async () => {
    const t = terminal();
    const result = multiselect({ message: "Which?", options: OPTIONS, input: t.input, output: t.output });
    await t.press(KEY.enter);
    expect(t.written()).toMatch(/Select at least one/);
    await t.press(KEY.space, KEY.enter);
    expect(await result).toEqual(["Component00"]);
  });

  it.each([["esc", KEY.esc], ["ctrl+c", KEY.ctrlC]])("cancels on %s, and gives the cursor back", async (_, key) => {
    const t = terminal();
    const result = multiselect({ message: "Which?", options: OPTIONS, input: t.input, output: t.output });
    await t.press(KEY.space, key);
    await new Promise((resolve) => setTimeout(resolve, 600)); // esc waits to rule out an arrow key
    expect(await result).toBeNull();
    expect(t.written().endsWith("\x1b[?25h")).toBe(true);
  });

  it("refuses to start without a terminal, rather than hanging", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    await expect(multiselect({ message: "Which?", options: OPTIONS, input, output })).rejects.toThrow(/needs a terminal/);
  });
});
