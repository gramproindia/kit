"use client";

import { useRef, useState } from "react";
import { DatePicker, toISODate, type DatePickerHandle } from "@/components/date-picker";
import { LOCALES, TODAY, button } from "./_date-picker-fixtures";

export default function DatePickerVariantsWrapper() {
  const [date, setDate] = useState<Date | null>(null);
  const [locale, setLocale] = useState<string>("en-GB");
  const pickerRef = useRef<DatePickerHandle<Date | null>>(null);

  return (
    <div className="flex flex-col gap-4">
      <DatePicker
        label="Delivery date"
        locale={locale}
        value={date}
        onChange={setDate}
        description={date ? `Value: ${toISODate(date)}` : "Nothing selected"}
      />

      <div className="flex flex-wrap items-center gap-2">
        <label
          className="text-xs text-zinc-600 dark:text-zinc-400"
          htmlFor="locale"
        >
          Locale
        </label>
        <select
          id="locale"
          className={button}
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
        >
          {LOCALES.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={button}
          onClick={() => pickerRef.current?.open()}
        >
          Open the small one
        </button>
      </div>

      <DatePicker
        ref={pickerRef}
        size="sm"
        locale={locale}
        placeholder="Small, no typing"
        allowInput={false}
        defaultValue={TODAY}
      />
    </div>
  );
}
