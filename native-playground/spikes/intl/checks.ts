// Spike S1: does Hermes have the Intl that Kit's core relies on?
//
// Runs Kit's real core functions, not hand-written Intl calls, so the answer is
// "does Kit work", not "does Intl work". The same file runs in Node (full ICU,
// gives the expected values) and on a phone (gives the actual values).
import {
  dayPeriodNames,
  fieldOrder,
  formatDate,
  formatDateTime,
  formatMonthYear,
  hourCycleOf,
  inputPlaceholder,
  monthNames,
  parseDate,
  parseDateTime,
  resolveWeekStart,
  weekdayNames,
} from "../../../source/components/date-picker/core";
import {
  formatNumber,
  localeParts,
  parseNumber,
} from "../../../source/components/number-input/core";
import { countCharacters } from "../../../source/components/shared/core/text";
import { initials } from "../../../source/components/avatar/core/identity";

export const LOCALES = [
  "en-US",
  "en-IN",
  "en-GB",
  "ml-IN",
  "hi-IN",
  "ta-IN",
  "ar-EG",
  "de-DE",
  "fr-FR",
  "ja-JP",
] as const;

export type Results = Record<string, unknown>;

function safe(run: () => unknown): unknown {
  try {
    return run();
  } catch (error) {
    return `THROWS: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/** What exists at all. Differences here explain the per-locale differences. */
export function features(): Results {
  const anyIntl = Intl as unknown as Record<string, unknown>;
  const locale = safe(() => new (anyIntl.Locale as typeof Intl.Locale)("en-IN")) as
    | (Intl.Locale & { getWeekInfo?: () => unknown; weekInfo?: unknown })
    | string;
  return {
    "Intl.DateTimeFormat": typeof Intl.DateTimeFormat,
    "Intl.NumberFormat": typeof Intl.NumberFormat,
    "Intl.Collator": typeof anyIntl.Collator,
    "Intl.Locale": typeof anyIntl.Locale,
    "Intl.Segmenter": typeof anyIntl.Segmenter,
    "Intl.PluralRules": typeof anyIntl.PluralRules,
    "Intl.RelativeTimeFormat": typeof anyIntl.RelativeTimeFormat,
    "Locale.getWeekInfo":
      typeof locale === "object" ? typeof locale.getWeekInfo + "/" + typeof locale.weekInfo : locale,
    "DTF.formatToParts": typeof Intl.DateTimeFormat.prototype.formatToParts,
    "NF.formatToParts": typeof Intl.NumberFormat.prototype.formatToParts,
    "DTF.resolvedOptions.hourCycle": safe(
      () => new Intl.DateTimeFormat("en-US", { hour: "numeric" }).resolvedOptions().hourCycle,
    ),
    "supportedLocalesOf(ml,hi,ta,ar)": safe(() =>
      Intl.DateTimeFormat.supportedLocalesOf(["ml-IN", "hi-IN", "ta-IN", "ar-EG"]),
    ),
  };
}

const DAY = new Date(2024, 10, 22); // 22 Nov 2024
const MOMENT = new Date(2024, 10, 22, 21, 5, 9);

/** Kit's behaviour per locale. These are the values that must match Node. */
export function perLocale(locale: string): Results {
  return {
    fieldOrder: safe(() => fieldOrder(locale).join("-")),
    placeholder: safe(() => inputPlaceholder(locale)),
    hourCycle: safe(() => hourCycleOf(locale)),
    dayPeriods: safe(() => dayPeriodNames(locale).join("|")),
    weekStart: safe(() => resolveWeekStart(locale)),
    months: safe(() => monthNames(locale).slice(0, 3).join("|")),
    weekdays: safe(() =>
      weekdayNames(locale)
        .slice(0, 3)
        .map((w) => w.short ?? JSON.stringify(w))
        .join("|"),
    ),
    formatDate: safe(() => formatDate(DAY, locale)),
    monthYear: safe(() => formatMonthYear(2024, 10, locale)),
    dateTime12: safe(() => formatDateTime(MOMENT, locale, { hourCycle: 12, seconds: false })),
    dateTime24: safe(() => formatDateTime(MOMENT, locale, { hourCycle: 24, seconds: true })),
    parseOwnDate: safe(() => {
      const shown = formatDate(DAY, locale, { year: "numeric", month: "2-digit", day: "2-digit" });
      const back = parseDate(shown, locale);
      return back ? `${shown} -> ${back.toDateString()}` : `${shown} -> null`;
    }),
    // Hermes writes a narrow no-break space before AM/PM; what it shows must still parse.
    dateTimeRoundTrip: safe(() => {
      const shown = formatDateTime(MOMENT, locale, {
        hourCycle: 12,
        seconds: false,
        dateFormat: { year: "numeric", month: "2-digit", day: "2-digit" },
      });
      const back = parseDateTime(shown, locale);
      return back?.time
        ? `${back.date.toDateString()} ${back.time.hours}:${back.time.minutes}`
        : `null (${shown})`;
    }),
    numberParts: safe(() => {
      const p = localeParts(locale);
      return `group=${JSON.stringify(p.group)} decimal=${p.decimal} minus=${JSON.stringify(p.minus)} digits=${p.digits.join("")}`;
    }),
    formatNumber: safe(() => formatNumber(1234567.891, { locale, decimals: 2 })),
    currencyINR: safe(() => formatNumber(1234567.5, { locale, style: "currency", currency: "INR" })),
    roundTrip: safe(() => {
      const shown = formatNumber(-1234567.25, { locale, decimals: 2 });
      return `${shown} -> ${parseNumber(shown, locale)}`;
    }),
  };
}

/** Text handling that falls back when Segmenter is missing. */
export function text(): Results {
  return {
    "countCharacters(family emoji + é + 👍🏽)": countCharacters("👨‍👩‍👧 é 👍🏽"),
    "initials(Anand Remanan)": safe(() => initials("Anand Remanan")),
    "initials(അനന്തു രമണൻ)": safe(() => initials("അനന്തു രമണൻ")),
    "initials(🙂 Smile Team)": safe(() => initials("🙂 Smile Team")),
    "collator numeric sort": safe(() =>
      ["item 10", "Item 2", "item 1"]
        .sort(new Intl.Collator("en", { numeric: true, sensitivity: "base" }).compare)
        .join(", "),
    ),
  };
}

export function runAll(): Results {
  const results: Results = {};
  for (const [key, value] of Object.entries(features())) results[`feature: ${key}`] = value;
  for (const [key, value] of Object.entries(text())) results[`text: ${key}`] = value;
  for (const locale of LOCALES) {
    for (const [key, value] of Object.entries(perLocale(locale))) results[`${locale}: ${key}`] = value;
  }
  return results;
}
