"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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

  const item = (href: string, label: string, children?: { href: string; title: string }[]) =>
    children && children.length > 0 ? (
      <NavSection
        key={href}
        href={href}
        label={label}
        pages={children}
        pathname={pathname}
        onNavigate={onNavigate}
      />
    ) : (
      <li key={href}>
        <Link
          href={href}
          onClick={onNavigate}
          aria-current={pathname === href ? "page" : undefined}
          className="v2-nav-link"
        >
          {label}
        </Link>
      </li>
    );

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

/**
 * A page with sub-pages, collapsed until asked for.
 *
 * A long doc split into chapters would otherwise push every other component
 * out of view, so the chapters stay folded. The section you are reading is
 * open from the start, because a sidebar that hides your own location is
 * worse than a long one.
 *
 * The parent is a page in its own right, so the disclosure is a separate
 * button rather than the link: clicking the name goes there, clicking the
 * chevron opens the chapters.
 */
function NavSection({
  href,
  label,
  pages,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  pages: { href: string; title: string }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const holdsCurrentPage =
    pathname === href || pages.some((page) => pathname === page.href);
  const [open, setOpen] = useState(holdsCurrentPage);

  // Navigating within the section (or into it from elsewhere) opens it.
  useEffect(() => {
    if (holdsCurrentPage) setOpen(true);
  }, [holdsCurrentPage]);

  const listId = `nav-sub-${href.replace(/[^a-zA-Z0-9]+/g, "-")}`;

  return (
    <li>
      <div className="v2-nav-row">
        <Link
          href={href}
          onClick={onNavigate}
          aria-current={pathname === href ? "page" : undefined}
          className="v2-nav-link"
        >
          {label}
        </Link>
        <button
          type="button"
          className="v2-nav-toggle"
          aria-expanded={open}
          aria-controls={listId}
          // The name is the section; `aria-expanded` already carries the state.
          aria-label={label}
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronRight className="size-3.5" aria-hidden />
        </button>
      </div>
      {open && (
        /*
         * A nested list, not a flat one: the sub-pages are chapters of the
         * page above them, and the indent is the only thing that says so.
         */
        <ul id={listId} className="v2-nav-list v2-nav-sub">
          {pages.map((page) => (
            <li key={page.href}>
              <Link
                href={page.href}
                onClick={onNavigate}
                aria-current={pathname === page.href ? "page" : undefined}
                className="v2-nav-link"
              >
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
