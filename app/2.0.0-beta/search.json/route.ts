import { getDocs, getHeadings } from "../_lib/docs";
import { LOCALE_CODES, type Locale } from "../_lib/i18n";

export const dynamic = "force-static";

export interface SearchEntry {
  type: "page" | "section";
  title: string;
  /** Title of the page the entry belongs to. */
  page: string;
  group: string;
  href: string;
  locale: Locale;
}

export async function GET() {
  const entries: SearchEntry[] = [];

  for (const locale of LOCALE_CODES) {
    for (const doc of await getDocs(locale)) {
      entries.push({
        type: "page",
        title: doc.title,
        page: doc.title,
        group: doc.group,
        href: doc.href,
        locale,
      });
      for (const heading of await getHeadings(doc.slug, locale)) {
        if (heading.level > 3) continue;
        entries.push({
          type: "section",
          title: heading.title,
          page: doc.title,
          group: doc.group,
          href: `${doc.href}#${heading.id}`,
          locale,
        });
      }
    }
  }

  return Response.json(entries);
}
