/*
 * Checkbox's agent contract.
 *
 * A boolean field, so the write sets `checked` rather than `value`. The
 * indeterminate state is not settable by an agent: it means "some of the group",
 * which is a conclusion about other checkboxes rather than a value of this one.
 *
 * Pure: no React, no DOM. The contract is what this instance will accept, and
 * the validator in shared/core/agent decides everything from it. Build it from
 * props on every render so that a field which has just become read-only stops
 * accepting writes immediately.
 */

import type { FieldContract } from "../../shared/core/agent";

export interface CheckboxAgentProps {
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
}

export function checkboxContract(props: CheckboxAgentProps = {}): FieldContract {
  return {
    component: "Checkbox",
    kind: "boolean",
    operations: ["setValue", "clear", "focus"],
    label: props.label,
    disabled: props.disabled,
    readOnly: props.readOnly,
    required: props.required,
  };
}
