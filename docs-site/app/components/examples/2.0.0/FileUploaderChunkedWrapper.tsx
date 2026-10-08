"use client";

import { useMemo, useState } from "react";
import { FileUploader, readFileId } from "@/components/file-uploader";
import { simulatedServer } from "./_uploader-fixtures";

export default function FileUploaderChunkedWrapper() {
  const [flaky, setFlaky] = useState(false);
  const [preview, setPreview] = useState(true);
  // Chunks already in flight keep the transport they started with.
  const transport = useMemo(
    () => simulatedServer(() => (flaky ? 0.35 : 0)),
    [flaky],
  );
  const [results, setResults] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={flaky}
            onChange={(event) => setFlaky(event.target.checked)}
          />
          Flaky server
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={preview}
            onChange={(event) => setPreview(event.target.checked)}
          />
          Image previews
        </label>
      </div>
      <FileUploader
        label="Project files"
        multiple
        maxFiles={8}
        chunkSize={256 * 1024}
        concurrency={2}
        retries={2}
        retryDelay={300}
        preview={preview}
        transport={transport}
        onUploadComplete={(items) =>
          setResults(
            items
              .filter((item) => item.status === "success")
              .map((item) => readFileId(item.response) ?? item.id),
          )
        }
      />
      <p className="break-all text-xs text-zinc-600 dark:text-zinc-400">
        Last run stored:{" "}
        {results.length > 0 ? results.join(", ") : "nothing yet"}
      </p>
    </div>
  );
}
