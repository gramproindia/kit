"use client";

import { Breadcrumb } from "@/components/breadcrumb";
import { TRAIL } from "./_controls-fixtures";

export default function BreadcrumbCollapseWrapper() {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb items={TRAIL} />
      <Breadcrumb items={TRAIL} maxItems={4} itemsAfterCollapse={2} />
      <Breadcrumb items={TRAIL.slice(0, 3)} separator="/" size="sm" />
    </div>
  );
}
