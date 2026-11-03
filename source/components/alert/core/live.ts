import type { AlertVariant } from "./types";

export interface Liveness {
  /** `alert` interrupts whatever is being read; `status` waits its turn. */
  role: "alert" | "status";
  live: "assertive" | "polite";
}

/**
 * How loudly an alert announces itself.
 *
 * A banner that appears after the page has loaded is news, and a screen reader
 * has to be told whether it is worth interrupting for. Problems are:
 * `role="alert"` cuts into whatever is being read, which is right for "your
 * card was declined" and rude for "3 rows imported".
 *
 * A banner that was on the page from the start announces nothing either way —
 * a live region only speaks when its contents change — so this only decides
 * what happens when one appears or its text is replaced.
 */
export function liveness(variant: AlertVariant): Liveness {
  return variant === "danger" || variant === "warning"
    ? { role: "alert", live: "assertive" }
    : { role: "status", live: "polite" };
}

/**
 * The words to speak when an urgent alert appears, for platforms that have no
 * live regions (iOS VoiceOver ignores `role="alert"`). Only plain text can be
 * spoken this way; parts that are elements are skipped.
 */
export function announcementText(parts: readonly unknown[]): string {
  return parts
    .filter((part): part is string | number => typeof part === "string" || typeof part === "number")
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join(". ");
}
