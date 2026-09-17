"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "../_lib/docs";
import { V2_BASE, v2Config } from "../_lib/config";

export function SidebarNav({ nav, onNavigate }: { nav: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  const item = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <li key={href}>
        <Link
          href={href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className="v2-nav-link"
        >
          {label}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Documentation" className="space-y-7 text-sm">
      <div>
        <p className="v2-nav-heading">Getting started</p>
        <ul className="v2-nav-list">{item(V2_BASE, "Overview")}</ul>
      </div>
      {nav.map((group) => (
        <div key={group.name}>
          <p className="v2-nav-heading">{group.name}</p>
          <ul className="v2-nav-list">{group.items.map((doc) => item(doc.href, doc.title))}</ul>
        </div>
      ))}
      <div>
        <p className="v2-nav-heading">Resources</p>
        <ul className="v2-nav-list">
          {item(v2Config.legacyDocsHref, "1.x documentation")}
          {item(v2Config.bugReportHref, "Report a bug")}
        </ul>
      </div>
    </nav>
  );
}
