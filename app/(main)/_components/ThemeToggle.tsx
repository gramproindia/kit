"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";
import { DEFAULT_LOCALE, type Locale } from "../_lib/i18n";
import { t } from "../_lib/strings";

export function ThemeToggle({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const { toggleTheme } = useTheme();
  const s = t(locale);

  // Both icons render and CSS picks one, so the server HTML already matches
  // the theme the inline script applied — no icon flash on load.
  return (
    <button type="button" onClick={toggleTheme} className="v2-icon-btn" aria-label={s.toggleTheme}>
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}
