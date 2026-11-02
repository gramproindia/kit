import type { MenuLocaleText } from "./types";

/** Built-in strings. Shared by the web and native menus, so they never drift. */
export const defaultMenuText: MenuLocaleText = {
  label: "Menu",
  submenu: (label) => `${label} submenu`,
  back: "Back",
};
