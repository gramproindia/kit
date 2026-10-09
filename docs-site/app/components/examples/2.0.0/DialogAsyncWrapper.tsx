"use client";

import { useRef, useState } from "react";
import { createDialogApi, createDialogStore, DialogHost } from "@/components/dialog";
import { button, wait } from "./_overlays-fixtures";

// Its own store and host: several dialog examples share this page, and a
// shared host would show one example's dialogs inside another. In an app
// there is one host and you import the ready-made `dialog`.
const store = createDialogStore();
const dialog = createDialogApi(store);

export default function DialogAsyncWrapper() {
  // A stand-in for a flaky server: every second attempt fails, which is what
  // puts the error and the retry on screen.
  const attempts = useRef(0);
  const [log, setLog] = useState<string[]>([]);
  const add = (line: string) =>
    setLog((current) => [line, ...current].slice(0, 4));

  return (
    <>
      <button
        type="button"
        className={button}
        onClick={async () => {
          const deleted = await dialog.confirm({
            title: "Delete project “Atlas”?",
            description: "All 18 boards and their history will be removed.",
            intent: "danger",
            confirmLabel: "Delete project",
            onConfirm: async () => {
              await wait(1000);
              attempts.current += 1;
              if (attempts.current % 2 === 0)
                throw new Error("The server didn't respond. Try again.");
            },
          });
          add(deleted ? "Project deleted" : "Kept the project");
        }}
      >
        Delete project
      </button>
      <ul className="mt-3 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {log.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
      <DialogHost store={store} />
    </>
  );
}
