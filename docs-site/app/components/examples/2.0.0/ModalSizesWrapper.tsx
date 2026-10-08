"use client";

import { useState } from "react";
import { Modal, type ModalPlacement, type ModalSize } from "@/components/modal";
import { button } from "./_overlays-fixtures";

export default function ModalSizesWrapper() {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<ModalSize>("md");
  const [placement, setPlacement] = useState<ModalPlacement>("center");

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Modal size"
          className={button}
          value={size}
          onChange={(event) => setSize(event.target.value as ModalSize)}
        >
          {["sm", "md", "lg", "xl", "full"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Modal placement"
          className={button}
          value={placement}
          onChange={(event) =>
            setPlacement(event.target.value as ModalPlacement)
          }
        >
          {["center", "top", "left", "right", "bottom"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <button type="button" className={button} onClick={() => setOpen(true)}>
          Open
        </button>
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        size={size}
        placement={placement}
        title="Terms of service"
        description={`size="${size}" · placement="${placement}"`}
        footer={({ close }) => (
          <>
            <button type="button" className={button} onClick={close}>
              Decline
            </button>
            <button
              type="button"
              className={button}
              data-autofocus
              onClick={close}
            >
              Accept
            </button>
          </>
        )}
      >
        {Array.from({ length: 12 }, (_, index) => (
          <p key={index} className="mb-3">
            {index + 1}. The body scrolls on its own while the header and footer
            stay in place. Escape, the close button and a click on the backdrop
            all close the modal.
          </p>
        ))}
      </Modal>
    </>
  );
}
