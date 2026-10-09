"use client";

import { useState } from "react";
import { createDialogApi, createDialogStore, DialogHost } from "@/components/dialog";
import { button } from "./_overlays-fixtures";

// Its own store and host: several dialog examples share this page, and a
// shared host would show one example's dialogs inside another. In an app
// there is one host and you import the ready-made `dialog`.
const store = createDialogStore();
const dialog = createDialogApi(store);

export default function DialogTypesWrapper() {
  const [result, setResult] = useState("—");

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={button}
          onClick={async () => {
            await dialog.alert({
              title: "Backup complete",
              description: "2,431 files copied.",
              intent: "success",
            });
            setResult("alert closed");
          }}
        >
          Alert
        </button>
        <button
          type="button"
          className={button}
          onClick={async () =>
            setResult(`confirm → ${await dialog.confirm("Leave this page?")}`)
          }
        >
          Confirm
        </button>
        <button
          type="button"
          className={button}
          onClick={async () => {
            const email = await dialog.prompt({
              title: "Invite a teammate",
              inputLabel: "Email",
              inputType: "email",
              placeholder: "name@company.com",
              required: true,
              validate: (value) =>
                /^\S+@\S+\.\S+$/.test(value) ? null : "Enter a valid email",
            });
            setResult(`prompt → ${JSON.stringify(email)}`);
          }}
        >
          Prompt
        </button>
        <button
          type="button"
          className={button}
          onClick={async () => {
            const answers = await Promise.all([
              dialog.confirm("First question?"),
              dialog.confirm("Second question?"),
            ]);
            setResult(`queued → ${answers.join(", ")}`);
          }}
        >
          Two in a row
        </button>
      </div>
      <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
        Result: {result}
      </p>
      <DialogHost store={store} />
    </>
  );
}
