"use client";

import { labelText, useAgentSurfaceField } from "../../shared/react/agentSurfaceContext";
import { startOfDay, toDate, toISODate } from "../core/calendar";
import { toDateTime, toISODateTime } from "../core/time";
import type { DateInput } from "../core/types";

interface DateSurfaceParams {
  component: "DatePicker" | "DateRangePicker" | "DateTimePicker";
  label: unknown;
  name?: string;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  min: Date | null;
  max: Date | null;
  isDateDisabled?: (date: Date) => boolean;
  handle: {
    setValue(value: unknown): void;
    clear(): void;
    focus(): void;
    open(): void;
    close(): void;
  };
}

/**
 * Inside an <AgentSurface>, offer a date, date-time or range field with its bounds.
 *
 * `min` and `max` go in the contract, where the validator refuses an
 * out-of-range day with the reason. `isDateDisabled` is a function and cannot
 * be described, so it is checked at the write instead: a disabled day is
 * refused there rather than quietly chosen.
 */
export function useDateSurface(params: DateSurfaceParams): void {
  useAgentSurfaceField(() => {
    const { component, handle, isDateDisabled } = params;
    const timed = component === "DateTimePicker";
    const refuseDisabled = (value: DateInput | null | undefined) => {
      const moment = timed ? toDateTime(value ?? null) : null;
      const date = timed ? (moment ? startOfDay(moment) : null) : toDate(value ?? null);
      if (date && isDateDisabled?.(date)) throw new Error(`${toISODate(date)} is not available in this field.`);
    };
    return {
      contract: {
        component,
        kind: component === "DateRangePicker" ? "dateRange" : timed ? "dateTime" : "date",
        label: labelText(params.label, params.name),
        disabled: params.disabled,
        readOnly: params.readOnly,
        required: params.required,
        // A date-time field's bounds are moments, so they go in to the second.
        ...(params.min ? { min: timed ? toISODateTime(params.min, true) : toISODate(params.min) } : {}),
        ...(params.max ? { max: timed ? toISODateTime(params.max, true) : toISODate(params.max) } : {}),
        operations: ["setValue", "clear", "focus", "open", "close"],
      },
      target: () => ({
        ...handle,
        setValue: (next) => {
          if (next && typeof next === "object") {
            const range = next as { start?: DateInput; end?: DateInput };
            refuseDisabled(range.start);
            refuseDisabled(range.end);
          } else {
            refuseDisabled(next as DateInput);
          }
          handle.setValue(next);
        },
      }),
    };
  });
}
