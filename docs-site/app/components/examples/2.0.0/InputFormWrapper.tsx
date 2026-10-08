"use client";

import { useState } from "react";
import { Input, OtpInput } from "@/components/input";
import { Textarea } from "@/components/textarea";
import { button } from "./_fields-fixtures";

export default function InputFormWrapper() {
  const [posted, setPosted] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setPosted(
          JSON.stringify(
            Object.fromEntries(new FormData(event.currentTarget)),
          ),
        );
      }}
    >
      <Input label="Company" name="company" required />
      <OtpInput label="Access code" name="code" length={4} required />
      <Textarea label="Message" name="message" autoResize minRows={2} />
      <div className="flex items-center gap-2">
        <button type="submit" className={button}>
          Submit
        </button>
        <code className="break-all text-xs text-zinc-600 dark:text-zinc-400">
          {posted ?? "not submitted"}
        </code>
      </div>
    </form>
  );
}
