"use client";

/*
 * Fixtures shared by the controls examples, kept out of them so each
 * one shows only the thing it demonstrates. Ported from the playground's
 * ControlsDemo, where these cases were first exercised.
 */

import { type BreadcrumbItem } from "@/components/breadcrumb";

export const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const TrashIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);

export const HomeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 11 12 4l9 7M5 10v10h14V10" />
  </svg>
);

export const CHANNELS = [
  { value: "email", label: "Email", description: "Daily digest" },
  { value: "sms", label: "SMS", description: "Urgent alerts only" },
  { value: "push", label: "Push", description: "Mobile app" },
  {
    value: "slack",
    label: "Slack",
    description: "Needs an admin to connect",
    disabled: true,
  },
];

export const TRAIL: BreadcrumbItem[] = [
  { label: "Home", href: "#", icon: <HomeIcon /> },
  { label: "Workspaces", href: "#" },
  { label: "Grampro", href: "#" },
  { label: "Finance", href: "#" },
  { label: "Invoices", href: "#" },
  { label: "INV-2026-0042 — Quarterly retainer for design services" },
];
