"use client";

/*
 * Fixtures shared by the overlays examples, kept out of them so each
 * one shows only the thing it demonstrates. Ported from the playground's
 * OverlaysDemo, where these cases were first exercised.
 */

export const button =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700";

export const field =
  "w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700";

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
