import type { ComboboxLocaleText } from "./types";

/** Built-in strings, shared by the web and native comboboxes so they never drift. */
export const defaultComboboxText: ComboboxLocaleText = {
  searchPlaceholder: "Search…",
  noResults: "No options found",
  loading: "Loading…",
  loadMore: "Load more",
  clear: "Clear",
  clearAll: "Clear all",
  selectAll: "Select all",
  done: "Done",
  createOption: (label) => `Create “${label}”`,
  selectedCount: (count) => `${count} selected`,
  moreCount: (count) => `+${count} more`,
  removeOption: (label) => `Remove ${label}`,
  maxReached: (max) => `Maximum ${max} selected`,
};
