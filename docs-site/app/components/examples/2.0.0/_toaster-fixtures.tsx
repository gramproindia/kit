"use client";

/*
 * Shared by the Toaster examples.
 *
 * Each example makes its own store rather than using the ready-made `toast`,
 * because several of them appear on one page and a shared store would show
 * every toast in every example's Toaster at once. In an app there is one
 * store and you import `toast` directly.
 */

export const button =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700";
