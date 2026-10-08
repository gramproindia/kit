"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { PlusIcon, TrashIcon, wait } from "./_controls-fixtures";

export default function ButtonVariantsWrapper() {
  const [saves, setSaves] = useState(0);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger" leading={<TrashIcon />}>
          Delete
        </Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" leading={<PlusIcon />}>
          Small
        </Button>
        <Button size="md" variant="outline">
          Medium
        </Button>
        <Button size="lg" variant="outline">
          Large
        </Button>
        <Button variant="outline" icon={<PlusIcon />} aria-label="Add item" />
        <Button disabled>Disabled</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={async () => {
            await wait(1500);
            setSaves((count) => count + 1);
          }}
        >
          Save changes
        </Button>
        <Button
          variant="outline"
          loading={loading}
          loadingText="Syncing…"
          onClick={() => setLoading((value) => !value)}
        >
          Toggle loading
        </Button>
        <Button
          variant="secondary"
          render={(props) => <a href="#controls" {...props} />}
        >
          Rendered as a link
        </Button>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          Saved {saves}×
        </span>
      </div>
      <Button variant="outline" fullWidth onClick={() => wait(1200)}>
        Full width
      </Button>
    </div>
  );
}
