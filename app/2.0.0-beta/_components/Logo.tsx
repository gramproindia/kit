import Link from "next/link";
import { V2_BASE } from "../_lib/config";

export function Logo() {
  return (
    <Link href={V2_BASE} className="flex items-center gap-2 rounded-md" aria-label="GramproKit 2.0.0 beta home">
      <svg width="22" height="23" viewBox="0 8 38 40" fill="none" aria-hidden>
        <rect x="8" y="10" width="28" height="28" rx="5" fill="#29ABE2" />
        <rect y="20.2266" width="28" height="28" rx="5" transform="rotate(-19.2401 0 20.2266)" fill="#D9D9D9" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">GramproKit</span>
    </Link>
  );
}
