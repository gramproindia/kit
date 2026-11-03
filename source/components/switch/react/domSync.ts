"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/*
 * The same file sits in each form-control folder. Every component folder
 * installs on its own, so these few lines are copied rather than shared.
 */

type Field = HTMLInputElement | HTMLTextAreaElement;
type Property = "checked" | "value";
type FormOwned = Pick<HTMLFieldSetElement, "form" | "ownerDocument">;

/**
 * Calls `onWrite` whenever a script assigns `target[property]`, after the
 * assignment has landed. The setter is wrapped on this one object only, and
 * whatever setter was there before — the prototype's, or React's own value
 * tracker — still runs first. Returns a function that removes the wrapper.
 */
export function watchProperty<T extends object, K extends keyof T & string>(
  target: T,
  property: K,
  onWrite: (value: T[K]) => void,
): () => void {
  const own = Object.getOwnPropertyDescriptor(target, property);
  let base = own;
  for (let proto = Object.getPrototypeOf(target); !base && proto; proto = Object.getPrototypeOf(proto)) {
    base = Object.getOwnPropertyDescriptor(proto, property);
  }
  if (!base?.get || !base.set || (own && !own.configurable)) return () => undefined;
  const { get, set } = base;

  const wrapper: PropertyDescriptor = {
    configurable: true,
    enumerable: base.enumerable,
    get() {
      return get.call(this);
    },
    set(value: unknown) {
      set.call(this, value);
      onWrite(get.call(this) as T[K]);
    },
  };
  Object.defineProperty(target, property, wrapper);

  return () => {
    // Put back only our own wrapper: if something replaced it since, leave that.
    if (Object.getOwnPropertyDescriptor(target, property)?.set !== wrapper.set) return;
    if (own) Object.defineProperty(target, property, own);
    else delete (target as Record<string, unknown>)[property];
  };
}

/**
 * Calls `onReset` just after the form that owns `ref` has reset — through
 * `form.reset()`, a reset button, or react-hook-form's `reset()`, which calls
 * `form.reset()`. No event React listens to is fired for any of them.
 */
export function useFormReset(
  ref: RefObject<FormOwned | null>,
  onReset: () => void,
  enabled: boolean,
): void {
  const latest = useRef(onReset);
  useLayoutEffect(() => {
    latest.current = onReset;
  });

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    const doc = element.ownerDocument;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    // Listened for on the document, after any handler on the form itself has
    // had the chance to cancel it. The browser resets the fields only after
    // the event, so the callback waits a task to see the result.
    const handleReset = (event: Event) => {
      if (event.defaultPrevented || event.target !== element.form) return;
      const timer = setTimeout(() => {
        timers.delete(timer);
        latest.current();
      }, 0);
      timers.add(timer);
    };
    doc.addEventListener("reset", handleReset);
    return () => {
      doc.removeEventListener("reset", handleReset);
      timers.forEach(clearTimeout);
    };
  }, [ref, enabled]);
}

/**
 * Keeps an uncontrolled field's React state in step with changes React never
 * hears about: a form reset, and a script assigning `el.checked` or `el.value`
 * directly (react-hook-form's `setValue`). Without this the state goes stale,
 * and a control that renders `checked` from that state would put the old
 * value back on its next render.
 *
 * `rendered` is the value the component shows now. `onWrite` runs with a
 * written value that differs from it — React's own writes always match, so
 * they are ignored. `onReset` runs after a reset and may return the value the
 * field should show; it is written to the element, since a render of the old
 * state can land between the reset and this callback. Off while `enabled` is
 * false, i.e. while a parent controls the value.
 */
export function useDomSync<V extends boolean | string>(
  ref: RefObject<Field | null>,
  property: Property,
  rendered: V,
  handlers: { onReset(field: Field): V | undefined; onWrite(value: V): void },
  enabled: boolean,
): void {
  const latest = useRef({ rendered, handlers, muted: false });
  useLayoutEffect(() => {
    latest.current.rendered = rendered;
    latest.current.handlers = handlers;
  });

  useFormReset(
    ref,
    () => {
      const field = ref.current;
      if (!field) return;
      const next = latest.current.handlers.onReset(field);
      if (next === undefined || field[property as "value"] === next) return;
      // Our own write, so not reported back to onWrite.
      latest.current.muted = true;
      (field as unknown as Record<Property, V>)[property] = next;
      latest.current.muted = false;
    },
    enabled,
  );

  useEffect(() => {
    const field = ref.current;
    if (!enabled || !field) return;
    // Compared a moment later: React writes the rendered value during a commit
    // and only then updates `latest`, and its own writes are not news.
    return watchProperty(field as HTMLInputElement, property, (value) => {
      if (latest.current.muted) return;
      queueMicrotask(() => {
        if (value !== latest.current.rendered) latest.current.handlers.onWrite(value as V);
      });
    });
  }, [ref, property, enabled]);
}
