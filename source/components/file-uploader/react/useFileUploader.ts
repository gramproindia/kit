"use client";

// DOM-free, so it lives in hooks/ where the native uploader can reach it too.
export { useFileUploader, type UseFileUploaderResult } from "../hooks/useFileUploader";
