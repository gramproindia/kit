/*
 * Time of day, for DateTimePicker.
 *
 * Everything here is wall-clock local time, the way a person reads a meeting
 * invite: "15 March, 14:30" means 14:30 where the person is. Nothing converts
 * between zones, and an ISO value with a zone or offset is not read as one —
 * converting it silently would move the appointment.
 *
 * Pure: no React, no DOM, so a server or a test can reproduce what the field
 * shows and accepts.
 */

import { parseISODate, startOfDay, toISODate } from "./calendar";
import { DEFAULT_DATE_FORMAT, formatDate, inputPlaceholder, parseDate } from "./format";
import type { DateInput } from "./types";

export interface TimeOfDay {
  hours: number;
  minutes: number;
  seconds: number;
}

export type HourCycle = 12 | 24;

/** Whether a locale writes 2:30 PM or 14:30. Unknown locales get 24. */
export function hourCycleOf(locale?: string): HourCycle {
  try {
    const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
    return cycle === "h11" || cycle === "h12" ? 12 : 24;
  } catch {
    return 24;
  }
}

export const timeOf = (date: Date): TimeOfDay => ({
  hours: date.getHours(),
  minutes: date.getMinutes(),
  seconds: date.getSeconds(),
});

/** The same day at the given time. */
export function withTime(day: Date, time: TimeOfDay): Date {
  const next = startOfDay(day);
  next.setHours(time.hours, time.minutes, time.seconds, 0);
  return next;
}

const ISO_DATE_TIME = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Strict local `yyyy-mm-ddTHH:mm[:ss]`; null for anything else, including a
 * zone or offset, an impossible day, or 24:00.
 */
export function parseISODateTime(text: string): Date | null {
  const match = ISO_DATE_TIME.exec(text.trim());
  if (!match) return null;
  const day = parseISODate(match[1]);
  const time = { hours: Number(match[2]), minutes: Number(match[3]), seconds: Number(match[4] ?? 0) };
  if (!day || time.hours > 23 || time.minutes > 59 || time.seconds > 59) return null;
  return withTime(day, time);
}

/** `yyyy-mm-ddTHH:mm`, or with `:ss` — the shape `<input type="datetime-local">` posts. */
export function toISODateTime(date: Date, seconds = false): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${toISODate(date)}T${time}${seconds ? `:${pad(date.getSeconds())}` : ""}`;
}

/**
 * A date and time from anything `value` accepts: a `Date` (copied, time kept),
 * an ISO date-time, an ISO date (midnight) or a timestamp.
 */
export function toDateTime(value: DateInput | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const local = parseISODateTime(value) ?? parseISODate(value);
    if (local) return local;
  }
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Within the bounds, to the second. A bound is a moment, not a day. */
export function clampDateTime(date: Date, min?: Date | null, max?: Date | null): Date {
  if (min && date.getTime() < min.getTime()) return new Date(min.getTime());
  if (max && date.getTime() > max.getTime()) return new Date(max.getTime());
  return date;
}

/**
 * Reads a typed time: `14:30`, `2:30 pm`, `2.30PM`, `14:30:15`, `9 am`.
 * Null when it is not a time of day.
 */
export function parseTime(text: string): TimeOfDay | null {
  const match = /^(\d{1,2})(?:[:.](\d{2}))?(?:[:.](\d{2}))?\s*([ap])?\.?\s*(?:m\.?)?$/i.exec(text.trim());
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const period = match[4]?.toLowerCase();
  // "9" alone is not a time; "9 am" and "9:00" are.
  if (match[2] === undefined && !period) return null;
  if (period) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (period === "p" ? 12 : 0);
  }
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return { hours, minutes, seconds };
}

/** The time at the end of a typed date-time, and what comes before it. */
const TRAILING_TIME = /(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?\s*(?:[ap]\.?\s*m\.?)?|\d{1,2}\s*[ap]\.?\s*m\.?)\s*$/i;

/**
 * Reads what someone typed into a date-time field: an ISO date-time, or a
 * date in any form `parseDate` reads followed by a time — `15/03/2026 14:30`,
 * `Mar 15, 2026, 2:30 PM`. With no time typed, `time` is null and the caller
 * decides which time to keep.
 */
export function parseDateTime(
  text: string,
  locale?: string,
  reference: Date = new Date(),
): { date: Date; time: TimeOfDay | null } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const iso = parseISODateTime(trimmed);
  if (iso) return { date: startOfDay(iso), time: timeOf(iso) };

  const found = TRAILING_TIME.exec(trimmed);
  const time = found ? parseTime(found[1]) : null;
  if (found && !time) return null;
  // What is left is the date, less the comma or connecting word before the
  // time ("at", "um", "à") that some locales write.
  const datePart = found
    ? trimmed.slice(0, found.index).replace(/[\s,]*(?:at|um|à|a las|alle|om)?[\s,]*$/iu, "")
    : trimmed;
  const date = parseDate(datePart, locale, reference);
  return date ? { date, time } : null;
}

/** `Intl` options for the time half of the display. */
export function timeFormatOptions(hourCycle: HourCycle, seconds: boolean): Intl.DateTimeFormatOptions {
  return {
    hour: "numeric",
    minute: "2-digit",
    ...(seconds ? { second: "2-digit" } : {}),
    hourCycle: hourCycle === 12 ? "h12" : "h23",
  };
}

/** How a chosen date and time reads in the field: the locale's date, then its time. */
export function formatDateTime(
  date: Date,
  locale: string | undefined,
  options: { hourCycle: HourCycle; seconds: boolean; dateFormat?: Intl.DateTimeFormatOptions },
): string {
  return formatDate(date, locale, {
    ...(options.dateFormat ?? DEFAULT_DATE_FORMAT),
    ...timeFormatOptions(options.hourCycle, options.seconds),
  });
}

/** A typing hint: the locale's date order, then the time, e.g. `dd/mm/yyyy hh:mm`. */
export function dateTimePlaceholder(locale: string | undefined, hourCycle: HourCycle, seconds: boolean): string {
  return `${inputPlaceholder(locale)} hh:mm${seconds ? ":ss" : ""}${hourCycle === 12 ? " am" : ""}`;
}

/** The locale's own words for AM and PM, e.g. ["AM", "PM"] or ["a. m.", "p. m."]. */
export function dayPeriodNames(locale?: string): [string, string] {
  try {
    const format = new Intl.DateTimeFormat(locale, { hour: "numeric", hourCycle: "h12" });
    const name = (hour: number) =>
      format.formatToParts(new Date(2024, 0, 1, hour)).find((part) => part.type === "dayPeriod")?.value;
    return [name(9) ?? "AM", name(21) ?? "PM"];
  } catch {
    return ["AM", "PM"];
  }
}
