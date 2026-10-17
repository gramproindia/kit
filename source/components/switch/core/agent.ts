/*
 * Switch's agent contract.
 *
 * A Switch applies its change as it is flipped, so a write here is the
 * setting taking effect — not a draft the user will later submit.
 *
 * Pure: no React, no DOM. The contract is what this instance will accept, and
 * the validator in shared/core/agent decides everything from it. Build it from
 * props on every render so that a field which has just become read-only stops
 * accepting writes immediately.
 */

import type { FieldContract } from "../../shared/core/agent";

export interface SwitchAgentProps {
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export function switchContract(props: SwitchAgentProps = {}): FieldContract {
  return {
    component: "Switch",
    kind: "boolean",
    // No clear: a switch is on or off, and "neither" is not one of its states.
    operations: ["setValue", "focus"],
    label: props.label,
    disabled: props.disabled,
    readOnly: props.readOnly,
  };
}
