"use client";

import { useState } from "react";
import { addDays, DatePicker } from "@/components/date-picker";
import { TODAY } from "./_date-picker-fixtures";

export default function DatePickerLimitsWrapper() {
  const [date, setDate] = useState<Date | null>(null);
  const min = addDays(TODAY, -30);
  const max = addDays(TODAY, 60);

  return (
    <div className="flex flex-col gap-4">
      <DatePicker
        label="Appointment"
        value={date}
        onChange={setDate}
        min={min}
        max={max}
        weekStartsOn={0}
        showWeekNumbers
        isDateDisabled={(day) => day.getDay() === 0 || day.getDay() === 6}
        error={
          date && date.getDay() === 5
            ? "Fridays fill up fast — double-check."
            : undefined
        }
        description="Weekends are blocked; the arrows stop at the limits."
      />
      <DatePicker label="Disabled" defaultValue={TODAY} disabled />
      <DatePicker label="Read-only" defaultValue={TODAY} readOnly />
    </div>
  );
}
