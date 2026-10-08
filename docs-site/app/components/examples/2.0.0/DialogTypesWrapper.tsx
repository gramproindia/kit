"use client";

import { useState } from "react";
import { dialog } from "@/components/dialog";
import { button } from "./_overlays-fixtures";

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
    </>
  );
}
