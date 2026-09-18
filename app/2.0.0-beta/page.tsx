import type { Metadata } from "next";
import { v2Config } from "./_lib/config";
import { DEFAULT_LOCALE, homeHref, LOCALE_CODES } from "./_lib/i18n";
import { Overview } from "./_components/Overview";

export const metadata: Metadata = {
  title: { absolute: `${v2Config.name} ${v2Config.version} Docs` },
  alternates: {
    canonical: homeHref(DEFAULT_LOCALE),
    languages: Object.fromEntries(LOCALE_CODES.map((code) => [code, homeHref(code)])),
  },
};

/** English landing page. Other locales are served by [...slug], e.g. /2.0.0-beta/ml. */
export default function Page() {
  return <Overview locale={DEFAULT_LOCALE} />;
}
