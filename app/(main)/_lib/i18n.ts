
/*
 * Locales for the 2.0.0 docs.
 *
 * English is the default and lives at the root: /<slug>, with its MDX in
 * app/content/2.0.0-beta/<slug>.mdx. Every other locale gets a path prefix and
 * a folder of the same name: /ml/<slug> from
 * app/content/2.0.0-beta/ml/<slug>.mdx.
 *
 * To add a locale: add it here, create the content folder, and add its strings
 * in strings.ts. Pages without a translation fall back to English.
 */

export const LOCALES = [
  { code: "en", label: "English", nativeLabel: "English", htmlLang: "en" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം", htmlLang: "ml" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_CODES = LOCALES.map((l) => l.code) as readonly Locale[];

export function isLocale(value: string): value is Locale {
  return (LOCALE_CODES as readonly string[]).includes(value);
}

export function localeInfo(locale: Locale) {
  return LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
}

/** Path prefix for a locale: "" for English, "/ml" for Malayalam. */
export function localePrefix(locale: Locale) {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

export function homeHref(locale: Locale) {
  return localePrefix(locale) || "/";
}

export function docHref(slug: string, locale: Locale = DEFAULT_LOCALE) {
  return `${localePrefix(locale)}/${slug}`;
}

/**
 * Any page under a locale, e.g. sectionHref("playground") -> "/playground" and
 * "/ml/playground". Note homeHref() is "/" for English, so appending to it
 * would produce "//playground" — a protocol-relative URL the browser reads as
 * a different host.
 */
export function sectionHref(path: string, locale: Locale = DEFAULT_LOCALE) {
  return `${localePrefix(locale)}/${path}`;
}

/** The locale a docs path belongs to, and the rest of the path. */
export function parsePath(pathname: string) {
  const [, first = "", ...others] = pathname.split("/");
  return isLocale(first) && first !== DEFAULT_LOCALE
    ? { locale: first as Locale, slug: others.join("/") }
    : { locale: DEFAULT_LOCALE, slug: [first, ...others].filter(Boolean).join("/") };
}

/** The same page in another locale. */
export function switchLocaleHref(pathname: string, locale: Locale) {
  const { slug } = parsePath(pathname);
  return slug ? docHref(slug, locale) : homeHref(locale);
}
