"use client";

import { usePathname } from "next/navigation";
import { parsePath } from "../_lib/i18n";
import { t } from "../_lib/strings";

export function SkipLink() {
  const { locale } = parsePath(usePathname());

  return (
    <a href="#v2-main" className="v2-skip">
      {t(locale).skipToContent}
    </a>
  );
}
