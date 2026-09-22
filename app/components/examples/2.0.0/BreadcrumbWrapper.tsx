"use client";

import { Breadcrumb, type BreadcrumbItem } from "@/components/breadcrumb";

const TRAIL: BreadcrumbItem[] = [
  { label: "Home", href: "#" },
  { label: "Workspaces", href: "#" },
  { label: "Grampro", href: "#" },
  { label: "Finance", href: "#" },
  { label: "Invoices", href: "#" },
  { label: "INV-2026-0042" },
];

/** Live example used in the Breadcrumb documentation. */
export function BreadcrumbWrapper() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Breadcrumb items={TRAIL} />
      {/* A custom separator. */}
      <Breadcrumb items={TRAIL} separator="/" aria-label="Breadcrumb (slashes)" />
      {/* Collapsed: the ellipsis opens the hidden crumbs. */}
      <Breadcrumb
        items={TRAIL}
        maxItems={4}
        itemsBeforeCollapse={1}
        itemsAfterCollapse={2}
        aria-label="Breadcrumb (collapsed)"
      />
    </div>
  );
}

export default BreadcrumbWrapper;
