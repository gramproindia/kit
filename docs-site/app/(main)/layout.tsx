import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Malayalam } from "next/font/google";
import { getNav, type NavGroup } from "./_lib/docs";
import { v2Config } from "./_lib/config";
import { getPublishedVersion } from "./_lib/version";
import { LOCALE_CODES, type Locale } from "./_lib/i18n";
import { SiteHeader } from "./_components/SiteHeader";
import { SiteFooter } from "./_components/SiteFooter";
import { SkipLink } from "./_components/SkipLink";
import { JsonLd } from "./_components/JsonLd";
import { HOME_TITLE, TITLE_TEMPLATE, siteGraph } from "./_lib/seo";
import "./v2.css";

const sans = Geist({ subsets: ["latin"], variable: "--v2-font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--v2-font-mono", display: "swap" });
// Malayalam text needs its own face; only fetched on pages that use it.
const malayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  variable: "--v2-font-malayalam",
  display: "swap",
  preload: false,
});

/*
 * Ownership tokens for Google Search Console and Bing Webmaster Tools, read
 * from the environment so they can be set in Vercel without a code change.
 * Bing matters as much as Google here: ChatGPT's search draws on Bing's
 * index, so a site Bing has not crawled is a site ChatGPT cannot cite.
 */
const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  title: {
    template: TITLE_TEMPLATE,
    default: HOME_TITLE,
  },
  description: v2Config.description,
  applicationName: v2Config.name,
  ...(google || bing
    ? {
        verification: {
          ...(google ? { google } : {}),
          ...(bing ? { other: { "msvalidate.01": bing } } : {}),
        },
      }
    : {}),
};

export default async function V2Layout({ children }: { children: React.ReactNode }) {
  // The header sits above the locale segment, so it gets every locale's nav and
  // picks one from the path.
  const [navs, version] = await Promise.all([
    Object.fromEntries(
      await Promise.all(LOCALE_CODES.map(async (locale) => [locale, await getNav(locale)] as const)),
    ) as Record<Locale, NavGroup[]>,
    getPublishedVersion(),
  ]);

  return (
    <div className={`v2 ${sans.variable} ${mono.variable} ${malayalam.variable}`}>
      <JsonLd data={siteGraph()} />
      <SkipLink />
      <SiteHeader navs={navs} version={version} />
      {children}
      <SiteFooter />
    </div>
  );
}
