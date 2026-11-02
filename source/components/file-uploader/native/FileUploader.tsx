import { memo, useEffect, useImperativeHandle, useMemo, useState, type ReactNode, type Ref } from "react";
import {
  AccessibilityInfo,
  Image,
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { CloseGlyph } from "../../shared/native/glyphs";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { alpha } from "../../shared/native/theme";
import { fileKind, formatBytes } from "../core/format";
import { defaultUploaderText } from "../core/locale";
import { summarize, type AddResult, type UploaderStore } from "../core/store";
import { createHttpTransport, type HttpTransportOptions } from "../core/transport";
import type {
  ExistingFile,
  FileRejection,
  Transport,
  UploaderLocaleText,
  UploaderSize,
  UploadItem,
} from "../core/types";
import { useFileUploader } from "../hooks/useFileUploader";
import { fromUploadable, NATIVE_CHUNK_SIZE, toUploadable, type NativeFile, type PickFiles } from "./file";
import { AlertGlyph, KindLabel, PauseGlyph, PlayGlyph, RetryGlyph, UploadGlyph } from "./icons";

export type UploaderSlot =
  | "root"
  | "label"
  | "dropzone"
  | "rejections"
  | "list"
  | "item"
  | "thumb"
  | "progress"
  | "actions"
  | "footer";

export interface FileUploaderHandle {
  /** Opens the picker given as `pick`. */
  open(): Promise<void>;
  /** Adds files from code, with the same validation as a pick. */
  addFiles(files: readonly NativeFile[]): AddResult;
  /** Uploads every file not uploaded yet. Resolves when they have all stopped. */
  upload(): Promise<UploadItem[]>;
  pause(id?: string): void;
  cancel(id?: string): void;
  clear(): void;
  getFiles(): NativeFile[];
  getItems(): readonly UploadItem[];
}

export interface FileUploaderProps {
  /**
   * Opens a document or image picker and resolves with what was chosen.
   * Kit takes no picker dependency: pass expo-document-picker,
   * expo-image-picker, or anything that returns `{ uri, name, size, type }`.
   */
  pick?: PickFiles;

  /* ----------------------------------------------------------- selection */
  /** Several files. When false, a new file replaces the current one. Default false. */
  multiple?: boolean;
  /** Same syntax as `<input accept>`: `.pdf`, `image/*`, `application/json`. */
  accept?: string;
  maxFiles?: number;
  /** Bytes per file. */
  maxSize?: number;
  /** Bytes per file. */
  minSize?: number;
  /** Return a message to reject a file. */
  validate?(file: NativeFile): string | null | undefined;
  allowDuplicates?: boolean;

  /* ------------------------------------------------------------- upload */
  /**
   * Where files are POSTed, one multipart request per file with the same
   * fields as the web's chunked upload (as a single chunk). Without
   * `endpoint` or `transport`, files are only selected.
   */
  endpoint?: HttpTransportOptions["endpoint"];
  method?: HttpTransportOptions["method"];
  headers?: HttpTransportOptions["headers"];
  withCredentials?: boolean;
  params?: HttpTransportOptions["params"];
  fieldNames?: HttpTransportOptions["fieldNames"];
  parseResponse?: HttpTransportOptions["parseResponse"];
  /**
   * Replaces the built-in HTTP transport, e.g. for presigned URLs or an SDK.
   * `request.file` and `request.chunk` are the whole file, with its `uri`
   * (see `fromUploadable`).
   */
  transport?: Transport;
  /** Files uploading at once. Default 3. */
  concurrency?: number;
  /** Extra attempts per file. Default 3. */
  retries?: number;
  /** First retry delay in ms, doubled each time. Default 1000. */
  retryDelay?: number;
  /** Upload as soon as files are added. Default false. */
  autoUpload?: boolean;

  /* ------------------------------------------------------------ display */
  /** Thumbnails for images. Default true. */
  preview?: boolean;
  existingFiles?: readonly ExistingFile[];
  onRemoveExisting?(file: ExistingFile): void;
  /** Show remove buttons. Default true. */
  removable?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  /** Message below the picker; also marks it invalid. */
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Default `md`. */
  size?: UploaderSize;
  /** For sizes and percentages. */
  locale?: string;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<Record<UploaderSlot, StyleProp<ViewStyle>>>;
  localeText?: Partial<UploaderLocaleText>;

  /* ------------------------------------------------------------- events */
  onChange?(files: NativeFile[]): void;
  onRejected?(rejections: FileRejection[]): void;
  onFileSuccess?(item: UploadItem): void;
  onFileError?(item: UploadItem, error: unknown): void;
  onUploadComplete?(items: UploadItem[]): void;

  ref?: Ref<FileUploaderHandle>;
}

const PAD: Record<UploaderSize, number> = { sm: 14, md: 20, lg: 28 };

const themed = createThemedStyles((t) => ({
  root: { gap: 8 },
  label: { color: t.fg, fontSize: t.fontSize - 1, fontWeight: "600" },
  required: { color: t.danger },
  dropzone: {
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: t.radius,
    minHeight: t.touchTarget,
  },
  dropText: { color: t.fg, fontSize: t.fontSize, textAlign: "center" },
  browse: { color: t.accent, fontWeight: "600" },
  hint: { color: t.muted, fontSize: t.fontSize - 2, textAlign: "center" },
  description: { color: t.muted, fontSize: t.fontSize - 2 },
  error: { color: t.danger, fontSize: t.fontSize - 2 },
  rejections: { gap: 6 },
  rejection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 10,
    borderRadius: t.radius,
    backgroundColor: alpha(t.danger, 0.08),
  },
  rejectionText: { flex: 1, color: t.danger, fontSize: t.fontSize - 2 },
  list: { gap: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: t.radius,
    backgroundColor: t.bg,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: t.radius - 2,
    backgroundColor: t.subtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  body: { flex: 1, minWidth: 0, gap: 2 },
  name: { color: t.fg, fontSize: t.fontSize - 1, fontWeight: "500" },
  meta: { color: t.muted, fontSize: t.fontSize - 3, fontVariant: ["tabular-nums"] },
  itemError: { color: t.danger, fontSize: t.fontSize - 3 },
  track: { height: 4, borderRadius: 2, backgroundColor: t.subtle, overflow: "hidden", marginTop: 4 },
  bar: { height: 4, borderRadius: 2 },
  actions: { flexDirection: "row", alignItems: "center" },
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  footer: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  footerText: { color: t.muted, fontSize: t.fontSize - 2, fontVariant: ["tabular-nums"] },
  button: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: t.radius,
    borderWidth: 1,
    borderColor: t.border,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: t.fg, fontSize: t.fontSize - 1, fontWeight: "600" },
}));

