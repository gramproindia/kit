import { parseISODate } from "./calendar";

/** `Intl.DateTimeFormat` is expensive to build, and these are reused every render. */
const formatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Always Gregorian. The grid is a Gregorian month, so every name and year
 * around it must be too: left to the locale, fa-IR writes Persian months and
 * th-TH Buddhist years over the same grid.
 */
function formatter(locale: string | undefined, options: Intl.DateTimeFormatOptions) {
  const settled: Intl.DateTimeFormatOptions = { ...options, calendar: "gregory" };
  const key = `${locale ?? ""}|${JSON.stringify(settled)}`;
  let found = formatters.get(key);
  if (!found) {
    found = new Intl.DateTimeFormat(locale, settled);
    formatters.set(key, found);
  }
  return found;
}

export const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};
export const DEFAULT_INPUT_PLACEHOLDER = "dd/mm/yyyy";

/**
 * The longest text the field reads. A real date, even a long weekday-and-month
 * one with a time, is well under this; anything longer is refused before any
 * pattern runs on it, so a pasted wall of text costs nothing.
 */
export const MAX_DATE_TEXT_LENGTH = 100;

export function formatDate(
  date: Date,
  locale?: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_FORMAT,
): string {
  return formatter(locale, options).format(date);
}

export function formatMonthYear(year: number, month: number, locale?: string): string {
  return formatter(locale, { year: "numeric", month: "long" }).format(new Date(year, month, 1));
}

export function monthNames(locale?: string, width: "long" | "short" = "long"): string[] {
  const format = formatter(locale, { month: width });
  return Array.from({ length: 12 }, (_, month) => format.format(new Date(2024, month, 1)));
}

export interface WeekdayName {
  short: string;
  long: string;
}

/** The seven weekday names, ordered from `weekStartsOn`. */
export function weekdayNames(locale?: string, weekStartsOn = 1): WeekdayName[] {
  const short = formatter(locale, { weekday: "short" });
  const long = formatter(locale, { weekday: "long" });
  // 2024-01-07 was a Sunday, so index 0 lines up with `Date.prototype.getDay`.
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(2024, 0, 7 + ((weekStartsOn + offset) % 7));
    return { short: short.format(date), long: long.format(date) };
  });
}

export type DateField = "day" | "month" | "year";

/** The order a locale writes a numeric date in, used for parsing and the placeholder. */
export function fieldOrder(locale?: string): DateField[] {
  const parts = formatter(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(2024, 10, 22));
  const order = parts
    .map((part) => part.type)
    .filter((type): type is DateField => type === "day" || type === "month" || type === "year");
  return order.length === 3 ? order : ["day", "month", "year"];
}

function separator(locale?: string): string {
  const parts = formatter(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(2024, 10, 22));
  const literal = parts.find((part) => part.type === "literal" && part.value.trim());
  return literal ? literal.value.trim() : "/";
}

/** A hint in the locale's own order, e.g. `dd/mm/yyyy` or `mm/dd/yyyy`. */
export function inputPlaceholder(locale?: string): string {
  if (!locale) return DEFAULT_INPUT_PLACEHOLDER;
  const hint: Record<DateField, string> = { day: "dd", month: "mm", year: "yyyy" };
  return fieldOrder(locale)
    .map((field) => hint[field])
    .join(separator(locale));
}

/* ------------------------------------------------------------- reading */

const ASCII_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const digitSets = new Map<string, readonly string[]>();

/** The digits a locale writes, 0-9 in order: ٠-٩ in ar-EG, ۰-۹ in fa-IR. */
function localeDigits(locale?: string): readonly string[] {
  const key = locale ?? "";
  let digits = digitSets.get(key);
  if (!digits) {
    try {
      const format = new Intl.NumberFormat(locale, { useGrouping: false });
      digits = ASCII_DIGITS.map((_, index) => format.format(index));
    } catch {
      digits = ASCII_DIGITS;
    }
    digitSets.set(key, digits);
  }
  return digits;
}

/**
 * Text as the parser wants it: the locale's digits (and Arabic-Indic or
 * Persian ones, which keyboards produce whatever the locale) as 0-9, and
 * the invisible direction marks Arabic and Hebrew formats carry removed.
 */
export function normalizeDateText(text: string, locale?: string): string {
  const digits = localeDigits(locale);
  let result = "";
  for (const character of text.replace(/\p{Cf}/gu, "")) {
    const code = character.charCodeAt(0);
    if (code >= 0x660 && code <= 0x669) result += String(code - 0x660);
    else if (code >= 0x6f0 && code <= 0x6f9) result += String(code - 0x6f0);
    else {
      const index = digits[0] === "0" ? -1 : digits.indexOf(character);
      result += index === -1 ? character : String(index);
    }
  }
  return result;
}

