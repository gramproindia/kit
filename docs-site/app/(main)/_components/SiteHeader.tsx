"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "../_lib/docs";
import { v2Config } from "../_lib/config";
import { Palette, Sparkles } from "lucide-react";
import { localeInfo, parsePath, sectionHref, type Locale } from "../_lib/i18n";
import { t } from "../_lib/strings";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { CommandMenu } from "./CommandMenu";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { GitHubIcon } from "./GitHubIcon";

/**
 * Client-side because the header sits above the locale segment in the route
 * tree: it reads the locale from the path and picks that locale's navigation.
 */
export function SiteHeader({ navs }: { navs: Record<Locale, NavGroup[]> }) {
  const pathname = usePathname();
  const { locale } = parsePath(pathname);
  const s = t(locale);
  const nav = navs[locale] ?? [];
  const firstDoc = nav[0]?.items[0];

  return (
    <header className="v2-header" lang={localeInfo(locale).htmlLang}>
      <div className="v2-container flex h-14 items-center gap-2 sm:gap-4">
        <MobileNav nav={nav} locale={locale} />
        <Logo locale={locale} />
        <span className="v2-pill">{v2Config.version}</span>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 text-sm lg:flex">
          {firstDoc && (
            <Link href={firstDoc.href} className="v2-top-link">
              {s.components}
            </Link>
          )}
          <Link href={sectionHref("playground", locale)} className="v2-top-link">
            {s.playground}
          </Link>
          <a
            href={v2Config.seAgent}
            target="_blank"
            rel="noopener noreferrer"
            className="v2-top-link inline-flex items-center gap-1.5"
          >
            <Sparkles className="size-3.5 text-(--v2-accent)" aria-hidden />
            {s.seAgent}
          </a>
          <Link href={v2Config.legacyDocsHref} className="v2-top-link hidden xl:inline-block">
            {s.legacyDocs}
          </Link>
          <Link href={v2Config.bugReportHref} className="v2-top-link hidden xl:inline-block">
            {s.reportBug}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <CommandMenu locale={locale} />
          <Link
            href={sectionHref("playground", locale)}
            className="v2-icon-btn lg:hidden"
            aria-label={s.pgTitle}
            title={s.pgTitle}
          >
            <Palette className="size-4" aria-hidden />
          </Link>
          <LanguageSwitcher locale={locale} />
          <a
            href={v2Config.github}
            target="_blank"
            rel="noopener noreferrer"
            className="v2-icon-btn"
            aria-label={s.githubRepository}
          >
            <GitHubIcon className="size-4" />
          </a>
          <ThemeToggle locale={locale} />
        </div>
      </div>
    </header>
  );
}
