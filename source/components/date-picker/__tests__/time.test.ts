/*
 * DateTimePicker's time helpers: reading, writing and bounding wall-clock time.
 */
import { describe, expect, it } from "vitest";
import {
  clampDateTime,
  dateTimePlaceholder,
  formatDateTime,
  hourCycleOf,
  parseDateTime,
  parseISODateTime,
  parseTime,
  toDateTime,
  toISODateTime,
  withTime,
} from "../core/time";

const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0) => new Date(y, m - 1, d, h, min, s);

describe("parseTime", () => {
  it.each([
    ["14:30", { hours: 14, minutes: 30, seconds: 0 }],
    ["2:30 pm", { hours: 14, minutes: 30, seconds: 0 }],
    ["2.30PM", { hours: 14, minutes: 30, seconds: 0 }],
    ["12:05 am", { hours: 0, minutes: 5, seconds: 0 }],
    ["12:05 p.m.", { hours: 12, minutes: 5, seconds: 0 }],
    ["9 am", { hours: 9, minutes: 0, seconds: 0 }],
    ["23:59:58", { hours: 23, minutes: 59, seconds: 58 }],
  ])("reads %s", (text, time) => {
    expect(parseTime(text)).toEqual(time);
  });

  it.each(["9", "24:00", "13 pm", "12:60", "0 am", "noon", ""])("refuses %s", (text) => {
    expect(parseTime(text)).toBeNull();
  });
});

describe("ISO date-time", () => {
  it("reads local yyyy-mm-ddTHH:mm, with or without seconds", () => {
    expect(parseISODateTime("2026-03-15T14:30")).toEqual(at(2026, 3, 15, 14, 30));
    expect(parseISODateTime("2026-03-15 14:30:15")).toEqual(at(2026, 3, 15, 14, 30, 15));
  });

  it("refuses a zone, an offset, an impossible day and 24:00", () => {
    for (const text of ["2026-03-15T14:30Z", "2026-03-15T14:30+05:30", "2026-02-30T10:00", "2026-03-15T24:00"]) {
      expect(parseISODateTime(text)).toBeNull();
    }
  });

  it("writes the datetime-local shape", () => {
    expect(toISODateTime(at(2026, 3, 5, 9, 7, 3))).toBe("2026-03-05T09:07");
    expect(toISODateTime(at(2026, 3, 5, 9, 7, 3), true)).toBe("2026-03-05T09:07:03");
  });

  it("toDateTime keeps a Date's time, and reads an ISO date as midnight", () => {
    const given = at(2026, 3, 15, 14, 30);
    const copy = toDateTime(given)!;
    expect(copy).toEqual(given);
    expect(copy).not.toBe(given);
    expect(toDateTime("2026-03-15")).toEqual(at(2026, 3, 15));
    expect(toDateTime("2026-03-15T08:45")).toEqual(at(2026, 3, 15, 8, 45));
    expect(toDateTime("nonsense")).toBeNull();
    expect(toDateTime(null)).toBeNull();
  });
});

describe("parseDateTime", () => {
  it("reads a date in the locale's order followed by a time", () => {
    expect(parseDateTime("15/03/2026 14:30", "en-GB")).toEqual({
      date: at(2026, 3, 15),
      time: { hours: 14, minutes: 30, seconds: 0 },
    });
    expect(parseDateTime("03/15/2026 2:30 PM", "en-US")?.time).toEqual({ hours: 14, minutes: 30, seconds: 0 });
  });

  it("reads back what the field itself displays", () => {
    for (const [locale, cycle] of [["en-US", 12], ["en-GB", 24], ["de-DE", 24]] as const) {
      const moment = at(2026, 3, 15, 14, 30);
      const shown = formatDateTime(moment, locale, { hourCycle: cycle, seconds: false });
      const read = parseDateTime(shown, locale)!;
      expect(withTime(read.date, read.time!)).toEqual(moment);
    }
  });

  it("leaves the time to the caller when none was typed", () => {
    expect(parseDateTime("15/03/2026", "en-GB")).toEqual({ date: at(2026, 3, 15), time: null });
  });

  it("refuses a time that is not one, rather than dropping it", () => {
    expect(parseDateTime("15/03/2026 25:00", "en-GB")).toBeNull();
  });
});

describe("bounds and display", () => {
  it("clamps to the second, not the day", () => {
    const min = at(2026, 3, 15, 9, 0);
    const max = at(2026, 3, 15, 17, 30);
    expect(clampDateTime(at(2026, 3, 15, 8, 0), min, max)).toEqual(min);
    expect(clampDateTime(at(2026, 3, 15, 18, 0), min, max)).toEqual(max);
    expect(clampDateTime(at(2026, 3, 15, 12, 0), min, max)).toEqual(at(2026, 3, 15, 12, 0));
  });

  it("follows the locale's clock unless told otherwise", () => {
    expect(hourCycleOf("en-US")).toBe(12);
    expect(hourCycleOf("en-GB")).toBe(24);
    expect(formatDateTime(at(2026, 3, 15, 14, 30), "en-GB", { hourCycle: 12, seconds: false })).toMatch(/2:30\s*pm/i);
  });

  it("hints at the shape to type", () => {
    expect(dateTimePlaceholder("en-GB", 24, false)).toBe("dd/mm/yyyy hh:mm");
    expect(dateTimePlaceholder("en-US", 12, true)).toBe("mm/dd/yyyy hh:mm:ss am");
  });
});
