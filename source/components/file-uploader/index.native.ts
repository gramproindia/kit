// React Native entry. Metro picks this over index.ts on iOS and Android.
export { FileUploader } from "./native/FileUploader";
export type { FileUploaderHandle, FileUploaderProps, UploaderSlot } from "./native/FileUploader";
export { fromUploadable, NATIVE_CHUNK_SIZE, toUploadable } from "./native/file";
export type { NativeFile, PickFiles, UploadableNativeFile } from "./native/file";
export { useFileUploader } from "./hooks/useFileUploader";
export type { UseFileUploaderResult } from "./hooks/useFileUploader";
export * from "./core";
