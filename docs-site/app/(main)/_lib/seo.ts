/*
 * What search engines and models are told this site is.
 *
 * The product is written "GramproKit", but people type "grampro kit", and
 * some call it the GBS Kit after the company and the `--gbs-*` variables.
 * Those spellings appeared almost nowhere on the site: "GBS Kit" zero times,
 * "Grampro Kit" eight. A search engine cannot match a query to a page that
 * never contains it, and structured data is where a site says outright
 * "these names are all the same thing" rather than hoping a ranker infers it.
 *
 * Every alias here is one the project really uses. Adding names it does not
 * use would be keyword stuffing, which search engines penalise and which
 * would mislead a model into answering for a product that does not exist.
 */
import { siteConfig } from "@/site.config";
import { v2Config } from "./config";

export const BRAND = {
  name: v2Config.name,
  alternateNames: ["Grampro Kit", "GBS Kit", "GBS Components", "@grampro/kit"],
  organization: "Grampro Business Services",
  npm: "https://www.npmjs.com/package/@grampro/kit",
  /** Social preview, 1200×630, rendered by scripts/build-diagrams.mjs. */
  ogImage: "/og.png",
} as const;

/*
 * Titles carry no version number. It changed every release, which reset what
 * a search engine had learned about each title, and it spent characters a
 * results page truncates on something no one searches for.
 */
export const HOME_TITLE = `${v2Config.name} — copy-paste React components with an MCP server`;
export const TITLE_TEMPLATE = `%s | ${v2Config.name} React components`;

const site = siteConfig.baseUrl.replace(/\/$/, "");
const absolute = (path: string) => (path.startsWith("http") ? path : `${site}${path === "/" ? "" : path}`);

const ids = {
  website: `${site}/#website`,
  software: `${site}/#software`,
  organization: `${site}/#organization`,
};

/*
 * The site-wide graph: who makes it, what the site is, what the software is.
 * Linked by @id so the three are understood as one entity, not three
 * unrelated claims.
 */
export function siteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ids.organization,
        name: BRAND.organization,
        sameAs: ["https://github.com/gramproindia"],
      },
      {
        "@type": "WebSite",
        "@id": ids.website,
        url: site,
        name: `${BRAND.name} documentation`,
        alternateName: BRAND.alternateNames.map((alias) => `${alias} documentation`),
        publisher: { "@id": ids.organization },
        inLanguage: "en",
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": ids.software,
        name: BRAND.name,
        alternateName: [...BRAND.alternateNames],
        description: v2Config.description,
        url: site,
        codeRepository: v2Config.github,
        programmingLanguage: ["TypeScript", "React"],
        runtimePlatform: "React 19",
        license: "https://spdx.org/licenses/ISC.html",
        version: v2Config.version,
        author: { "@id": ids.organization },
        sameAs: [v2Config.github, BRAND.npm, v2Config.figmaPlugin],
        keywords: [
          "React component library",
          "copy-paste React components",
          "React components without a runtime dependency",
          "accessible React components",
          "MCP server",
          "AI coding agents",
          "Figma to React",
        ],
      },
    ],
  };
}

/* One documentation page, tied back to the site and the software it documents. */
export function articleGraph(page: { title: string; description?: string; href: string; locale: string }) {
  const url = absolute(page.href);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: page.title,
        ...(page.description ? { description: page.description } : {}),
        url,
        inLanguage: page.locale,
        isPartOf: { "@id": ids.website },
        about: { "@id": ids.software },
        publisher: { "@id": ids.organization },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: BRAND.name, item: site },
          { "@type": "ListItem", position: 2, name: page.title, item: url },
        ],
      },
    ],
  };
}

/*
 * Serialised for a <script type="application/ld+json">. `<` is escaped as the
 * Next.js guide recommends: the payload carries page titles and descriptions
 * from frontmatter, and an unescaped "</script>" in one would end the tag.
 */
export const serialiseJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
