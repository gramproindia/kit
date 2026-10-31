/*
 * DatePicker's agent contract.
 *
 * Dates arrive as ISO yyyy-mm-dd and are checked against `min` and `max`
 * before anything is written. Anything relative — "last Friday", "end of the
 * quarter" — is the adapter's to resolve: this layer refuses what it cannot read
 * rather than guessing, because guessing a date wrong is indistinguishable from
 * being told the wrong date.
 *
 * Pure: no React, no DOM. The contract is what this instance will accept, and
 * the validator in shared/core/agent decides everything from it. Build it from
 * props on every render so that a field which has just become read-only stops
 * accepting writes immediately.
 */

import type { FieldContract } from "../../shared/core/agent";

export interface DatePickerAgentProps {
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** ISO yyyy-mm-dd, or yyyy-mm-ddTHH:mm with `time`. */
  min?: string;
  /** ISO yyyy-mm-dd, or yyyy-mm-ddTHH:mm with `time`. */
  max?: string;
  range?: boolean;
  /** DateTimePicker: min and max are then local yyyy-mm-ddTHH:mm. */
  time?: boolean;
}

export function datePickerContract(props: DatePickerAgentProps = {}): FieldContract {
  return {
    component: props.range ? "DateRangePicker" : props.time ? "DateTimePicker" : "DatePicker",
    kind: props.range ? "dateRange" : props.time ? "dateTime" : "date",
    operations: ["setValue", "clear", "focus", "open", "close"],
    label: props.label,
    disabled: props.disabled,
    readOnly: props.readOnly,
    required: props.required,
    min: props.min,
    max: props.max,
  };
}
