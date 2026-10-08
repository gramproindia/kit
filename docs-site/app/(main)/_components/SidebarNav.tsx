"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "../_lib/docs";
import { v2Config } from "../_lib/config";
import { homeHref, type Locale } from "../_lib/i18n";
import { t } from "../_lib/strings";

export function SidebarNav({
  nav,
  locale,
  onNavigate,
}: {
  nav: NavGroup[];
  locale: Locale;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const s = t(locale);

  const external = (href: string, label: string) => (
    <li key={href}>
      <a href={href} target="_blank" rel="noopener noreferrer" className="v2-nav-link" onClick={onNavigate}>
        {label}
      </a>
    </li>
  );

  const item = (href: string, label: string, children?: { href: string; title: string }[]) => {
    const active = pathname === href;
    return (
      <li key={href}>
        <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className="v2-nav-link">
          {label}
        </Link>
        {children && children.length > 0 && (
          /*
           * A nested list, not a flat one: the sub-pages are chapters of the
           * page above them, and the indent is the only thing that says so.
           */
          <ul className="v2-nav-list v2-nav-sub">
            {children.map((child) => (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  aria-current={pathname === child.href ? "page" : undefined}
                  className="v2-nav-link"
                >
                  {child.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav aria-label={s.documentation} className="space-y-7 text-sm">
      <div>
        <p className="v2-nav-heading">{s.gettingStarted}</p>
        <ul className="v2-nav-list">{item(homeHref(locale), s.overview)}</ul>
      </div>
      {nav.map((group) => (
        <div key={group.name}>
          <p className="v2-nav-heading">{s.groups[group.name] ?? group.name}</p>
          <ul className="v2-nav-list">
            {group.items.map((doc) => item(doc.href, doc.title, doc.children))}
          </ul>
        </div>
      ))}
      <div>
        <p className="v2-nav-heading">{s.resources}</p>
        <ul className="v2-nav-list">
          {external(v2Config.seAgent, s.seAgent)}
          {item(v2Config.legacyDocsHref, s.legacyDocsLong)}
          {item(v2Config.bugReportHref, s.reportBug)}
        </ul>
      </div>
    </nav>
  );
}
