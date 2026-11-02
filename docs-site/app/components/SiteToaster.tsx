"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "@/components/toaster";
import { isNativePath } from "@/app/(main)/_lib/native-config";

/**
 * The site's toaster, everywhere except /native. The React Native previews
 * share Kit's toast store (core/ is one module for both platforms) and draw
 * their toasts inside the phone frame; a second copy at the top of the page
 * would show each toast twice.
 */
export function SiteToaster() {
  const pathname = usePathname();
  if (pathname && isNativePath(pathname)) return null;
  return <Toaster />;
}
