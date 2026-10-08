"use client";

import { createToastApi, createToastStore, Toaster } from "@/components/toaster";
import { button } from "./_toaster-fixtures";

// Its own store, so this example's toasts stay in this example's Toaster. In
// an app you would import the ready-made `toast` instead.
const store = createToastStore();
const toast = createToastApi(store);

// Outside React on purpose: `toast()` needs no hook, context or provider.
let attempt = 0;

function saveSettings() {
  attempt += 1;
  const fails = attempt % 2 === 0;
  return new Promise<{ name: string }>((resolve, reject) =>
    setTimeout(
      () =>
        fails ? reject(new Error("Network timeout")) : resolve({ name: "Profile" }),
      1500,
    ),
  );
}

function simulateUpload() {
  const id = toast.loading("Uploading report.pdf", { description: "0%" });
  let percent = 0;
  const timer = setInterval(() => {
    percent += 20;
    if (percent < 100) {
      toast.update(id, { description: `${percent}%` });
      return;
    }
    clearInterval(timer);
    toast.update(id, {
      type: "success",
      title: "report.pdf uploaded",
      description: "2.4 MB",
    });
  }, 400);
}

export default function ToasterUpdatesWrapper() {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={button}
        onClick={() =>
          toast("Message archived", {
            action: {
              label: "Undo",
              onClick: () => toast.success("Message restored"),
            },
          })
        }
      >
        Undo action
      </button>
      <button
        type="button"
        className={button}
        onClick={() =>
          toast.error("Could not connect", {
            id: "connect",
            duration: Infinity,
            cancel: { label: "Dismiss", onClick: () => {} },
            action: {
              label: "Retry",
              onClick: (event) => {
                // Keep this toast open and turn it into progress.
                event.preventDefault();
                toast.update("connect", {
                  type: "loading",
                  title: "Reconnecting…",
                  action: undefined,
                  cancel: undefined,
                });
                setTimeout(
                  () => toast.update("connect", { type: "success", title: "Connected" }),
                  1200,
                );
              },
            },
          })
        }
      >
        Retry + cancel
      </button>
      <button
        type="button"
        className={button}
        onClick={() =>
          toast.promise(saveSettings, {
            loading: "Saving profile…",
            success: (result) => `${result.name} saved`,
            error: (error) => `Could not save: ${(error as Error).message}`,
          })
        }
      >
        Promise
      </button>
      <button type="button" className={button} onClick={simulateUpload}>
        Upload progress
      </button>
      <Toaster store={store} position="bottom-right" />
    </div>
  );
}
