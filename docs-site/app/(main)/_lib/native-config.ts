/*
 * Plain data about the React Native section (/native), with no server-only
 * imports, so client components (sidebar, header, drawer) can use it.
 * Reading pages from disk lives in native-docs.ts.
 */

export const NATIVE_BASE = "/native";
export const NATIVE_DOCS = "/native/docs";

/** Sidebar group order. */
export const NATIVE_GROUPS = ["Get started", "Mobile", "Actions", "Forms", "Pickers", "Overlays", "Display", "Feedback"];

export const nativeConfig = {
  name: "GramproKit for React Native",
  shortName: "Kit Native",
  description:
    "GramproKit for React Native: the same components and props as the web Kit, drawn natively for iOS and Android, plus mobile patterns such as AppBar, BottomNavigation and Fab. Copy-in source, zero dependencies, works in Expo Go. Beta.",
  install: "npx @grampro/kit@native add Button",
  installPnpm: "pnpm dlx --package=@grampro/kit@native grampro-kit add Button",
  npmTag: "native",
  beta: "React Native support is in beta. APIs may change or break between prereleases (npm tag `native`).",
};

/**
 * The GramproKit Demo app (native-playground) as an installable Android APK.
 * Served by this site from public/downloads/. Replace that file (same name)
 * with each new build; the link never changes. Git keeps every version of a
 * binary, ~30 MB each, so move to Git LFS or GitHub Releases if builds get
 * frequent.
 */
export const demoApp = {
  name: "GramproKit Demo",
  apkUrl: "/downloads/GramproKit-Demo.apk",
  version: "1.1.0",
  requirements: "Android 7.0 or later, 64-bit (arm64). About 30 MB.",
  /** Installing outside the Play Store needs the user to allow it once. */
  sideloadNote:
    "Android asks you to allow installs from your browser the first time. The demo is debug-signed, for trying Kit, not for production.",
};

export interface NativeDoc {
  slug: string;
  title: string;
  description: string;
  group: string;
  order: number;
  href: string;
  kind: "guide" | "component";
}

export interface NativeNavGroup {
  name: string;
  items: Pick<NativeDoc, "slug" | "title" | "href">[];
}

export const nativeHref = (slug: string) => (slug === "index" ? NATIVE_DOCS : `${NATIVE_DOCS}/${slug}`);

export const isNativePath = (pathname: string) => pathname === NATIVE_BASE || pathname.startsWith(`${NATIVE_BASE}/`);
