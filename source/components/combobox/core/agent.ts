/*
 * Combobox's agent contract.
 *
 * The first of the two components whose ref is a handle rather than an
 * element. `open` and `close` join the operation set because it has a list to
 * disclose, and `mode` decides whether the value is one option or several.
 *
 * Pure: no React, no DOM. The contract is what this instance will accept, and
 * the validator in shared/core/agent decides everything from it. Build it from
 * props on every render so that a field which has just become read-only stops
 * accepting writes immediately.
 */

import type { FieldContract } from "../../shared/core/agent";

export interface ComboboxAgentProps {
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  multiple?: boolean;
  max?: number;
  options?: readonly { value: string; label: string; disabled?: boolean }[];
}

export function comboboxContract(props: ComboboxAgentProps = {}): FieldContract {
  return {
    component: props.multiple ? "MultiSelect" : "Select",
    kind: props.multiple ? "multiChoice" : "choice",
    operations: ["setValue", "clear", "focus", "open", "close"],
    label: props.label,
    disabled: props.disabled,
    readOnly: props.readOnly,
    required: props.required,
    options: props.options,
    maxSelected: props.multiple ? props.max : undefined,
  };
}
