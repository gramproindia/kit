import { describe, expect, it } from "vitest";
import { parseNumber, toEditText } from "../core/parse";
import { shiftDecimal } from "../core/step";

describe("parseNumber refuses what is not a number", () => {
  it("rather than dropping the characters it does not know", () => {
    expect(parseNumber("1e3", "en-US")).toBeNull();
    expect(parseNumber("5-3", "en-US")).toBeNull();
    expect(parseNumber("12abc34", "en-US")).toBeNull();
    expect(parseNumber("--5", "en-US")).toBeNull();
    expect(parseNumber("12 kg", "en-US")).toBeNull();
  });

  it("still reads signs, symbols and a leading plus", () => {
    expect(parseNumber("-$5", "en-US")).toBe(-5);
    expect(parseNumber("€ -1.234,50", "nl-NL")).toBe(-1234.5);
    expect(parseNumber("+7", "en-US")).toBe(7);
    expect(parseNumber("−45 %", "sv-SE")).toBe(-45);
    expect(parseNumber("٤٥٪", "ar-EG")).toBe(45);
  });

  it("reads the locale's own negative, direction marks and all", () => {
    const shown = new Intl.NumberFormat("ar-EG").format(-1234.5);
    expect(parseNumber(shown, "ar-EG")).toBe(-1234.5);
  });

  it("accepts a currency written in letters when told the currency", () => {
    expect(parseNumber("-1234,50 zł", "pl-PL", "PLN")).toBe(-1234.5);
    expect(parseNumber("-R$ 1.234,50", "pt-BR", "BRL")).toBe(-1234.5);
    expect(parseNumber("CHF-1’234.50", "de-CH", "CHF")).toBe(-1234.5);
    // CLDR 48 groups de-CH with a plain apostrophe; either one reads.
    expect(parseNumber("CHF-1'234.50", "de-CH", "CHF")).toBe(-1234.5);
    expect(parseNumber("1'234'567", "de-CH")).toBe(1234567);
    expect(parseNumber("USD 12", "en-US", "USD")).toBe(12);
    // Without the currency, letters are letters.
    expect(parseNumber("12 zł", "pl-PL")).toBeNull();
  });
});

describe("parseNumber and the other separator", () => {
  it("reads a lone separator before other than three digits as the decimal point", () => {
    // A German phone typing into an en-US field can only produce a comma.
    expect(parseNumber("1,5", "en-US")).toBe(1.5);
    expect(parseNumber("0,25", "en-US")).toBe(0.25);
    expect(parseNumber("1.5", "de-DE")).toBe(1.5);
    expect(parseNumber("1.5", "fr-FR")).toBe(1.5);
  });

  it("keeps grouping where it is grouping", () => {
    expect(parseNumber("1,500", "en-US")).toBe(1500);
    expect(parseNumber("1,234,567", "en-US")).toBe(1234567);
    expect(parseNumber("1.234", "de-DE")).toBe(1234);
    expect(parseNumber("12,34,567", "en-IN")).toBe(1234567);
    expect(parseNumber("1.234,5", "de-DE")).toBe(1234.5);
  });
});

describe("toEditText never writes exponents", () => {
  it("for tiny or huge numbers", () => {
    expect(toEditText(1e-7, "en-US")).toBe("0.0000001");
    expect(toEditText(-1.5e-7, "de-DE")).toBe("-0,00000015");
    expect(toEditText(1e21, "en-US")).toBe("1000000000000000000000");
    expect(parseNumber(toEditText(1e-7, "en-US"), "en-US")).toBe(1e-7);
  });
});

describe("shiftDecimal", () => {
  it("moves the point without float noise, both ways", () => {
    expect(shiftDecimal(0.07, 2)).toBe(7);
    expect(shiftDecimal(0.45, 2)).toBe(45);
    expect(shiftDecimal(0.123, 2)).toBe(12.3);
    expect(shiftDecimal(45, -2)).toBe(0.45);
    expect(shiftDecimal(7, -2)).toBe(0.07);
    expect(shiftDecimal(12.3, -2)).toBe(0.123);
    expect(shiftDecimal(-0.5, 2)).toBe(-50);
  });

  it("round-trips a percentage typed as it is shown", () => {
    for (const shown of [0, 1, 7, 12.5, 33.33, 45, 99.99, 100, 250]) {
      expect(shiftDecimal(shiftDecimal(shown, -2), 2)).toBe(shown);
    }
  });
});
