import Link from "next/link";
import { homeHref, DEFAULT_LOCALE, type Locale } from "../_lib/i18n";

export function Logo({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  return (
    <Link href={homeHref(locale)} className="flex items-center gap-2 rounded-md" aria-label="GramproKit 2.0.0 beta home">
      <svg width="22" height="23" viewBox="0 8 38 40" fill="none" aria-hidden>
        <rect x="8" y="10" width="28" height="28" rx="5" fill="#29ABE2" />
        <rect y="20.2266" width="28" height="28" rx="5" transform="rotate(-19.2401 0 20.2266)" fill="#D9D9D9" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">GramproKit</span>
    </Link>
  );
}
