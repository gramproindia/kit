"use client";

import { useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { card } from "./_display-fixtures";

export default function AlertVariantsWrapper() {
  const [shown, setShown] = useState(true);

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info" title="Read-only workspace">
        You have view access to this project. Ask an owner for edit rights.
      </Alert>
      <Alert
        variant="warning"
        title="Your trial ends in 3 days"
        actions={<Button size="sm">Add a card</Button>}
      >
        After that the workspace becomes read-only.
      </Alert>
      {shown && (
        <Alert
          variant="danger"
          title="We could not save your changes"
          onDismiss={() => setShown(false)}
        >
          The connection dropped. Your edits are still here.
        </Alert>
      )}
      <Alert variant="success" size="sm">
        240 rows imported.
      </Alert>
      <Alert variant="neutral" size="sm" icon={false}>
        No icon, no colour: a plain note.
      </Alert>
    </div>
  );
}