/** Letters with their combining marks, so Hindi and Thai words stay whole. */
const WORD = /[\p{L}\p{M}]+/gu;
const wordsOf = (text: string): string[] => text.toLowerCase().match(WORD) ?? [];

/**
 * Words that sit between the numbers but never name a month: what people type
 * before a time ("at", "um", "à", "a las", "alle", "om") and the CJK markers
 * for year, month and day.
 */
const CONNECTORS = ["at", "um", "à", "a", "las", "alle", "om", "年", "月", "日", "년", "월", "일"];

interface Vocabulary {
  /** Month names, each with the one month it names. Long names first. */
  months: { name: string; month: number }[];
  /** Words a locale writes around a date that carry no meaning: "de", "г", "klo". */
  fillers: Set<string>;
  weekdays: Set<string>;
  /** Fillers and weekdays, longest first, for words with no spaces between them. */
  pieces: string[];
}

/** A word that says nothing about which day: a filler, a weekday, or a run of them. */
function isNoise(word: string, vocab: Vocabulary): boolean {
  if (vocab.fillers.has(word) || vocab.weekdays.has(word)) return true;
  let rest = word;
  for (const piece of vocab.pieces) rest = rest.split(piece).join("");
  return rest === "";
}

/**
 * Drops words after the last number that only a locale's format puts there,
 * like Bulgarian "г." after the year or "ч." after the hour.
 */
export function stripTrailingFillers(text: string, locale?: string): string {
  const vocab = vocabulary(locale);
  let rest = text.trimEnd();
  // Bounded by MAX_DATE_TEXT_LENGTH at every caller.
  for (;;) {
    const match = /([\p{L}\p{M}]+)[^\p{L}\p{M}\d]*$/u.exec(rest);
    if (!match || !vocab.fillers.has(match[1].toLowerCase())) return rest;
    rest = rest.slice(0, match.index).trimEnd();
  }
}

const vocabularies = new Map<string, Vocabulary>();

/**
 * What the words in a typed date can mean in one locale, read out of `Intl`
 * by formatting known dates and keeping the pieces, so the field accepts back
 * whatever it showed.
 */
function vocabulary(locale?: string): Vocabulary {
  const key = locale ?? "";
  const cached = vocabularies.get(key);
  if (cached) return cached;

  const fillers = new Set(CONNECTORS);
  const sample = new Date(2024, 10, 22, 14, 30);
  const literalShapes: Intl.DateTimeFormatOptions[] = [
    DEFAULT_DATE_FORMAT,
    { year: "numeric", month: "long", day: "numeric" },
    { year: "numeric", month: "2-digit", day: "2-digit" },
    { ...DEFAULT_DATE_FORMAT, hour: "numeric", minute: "2-digit", hourCycle: "h23" },
    { ...DEFAULT_DATE_FORMAT, hour: "numeric", minute: "2-digit", hourCycle: "h12" },
    { dateStyle: "full", timeStyle: "short" },
    { dateStyle: "long", timeStyle: "short" },
  ];
  for (const options of literalShapes) {
    try {
      for (const part of formatter(locale, options).formatToParts(sample)) {
        // The era too: Thai writes "ค.ศ." once the calendar is Gregorian.
        if (part.type === "literal" || part.type === "era") {
          for (const word of wordsOf(part.value)) fillers.add(word);
        }
      }
    } catch {
      // A runtime without dateStyle still has the plainer shapes.
    }
  }

  // Standalone names ("март") and the forms used inside a date ("марта",
  // Hebrew "במרץ"), long before short so a full name wins a prefix match.
  const owners = new Map<string, Set<number>>();
  const order: string[] = [];
  const add = (name: string | undefined, month: number) => {
    const words = wordsOf(name ?? "").join(" ");
    if (!words) return;
    if (!owners.has(words)) {
      owners.set(words, new Set());
      order.push(words);
    }
    owners.get(words)!.add(month);
  };
  for (const width of ["long", "short"] as const) {
    for (let month = 0; month < 12; month++) {
      const date = new Date(2024, month, 22);
      add(formatter(locale, { month: width }).format(date), month);
      const inDate = formatter(locale, { day: "numeric", month: width }).formatToParts(date);
      const at = inDate.findIndex((part) => part.type === "month");
      if (at === -1) continue;
      add(inDate[at].value, month);
      // Hebrew glues a prefix on: "15 במרץ" is "15 ב" + "מרץ".
      const before = inDate[at - 1];
      if (before?.type === "literal" && /[\p{L}\p{M}]$/u.test(before.value)) {
        add(wordsOf(before.value + inDate[at].value).pop(), month);
      }
    }
  }
  // A word shared by every month, like "thg" in Vietnamese "thg 3" or 月 in
  // "3月", names none of them: the number beside it does.
  const months: Vocabulary["months"] = [];
  for (const name of order) {
    const set = owners.get(name)!;
    if (set.size === 1) months.push({ name, month: [...set][0] });
    else for (const word of name.split(" ")) fillers.add(word);
  }

  const weekdays = new Set<string>();
  for (const { short, long } of weekdayNames(locale)) {
    for (const word of [...wordsOf(short), ...wordsOf(long)]) weekdays.add(word);
  }

  // Scripts written without spaces run a weekday into its neighbours
  // ("日曜日" after "15日", Thai "วันอาทิตย์ที่"), so those words are also
  // checked piece by piece. A lone Latin letter is too loose to be a piece.
  const pieces = [...fillers, ...weekdays]
    .filter((piece) => piece.length > 1 || !/\p{Script=Latin}/u.test(piece))
    .sort((a, b) => b.length - a.length);

  const result = { months, fillers, weekdays, pieces };
  vocabularies.set(key, result);
  return result;
}

