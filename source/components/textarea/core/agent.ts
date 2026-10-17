/*
 * Textarea's agent contract.
 *
 * Identical to Input but for the element behind it, which is why both go
 * through the same executor.
 *
 * Pure: no React, no DOM. The contract is what this instance will accept, and
 * the validator in shared/core/agent decides everything from it. Build it from
 * props on every render so that a field which has just become read-only stops
 * accepting writes immediately.
 */

import type { FieldContract } from "../../shared/core/agent";

export interface TextareaAgentProps {
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  maxLength?: number;
}

export function textareaContract(props: TextareaAgentProps = {}): FieldContract {
  return {
    component: "Textarea",
    kind: "text",
    operations: ["setValue", "clear", "focus"],
    label: props.label,
    disabled: props.disabled,
    readOnly: props.readOnly,
    required: props.required,
    maxLength: props.maxLength,
  };
}
