import { getDocs, getHeadings } from "../_lib/docs";

export const dynamic = "force-static";

export interface SearchEntry {
  type: "page" | "section";
  title: string;
  /** Title of the page the entry belongs to. */
  page: string;
  group: string;
  href: string;
}

export async function GET() {
  const entries: SearchEntry[] = [];

  for (const doc of await getDocs()) {
    entries.push({ type: "page", title: doc.title, page: doc.title, group: doc.group, href: doc.href });
    for (const heading of await getHeadings(doc.slug)) {
      if (heading.level > 3) continue;
      entries.push({
        type: "section",
        title: heading.title,
        page: doc.title,
        group: doc.group,
        href: `${doc.href}#${heading.id}`,
      });
    }
  }

  return Response.json(entries);
}
