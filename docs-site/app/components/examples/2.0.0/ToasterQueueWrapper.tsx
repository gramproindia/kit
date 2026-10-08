"use client";

import { useState } from "react";
import {
  createToastApi,
  createToastStore,
  Toaster,
  type ToastPosition,
} from "@/components/toaster";
import { button } from "./_toaster-fixtures";

// Its own store, so this example's toasts stay in this example's Toaster. In
// an app you would import the ready-made `toast` instead.
const store = createToastStore();
const toast = createToastApi(store);

const POSITIONS: ToastPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

export default function ToasterQueueWrapper() {
  const [position, setPosition] = useState<ToastPosition>("top-right");
  const [limit, setLimit] = useState(3);
  const [closeButton, setCloseButton] = useState(true);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label
          className="text-xs text-zinc-600 dark:text-zinc-400"
          htmlFor="toast-position"
        >
          Position
        </label>
        <select
          id="toast-position"
          className={button}
          value={position}
          onChange={(event) => setPosition(event.target.value as ToastPosition)}
        >
          {POSITIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <label
          className="text-xs text-zinc-600 dark:text-zinc-400"
          htmlFor="toast-limit"
        >
          Limit
        </label>
        <select
          id="toast-limit"
          className={button}
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value))}
        >
          {[1, 3, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={closeButton}
            onChange={(event) => setCloseButton(event.target.checked)}
          />
          Close button
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={button}
          onClick={() => {
            for (let i = 1; i <= 6; i++)
              toast(`Notification ${i}`, { description: "Queued" });
          }}
        >
          Show six
        </button>
        <button
          type="button"
          className={button}
          onClick={() => toast("Stays until you close it", { duration: Infinity })}
        >
          Sticky
        </button>
        <button type="button" className={button} onClick={() => toast.dismiss()}>
          Dismiss all
        </button>
      </div>
      <Toaster
        store={store}
        position={position}
        limit={limit}
        closeButton={closeButton}
      />
    </div>
  );
}
