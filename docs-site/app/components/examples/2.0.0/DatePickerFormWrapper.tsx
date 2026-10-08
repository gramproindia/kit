"use client";

import { useState } from "react";
import { DatePicker, DateRangePicker } from "@/components/date-picker";
import { PRESETS, TODAY, button } from "./_date-picker-fixtures";

export default function DatePickerFormWrapper() {
  const [posted, setPosted] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPosted(
          [...data.entries()]
            .map(([key, entry]) => `${key}=${String(entry) || "—"}`)
            .join("  "),
        );
      }}
    >
      <DatePicker
        label="Invoice date"
        name="invoice"
        defaultValue={TODAY}
        required
      />
      <DateRangePicker
        label="Period"
        name="period"
        defaultValue={PRESETS[1].range}
      />
      <div className="flex items-center gap-2">
        <button type="submit" className={button}>
          Submit
        </button>
        <code className="text-xs text-zinc-600 dark:text-zinc-400">
          {posted ?? "not submitted"}
        </code>
      </div>
    </form>
  );
}
