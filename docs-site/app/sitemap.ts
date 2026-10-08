import { MetadataRoute } from "next";
import { getDocsStructure } from "@/lib/docs";
import { getDocs as getMainDocs } from "@/app/(main)/_lib/docs";
import { docHref, homeHref, sectionHref, DEFAULT_LOCALE, LOCALE_CODES } from "@/app/(main)/_lib/i18n";
import { siteConfig } from "@/site.config";

const url = (path: string) => `${siteConfig.baseUrl}${path === "/" ? "" : path}`;
/** The same page in every locale, for hreflang. */
const languages = (path: (locale: (typeof LOCALE_CODES)[number]) => string) =>
  Object.fromEntries(LOCALE_CODES.map((locale) => [locale, url(path(locale))]));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // The 2.0 docs: the current version, listed with their translations.
  const docs = await getMainDocs(DEFAULT_LOCALE);
  const main: MetadataRoute.Sitemap = [
    {
      url: url(homeHref(DEFAULT_LOCALE)),
      lastModified,
      changeFrequency: "daily",
      priority: 1,
      alternates: { languages: languages((locale) => homeHref(locale)) },
    },
    ...docs.map((doc) => ({
      url: url(doc.href),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: { languages: languages((locale) => docHref(doc.slug, locale)) },
    })),
    {
      url: url("/playground"),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: languages((locale) => sectionHref("playground", locale)) },
    },
  ];

  // The 1.x docs stay listed, at a lower priority.
  const { categories, uncategorized } = await getDocsStructure();
  const legacy: MetadataRoute.Sitemap = [...categories.flatMap((c) => c.items), ...uncategorized].map((doc) => ({
    url: url(doc.href),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.3,
  }));

  return [...main, ...legacy];
}
