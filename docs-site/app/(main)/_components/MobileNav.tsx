"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { NavGroup } from "../_lib/docs";
import type { Locale } from "../_lib/i18n";
import { t } from "../_lib/strings";
import { SidebarNav } from "./SidebarNav";
import { Logo } from "./Logo";

export function MobileNav({ nav, locale }: { nav: NavGroup[]; locale: Locale }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const close = () => dialog.current?.close();
  const s = t(locale);

  useEffect(close, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="v2-icon-btn md:hidden"
        aria-label={s.openNavigation}
      >
        <Menu className="size-4" aria-hidden />
      </button>
      <dialog
        ref={dialog}
        className="v2-drawer"
        aria-label={s.documentation}
        // A click on the dialog element itself is a click on the backdrop.
        onClick={(event) => event.target === event.currentTarget && close()}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-(--v2-border) px-4">
            <Logo locale={locale} />
            <button type="button" onClick={close} className="v2-icon-btn" aria-label={s.closeNavigation}>
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <SidebarNav nav={nav} locale={locale} onNavigate={close} />
          </div>
        </div>
      </dialog>
    </>
  );
}
