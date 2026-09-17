"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  // Both icons render and CSS picks one, so the server HTML already matches
  // the theme the inline script applied — no icon flash on load.
  return (
    <button type="button" onClick={toggleTheme} className="v2-icon-btn" aria-label="Toggle dark mode">
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}
