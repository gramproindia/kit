"use client";

/*
 * Fixtures shared by the uploader examples, kept out of them so each
 * one shows only the thing it demonstrates. Ported from the playground's
 * UploaderDemo, where these cases were first exercised.
 */

import { UploadHttpError, type ExistingFile, type Transport } from "@/components/file-uploader";

export const button =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700";

/**
 * Stands in for an upload server so the demo runs without one. Each chunk
 * reports progress over ~400 ms and answers like the Go chunk-uploader;
 * `failRate` makes chunks fail with a 503, which the uploader retries.
 */

export function simulatedServer(failRate: () => number): Transport {
  return (request) =>
    new Promise((resolve, reject) => {
      let step = 0;
      const timer = setInterval(() => {
        step += 1;
        request.onProgress((request.chunk.size * step) / 8);
        if (step < 8) return;
        clearInterval(timer);
        if (Math.random() < failRate()) {
          reject(new UploadHttpError(503, { message: "Service unavailable" }));
          return;
        }
        const last = request.index === request.total - 1;
        resolve(
          last
            ? {
                status: "complete",
                metadata: {
                  storedName: `${request.uploadId}-${request.file.name}`,
                },
              }
            : { status: "chunk_received", chunkIndex: request.index },
        );
      }, 50);
      request.signal.addEventListener(
        "abort",
        () => {
          clearInterval(timer);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true },
      );
    });
}

export const SAMPLE_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#60a5fa"/><circle cx="28" cy="30" r="9" fill="#fff"/><path d="M0 70 30 44l18 16 12-10 20 20Z" fill="#1d4ed8"/></svg>',
)}`;

export const SAMPLE_PDF = URL.createObjectURL(
  new Blob(["%PDF-1.4 sample"], { type: "application/pdf" }),
);

export const INITIAL_EXISTING: ExistingFile[] = [
  {
    id: "doc-101",
    name: "site-photo.svg",
    size: 412,
    type: "image/svg+xml",
    url: SAMPLE_IMAGE,
  },
  {
    id: "doc-102",
    name: "contract-signed.pdf",
    size: 248_000,
    url: SAMPLE_PDF,
  },
];

export const noFailures = simulatedServer(() => 0);
