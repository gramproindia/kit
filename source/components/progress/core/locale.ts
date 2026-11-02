import type { ProgressLocaleText } from "./types";

/** Built-in strings. Shared by the web and native progress, so they never drift. */
export const defaultProgressText: ProgressLocaleText = {
  label: "Progress",
  valueText: (percent: number) => `${percent}%`,
  working: "Working\u2026",
};
