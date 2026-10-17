/*
 * RadioGroup's agent contract.
 *
 * A choice over the group's own options, so an unknown value is refused by
 * the reference layer with the nearest real option suggested.
 *
 * Pure: no React, no DOM. The contract is what this instance will accept, and
 * the validator in shared/core/agent decides everything from it. Build it from
 * props on every render so that a field which has just become read-only stops
 * accepting writes immediately.
 */

import type { FieldContract } from "../../shared/core/agent";

export interface RadioGroupAgentProps {
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  options?: readonly { value: string; label: string; disabled?: boolean }[];
}

export function radioGroupContract(props: RadioGroupAgentProps = {}): FieldContract {
  return {
    component: "RadioGroup",
    kind: "choice",
    operations: ["setValue", "clear", "focus"],
    label: props.label,
    disabled: props.disabled,
    readOnly: props.readOnly,
    required: props.required,
    options: props.options,
  };
}
