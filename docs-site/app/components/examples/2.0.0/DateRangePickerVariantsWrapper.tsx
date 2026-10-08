"use client";

import { useState } from "react";
import { DateRangePicker, toISODate, type DateRange } from "@/components/date-picker";
import { PRESETS } from "./_date-picker-fixtures";

export default function DateRangePickerVariantsWrapper() {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });

  return (
    <div className="flex flex-col gap-4">
      <DateRangePicker
        label="Reporting period"
        value={range}
        onChange={setRange}
        presets={PRESETS}
        description={
          range.start && range.end
            ? `${toISODate(range.start)} → ${toISODate(range.end)}`
            : range.start
              ? "Now pick the end date"
              : "Nothing selected"
        }
      />
      <DateRangePicker
        label="One month at a time"
        numberOfMonths={1}
        size="sm"
      />
    </div>
  );
}
