import fs from "fs/promises";
import path from "path";
import { cache } from "react";
import matter from "gray-matter";
import { v2Config } from "./config";
import { createSlugger } from "./slug";
import { DEFAULT_LOCALE, docHref, type Locale } from "./i18n";

/*
 * English is the source of truth: it decides which pages exist, their group and
 * their order. A translation only supplies its own title, description and body,
 * so the two languages always have the same pages in the same order.
 */
const CONTENT_DIR = path.join(process.cwd(), "app", "content", "2.0.0-beta");

const localeDir = (locale: Locale) =>
  locale === DEFAULT_LOCALE ? CONTENT_DIR : path.join(CONTENT_DIR, locale);

export interface DocMeta {
  slug: string;
  title: string;
  description: string;
  group: string;
  order: number;
  href: string;
  locale: Locale;
  /** False when this locale has no file yet and English is shown instead. */
  translated: boolean;
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

/** The MDX for one locale, or null when that locale has no file for the slug. */
export const readSource = cache(async (slug: string, locale: Locale = DEFAULT_LOCALE) => {
  // Slugs come from the URL; only allow plain file names.
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return await fs.readFile(path.join(localeDir(locale), `${slug}.mdx`), "utf8");
  } catch {
    return null;
  }
});

/** The MDX to render: the translation when it exists, English otherwise. */
export const readSourceWithFallback = cache(async (slug: string, locale: Locale) => {
  const translated = locale === DEFAULT_LOCALE ? null : await readSource(slug, locale);
  const source = translated ?? (await readSource(slug, DEFAULT_LOCALE));
  return source ? { source, translated: translated !== null || locale === DEFAULT_LOCALE } : null;
});

export const getDocs = cache(async (locale: Locale = DEFAULT_LOCALE): Promise<DocMeta[]> => {
  const files = (await fs.readdir(CONTENT_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => entry.name);

  const docs = await Promise.all(
    files.map(async (file) => {
      const slug = file.replace(/\.mdx$/, "");
      const { data } = matter((await readSource(slug, DEFAULT_LOCALE)) ?? "");
      const translation = locale === DEFAULT_LOCALE ? null : await readSource(slug, locale);
      const translated = translation ? matter(translation).data : null;

      return {
        slug,
        // Group and order always come from English, so both languages match.
        group: data.group ?? "Components",
        order: data.order ?? 999,
        title: translated?.title ?? data.title ?? slug,
        description: translated?.description ?? data.description ?? "",
        href: docHref(slug, locale),
        locale,
        translated: translated !== null,
      };
    }),
  );

  return docs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
});

export const getNav = cache(async (locale: Locale = DEFAULT_LOCALE): Promise<NavGroup[]> => {
  const groups = new Map<string, DocMeta[]>();
  for (const doc of await getDocs(locale)) {
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
export const getHeadings = cache(async (slug: string, locale: Locale = DEFAULT_LOCALE): Promise<Heading[]> => {
  const found = await readSourceWithFallback(slug, locale);
  if (!found) return [];
  const { content } = matter(found.source);
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
