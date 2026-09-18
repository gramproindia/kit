"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { LOCALES, parsePath, switchLocaleHref, type Locale } from "../_lib/i18n";
import { t } from "../_lib/strings";

/** Opens the current page in another locale, keeping the slug and hash. */
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const s = t(locale);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLButtonElement>("[aria-haspopup]")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = parsePath(pathname).locale;

  return (
    <div ref={root} className="v2-page-actions">
      <button
        type="button"
        className="v2-icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={s.language}
        title={s.language}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe className="size-4" aria-hidden />
      </button>

      {open && (
        <div id={menuId} role="menu" aria-label={s.language} className="v2-menu" data-size="sm">
          {LOCALES.map((option) => (
            <Link
              key={option.code}
              role="menuitem"
              className="v2-menu-item"
              href={switchLocaleHref(pathname, option.code)}
              hrefLang={option.htmlLang}
              lang={option.htmlLang}
              aria-current={option.code === current ? "true" : undefined}
              onClick={() => setOpen(false)}
            >
              {option.code === current ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <span className="size-4" aria-hidden />
              )}
              <span>
                <span className="v2-menu-title">{option.nativeLabel}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
