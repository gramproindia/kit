import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Malayalam } from "next/font/google";
import { getNav, type NavGroup } from "./_lib/docs";
import { v2Config } from "./_lib/config";
import { LOCALE_CODES, type Locale } from "./_lib/i18n";
import { SiteHeader } from "./_components/SiteHeader";
import { SiteFooter } from "./_components/SiteFooter";
import { SkipLink } from "./_components/SkipLink";
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

export const metadata: Metadata = {
  title: {
    template: `%s | ${v2Config.name} ${v2Config.version}`,
    default: `${v2Config.name} ${v2Config.version} Docs`,
  },
  description: v2Config.description,
};

export default async function V2Layout({ children }: { children: React.ReactNode }) {
  // The header sits above the locale segment, so it gets every locale's nav and
  // picks one from the path.
  const navs = Object.fromEntries(
    await Promise.all(LOCALE_CODES.map(async (locale) => [locale, await getNav(locale)] as const)),
  ) as Record<Locale, NavGroup[]>;

  return (
    <div className={`v2 ${sans.variable} ${mono.variable} ${malayalam.variable}`}>
      <SkipLink />
      <SiteHeader navs={navs} />
      {children}
      <SiteFooter />
    </div>
  );
}
