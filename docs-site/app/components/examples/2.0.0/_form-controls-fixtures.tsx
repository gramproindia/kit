"use client";

/*
 * Fixtures shared by the form-controls examples, kept out of them so each
 * one shows only the thing it demonstrates. Ported from the playground's
 * FormControlsDemo, where these cases were first exercised.
 */

export const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
