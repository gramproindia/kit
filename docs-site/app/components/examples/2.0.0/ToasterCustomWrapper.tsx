"use client";

import { createToastApi, createToastStore, Toaster } from "@/components/toaster";
import { button } from "./_toaster-fixtures";

// Its own store, so this example's toasts stay in this example's Toaster. In
// an app you would import the ready-made `toast` instead.
const store = createToastStore();
const toast = createToastApi(store);

export default function ToasterCustomWrapper() {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={button}
        onClick={() =>
          toast.custom(
            ({ dismiss }) => (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-zinc-200 text-sm font-semibold dark:bg-zinc-800">
                  AK
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">Aarav Kim</div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    Invited you to “Q3 planning”
                  </div>
                </div>
                <button type="button" className={button} onClick={dismiss}>
                  View
                </button>
              </div>
            ),
            { duration: 8000 },
          )
        }
      >
        Custom card
      </button>
      <button
        type="button"
        className={button}
        onClick={() => toast("Party time", { icon: <span aria-hidden="true">🎉</span> })}
      >
        Custom icon
      </button>
      <Toaster store={store} position="bottom-right" />
    </div>
  );
}
