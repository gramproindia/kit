import { describe, expect, it } from "vitest";
import { parseISODate, toDate, toISODate } from "../core/calendar";
import { formatDate, formatMonthYear, monthNames, parseDate } from "../core/format";
import { formatDateTime, parseDateTime, parseTime, toDateTime, toISODateTime } from "../core/time";

const iso = (date: Date | null) => (date ? toISODate(date) : null);

// What the field shows must read back. Every locale here passes for each
// shape below; none are known to fail.
const LOCALES = [
  "en-US", "en-GB", "de-DE", "fr-FR", "es-ES", "it-IT", "nl-NL", "pt-BR", "ru-RU", "pl-PL",
  "ja-JP", "zh-CN", "zh-TW", "ko-KR", "ar-EG", "ar-SA", "hi-IN", "bn-BD", "tr-TR", "sv-SE",
  "fi-FI", "cs-CZ", "bg-BG", "he-IL", "th-TH", "vi-VN", "uk-UA", "hu-HU", "el-GR", "fa-IR",
  "id-ID", "da-DK", "nb-NO", "ro-RO", "ca-ES", "lt-LT", "lv-LV", "et-EE", "sk-SK", "hr-HR",
  "sr-RS", "mr-IN", "ta-IN", "ur-PK", "ms-MY",
];

const DATE_SHAPES: (Intl.DateTimeFormatOptions | undefined)[] = [
  undefined,
  { year: "numeric", month: "long", day: "numeric" },
  { year: "numeric", month: "2-digit", day: "2-digit" },
  { dateStyle: "full" },
];

describe("format, then parse", () => {
  const day = new Date(2026, 2, 15);
  const moment = new Date(2026, 2, 15, 14, 30);
  const reference = new Date(2020, 0, 1);

  it.each(LOCALES)("reads back its own dates in %s", (locale) => {
    for (const shape of DATE_SHAPES) {
      const shown = formatDate(day, locale, shape);
      expect(iso(parseDate(shown, locale, reference)), shown).toBe("2026-03-15");
    }
  });

  it.each(LOCALES)("reads back its own date-times in %s", (locale) => {
    for (const hourCycle of [12, 24] as const) {
      const shown = formatDateTime(moment, locale, { hourCycle, seconds: false });
      const read = parseDateTime(shown, locale, reference);
      expect(iso(read?.date ?? null), shown).toBe("2026-03-15");
      expect(read?.time, shown).toEqual({ hours: 14, minutes: 30, seconds: 0 });
    }
  });

  it("still refuses words that are not a month", () => {
    expect(parseDate("hello 2026", "en-GB", reference)).toBeNull();
    expect(parseDate("15 foo 2026", "es-ES", reference)).toBeNull();
  });

  it("reads Arabic-Indic and Persian digits in any locale", () => {
    expect(iso(parseDate("١٥/٠٣/٢٠٢٦", "en-GB", reference))).toBe("2026-03-15");
    expect(iso(parseDate("۱۵/۰۳/۲۰۲۶", "en-GB", reference))).toBe("2026-03-15");
  });
});

describe("Gregorian everywhere", () => {
  it("names Gregorian months and years whatever the locale's own calendar", () => {
    expect(monthNames("fa-IR")[2]).toBe(new Intl.DateTimeFormat("fa-IR", { month: "long", calendar: "gregory" }).format(new Date(2024, 2, 1)));
    expect(formatMonthYear(2026, 2, "th-TH")).toContain("2026");
    expect(formatDate(new Date(2026, 2, 15), "th-TH")).toContain("2026");
  });
});

describe("zoned ISO strings", () => {
  it("keep the day they name, in every time zone", () => {
    expect(iso(toDate("2026-03-10T23:00:00Z"))).toBe("2026-03-10");
    expect(iso(toDate("2026-03-10T00:00:00Z"))).toBe("2026-03-10");
    expect(iso(toDate("2026-03-10T00:00:00.000-05:00"))).toBe("2026-03-10");
  });

  it("keep the wall-clock time they name", () => {
    expect(toISODateTime(toDateTime("2026-03-10T23:00:00Z")!)).toBe("2026-03-10T23:00");
    expect(toISODateTime(toDateTime("2026-03-10T08:15:30+05:30")!, true)).toBe("2026-03-10T08:15:30");
  });
});

describe("years before 1000", () => {
  it("round-trip through ISO", () => {
    const date = parseISODate("0025-06-01");
    expect(date?.getFullYear()).toBe(25);
    expect(iso(date)).toBe("0025-06-01");
  });
});

describe("hostile input", () => {
  // These took seconds before the patterns were made linear.
  const attacks = [
    `x${" ".repeat(4000)}x 14:30`,
    `1:00${" ".repeat(4000)}x`,
    `${",".repeat(4000)}x 1:00`,
    `1${" ".repeat(2000)}a${" ".repeat(2000)}x`,
    "1:00 ".repeat(1000),
  ];

  it("is refused at once, not after a long search", () => {
    for (const text of attacks) {
      const start = performance.now();
      expect(parseDateTime(text, "en-US")).toBeNull();
      expect(parseDate(text, "en-US")).toBeNull();
      expect(parseTime(text)).toBeNull();
      expect(performance.now() - start).toBeLessThan(50);
    }
  });

  it("is quick even just under the length limit", () => {
    const text = `x${" ".repeat(90)}x 14:30`;
    const start = performance.now();
    for (let index = 0; index < 100; index++) parseDateTime(text, "en-US");
    expect(performance.now() - start).toBeLessThan(200);
  });
});
