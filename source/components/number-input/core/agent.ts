/*
 * NumberInput's agent contract.
 *
 * `min`, `max` and `step` become policy: a proposal outside them is refused
 * by name rather than silently clamped, so the caller learns which rule it hit.
 *
 * Pure: no React, no DOM. The contract is what this instance will accept, and
 * the validator in shared/core/agent decides everything from it. Build it from
 * props on every render so that a field which has just become read-only stops
 * accepting writes immediately.
 */

import type { FieldContract } from "../../shared/core/agent";

export interface NumberInputAgentProps {
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export function numberInputContract(props: NumberInputAgentProps = {}): FieldContract {
  return {
    component: "NumberInput",
    kind: "number",
    operations: ["setValue", "clear", "focus"],
    label: props.label,
    disabled: props.disabled,
    readOnly: props.readOnly,
    required: props.required,
    min: props.min,
    max: props.max,
    step: props.step,
  };
}
