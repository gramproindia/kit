"use client";

/*
 * Fixtures shared by the fields examples, kept out of them so each
 * one shows only the thing it demonstrates. Ported from the playground's
 * FieldsDemo, where these cases were first exercised.
 */

export const button =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700";

export const SearchIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
