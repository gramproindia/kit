"use client";

import { useRef, useState } from "react";
import { FileUploader, type FileUploaderHandle } from "@/components/file-uploader";
import { INITIAL_EXISTING, button, noFailures } from "./_uploader-fixtures";

export default function FileUploaderEditWrapper() {
  const [existing, setExisting] = useState(INITIAL_EXISTING);
  const [saved, setSaved] = useState<string | null>(null);
  const uploader = useRef<FileUploaderHandle>(null);

  return (
    <div className="flex flex-col gap-3">
      <FileUploader
        ref={uploader}
        label="Contract documents"
        multiple
        size="sm"
        accept=".pdf,image/*"
        transport={noFailures}
        existingFiles={existing}
        onRemoveExisting={(file) =>
          setExisting((current) =>
            current.filter((item) => item.id !== file.id),
          )
        }
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={button}
          onClick={async () => {
            const items = await uploader.current?.upload();
            setSaved(
              `Saved: ${existing.length} kept, ${items?.filter((item) => item.status === "success").length ?? 0} uploaded`,
            );
          }}
        >
          Save
        </button>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          {saved}
        </span>
      </div>
    </div>
  );
}
