import { MetadataRoute } from "next";
import { getDocsStructure } from "@/lib/docs";
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

  const routes = siteConfig.nav.map((route) => ({
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
    ...routes,
    ...docs,
  ];
}
