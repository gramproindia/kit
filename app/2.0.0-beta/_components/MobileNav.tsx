"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { NavGroup } from "../_lib/docs";
import { SidebarNav } from "./SidebarNav";
import { Logo } from "./Logo";

export function MobileNav({ nav }: { nav: NavGroup[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const close = () => dialog.current?.close();

  useEffect(close, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="v2-icon-btn md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-4" aria-hidden />
      </button>
      <dialog
        ref={dialog}
        className="v2-drawer"
        aria-label="Navigation"
        // A click on the dialog element itself is a click on the backdrop.
        onClick={(event) => event.target === event.currentTarget && close()}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-(--v2-border) px-4">
            <Logo />
            <button type="button" onClick={close} className="v2-icon-btn" aria-label="Close navigation">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <SidebarNav nav={nav} onNavigate={close} />
          </div>
        </div>
      </dialog>
    </>
  );
}
