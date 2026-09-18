import { cache } from "react";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import { remarkMermaid } from "@/lib/remark-mermaid";
import { mdxComponents } from "../_components/mdx";
import { readSourceWithFallback, type Heading } from "./docs";
import { createSlugger } from "./slug";
import { DEFAULT_LOCALE, type Locale } from "./i18n";

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function textOf(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textOf).join("");
}

/** Gives every heading an id and records h2/h3 for the table of contents. */
function rehypeHeadings(toc: Heading[]) {
  return () => (tree: HastNode) => {
    const slugger = createSlugger();
    const walk = (node: HastNode) => {
      const level = node.tagName && /^h([1-6])$/.exec(node.tagName)?.[1];
      if (level) {
        const title = textOf(node).trim();
        const id = slugger(title);
        node.properties = { ...node.properties, id };
        if (level === "2" || level === "3") {
          toc.push({ id, title, level: Number(level) });
        }
        return;
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

const prettyCodeOptions = {
  theme: { dark: "github-dark-dimmed", light: "github-light" },
  keepBackground: false,
};

export const renderDoc = cache(async (slug: string, locale: Locale = DEFAULT_LOCALE) => {
  const found = await readSourceWithFallback(slug, locale);
  if (!found) return null;

  const toc: Heading[] = [];
  const { content, frontmatter } = await compileMDX<Record<string, unknown>>({
    source: found.source,
    components: mdxComponents,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkMermaid],
        rehypePlugins: [rehypeHeadings(toc), [rehypePrettyCode, prettyCodeOptions]],
      },
    },
  });

  return { content, frontmatter, toc, translated: found.translated };
});
