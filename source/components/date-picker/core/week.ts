/**
 * First day of the week from a locale tag alone, for runtimes where
 * `Intl.Locale` has no week info: Hermes (React Native) has no `Intl.Locale` at
 * all, and Firefox has no `getWeekInfo`. Without this they all start on Monday,
 * which is wrong for India, the US and most of the Gulf.
 *
 * Data: CLDR 46 `weekData/firstDay` (Node 22, ICU 76.1). Regions not listed
 * start on Monday. A test compares every region against `Intl.Locale`, so a
 * CLDR change shows up as a failing test, not a silent drift.
 */

const FRIDAY = "MV";
const SATURDAY = "AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY";
const SUNDAY =
  "AG AS BD BR BS BT BU BW BZ CA CO DM DO ET GT GU HK HN ID IL IN JM JP JT KE KH KR LA MH MI " +
  "MM MO MT MX MZ NI NP NT PA PE PH PK PR PT PU PY PZ RH SA SG SV TH TT TW UM US VE VI WK WS " +
  "YD YE ZA ZW";

let byRegion: Map<string, number> | undefined;

function regionTable(): Map<string, number> {
  if (!byRegion) {
    byRegion = new Map();
    for (const region of SUNDAY.split(" ")) byRegion.set(region, 0);
    for (const region of SATURDAY.split(" ")) byRegion.set(region, 6);
    byRegion.set(FRIDAY, 5);
  }
  return byRegion;
}

/**
 * The region a bare language means, for languages whose usual region does not
 * start on Monday (CLDR likely subtags). `"hi"` means India, so Sunday.
 */
const LIKELY_REGION: Record<string, string> = {
  af: "ZA", am: "ET", ar: "EG", as: "IN", bn: "BD", dv: "MV", en: "US", fa: "IR",
  fil: "PH", gu: "IN", he: "IL", hi: "IN", id: "ID", ja: "JP", jv: "ID", km: "KH",
  kn: "IN", ko: "KR", kok: "IN", lo: "LA", mai: "IN", ml: "IN", mr: "IN", my: "MM",
  ne: "NP", or: "IN", pa: "IN", ps: "AF", pt: "BR", sd: "PK", su: "ID", ta: "IN",
  te: "IN", th: "TH", ur: "PK", yue: "HK", zu: "ZA",
};

const FW_DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** 0 = Sunday … 6 = Saturday, read from a BCP 47 tag such as `en-IN` or `ar`. */
export function weekStartFromTag(tag: string): number {
  const subtags = tag.split(/[-_]/);
  const language = subtags[0]?.toLowerCase() ?? "";

  // An explicit `-u-fw-sun` wins, as it does in Intl.Locale.
  const unicode = subtags.findIndex((part) => part.toLowerCase() === "u");
  if (unicode !== -1) {
    const fw = subtags.findIndex((part, i) => i > unicode && part.toLowerCase() === "fw");
    const day = fw === -1 ? -1 : FW_DAYS.indexOf(subtags[fw + 1]?.toLowerCase() ?? "");
    if (day !== -1) return day;
  }

  let region: string | undefined;
  for (const part of subtags.slice(1)) {
    if (part.length === 1) break; // an extension starts; no region after it
    if (/^[A-Za-z]{2}$/.test(part) || /^\d{3}$/.test(part)) {
      region = part.toUpperCase();
      break;
    }
  }
  region ??= LIKELY_REGION[language];
  if (!region) return 1;
  return regionTable().get(region) ?? 1;
}
