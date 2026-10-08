"use client";

import { createToastApi, createToastStore, Toaster } from "@/components/toaster";
import { button } from "./_toaster-fixtures";

// Its own store, so this example's toasts stay in this example's Toaster. In
// an app you would import the ready-made `toast` instead.
const store = createToastStore();
const toast = createToastApi(store);

export default function ToasterTypesWrapper() {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={button}
        onClick={() =>
          toast("Event created", { description: "Monday, 16 September at 10:00" })
        }
      >
        Default
      </button>
      <button
        type="button"
        className={button}
        onClick={() => toast.success("Settings saved")}
      >
        Success
      </button>
      <button
        type="button"
        className={button}
        onClick={() =>
          toast.error("Payment declined", { description: "The card was refused." })
        }
      >
        Error
      </button>
      <button
        type="button"
        className={button}
        onClick={() =>
          toast.warning("Storage almost full", { description: "92% of 10 GB used" })
        }
      >
        Warning
      </button>
      <button
        type="button"
        className={button}
        onClick={() => toast.info("A new version is available")}
      >
        Info
      </button>
      <button
        type="button"
        className={button}
        onClick={() => toast.loading("Syncing…", { id: "sync" })}
      >
        Loading (stays)
      </button>
      <Toaster store={store} position="bottom-right" />
    </div>
  );
}
