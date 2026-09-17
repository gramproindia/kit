import fs from "fs/promises";
import path from "path";
import { cache } from "react";
import matter from "gray-matter";
import { docHref, v2Config } from "./config";
import { createSlugger } from "./slug";

const DOCS_DIR = path.join(process.cwd(), "app", "content", "2.0.0-beta");

export interface DocMeta {
  slug: string;
  title: string;
  description: string;
  group: string;
  order: number;
  href: string;
}

export interface Heading {
  id: string;
  title: string;
  level: number;
}

export interface NavGroup {
  name: string;
  items: DocMeta[];
}

export const readSource = cache(async (slug: string) => {
  // Slugs come from the URL; only allow plain file names.
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return await fs.readFile(path.join(DOCS_DIR, `${slug}.mdx`), "utf8");
  } catch {
    return null;
  }
});

export const getDocs = cache(async (): Promise<DocMeta[]> => {
  const files = (await fs.readdir(DOCS_DIR)).filter((f) => f.endsWith(".mdx"));

  const docs = await Promise.all(
    files.map(async (file) => {
      const slug = file.replace(/\.mdx$/, "");
      const { data } = matter((await readSource(slug)) ?? "");
      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        group: data.group ?? "Components",
        order: data.order ?? 999,
        href: docHref(slug),
      };
    }),
  );

  return docs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
});

export const getNav = cache(async (): Promise<NavGroup[]> => {
  const groups = new Map<string, DocMeta[]>();
  for (const doc of await getDocs()) {
    groups.set(doc.group, [...(groups.get(doc.group) ?? []), doc]);
  }
  const rank = (name: string) => {
    const i = v2Config.groups.indexOf(name);
    return i === -1 ? Infinity : i;
  };
  return [...groups.entries()]
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => rank(a.name) - rank(b.name));
});

function stripInlineMarkdown(text: string) {
  return text
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

/**
 * Headings read straight from the markdown, for search and the landing page.
 * Ids use the same slugger as the rendered page, so links land on the heading.
 */
export const getHeadings = cache(async (slug: string): Promise<Heading[]> => {
  const source = await readSource(slug);
  if (!source) return [];
  const { content } = matter(source);
  const slugger = createSlugger();
  const headings: Heading[] = [];
  let inFence = false;

  for (const line of content.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const title = stripInlineMarkdown(match[2]);
    headings.push({ id: slugger(title), title, level: match[1].length });
  }
  return headings;
});
