"use client";

import { useState } from "react";
import { FileUploader } from "@/components/file-uploader";
import { button } from "./_uploader-fixtures";

export default function FileUploaderFormWrapper() {
  const [posted, setPosted] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const files = new FormData(event.currentTarget).getAll(
          "attachments",
        ) as File[];
        setPosted(
          files.length > 0
            ? files.map((file) => `${file.name} (${file.size} B)`).join(", ")
            : "no files",
        );
      }}
    >
      <FileUploader
        label="Attachments"
        name="attachments"
        multiple
        preview={false}
      />
      <div className="flex items-center gap-2">
        <button type="submit" className={button}>
          Submit
        </button>
        <span className="break-all text-xs text-zinc-600 dark:text-zinc-400">
          {posted ?? "not submitted"}
        </span>
      </div>
    </form>
  );
}
