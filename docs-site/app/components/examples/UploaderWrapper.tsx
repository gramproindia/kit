"use client";

import React from "react";
import { FileUploader } from "@/legacy-components/uploader";

export const FileUploaderWrapper = () => {
  const handleFileChange = (files: any) => {
    console.log("Uploaded files:", files);
  };

  return (
    <div className="">
      <FileUploader
        showImagePreview={true}
        multiple={true}
        onChange={handleFileChange}
        startUpload={false}
        fileCount={5}
        inputFileSize={2} // Max size in MB
      />
    </div>
  );
};
