/**
 * A file on a phone: a `uri` the OS hands out, not bytes in memory. This is
 * what document and image pickers return (expo-document-picker's `assets`,
 * expo-image-picker's `assets`, react-native-document-picker), so an adapter is
 * usually one `map`.
 */
export interface NativeFile {
  /** `file://`, `content://` or `ph://` — whatever the picker returned. */
  uri: string;
  name: string;
  /**
   * Bytes. 0 (or missing) when the picker did not say: such a file skips the
   * `maxSize`/`minSize` checks and uploads without a percentage. Reject it in
   * `validate` if you need a size, and always enforce limits on the server.
   */
  size: number;
  /** MIME type, e.g. `image/jpeg`. Empty when unknown. */
  type: string;
  /** For duplicate detection. Default 0. */
  lastModified?: number;
}

/** Opens a picker and returns what was chosen, or nothing when cancelled. */
export type PickFiles = () => Promise<readonly NativeFile[] | null | undefined>;

/**
 * The shape the upload engine works with. The engine is the web's, unchanged;
 * it needs `name`, `size`, `type`, `lastModified` and `slice()`.
 *
 * A native file cannot be sliced without a filesystem library, so `slice`
 * returns the whole file and the native uploader sends one request per file.
 * `{ uri, name, type }` is exactly what React Native's `FormData` sends as a
 * file part, so the web's HTTP transport works as it is.
 */
export interface UploadableNativeFile extends NativeFile {
  lastModified: number;
  /** The picker gave no size; `size` is 0 as a placeholder. Read by the engine. */
  sizeUnknown: boolean;
  slice(): UploadableNativeFile;
}

/** Pickers report a missing size as 0, undefined, null or -1; all mean "unknown". */
const knownSize = (size: unknown): size is number =>
  typeof size === "number" && Number.isFinite(size) && size > 0;

export function toUploadable(file: NativeFile): File {
  const sized = knownSize(file.size);
  const uploadable: UploadableNativeFile = {
    uri: file.uri,
    name: file.name,
    size: sized ? file.size : 0,
    sizeUnknown: !sized,
    type: file.type,
    lastModified: file.lastModified ?? 0,
    slice: () => uploadable,
  };
  // The engine is typed against the DOM's File; this object carries every
  // member it reads. Nothing else ever sees it as a File.
  return uploadable as unknown as File;
}

/** Back from the engine's File to the native file the app gave. */
export function fromUploadable(file: File): NativeFile {
  const { uri, name, size, type, lastModified } = file as unknown as UploadableNativeFile;
  return { uri, name, size, type, lastModified };
}

/** One request per file: native files are not sliced (see `toUploadable`). */
export const NATIVE_CHUNK_SIZE = Number.MAX_SAFE_INTEGER;
