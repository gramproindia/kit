/*
 * Writing to a field the way a person does.
 *
 * This is the one file under `agent/` that needs a browser. Everything else
 * here validates, and validation runs anywhere; executing has to touch
 * something real. It is kept separate so the split is visible rather than
 * discovered when a server build fails.
 *
 * Why not simply assign `input.value = x`: React tracks the last value it
 * wrote on the DOM node, and an assignment that bypasses the prototype setter
 * leaves that tracker in step with the new value. React then concludes nothing
 * changed and never fires `onChange`, so a controlled field snaps back on the
 * next render. Going through the prototype setter and dispatching a real
 * bubbling event is what makes the change indistinguishable from typing — to
 * React, to form libraries, and to any plain listener.
 *
 * `Input.clear()` has worked this way since before there was an agent runtime.
 * This is the same technique, generalised to textareas and to checkedness.
 */

type Writable = HTMLInputElement | HTMLTextAreaElement;

/** The prototype that owns the real setter for this element. */
const prototypeOf = (element: Writable) =>
  element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;

function nativeSetter(element: Writable, property: "value" | "checked") {
  return Object.getOwnPropertyDescriptor(prototypeOf(element), property)?.set;
}

/**
 * Set a field's text through the prototype setter, then fire the events a
 * person typing would have fired.
 */
export function writeValue(element: Writable, value: string): void {
  nativeSetter(element, "value")?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Set a checkbox or radio, as a click would.
 *
 * `checked` rather than `value`, and a `click` is not used: clicking a radio
 * that is already selected does nothing, and clicking a disabled one is
 * silently dropped. Setting the property and announcing it is both more
 * predictable and easier to reason about from a validator's point of view —
 * by the time this runs, the policy layer has already decided it is allowed.
 */
export function writeChecked(element: HTMLInputElement, checked: boolean): void {
  nativeSetter(element, "checked")?.call(element, checked);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

/** True when the element can still be written to at all. */
export const writable = (element: Writable | null | undefined): element is Writable =>
  Boolean(element) && !(element as Writable).disabled && !(element as Writable).readOnly;
