import type { ToasterLocaleText } from "./types";

/** Built-in strings, shared by the web and native components. */
export const defaultToasterText: ToasterLocaleText = {
  regionLabel: (hotkey) => `Notifications (${hotkey})`,
  close: "Close notification",
};
