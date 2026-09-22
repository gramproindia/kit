"use client";

import { useState } from "react";
import { DatePicker, toISODate } from "@/components/date-picker";

// Stable across renders, so the calendar is not rebuilt on every keystroke.
const isWeekend = (day: Date) => day.getDay() === 0 || day.getDay() === 6;
const today = new Date();
const inDays = (days: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);

/** Live example used in the DatePicker documentation. */
export function DatePickerWrapper() {
  const [date, setDate] = useState<Date | null>(null);
  const [delivery, setDelivery] = useState<Date | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 380 }}>
      <DatePicker
        label="Any date"
        value={date}
        onChange={setDate}
        clearable
        description="Type a date or pick one. Try “12 Mar 2026” or “3/4/2026”."
      />

      {/* Limits and blocked days: the next 60 days, weekdays only. */}
      <DatePicker
        label="Delivery date"
        value={delivery}
        onChange={setDelivery}
        min={today}
        max={inDays(60)}
        isDateDisabled={isWeekend}
        clearable
        error={delivery && isWeekend(delivery) ? "We only deliver on weekdays." : undefined}
        description="Weekends are blocked, and only the next 60 days can be chosen."
      />

      <code style={{ fontSize: 12, opacity: 0.7 }}>
        any: {date ? toISODate(date) : "null"} · delivery: {delivery ? toISODate(delivery) : "null"}
      </code>
    </div>
  );
}

export default DatePickerWrapper;
