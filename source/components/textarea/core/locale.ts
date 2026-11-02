import type { TextareaLocaleText } from "./types";

/** Built-in strings. Shared by the web and native components, so they never drift. */
export const defaultTextareaText: TextareaLocaleText = {
  characterCount: (count, max) => (max === undefined ? count : `${count} / ${max}`),
};
