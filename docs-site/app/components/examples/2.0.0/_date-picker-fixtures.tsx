"use client";

/*
 * Fixtures shared by the date-picker examples, kept out of them so each
 * one shows only the thing it demonstrates. Ported from the playground's
 * DatePickerDemo, where these cases were first exercised.
 */

import { addDays, startOfMonth, type DatePreset } from "@/components/date-picker";

export const button =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700";

export const TODAY = new Date();

export const PRESETS: DatePreset[] = [
  { label: "Today", range: { start: TODAY, end: TODAY } },
  { label: "Last 7 days", range: { start: addDays(TODAY, -6), end: TODAY } },
  { label: "Last 30 days", range: { start: addDays(TODAY, -29), end: TODAY } },
  { label: "This month", range: { start: startOfMonth(TODAY), end: TODAY } },
];

export const LOCALES = ["en-GB", "en-US", "de-DE", "ja-JP"] as const;
