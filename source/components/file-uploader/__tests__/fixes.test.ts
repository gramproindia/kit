import { afterEach, describe, expect, it, vi } from "vitest";
import { createUploaderStore } from "../core/store";
import type { ChunkRequest, Transport } from "../core/types";
import { hasKnownSize, matchesAccept, partitionFiles } from "../core/validate";
import { toUploadable } from "../native/file";

const file = (name: string, size = 10, type = "", lastModified = 1) =>
  new File([new Uint8Array(size)], name, { type, lastModified });

afterEach(() => {
  vi.useRealTimers();
});

describe("accept wildcards", () => {
  it("treats */* and * as anything", () => {
    const pdf = { name: "a.pdf", type: "application/pdf" };
    expect(matchesAccept(pdf, "*/*")).toBe(true);
    expect(matchesAccept(pdf, "*")).toBe(true);
    expect(matchesAccept({ name: "noext", type: "" }, "*/*")).toBe(true);
  });
});

describe("transport changes mid-upload", () => {
  it("sends later chunks with the latest transport", async () => {
    const used: string[] = [];
    const tagged =
      (tag: string, after?: () => void): Transport =>
      async (request: ChunkRequest) => {
        used.push(`${tag}:${request.index}`);
        after?.();
        return {};
      };
    const store = createUploaderStore({ chunkSize: 4 });
    // The first chunk swaps in a transport with a fresh token, like a re-render would.
    store.configure({ transport: tagged("old", () => store.configure({ transport: tagged("new") })) });
    store.addFiles([file("a.bin", 10)]);
    const [item] = await store.upload();
    expect(item.status).toBe("success");
    expect(used).toEqual(["old:0", "new:1", "new:2"]);
  });
});

describe("app callbacks that throw", () => {
  it("keeps an uploaded file as uploaded when onFileSuccess throws", async () => {
    vi.useFakeTimers();
    const onFileError = vi.fn();
    const store = createUploaderStore({
      transport: async () => ({}),
      onFileSuccess: () => {
        throw new Error("boom");
      },
      onFileError,
    });
    store.addFiles([file("a.txt")]);
    const [item] = await store.upload();
    expect(item.status).toBe("success");
    expect(store.getSnapshot().items[0].status).toBe("success");
    expect(onFileError).not.toHaveBeenCalled();
    // The error is still surfaced, on its own turn.
    expect(() => vi.runAllTimers()).toThrow("boom");
  });
});

describe("files with an unknown size", () => {
  const unknown = () =>
    toUploadable({ uri: "content://x", name: "a.jpg", size: 0, type: "image/jpeg" });

  it("marks native files without a size as unknown", () => {
    expect(hasKnownSize(unknown())).toBe(false);
    const missing = toUploadable({ uri: "u", name: "b", size: undefined as unknown as number, type: "" });
    expect(missing.size).toBe(0);
    expect(hasKnownSize(missing)).toBe(false);
    expect(hasKnownSize(toUploadable({ uri: "u", name: "c", size: 5, type: "" }))).toBe(true);
    expect(hasKnownSize(file("web.txt", 0))).toBe(true);
  });

  it("skips size limits it cannot check, but not other rules", () => {
    const result = partitionFiles([unknown()], [], { maxSize: 10, minSize: 1, accept: "image/*" });
    expect(result.accepted).toHaveLength(1);
    expect(partitionFiles([unknown()], [], { accept: ".pdf" }).rejected[0].code).toBe("file-type");
  });

  it("does not report 100% before the server answers", async () => {
    const progress: number[] = [];
    let release!: () => void;
    const transport: Transport = (request) => {
      request.onProgress(0);
      return new Promise((resolve) => {
        release = () => resolve({});
      });
    };
    const store = createUploaderStore({ transport });
    store.subscribe(() => progress.push(store.getSnapshot().items[0]?.progress ?? -1));
    store.addFiles([unknown()]);
    const done = store.upload();
    await vi.waitFor(() => expect(release).toBeDefined());
    expect(Math.max(...progress)).toBe(0);
    release();
    const [item] = await done;
    expect(item).toMatchObject({ status: "success", progress: 1 });
  });
});
