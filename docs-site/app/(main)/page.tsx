import type { Metadata } from "next";
import { BRAND, HOME_TITLE } from "./_lib/seo";
import { v2Config } from "./_lib/config";
import { DEFAULT_LOCALE, homeHref, LOCALE_CODES } from "./_lib/i18n";
import { Overview } from "./_components/Overview";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: v2Config.description,
  // Stated here, not inherited: shared links and previews should say React
  // Native too, and an inherited openGraph carries no title or description.
  openGraph: {
    title: HOME_TITLE,
    description: v2Config.description,
    type: "website",
    url: "/",
    siteName: `${v2Config.name} Docs`,
    images: [{ url: BRAND.ogImage, width: 1200, height: 630, alt: HOME_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: v2Config.description,
    images: [BRAND.ogImage],
  },
  alternates: {
    canonical: homeHref(DEFAULT_LOCALE),
    languages: Object.fromEntries(LOCALE_CODES.map((code) => [code, homeHref(code)])),
  },
};

/** English landing page. Other locales are served by [...slug], e.g. /2.0.0-beta/ml. */
export default function Page() {
  return <Overview locale={DEFAULT_LOCALE} />;
}
