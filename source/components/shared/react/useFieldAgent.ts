"use client";

/*
 * Make a field agent-operable without changing the field.
 *
 * The DataGrid takes an `agent` prop because a grid's runtime needs to see the
 * data, the columns and the live state to say anything useful. A field needs
 * none of that: its contract is its own props, and its executor is the ref the
 * caller already holds. So this is a hook rather than a prop, and no component
 * had to grow an API to support it.
 *
 *   const ref = useRef<HTMLInputElement>(null);
 *   const agent = useFieldAgent({
 *     contract: { component: "Input", kind: "text", operations: ["setValue", "clear", "focus"], maxLength: 80 },
 *     target: ref,
 *   });
 *
 *   await agent.run({ action: "setValue", value: "Ada Lovelace" });
 *
 * `target` is whatever that component's ref gives you. Input, Textarea,
 * NumberInput, Checkbox, Switch and Radio hand back the DOM element; Combobox
 * and DatePicker hand back a handle. The hook tells them apart and nothing
 * above it has to care.
 */

import { useMemo, useRef } from "react";
import {
  autoFieldExecutors,
  createFieldAgent,
  type FieldAgent,
  type FieldContract,
  type FieldHandleTarget,
} from "../core/agent";

type Target =
  | { readonly current: HTMLInputElement | HTMLTextAreaElement | null }
  | { readonly current: FieldHandleTarget | null };

export interface UseFieldAgentOptions {
  /** What this instance will accept. Rebuild it from props as they change. */
  readonly contract: FieldContract;
  /** The component's ref: a DOM element for most fields, a handle for some. */
  readonly target: Target;
}

export function useFieldAgent({ contract, target }: UseFieldAgentOptions): FieldAgent {
  // The ref object is stable; its contents are not, and the executors read
  // them at call time rather than closing over whatever was there on mount.
  const latest = useRef(target);
  latest.current = target;

  return useMemo(() => {
    // DOM element or handle is decided per call; see autoFieldExecutors.
    const executors = autoFieldExecutors(() => latest.current.current, {
      checkable: contract.kind === "boolean",
      component: contract.component,
    });
    return createFieldAgent({ contract, executors });
    // The contract is the dependency that matters: a field that has just
    // become read-only must stop accepting writes on the very next render.
  }, [contract]);
}
