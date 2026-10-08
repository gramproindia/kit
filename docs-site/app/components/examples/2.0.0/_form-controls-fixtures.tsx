"use client";

/*
 * Fixtures shared by the form-controls examples, kept out of them so each
 * one shows only the thing it demonstrates. Ported from the playground's
 * FormControlsDemo, where these cases were first exercised.
 */

export const card =
  "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950";

export const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
