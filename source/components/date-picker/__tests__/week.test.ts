import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveWeekStart } from "../core/calendar";
import { weekStartFromTag } from "../core/week";

// Node has full week data; it is the oracle for the fallback table.
function intlWeekStart(tag: string): number {
  const locale = new Intl.Locale(tag) as Intl.Locale & {
    getWeekInfo?: () => { firstDay: number };
    weekInfo?: { firstDay: number };
  };
  return (locale.getWeekInfo?.() ?? locale.weekInfo)!.firstDay % 7;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const REGIONS = [...LETTERS].flatMap((a) => [...LETTERS].map((b) => a + b));

const LANGUAGES = (
  "en ar ja zh ko hi bn pt he th id fa ml ta te kn mr gu pa ur ne my km lo am es fr de it ru " +
  "tr vi ms fil sw zu af si dv ps sd as or kok mai jv su yue nl pl sv uk el"
).split(" ");

afterEach(() => vi.unstubAllGlobals());

describe("weekStartFromTag", () => {
  it("matches Intl for every two-letter region", () => {
    // The table follows CLDR 48. An older runtime (Node's ICU, the CLDR it
    // ships) still has the previous answer for the regions that changed.
    const runtime = globalThis as { process?: { versions?: { cldr?: string } } };
    const cldr = Number(runtime.process?.versions?.cldr ?? "0");
    const changedIn48 = new Set(cldr < 48 ? ["IS"] : []);
    const wrong = REGIONS.filter(
      (r) => !changedIn48.has(r) && weekStartFromTag(`und-${r}`) !== intlWeekStart(`und-${r}`),
    );
    expect(wrong).toEqual([]);
  });

  it("matches Intl for a bare language", () => {
    const wrong = LANGUAGES.filter((l) => weekStartFromTag(l) !== intlWeekStart(l));
    expect(wrong).toEqual([]);
  });

  it("reads the region from a full tag", () => {
    expect(weekStartFromTag("en-IN")).toBe(0);
    expect(weekStartFromTag("en-GB")).toBe(1);
    expect(weekStartFromTag("ar-EG")).toBe(6);
    expect(weekStartFromTag("ar-MA")).toBe(1);
    expect(weekStartFromTag("zh-Hant-TW")).toBe(0);
    expect(weekStartFromTag("en_US")).toBe(0);
    expect(weekStartFromTag("es-419")).toBe(1);
  });

  it("honours -u-fw-", () => {
    expect(weekStartFromTag("en-US-u-fw-mon")).toBe(1);
    expect(weekStartFromTag("de-DE-u-ca-gregory-fw-sun")).toBe(0);
  });

  it("is Monday for anything unknown", () => {
    expect(weekStartFromTag("xx")).toBe(1);
    expect(weekStartFromTag("")).toBe(1);
  });
});

describe("resolveWeekStart without Intl.Locale (Hermes)", () => {
  it("falls back to the tag", () => {
    vi.stubGlobal("Intl", { DateTimeFormat: Intl.DateTimeFormat });
    expect(resolveWeekStart("en-IN")).toBe(0);
    expect(resolveWeekStart("ar-EG")).toBe(6);
    expect(resolveWeekStart("de-DE")).toBe(1);
    expect(resolveWeekStart("ml")).toBe(0);
    expect(resolveWeekStart(undefined, 3)).toBe(3);
  });
});
