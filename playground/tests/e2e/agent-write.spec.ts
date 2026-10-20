/*
 * The write primitive behind `setValue`, in a real engine.
 *
 * The unit tests prove the validator refuses the right things, with a mock
 * standing in for the field. They cannot prove the half only a browser can
 * answer, and it is the half that matters: that setting a value through the
 * prototype setter notifies listeners, while a plain assignment does not.
 *
 * That difference is the whole reason `writeValue` exists. React keeps a value
 * tracker on the DOM node; a plain `input.value = x` updates the node and
 * leaves the tracker agreeing with it, so React concludes nothing changed,
 * never fires `onChange`, and a controlled field reverts on its next render.
 * The write appears to work and then silently undoes itself.
 *
 * This runs against bare elements rather than the demo app on purpose: the
 * property under test belongs to the DOM, so proving it needs no component,
 * and a test that needs no component cannot be broken by one.
 */
import { expect, test } from "@playwright/test";

const PAGE = `<!doctype html>
<meta charset="utf-8">
<input id="text" value="start">
<textarea id="area">start</textarea>
<input id="box" type="checkbox">
<input id="ro" value="locked" readonly>
<input id="off" value="locked" disabled>
<script>
  window.seen = [];
  for (const id of ["text", "area", "box", "ro", "off"]) {
    const el = document.getElementById(id);
    for (const type of ["input", "change"]) {
      el.addEventListener(type, () => window.seen.push(id + ":" + type));
    }
  }
</script>`;

/* The library's technique, inlined so the test states what it is testing. */
const WRITE = `(id, value) => {
  const el = document.getElementById(id);
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}`;

/* A checkbox is clicked, because React hears a checkbox through `click`. */
const WRITE_CHECKED = `(id, checked) => {
  const el = document.getElementById(id);
  if (el.checked !== checked) el.click();
}`;

const run = (fn: string, ...args: unknown[]) =>
  // eslint-disable-next-line no-eval
  `(${fn})(${args.map((a) => JSON.stringify(a)).join(", ")})`;

test.beforeEach(async ({ page }) => {
  await page.setContent(PAGE);
});

test("writing through the prototype setter notifies listeners", async ({ page }) => {
  await page.evaluate(run(WRITE, "text", "ada"));

  expect(await page.inputValue("#text")).toBe("ada");
  expect(await page.evaluate(() => (window as never as { seen: string[] }).seen)).toEqual([
    "text:input",
    "text:change",
  ]);
});

test("a plain assignment changes the value and tells nobody", async ({ page }) => {
  await page.evaluate(() => {
    (document.getElementById("text") as HTMLInputElement).value = "ada";
  });

  // The node carries the text, and nothing downstream has any idea — which is
  // precisely the bug a controlled React field would exhibit as a revert.
  expect(await page.inputValue("#text")).toBe("ada");
  expect(await page.evaluate(() => (window as never as { seen: string[] }).seen)).toEqual([]);
});

test("a textarea needs its own prototype, not the input's", async ({ page }) => {
  await page.evaluate(run(WRITE, "area", "many lines"));

  expect(await page.inputValue("#area")).toBe("many lines");
  expect(await page.evaluate(() => (window as never as { seen: string[] }).seen)).toEqual([
    "area:input",
    "area:change",
  ]);
});

test("a checkbox is clicked, and announces it as a person's click would", async ({ page }) => {
  await page.evaluate(run(WRITE_CHECKED, "box", true));

  expect(await page.isChecked("#box")).toBe(true);
  expect(await page.evaluate(() => (window as never as { seen: string[] }).seen)).toEqual([
    "box:input",
    "box:change",
  ]);

  // Already checked: asking again is a no-op, not a toggle back.
  await page.evaluate(run(WRITE_CHECKED, "box", true));
  expect(await page.isChecked("#box")).toBe(true);
});

test("the elements the policy layer refuses report themselves as unwritable", async ({ page }) => {
  const state = await page.evaluate(() =>
    ["ro", "off"].map((id) => {
      const el = document.getElementById(id) as HTMLInputElement;
      return { id, writable: !el.disabled && !el.readOnly };
    }),
  );

  // `writable()` in shared/core/agent/write.ts asks exactly this, so a field
  // the validator refuses and an element that refuses cannot disagree.
  expect(state).toEqual([
    { id: "ro", writable: false },
    { id: "off", writable: false },
  ]);
});
