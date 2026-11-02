import { useState, useSyncExternalStore } from "react";
import { dialogStore } from "../core/dialog";
import type { DialogStore } from "../core/store";
import type { DialogLocaleText, DialogRequest } from "../core/types";
import { Dialog, type DialogProps } from "./Dialog";

export interface DialogHostProps {
  /** A store from `createDialogStore()`. Defaults to the one behind `dialog`. */
  store?: DialogStore;
  /** Applied to every dialog this host shows. */
  style?: DialogProps["style"];
  styles?: DialogProps["styles"];
  localeText?: Partial<DialogLocaleText>;
}

/** Mount once, inside `<KitProvider>`. Shows the dialogs requested through `dialog.alert/confirm/prompt`, one at a time. */
export function DialogHost({ store = dialogStore, ...shared }: DialogHostProps) {
  const { queue } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const current = queue[0];

  // Keep the last dialog rendered while it animates out.
  const [shown, setShown] = useState<DialogRequest | undefined>(current);
  if (current && current !== shown) setShown(current);

  if (!shown) return null;

  return (
    <Dialog
      key={shown.id}
      {...shown.options}
      {...shared}
      open={shown === current}
      kind={shown.kind}
      onConfirm={shown.options.onConfirm as DialogProps["onConfirm"]}
      onClose={(action, value) => store.resolve(shown.id, action === "confirm", value)}
      onExited={() => {
        if (store.getSnapshot().queue.length === 0) setShown(undefined);
      }}
    />
  );
}