const percentFormats = new Map<string, Intl.NumberFormat>();
function formatPercent(value: number, locale?: string) {
  const key = locale ?? "";
  let format = percentFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
    percentFormats.set(key, format);
  }
  return format.format(value);
}

/** `.pdf, image/*` → `PDF, image/*` for the hint line. */
const describeAccept = (accept: string) =>
  accept
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => (token.startsWith(".") ? token.slice(1).toUpperCase() : token))
    .join(", ");

function IconButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  onPress(): void;
  children: ReactNode;
}) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  return (
    <Pressable
      role="button"
      aria-label={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [s.iconButton, pressed && { backgroundColor: tokens.hover }, disabled && { opacity: 0.4 }]}
    >
      {children}
    </Pressable>
  );
}

function ProgressBar({ value, color, label }: { value: number; color: string; label?: string }) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  return (
    <View
      style={s.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
    >
      <View style={[s.bar, { width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

interface RowProps {
  preview: boolean;
  removable: boolean;
  disabled: boolean;
  locale?: string;
  text: UploaderLocaleText;
  styles?: Partial<Record<UploaderSlot, StyleProp<ViewStyle>>>;
}

/** One selected file. Memoized: a progress tick re-renders only its own row. */
const FileRow = memo(function FileRow({
  item,
  store,
  canUpload,
  preview,
  removable,
  disabled,
  locale,
  text,
  styles: slots,
}: RowProps & { item: UploadItem; store: UploaderStore; canUpload: boolean }) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const file = fromUploadable(item.file);
  const { status } = item;
  const kind = fileKind(file);
  const name = file.name;
  const [broken, setBroken] = useState(false);

  const percent = formatPercent(item.progress, locale);
  const size = formatBytes(file.size, locale);
  const label: Record<UploadItem["status"], string | null> = {
    idle: null,
    queued: text.queued,
    uploading: null,
    paused: `${text.paused} · ${percent}`,
    success: text.uploaded,
    error: text.failed,
    canceled: text.canceled,
  };
  const meta =
    status === "uploading"
      ? text.progress(formatBytes(item.uploadedBytes, locale), size, percent)
      : [size, label[status]].filter(Boolean).join(" · ");
  const showProgress = status === "uploading" || status === "paused" || (status === "error" && item.progress > 0);
  const inFlight = status === "uploading" || status === "queued";
  const barColor = status === "error" ? tokens.danger : status === "paused" ? tokens.warning : tokens.accent;

  return (
    <View style={[s.item, slots?.item]}>
      <View style={[s.thumb, slots?.thumb]} aria-hidden>
        <KindLabel kind={kind} color={tokens.muted} />
        {preview && kind === "image" && !broken && (
          // Formats the device cannot draw fall back to the label underneath.
          <Image source={{ uri: file.uri }} style={s.thumbImage} onError={() => setBroken(true)} />
        )}
      </View>

      <View style={s.body}>
        <Text style={s.name} numberOfLines={1} ellipsizeMode="middle">
          {name}
        </Text>
        <Text style={[s.meta, status === "success" && { color: tokens.success }]}>{meta}</Text>
        {status === "error" && item.error ? <Text style={s.itemError}>{item.error}</Text> : null}
        {showProgress && (
          <View style={slots?.progress}>
            <ProgressBar value={item.progress} color={barColor} label={name} />
          </View>
        )}
      </View>

      <View style={[s.actions, slots?.actions]}>
        {canUpload && status === "uploading" && (
          <IconButton label={text.pause(name)} disabled={disabled} onPress={() => store.pause(item.id)}>
            <PauseGlyph color={tokens.fg} />
          </IconButton>
        )}
        {canUpload && status === "paused" && (
          <IconButton label={text.resume(name)} disabled={disabled} onPress={() => void store.upload([item.id])}>
            <PlayGlyph color={tokens.fg} />
          </IconButton>
        )}
        {canUpload && (status === "error" || status === "canceled") && (
          <IconButton label={text.retry(name)} disabled={disabled} onPress={() => void store.upload([item.id])}>
            <RetryGlyph color={tokens.fg} />
          </IconButton>
        )}
        {inFlight || status === "paused" ? (
          <IconButton label={text.cancel(name)} disabled={disabled} onPress={() => store.cancel(item.id)}>
            <CloseGlyph size={12} color={tokens.muted} />
          </IconButton>
        ) : (
          removable && (
            <IconButton label={text.remove(name)} disabled={disabled} onPress={() => store.remove(item.id)}>
              <CloseGlyph size={12} color={tokens.muted} />
            </IconButton>
          )
        )}
      </View>
    </View>
  );
});

/** A file already stored on the server. */
function ExistingFileRow({
  file,
  onRemove,
  preview,
  removable,
  disabled,
  locale,
  text,
  styles: slots,
}: RowProps & { file: ExistingFile; onRemove?(file: ExistingFile): void }) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const kind = fileKind(file);
  const [broken, setBroken] = useState(false);
  const meta = [file.size !== undefined ? formatBytes(file.size, locale) : null, text.uploaded]
    .filter(Boolean)
    .join(" · ");
  return (
    <View style={[s.item, slots?.item]}>
      <View style={[s.thumb, slots?.thumb]} aria-hidden>
        <KindLabel kind={kind} color={tokens.muted} />
        {preview && kind === "image" && file.url && !broken && (
          <Image source={{ uri: file.url }} style={s.thumbImage} onError={() => setBroken(true)} />
        )}
      </View>
      <View style={s.body}>
        <Text style={s.name} numberOfLines={1} ellipsizeMode="middle">
          {file.name}
        </Text>
        <Text style={s.meta}>{meta}</Text>
      </View>
      <View style={[s.actions, slots?.actions]}>
        {removable && onRemove && (
          <IconButton label={text.remove(file.name)} disabled={disabled} onPress={() => onRemove(file)}>
            <CloseGlyph size={12} color={tokens.muted} />
          </IconButton>
        )}
      </View>
    </View>
  );
}

/**
 * Pick files and upload them with progress, pause, resume and retry. The
 * queue, validation and retries are the web uploader's engine, unchanged; the
 * picker is yours to pass in as `pick`.
 */
export function FileUploader(props: FileUploaderProps) {
  const {
    ref,
    pick,
    multiple = false,
    accept,
    maxFiles,
    maxSize,
    minSize,
    validate,
    allowDuplicates,
    endpoint,
    method,
    headers,
    withCredentials,
    params,
    fieldNames,
    parseResponse,
    transport: customTransport,
    concurrency,
    retries,
    retryDelay,
    autoUpload = false,
    preview = true,
    existingFiles,
    onRemoveExisting,
    removable = true,
    label,
    description,
    error,
    required = false,
    disabled = false,
    size = "md",
    locale,
    style,
    styles: slots,
    localeText,
    onChange,
    onRejected,
    onFileSuccess,
    onFileError,
    onUploadComplete,
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultUploaderText, ...localeText }), [localeText]);
  const [picking, setPicking] = useState(false);

  const transport = useMemo<Transport | undefined>(() => {
    if (customTransport) return customTransport;
    if (!endpoint) return undefined;
    // The web transport, unchanged: React Native's XMLHttpRequest reports
    // upload progress, and its FormData sends `{ uri, name, type }` as a file.
    return createHttpTransport({ endpoint, method, headers, withCredentials, params, fieldNames, parseResponse });
  }, [customTransport, endpoint, method, headers, withCredentials, params, fieldNames, parseResponse]);

  const { store, items, rejections } = useFileUploader({
    multiple,
    accept,
    maxFiles,
    maxSize,
    minSize,
    validate: validate ? (file) => validate(fromUploadable(file)) : undefined,
    allowDuplicates,
    transport,
    chunkSize: NATIVE_CHUNK_SIZE,
    concurrency,
    retries,
    retryDelay,
    autoUpload,
    onChange: onChange ? (files) => onChange(files.map(fromUploadable)) : undefined,
    onRejected,
    onFileSuccess(item) {
      AccessibilityInfo.announceForAccessibility(text.announceDone(item.file.name));
      onFileSuccess?.(item);
    },
    onFileError(item, reason) {
      AccessibilityInfo.announceForAccessibility(text.announceFailed(item.file.name));
      onFileError?.(item, reason);
    },
    onComplete: onUploadComplete,
  });

  // Rejections are read out as they appear: there is no live region on iOS.
  useEffect(() => {
    if (rejections.length > 0) {
      AccessibilityInfo.announceForAccessibility(rejections.map((r) => r.file.name).join(", "));
    }
  }, [rejections]);

  const addFiles = (files: readonly NativeFile[]) => store.addFiles(files.map(toUploadable));

  const open = async () => {
    if (disabled || !pick || picking) return;
    setPicking(true);
    try {
      const picked = await pick();
      if (picked && picked.length > 0) addFiles(picked);
    } finally {
      setPicking(false);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      open,
      addFiles,
      upload: () => store.upload(),
      pause: (fileId) => store.pause(fileId),
      cancel: (fileId) => store.cancel(fileId),
      clear: () => store.clear(),
      getFiles: () => store.getSnapshot().items.map((item) => fromUploadable(item.file)),
      getItems: () => store.getSnapshot().items,
    }),
  );

  const rejectionText = (rejection: FileRejection): string => {
    const fileName = rejection.file.name;
    switch (rejection.code) {
      case "file-type":
        return text.rejectFileType(fileName);
      case "file-too-large":
        return text.rejectTooLarge(fileName, formatBytes(maxSize ?? 0, locale));
      case "file-too-small":
        return text.rejectTooSmall(fileName, formatBytes(minSize ?? 0, locale));
      case "too-many-files":
        return text.rejectTooMany(String(multiple ? (maxFiles ?? 1) : 1));
      case "duplicate":
        return text.rejectDuplicate(fileName);
      case "custom":
        return rejection.message ?? fileName;
    }
  };

  const hints = [
    accept ? text.hintTypes(describeAccept(accept)) : null,
    maxSize !== undefined ? text.hintMaxSize(formatBytes(maxSize, locale)) : null,
    multiple && maxFiles !== undefined && Number.isFinite(maxFiles) ? text.hintMaxFiles(String(maxFiles)) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const summary = summarize(items);
  const canUpload = transport !== undefined;
  const hasRows = items.length > 0 || (existingFiles?.length ?? 0) > 0;
  const showFooter = items.length > 0 && (canUpload || multiple);
  const invalid = Boolean(error);
  const plainLabel = typeof label === "string" ? label : undefined;
  const rowProps: RowProps = { preview, removable, disabled, locale, text, styles: slots };

  const footerButton = (title: string, onPress: () => void, primary = false) => (
    <Pressable
      role="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        primary && { backgroundColor: tokens.accent, borderColor: tokens.accent },
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[s.buttonText, primary && { color: tokens.accentFg }]}>{title}</Text>
    </Pressable>
  );

  return (
    <View style={[s.root, { opacity: disabled ? 0.6 : 1 }, slots?.root, style]}>
      {label ? (
        <Text style={s.label}>
          {label}
          {required && <Text style={s.required}> *</Text>}
        </Text>
      ) : null}

      <Pressable
        role="button"
        aria-label={[plainLabel, capitalize(text.browse)].filter(Boolean).join(", ")}
        aria-disabled={disabled || !pick || undefined}
        aria-busy={picking || undefined}
        accessibilityHint={[hints, typeof description === "string" ? description : null, typeof error === "string" ? error : null]
          .filter(Boolean)
          .join(". ") || undefined}
        disabled={disabled || !pick}
        onPress={() => void open()}
        style={({ pressed }) => [
          s.dropzone,
          {
            padding: PAD[size],
            borderColor: invalid ? tokens.danger : pressed ? tokens.accent : tokens.borderControl,
            backgroundColor: pressed ? alpha(tokens.accent, 0.06) : tokens.inputBg,
          },
          slots?.dropzone,
        ]}
      >
        <UploadGlyph color={tokens.muted} size={size === "sm" ? 20 : 26} />
        <Text style={s.dropText}>
          {/* "Drag files here or browse" has no drag on a phone: lead with the action. */}
          <Text style={s.browse}>{capitalize(text.browse)}</Text>
        </Text>
        {hints ? <Text style={s.hint}>{hints}</Text> : null}
      </Pressable>

      {description ? <Text style={s.description}>{description}</Text> : null}
      {error ? (
        <Text role="alert" aria-live="polite" style={s.error}>
          {error}
        </Text>
      ) : null}

      {rejections.length > 0 && (
        <View style={[s.rejections, slots?.rejections]} role="alert">
          {rejections.map((rejection) => (
            <View key={rejection.id} style={s.rejection}>
              <AlertGlyph color={tokens.danger} />
              <Text style={s.rejectionText}>{rejectionText(rejection)}</Text>
              <IconButton label={text.dismiss} disabled={false} onPress={() => store.dismissRejection(rejection.id)}>
                <CloseGlyph size={12} color={tokens.danger} />
              </IconButton>
            </View>
          ))}
        </View>
      )}

      {hasRows && (
        <View style={[s.list, slots?.list]} role="list" aria-label={plainLabel}>
          {existingFiles?.map((file) => (
            <ExistingFileRow key={`existing-${file.id}`} file={file} onRemove={onRemoveExisting} {...rowProps} />
          ))}
          {items.map((item) => (
            <FileRow key={item.id} item={item} store={store} canUpload={canUpload} {...rowProps} />
          ))}
        </View>
      )}

      {showFooter && (
        <View style={[s.footer, slots?.footer]}>
          {summary.busy ? (
            <>
              <View style={{ flex: 1, minWidth: 120 }}>
                <ProgressBar value={summary.progress} color={tokens.accent} label={plainLabel} />
              </View>
              <Text style={s.footerText}>
                {formatBytes(summary.uploadedBytes, locale)} / {formatBytes(summary.totalBytes, locale)}
              </Text>
              {footerButton(text.cancelAll, () => store.cancel())}
            </>
          ) : (
            <>
              {footerButton(text.clear, () => store.clear())}
              {canUpload &&
                summary.startable > 0 &&
                footerButton(text.upload(String(summary.startable)), () => void store.upload(), true)}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase() + value.slice(1);
