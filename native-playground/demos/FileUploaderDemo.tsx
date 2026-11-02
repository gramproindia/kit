import { useState } from "react";
import { Text } from "react-native";
import {
  FileUploader,
  type NativeFile,
  type Transport,
} from "../../source/components/file-uploader";
import { useKitTheme } from "../../source/components/shared/native";
import { Section } from "./layout";

// A real app passes a picker adapter, e.g. expo-document-picker:
//   pick={async () => (await getDocumentAsync({ multiple: true })).assets?.map(
//     (a) => ({ uri: a.uri, name: a.name, size: a.size ?? 0, type: a.mimeType ?? "" }))}
// The demo fakes one so it runs in Expo Go with no picker installed.
const SAMPLES: NativeFile[] = [
  { uri: "https://picsum.photos/id/1015/200", name: "backwaters.jpg", size: 245_760, type: "image/jpeg" },
  { uri: "file:///demo/statement-oct.pdf", name: "statement-oct.pdf", size: 1_310_720, type: "application/pdf" },
  { uri: "file:///demo/ledger.xlsx", name: "ledger.xlsx", size: 88_064, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  { uri: "file:///demo/huge-video.mp4", name: "huge-video.mp4", size: 52_428_800, type: "video/mp4" },
  { uri: "file:///demo/notes.txt", name: "notes.txt", size: 2_048, type: "text/plain" },
];

let picks = 0;
/** Returns two sample files per call, cycling through the list. */
async function fakePick(): Promise<NativeFile[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const start = (picks++ * 2) % SAMPLES.length;
  return [SAMPLES[start], SAMPLES[(start + 1) % SAMPLES.length]];
}

/** Pretends to send the file, reporting progress; PDFs fail once, to show retry. */
const failedOnce = new Set<string>();
const fakeTransport: Transport = ({ file, signal, onProgress }) =>
  new Promise((resolve, reject) => {
    let sent = 0;
    const timer = setInterval(() => {
      sent = Math.min(file.size, sent + file.size / 20);
      onProgress(sent);
      if (file.name.endsWith(".pdf") && sent > file.size / 2 && !failedOnce.has(file.name)) {
        failedOnce.add(file.name);
        clearInterval(timer);
        reject(Object.assign(new Error("Server said 400: try again"), { status: 400 }));
        return;
      }
      if (sent >= file.size) {
        clearInterval(timer);
        resolve({ id: `srv-${file.name}` });
      }
    }, 120);
    signal.addEventListener("abort", () => {
      clearInterval(timer);
      reject(Object.assign(new Error("Upload aborted"), { name: "AbortError" }));
    });
  });

export function FileUploaderDemo() {
  const { tokens } = useKitTheme();
  const [files, setFiles] = useState<NativeFile[]>([]);
  return (
    <>
      <Section title="FileUploader · multiple, with upload">
        <FileUploader
          label="Attachments"
          description="Tap to add two sample files. PDFs fail once so you can retry."
          multiple
          maxFiles={6}
          maxSize={20 * 1024 * 1024}
          pick={fakePick}
          transport={fakeTransport}
          retries={0}
          onChange={setFiles}
        />
        <Text style={{ color: tokens.muted, fontSize: tokens.fontSize - 2 }}>
          Selected: {files.map((file) => file.name).join(", ") || "none"}
        </Text>
      </Section>

      <Section title="FileUploader · single image, auto upload, existing file">
        <FileUploader
          label="Profile photo"
          accept="image/*"
          autoUpload
          pick={async () => [SAMPLES[0]]}
          transport={fakeTransport}
          existingFiles={[{ id: "old", name: "old-photo.png", size: 51_200, type: "image/png" }]}
          onRemoveExisting={() => undefined}
          size="sm"
        />
      </Section>

      <Section title="FileUploader · states">
        <FileUploader label="Select only (no transport)" pick={fakePick} multiple required />
        <FileUploader label="Disabled" pick={fakePick} disabled />
        <FileUploader label="With error" pick={fakePick} error="Add at least one document." />
      </Section>
    </>
  );
}
