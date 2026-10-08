"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { v2Config } from "../_lib/config";
import { localeInfo, parsePath } from "../_lib/i18n";
import { t } from "../_lib/strings";

export function SiteFooter() {
  const { locale } = parsePath(usePathname());
  const s = t(locale);

  return (
    <footer className="relative z-10 border-t border-(--v2-border) bg-(--v2-bg)" lang={localeInfo(locale).htmlLang}>
      <div className="v2-container flex flex-col gap-3 py-8 text-sm text-(--v2-muted) sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} Grampro R&amp;D. {v2Config.name} {v2Config.version}.
        </p>
        <div className="flex flex-wrap gap-5">
          <Link href={v2Config.legacyDocsHref} className="hover:text-(--v2-fg)">
            {s.legacyDocs}
          </Link>
          <Link href={v2Config.bugReportHref} className="hover:text-(--v2-fg)">
            {s.reportBug}
          </Link>
          <a href={v2Config.figma} target="_blank" rel="noopener noreferrer" className="hover:text-(--v2-fg)">
            Figma
          </a>
          <a href="/llms.txt" className="hover:text-(--v2-fg)">
            llms.txt
          </a>
          <a href={v2Config.github} target="_blank" rel="noopener noreferrer" className="hover:text-(--v2-fg)">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
