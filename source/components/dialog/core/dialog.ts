import { createDialogApi } from "./api";
import { createDialogStore } from "./store";

/** The store behind `dialog`, and behind any `<DialogHost />` without a `store` prop. */
export const dialogStore = createDialogStore();

/** A screen exists: a browser document, or a React Native app. */
const canShow = () =>
  typeof document !== "undefined" ||
  (globalThis as { navigator?: { product?: string } }).navigator?.product === "ReactNative";

/**
 * Ask the user something from anywhere and `await` the answer. Where nobody
 * can see a dialog (a server render), calls settle at once as a cancel.
 */
export const dialog = createDialogApi(dialogStore, canShow);
