import { cache } from "react";
import matter from "gray-matter";
import { siteConfig } from "@/site.config";
import { getDocs, readSource, type DocMeta } from "./docs";
import { V2_BASE, v2Config } from "./config";

/*
 * Plain-Markdown versions of the docs for LLMs and "copy page". The MDX is
 * already Markdown apart from a few components, which are converted here:
 * <Notice /> becomes a blockquote and live demos become a link to the page.
 */

export function absoluteUrl(path: string) {
  return `${siteConfig.baseUrl.replace(/\/$/, "")}${path}`;
}

export function markdownHref(doc: Pick<DocMeta, "href">) {
  return `${doc.href}.md`;
}

const unescapeAttr = (value: string) =>
  value.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function toMarkdown(source: string, doc: DocMeta) {
  const { content } = matter(source);
  const pageUrl = absoluteUrl(doc.href);
  const out: string[] = [];
  let fence: string | null = null;
  let quoting = false;

  for (const line of content.split(/\r?\n/)) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      out.push(line);
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      continue;
    }
    if (marker) {
      fence = marker;
      out.push(line);
      continue;
    }

    if (/^import\s.+from\s/.test(line)) continue;

    const notice = /^<Notice\s+message="([^"]*)"(?:\s+link="([^"]*)")?\s*\/>\s*$/.exec(line);
    if (notice) {
      const link = notice[2] ? ` [Learn more](${notice[2]})` : "";
      out.push(`> **Note:** ${unescapeAttr(notice[1])}${link}`);
      continue;
    }

    if (/^<(\w*Wrapper(Beta)?|DemoGrid)\s*\/>\s*$/.test(line)) {
      out.push(`_Interactive demo: see the live example at ${pageUrl}_`);
      continue;
    }

    // Block components with Markdown children (<Callout>, <WarningBanner>).
    if (/^<(Callout|WarningBanner)\b[^>]*>\s*$/.test(line)) {
      const title = /title="([^"]*)"/.exec(line)?.[1];
      out.push(title ? `> **${unescapeAttr(title)}**` : ">");
      quoting = true;
      continue;
    }
    if (quoting && /^<\/(Callout|WarningBanner)>\s*$/.test(line)) {
      quoting = false;
      continue;
    }

    // Site-relative links become absolute so they work outside the site.
    const text = line.replace(/\]\((\/[^)\s]*)\)/g, (_, path: string) => `](${absoluteUrl(path)})`);
    out.push(quoting ? `> ${text.trim()}`.trimEnd() : text);
  }

  const header = [
    `# ${doc.title}`,
    "",
    `> ${doc.description}`,
    "",
    `GramproKit ${v2Config.version} · ${doc.group} · Beta (experimental; APIs may change) · Source: ${pageUrl}`,
    "",
  ];
  return [...header, ...out].join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export const getDocMarkdown = cache(async (slug: string) => {
  const doc = (await getDocs()).find((d) => d.slug === slug);
  const source = doc && (await readSource(slug));
  return doc && source ? toMarkdown(source, doc) : null;
});

export const getLlmsTxt = cache(async () => {
  const docs = await getDocs();
  const groups = new Map<string, DocMeta[]>();
  for (const doc of docs) groups.set(doc.group, [...(groups.get(doc.group) ?? []), doc]);
  const order = (name: string) => {
    const i = v2Config.groups.indexOf(name);
    return i === -1 ? Infinity : i;
  };

  const lines = [
    `# ${v2Config.name}`,
    "",
    `> ${v2Config.description}`,
    "",
    "Components are copy-in blocks: `npx gbs-add-block@latest -a <Component>` copies the source into your project, so you own and can edit the code. Each component ships a `styles.css` that is imported once. The 2.0.0 components are in beta and their APIs may change.",
    "",
    "Every page below is also available as plain Markdown by adding `.md` to its URL.",
    "",
  ];
  for (const [group, items] of [...groups].sort((a, b) => order(a[0]) - order(b[0]))) {
    lines.push(`## ${group}`, "");
    for (const doc of items) lines.push(`- [${doc.title}](${absoluteUrl(markdownHref(doc))}): ${doc.description}`);
    lines.push("");
  }
  lines.push(
    "## Optional",
    "",
    `- [All ${v2Config.version} docs in one file](${absoluteUrl("/llms-full.txt")}): Every component page above, concatenated.`,
    `- [${v2Config.version} overview](${absoluteUrl(V2_BASE)}): Landing page with the component list and migration notes.`,
    `- [1.x documentation](${absoluteUrl(v2Config.legacyDocsHref)}): Docs for the previous major version.`,
    "",
  );
  return lines.join("\n");
});

export const getLlmsFullTxt = cache(async () => {
  const docs = await getDocs();
  const pages = await Promise.all(docs.map((doc) => getDocMarkdown(doc.slug)));
  return [`# ${v2Config.name} ${v2Config.version} documentation`, "", `> ${v2Config.description}`, "", ...pages.map((p) => `---\n\n${p}`)].join("\n");
});
