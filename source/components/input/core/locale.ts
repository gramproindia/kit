import type { InputLocaleText } from "./types";

/** Built-in strings. Shared by the web and native components, so they never drift. */
export const defaultInputText: InputLocaleText = {
  clear: "Clear",
  showPassword: "Show password",
  hidePassword: "Hide password",
  characterCount: (count, max) => (max === undefined ? count : `${count} / ${max}`),
  otpLabel: "Verification code",
};
