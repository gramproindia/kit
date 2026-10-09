"use client";

import { useState } from "react";
import { createDialogApi, createDialogStore, DialogHost } from "@/components/dialog";
import { Modal } from "@/components/modal";
import { button, field } from "./_overlays-fixtures";

// Its own store and host: the guard asks through a Dialog, and the other
// examples on this page have hosts of their own. In an app there is one
// host and you import the ready-made `dialog`.
const store = createDialogStore();
const dialog = createDialogApi(store);

export default function ModalGuardWrapper() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState("");
  const dirty = draft !== saved;

  return (
    <>
      <div className="flex items-center gap-2">
        <button type="button" className={button} onClick={() => setOpen(true)}>
          Edit note
        </button>
        <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
          Saved: {saved || "empty"}
        </span>
      </div>

      <Modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setDraft(saved);
        }}
        title="Edit note"
        size="sm"
        closeOnBackdrop={false}
        onBeforeClose={(reason) =>
          !dirty ||
          reason === "api" ||
          dialog.confirm({
            title: "Discard your changes?",
            intent: "warning",
            confirmLabel: "Discard",
            cancelLabel: "Keep editing",
          })
        }
        footer={
          <button
            type="button"
            className={button}
            onClick={() => {
              setSaved(draft);
              setOpen(false);
            }}
          >
            Save
          </button>
        }
      >
        <textarea
          className={field}
          rows={4}
          data-autofocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type, then press Escape"
        />
      </Modal>
      <DialogHost store={store} />
    </>
  );
}
