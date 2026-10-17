/*
 * Input's agent contract.
 *
 * Its ref is the <input> element, so the write goes through the element
 * itself, exactly as `clear()` has always done.
 *
 * Pure: no React, no DOM. The contract is what this instance will accept, and
 * the validator in shared/core/agent decides everything from it. Build it from
 * props on every render so that a field which has just become read-only stops
 * accepting writes immediately.
 */

import type { FieldContract } from "../../shared/core/agent";

export interface InputAgentProps {
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  maxLength?: number;
  pattern?: string;
}

export function inputContract(props: InputAgentProps = {}): FieldContract {
  return {
    component: "Input",
    kind: "text",
    operations: ["setValue", "clear", "focus"],
    label: props.label,
    disabled: props.disabled,
    readOnly: props.readOnly,
    required: props.required,
    maxLength: props.maxLength,
    pattern: props.pattern,
  };
}
