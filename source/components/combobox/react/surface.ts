"use client";

import { labelText, useAgentSurfaceField } from "../../shared/react/agentSurfaceContext";
import type { ComboboxOption, OptionValue } from "../core/types";
import type { ComboboxHandle } from "./props";

interface ComboboxSurfaceParams<V extends OptionValue> {
  component: "Select" | "MultiSelect";
  label: unknown;
  ariaLabel: unknown;
  name?: string;
  required: boolean;
  disabled: boolean;
  options: readonly ComboboxOption<V>[];
  mode?: "client" | "server";
  max?: number;
  handle: ComboboxHandle<V>;
}

/**
 * Inside an <AgentSurface>, offer a Select or MultiSelect with its options.
 *
 * An agent speaks in strings and an option's value may be a number, so values
 * are offered as text and mapped back to the option they came from before the
 * write. In server mode the options are only the current results, so none are
 * enumerated: the set is the server's, not the component's.
 */
export function useComboboxSurface<V extends OptionValue>(params: ComboboxSurfaceParams<V>): void {
  useAgentSurfaceField(() => {
    const { component, options, handle } = params;
    const multiple = component === "MultiSelect";
    const enumerate = params.mode !== "server";
    const back = (value: unknown): V => {
      const text = String(value);
      return (options.find((option) => String(option.value) === text)?.value ?? text) as V;
    };
    return {
      contract: {
        component,
        kind: multiple ? "multiChoice" : "choice",
        label: labelText(params.label, params.ariaLabel, params.name),
        disabled: params.disabled,
        required: params.required,
        ...(enumerate
          ? {
              options: options.map((option) => ({
                value: String(option.value),
                label: option.label,
                ...(option.disabled ? { disabled: true } : {}),
              })),
            }
          : {}),
        ...(multiple && params.max !== undefined ? { maxSelected: params.max } : {}),
        operations: ["setValue", "clear", "focus", "open", "close"],
      },
      target: () => ({
        setValue: (next) =>
          handle.setValue(
            (next == null ? null : Array.isArray(next) ? next.map(back) : back(next)) as Parameters<
              ComboboxHandle<V>["setValue"]
            >[0],
          ),
        clear: handle.clear,
        focus: handle.focus,
        open: handle.open,
        close: handle.close,
      }),
    };
  });
}
