"use client";

import { FileUploader } from "@/components/file-uploader";
import { noFailures } from "./_uploader-fixtures";

export default function FileUploaderValidationWrapper() {
  return (
    <FileUploader
      label="Gallery"
      multiple
      accept="image/*"
      maxSize={2 * 1024 * 1024}
      maxFiles={3}
      autoUpload
      transport={noFailures}
      validate={(file) =>
        file.name.toLowerCase().includes("draft")
          ? `${file.name} looks like a draft`
          : null
      }
      description="Files with “draft” in the name are rejected by a custom rule."
    />
  );
}
