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
  installPnpm: "pnpm dlx @grampro/kit@native add Button",
  npmTag: "native",
  beta: "React Native support is in beta. APIs may change or break between prereleases (npm tag `native`).",
};

/**
 * The GramproKit Demo app (native-playground) as an installable Android APK.
 * Hosted as an asset on the repo's GitHub Releases: `releases/latest/download/<name>`
 * always serves the newest release's file, so the link never needs updating.
 * Upload each new build under exactly this file name.
 */
export const demoApp = {
  name: "GramproKit Demo",
  apkUrl: "https://github.com/gramproindia/kit/releases/latest/download/GramproKit-Demo.apk",
  releasesUrl: "https://github.com/gramproindia/kit/releases",
  requirements: "Android 7.0 or later, 64-bit (arm64). About 21 MB.",
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
