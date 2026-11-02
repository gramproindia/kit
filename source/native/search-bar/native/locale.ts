export interface SearchBarLocaleText {
  /** Placeholder and the field's spoken name. */
  placeholder: string;
  /** The button that clears the text. */
  clear: string;
  /** The text button that cancels the search. */
  cancel: string;
  /** Announced while results load. */
  loading: string;
}

export const defaultSearchBarText: SearchBarLocaleText = {
  placeholder: "Search",
  clear: "Clear search",
  cancel: "Cancel",
  loading: "Searching",
};