/** Two-digit years follow the usual pivot: 00-68 is 2000s, 69-99 is 1900s. */
function expandYear(year: number): number {
  if (year >= 100) return year;
  return year <= 68 ? 2000 + year : 1900 + year;
}

function build(year: number, month: number, day: number): Date | null {
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  // setFullYear, because `new Date(25, 0, 1)` means 1925.
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month, day);
  date.setHours(0, 0, 0, 0);
  const valid =
    date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
  return valid ? date : null;
}

/** Matches a written month name, long or short, by either being a prefix of the other. */
function monthFromWords(words: string[], vocab: Vocabulary): number | null {
  const needle = words.join(" ");
  const exact = vocab.months.find(({ name }) => name === needle);
  if (exact) return exact.month;
  const prefix = vocab.months.find(({ name }) => name.startsWith(needle) || needle.startsWith(name));
  return prefix ? prefix.month : null;
}

/**
 * Reads what someone typed into the field. ISO is accepted everywhere; anything
 * else is read in the locale's field order, so `03/04/2026` is 3 April in
 * en-GB and 4 March in en-US. Month names work too (`12 Mar 2026`), as do the
 * locale's own digits and the words it writes around a date (`15 de marzo de
 * 2026`, `2026年3月15日`), so whatever the field displayed reads back.
 * Missing parts fall back to `reference`. Returns null when it isn't a date.
 */
export function parseDate(
  text: string,
  locale?: string,
  reference: Date = new Date(),
): Date | null {
  if (text.length > MAX_DATE_TEXT_LENGTH) return null;
  const trimmed = normalizeDateText(text, locale).trim();
  if (!trimmed) return null;

  const iso = parseISODate(trimmed);
  if (iso) return iso;

  let month: number | null = null;
  const vocab = vocabulary(locale);
  const words = wordsOf(trimmed).filter((word) => !vocab.fillers.has(word));
  if (words.length > 0) {
    month = monthFromWords(words, vocab);
    if (month === null) {
      // A weekday is fine to write and adds nothing; anything else is not a date.
      const rest = words.filter((word) => !isNoise(word, vocab));
      if (rest.length > 0) {
        month = monthFromWords(rest, vocab);
        if (month === null) return null;
      }
    }
  }

  const numbers = (trimmed.match(/\d+/g) ?? []).map(Number);
  if (numbers.length === 0) return null;

  const order = fieldOrder(locale);

  if (month !== null) {
    // A month name was given, so the numbers are the day and maybe the year.
    if (numbers.length === 1) {
      return build(reference.getFullYear(), month, numbers[0]);
    }
    const yearFirst = numbers[0] >= 32;
    const year = expandYear(yearFirst ? numbers[0] : numbers[1]);
    const day = yearFirst ? numbers[1] : numbers[0];
    return build(year, month, day);
  }

  if (numbers.length >= 3) {
    const fields = numbers[0] >= 1000 ? (["year", "month", "day"] as DateField[]) : order;
    const value = (field: DateField) => numbers[fields.indexOf(field)];
    return build(expandYear(value("year")), value("month") - 1, value("day"));
  }

  if (numbers.length === 2) {
    const dayFirst = order.indexOf("day") < order.indexOf("month");
    const day = dayFirst ? numbers[0] : numbers[1];
    const monthNumber = dayFirst ? numbers[1] : numbers[0];
    return build(reference.getFullYear(), monthNumber - 1, day);
  }

  return build(reference.getFullYear(), reference.getMonth(), numbers[0]);
}
