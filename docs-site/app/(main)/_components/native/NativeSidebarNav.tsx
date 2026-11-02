"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NATIVE_BASE, nativeConfig, type NativeNavGroup } from "../../_lib/native-config";

/**
 * The sidebar for /native/docs. Same markup and classes as the component
 * sidebar; its own list, because the native edition has its own pages.
 */
export function NativeSidebarNav({ nav, onNavigate }: { nav: NativeNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label={`${nativeConfig.name} documentation`} className="space-y-7 text-sm">
      {nav.map((group) => (
        <div key={group.name}>
          <p className="v2-nav-heading">{group.name}</p>
          <ul className="v2-nav-list">
            {group.items.map((doc) => (
              <li key={doc.href}>
                <Link
                  href={doc.href}
                  onClick={onNavigate}
                  aria-current={pathname === doc.href ? "page" : undefined}
                  className="v2-nav-link"
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <p className="v2-nav-heading">Resources</p>
        <ul className="v2-nav-list">
          <li>
            <Link href={NATIVE_BASE} className="v2-nav-link" onClick={onNavigate}>
              React Native overview
            </Link>
          </li>
          <li>
            <Link href="/" className="v2-nav-link" onClick={onNavigate}>
              GramproKit for the web
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
