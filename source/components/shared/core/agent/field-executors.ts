/*
 * How a field actually performs what the validator allowed.
 *
 * Two kinds of field exist in this library and the difference is not cosmetic:
 *
 *   - Input, Textarea, NumberInput, Checkbox, Switch and Radio hand you the
 *     DOM element as their ref. They are written through the element.
 *   - Combobox and DatePicker hand you a handle object, because their value is
 *     not a string in an input — it is a selection, or a date. They are
 *     written through that handle.
 *
 * Both end up satisfying the same `OperationExecutor`, which is the point of
 * the executor being a separate thing from the operation. Everything above
 * this file — the contract, the schemas, the validator, the refusals — is
 * identical for both, and neither knows which it is driving.
 */

import { writeChecked, writeValue, writable } from "./write";
import type { FieldCommand, FieldContract, FieldOperationName } from "./field";
import type { ExecutionContext, RegisteredExecutor } from "./types";

export type FieldExecutionContext = ExecutionContext<FieldContract>;

/** What a component with a real handle must provide to be driven. */
export interface FieldHandleTarget {
  setValue(value: unknown): void;
  clear?(): void;
  focus?(): void;
  open?(): void;
  close?(): void;
}

type Registry = Map<string, RegisteredExecutor<FieldContract>>;

const define = (
  registry: Registry,
  operation: FieldOperationName,
  execute: (input: FieldCommand, context: FieldExecutionContext) => unknown,
) => {
  registry.set(operation, { operation, execute } as RegisteredExecutor<FieldContract>);
};

/**
 * Executors for a field whose ref is the DOM element.
 *
 * `getElement` is a function rather than the element itself because the ref is
 * not populated on the first render, and an executor registry built once must
 * still work on the tenth.
 */
export function domFieldExecutors(
  getElement: () => HTMLInputElement | HTMLTextAreaElement | null,
  options: { readonly checkable?: boolean } = {},
): Registry {
  const registry: Registry = new Map();

  const element = () => {
    const found = getElement();
    if (!found) throw new Error("The field is not mounted.");
    return found;
  };

  define(registry, "setValue", (command, context) => {
    const target = element();
    if (context.dryRun) return { wouldWrite: command.value };
    if (!writable(target)) throw new Error("The field is disabled or read-only.");
    if (options.checkable) writeChecked(target as HTMLInputElement, Boolean(command.value));
    else writeValue(target, String(command.value ?? ""));
    return { wrote: command.value };
  });

  define(registry, "clear", (_command, context) => {
    const target = element();
    if (context.dryRun) return { wouldClear: true };
    if (!writable(target)) throw new Error("The field is disabled or read-only.");
    if (options.checkable) writeChecked(target as HTMLInputElement, false);
    else writeValue(target, "");
    return { cleared: true };
  });

  define(registry, "focus", (_command, context) => {
    if (context.dryRun) return { wouldFocus: true };
    element().focus();
    return { focused: true };
  });

  return registry;
}

/** Executors for a field that exposes a handle object rather than an element. */
export function handleFieldExecutors(getHandle: () => FieldHandleTarget | null): Registry {
  const registry: Registry = new Map();

  const handle = () => {
    const found = getHandle();
    if (!found) throw new Error("The field is not mounted.");
    return found;
  };

  define(registry, "setValue", (command, context) => {
    const target = handle();
    if (context.dryRun) return { wouldWrite: command.value };
    target.setValue(command.value);
    return { wrote: command.value };
  });

  define(registry, "clear", (_command, context) => {
    const target = handle();
    if (context.dryRun) return { wouldClear: true };
    // A handle without `clear` still clears: writing null is the same thing.
    if (target.clear) target.clear();
    else target.setValue(null);
    return { cleared: true };
  });

  define(registry, "focus", (_command, context) => {
    const target = handle();
    if (context.dryRun) return { wouldFocus: true };
    target.focus?.();
    return { focused: true };
  });

  define(registry, "open", (_command, context) => {
    const target = handle();
    if (context.dryRun) return { wouldOpen: true };
    target.open?.();
    return { opened: true };
  });

  define(registry, "close", (_command, context) => {
    const target = handle();
    if (context.dryRun) return { wouldClose: true };
    target.close?.();
    return { closed: true };
  });

  return registry;
}

/** A handle, as opposed to a DOM node. Checked by capability, not by instanceof. */
const isHandle = (value: unknown): value is FieldHandleTarget =>
  Boolean(value) && typeof (value as FieldHandleTarget).setValue === "function";

/**
 * Executors that decide at call time whether the target is a DOM field or a
 * handle.
 *
 * It cannot be decided earlier: a ref is null on the first render, and
 * deciding then would treat every component as a DOM field for good. Both
 * registries are built, and the choice is made inside `execute`, by which
 * point the target exists.
 */
export function autoFieldExecutors(
  getTarget: () => unknown,
  options: { readonly checkable?: boolean; readonly component?: string } = {},
): Registry {
  const dom = domFieldExecutors(() => getTarget() as HTMLInputElement | HTMLTextAreaElement | null, {
    checkable: options.checkable,
  });
  const handle = handleFieldExecutors(() => getTarget() as FieldHandleTarget | null);

  const registry: Registry = new Map();
  for (const name of new Set([...dom.keys(), ...handle.keys()])) {
    registry.set(name, {
      operation: name,
      execute: (input, context) => {
        const chosen = isHandle(getTarget()) ? handle.get(name) : dom.get(name);
        if (!chosen) throw new Error(`${options.component ?? "This field"} cannot ${name}.`);
        return chosen.execute(input, context);
      },
    } as RegisteredExecutor<FieldContract>);
  }
  return registry;
}
