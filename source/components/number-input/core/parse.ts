/**
 * Reading numbers the way the person in front of the screen writes them.
 *
 * This is the reason the component exists. `<input type="number">` understands
 * one notation, roughly the C locale's, so a German typing `1.234,56` or an
 * Egyptian typing `١٢٣٤` hands it something it calls invalid — and an invalid
 * number input reports its value as the empty string, which loses what was
 * typed as well as the meaning.
 *
 * Every part of a locale's notation is discovered from `Intl` rather than
 * listed here: format a known number, look at the pieces that come back, and
 * you have that locale's group separator, decimal separator, minus sign and
 * digits, for any locale the runtime supports.
 */

import { decimalsOf } from "./step";

export interface NumberLocaleParts {
  group: string;
  decimal: string;
  minus: string;
  /** The locale's digits, ASCII 0-9 in order. Latin digits for most locales. */
  digits: readonly string[];
}

const partsCache = new Map<string, NumberLocaleParts>();

function partValue(parts: Intl.NumberFormatPart[], type: Intl.NumberFormatPartTypes, fallback: string) {
  return parts.find((part) => part.type === type)?.value ?? fallback;
}

/** The notation one locale uses, read out of `Intl` once and kept. */
export function localeParts(locale?: string): NumberLocaleParts {
  const key = locale ?? "";
  const cached = partsCache.get(key);
  if (cached) return cached;

  const format = new Intl.NumberFormat(locale);
  const sample = format.formatToParts(-12345.6);
  const digits = Array.from({ length: 10 }, (_, index) =>
    format.format(index).replace(/\s/g, ""),
  );

  const parts: NumberLocaleParts = {
    group: partValue(sample, "group", ","),
    decimal: partValue(sample, "decimal", "."),
    minus: partValue(sample, "minusSign", "-"),
    digits,
  };
  partsCache.set(key, parts);
  return parts;
}

/** Turns a locale's digits into 0-9, leaving everything else alone. */
function toAsciiDigits(text: string, digits: readonly string[]): string {
  if (digits[0] === "0") return text;
  let result = "";
  for (const character of text) {
    const index = digits.indexOf(character);
    result += index === -1 ? character : String(index);
  }
  return result;
}

const currencyCache = new Map<string, string[]>();

/** Every way `locale` writes `currency`: "$", "US$", "USD", "zł", "ج.م.". Longest first. */
function currencySigns(locale: string | undefined, currency: string): string[] {
  const key = `${locale ?? ""}|${currency}`;
  const cached = currencyCache.get(key);
  if (cached) return cached;
  const signs = new Set<string>([currency]);
  for (const currencyDisplay of ["symbol", "narrowSymbol", "code"] as const) {
    try {
      const parts = new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay }).formatToParts(1);
      const sign = parts.find((part) => part.type === "currency")?.value;
      if (sign) signs.add(sign);
    } catch {
      // An unknown code or an old runtime: the code itself is still listed.
    }
  }
  const sorted = [...signs].sort((a, b) => b.length - a.length);
  currencyCache.set(key, sorted);
  return sorted;
}

const MINUS = /^[-−‐‑]/u;
/** Currency symbols, percent and per-mille signs, which may sit either side of a number. */
const SIGNS = /^[\p{Sc}%‰٪]+|[\p{Sc}%‰٪]+$/gu;

/**
 * Reads what was typed, in the notation of `locale`.
 *
 * Returns `null` for anything that is not a number, including an empty field —
 * the component keeps those apart by looking at the text, so an unreadable
 * entry never silently becomes "nothing".
 *
 * Currency symbols, percent signs and stray spaces are ignored, so a pasted
 * `"$1,234.56"` or `"45 %"` is read rather than rejected; pass `currency` to
 * also accept the ones written in letters, like `"zł"` or `"CHF"`. Any other
 * letter, a minus anywhere but the front, or a second decimal separator makes
 * it not a number: `"1e3"`, `"5-3"` and `"1.2.3"` are refused, not guessed at.
 *
 * A keypad that only offers the device's separator is allowed for: with no
 * decimal separator of the locale's own, a single `.` or `,` that is not
 * followed by exactly three digits is read as the decimal point, so `"1,5"`
 * is 1.5 in en-US while `"1,500"` is still fifteen hundred.
 */
export function parseNumber(text: string, locale?: string, currency?: string): number | null {
  const parts = localeParts(locale);
  // Direction marks go first: Arabic writes them around the minus.
  let value = toAsciiDigits(text.replace(/\p{Cf}/gu, "").trim(), parts.digits);
  if (value === "") return null;

  if (currency) {
    for (const sign of currencySigns(locale, currency)) value = value.split(sign).join(" ");
  }
  // Every kind of space, including the narrow no-break space French and German
  // use as a group separator, and the ordinary one people type by hand.
  value = value.replace(/\s/gu, "");

  // One sign, at the front, before or after a currency symbol: "-$5", "€-5".
  let negative = false;
  const takeSign = () => {
    if (negative) return;
    if (parts.minus && value.startsWith(parts.minus)) {
      value = value.slice(parts.minus.length);
      negative = true;
    } else if (MINUS.test(value)) {
      value = value.slice(1);
      negative = true;
    } else if (value.startsWith("+")) {
      value = value.slice(1);
    }
  };
  takeSign();
  value = value.replace(SIGNS, "");
  takeSign();

  value = withDecimalPoint(value, parts);
  // Only digits and one point may be left; anything else is not a number.
  if (!/^\d*\.?\d*$/.test(value) || !/\d/.test(value)) return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
}

/** Group separators gone, the decimal separator made a point. */
function withDecimalPoint(text: string, parts: NumberLocaleParts): string {
  let value = text;
  if (!value.includes(parts.decimal)) {
    for (const other of [".", ","]) {
      if (other === parts.decimal) continue;
      const at = value.indexOf(other);
      if (at === -1 || at !== value.lastIndexOf(other)) continue;
      const otherAlso = [".", ","].some((mark) => mark !== other && value.includes(mark));
      const digitsAfter = value.slice(at + 1).match(/^\d*/)![0].length;
      if (!otherAlso && (other !== parts.group || digitsAfter !== 3)) {
        return value.replace(other, ".");
      }
    }
  }
  // Group separators go; the locale's decimal separator becomes a point. Doing
  // it in this order matters where one locale's group is another's decimal.
  if (parts.group !== "") value = value.split(parts.group).join("");
  if (parts.decimal !== ".") value = value.split(parts.decimal).join(".");
  return value;
}

/** Plain digits for any finite number, never `1e-7` or `1e+21`. */
function plainDigits(value: number): string {
  const text = String(value);
  if (!/e/i.test(text)) return text;
  if (Math.abs(value) >= 1) return BigInt(Math.round(value)).toString();
  return value.toFixed(Math.min(decimalsOf(value), 100));
}

/**
 * The text a number is edited as: the locale's decimal separator, no grouping
 * and no currency symbol.
 *
 * Editing text and reading text are different jobs. Separators inserted while
 * someone is typing move the caret out from under their fingers, so the field
 * shows the plain form while it has focus and the formatted one the rest of
 * the time.
 */
export function toEditText(value: number | null, locale?: string): string {
  if (value === null || Number.isNaN(value)) return "";
  const parts = localeParts(locale);
  const text = plainDigits(value);
  return parts.decimal === "." ? text : text.replace(".", parts.decimal);
}
