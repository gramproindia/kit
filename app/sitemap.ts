import { MetadataRoute } from "next";
import { getDocsStructure } from "@/lib/docs";
import { getDocs as getV2Docs } from "@/app/2.0.0-beta/_lib/docs";
import { V2_BASE } from "@/app/2.0.0-beta/_lib/config";
import { siteConfig } from "@/site.config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories, uncategorized } = await getDocsStructure();
  const allDocs = [
    ...categories.flatMap((cat) => cat.items),
    ...uncategorized,
  ];

  const docs = allDocs.map((doc) => ({
    url: `${siteConfig.baseUrl}${doc.href}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const v2Docs = (await getV2Docs()).map((doc) => ({
    url: `${siteConfig.baseUrl}${doc.href}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const routes = siteConfig.nav
    .filter((route) => route.href.startsWith("/"))
    .map((route) => ({
      url: `${siteConfig.baseUrl}${route.href}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    }));

  return [
    {
      url: siteConfig.baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteConfig.baseUrl}${V2_BASE}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...routes,
    ...docs,
    ...v2Docs,
  ];
}
