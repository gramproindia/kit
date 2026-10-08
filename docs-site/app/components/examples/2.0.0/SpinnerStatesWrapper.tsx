"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Spinner } from "@/components/spinner";
import { wait } from "./_controls-fixtures";

export default function SpinnerStatesWrapper() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-5">
        <Spinner size="xs" />
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" className="text-blue-600 dark:text-blue-400" />
        <Spinner size="xl" variant="dots" />
        <Spinner size="sm" showLabel label="Saving draft…" />
      </div>
      <Spinner
        loading={loading}
        delay={250}
        minDuration={600}
        className="rounded-lg"
      >
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="mb-2 text-sm font-medium">Quarterly revenue</p>
          <p className="text-2xl font-semibold">$48,210</p>
          <button
            type="button"
            className="mt-3 text-xs text-blue-600 underline dark:text-blue-400"
          >
            View report (inert while loading)
          </button>
        </div>
      </Spinner>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            setLoading(true);
            await wait(1800);
            setLoading(false);
          }}
        >
          Reload (1.8 s)
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            setLoading(true);
            await wait(120);
            setLoading(false);
          }}
        >
          Quick reload (120 ms, no flash)
        </Button>
      </div>
    </div>
  );
}
