"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "../_lib/docs";
import { isAgentPath, type AgentNavGroup } from "../_lib/agent-config";
import { isNativePath, NATIVE_BASE, type NativeNavGroup } from "../_lib/native-config";
import { v2Config } from "../_lib/config";
import { Palette, Smartphone, Sparkles } from "lucide-react";
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
export function SiteHeader({
  navs,
  version,
  agentNav,
  nativeNav,
}: {
  navs: Record<Locale, NavGroup[]>;
  /** What the registry is serving, resolved on the server. */
  version: string;
  /** The SE Agent section's sidebar, shown in the drawer on its pages. */
  agentNav: AgentNavGroup[];
  /** The React Native section's sidebar, shown in the drawer on its pages. */
  nativeNav: NativeNavGroup[];
}) {
  const pathname = usePathname();
  const { locale } = parsePath(pathname);
  const s = t(locale);
  const nav = navs[locale] ?? [];
  const firstDoc = nav[0]?.items[0];
  // The agent pages are English only, so they offer no language switch.
  const onAgentPage = isAgentPath(pathname);
  // So are the React Native pages.
  const onNativePage = isNativePath(pathname);

  return (
    <header className="v2-header" lang={localeInfo(locale).htmlLang}>
      <div className="v2-container flex h-14 items-center gap-2 sm:gap-4">
        <MobileNav
          nav={nav}
          locale={locale}
          agentNav={onAgentPage ? agentNav : undefined}
          nativeNav={onNativePage ? nativeNav : undefined}
        />
        <Logo locale={locale} />
        <span className="v2-pill">{version}</span>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 text-sm whitespace-nowrap lg:flex">
          {firstDoc && (
            <Link href={firstDoc.href} className="v2-top-link">
              {s.components}
            </Link>
          )}
          <Link href={sectionHref("playground", locale)} className="v2-top-link">
            {s.playground}
          </Link>
          <Link
            href={NATIVE_BASE}
            aria-current={onNativePage ? "page" : undefined}
            className="v2-top-link inline-flex items-center gap-1.5"
          >
            <Smartphone className="size-3.5 text-(--v2-accent)" aria-hidden />
            {/* Shorter between lg and xl, where the header is tight. */}
            <span className="xl:hidden">Native</span>
            <span className="hidden xl:inline">React Native</span>
            <span className="v2-pill hidden xl:inline">beta</span>
          </Link>
          <Link
            href={v2Config.seAgent}
            aria-current={onAgentPage ? "page" : undefined}
            className="v2-top-link inline-flex items-center gap-1.5"
          >
            <Sparkles className="size-3.5 text-(--v2-accent)" aria-hidden />
            {s.seAgent}
          </Link>
          <Link href={v2Config.legacyDocsHref} className="v2-top-link hidden 2xl:inline-block">
            {s.legacyDocs}
          </Link>
          <Link href={v2Config.bugReportHref} className="v2-top-link hidden 2xl:inline-block">
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
          {!onAgentPage && !onNativePage && <LanguageSwitcher locale={locale} />}
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
