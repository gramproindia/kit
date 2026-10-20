import { cache } from "react";
import matter from "gray-matter";
import { siteConfig } from "@/site.config";
import { getDocs, readSourceWithFallback, type DocMeta } from "./docs";
import { v2Config } from "./config";
import { DEFAULT_LOCALE, homeHref, LOCALE_CODES, localeInfo, type Locale } from "./i18n";
import { t } from "./strings";

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
  const s = t(doc.locale);
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
      const link = notice[2] ? ` [${notice[2]}](${notice[2]})` : "";
      out.push(`> **${s.mdNote}:** ${unescapeAttr(notice[1])}${link}`);
      continue;
    }

    // Our own video, same reasoning as the one below: a tag in the Markdown
    // copy tells a reader nothing, and the file plays in any browser.
    const hosted = /^<SelfHostedVideo\s+src="([^"]+)"\s+title="([^"]*)"[^>]*\/>\s*$/.exec(line);
    if (hosted) {
      out.push(`[${unescapeAttr(hosted[2])} (video)](${hosted[1]})`);
      continue;
    }

    // A diagram is a raster, so it carries nothing into this copy on its own.
    // The alt text is the diagram as far as a model or a screen reader is
    // concerned, so it is what gets written out, with the image beside it.
    const diagram = /^<Diagram\s+name="([^"]+)"\s+alt="([^"]*)"(?:\s+caption="([^"]*)")?\s*\/>\s*$/.exec(line);
    if (diagram) {
      out.push(`![${unescapeAttr(diagram[2])}](${absoluteUrl(`/diagrams/${diagram[1]}-light.webp`)})`);
      if (diagram[3]) out.push("", `_${unescapeAttr(diagram[3])}_`);
      continue;
    }

    // A video is a link once the player is gone. Left as a tag it would
    // tell a reader of the Markdown copy nothing at all.
    const video = /^<VideoEmbed\s+id="([^"]+)"\s+title="([^"]*)"[^>]*\/>\s*$/.exec(line);
    if (video) {
      out.push(`[${unescapeAttr(video[2])} (video)](https://www.youtube.com/watch?v=${video[1]})`);
      continue;
    }

    // The install button, which is a link once the styling is gone.
    // Passed through verbatim it left a dangling JSX tag where the URL
    // should be, in every copy an LLM reads.
    const plugin = /^<FigmaPlugin(?:\s+label="([^"]*)")?\s*\/>\s*$/.exec(line);
    if (plugin) {
      const label = plugin[1] ? unescapeAttr(plugin[1]) : "Get the plugin on Figma Community";
      out.push(`[${label}](${v2Config.figmaPlugin})`);
      continue;
    }

    if (/^<(\w*Wrapper(Beta)?|DemoGrid)\s*\/>\s*$/.test(line)) {
      out.push(`_${s.mdInteractiveDemo}_ [${s.mdOpenLiveExample}](${pageUrl})`);
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
    `GramproKit ${v2Config.version} · ${doc.group} · ${s.mdBetaLine} · ${s.mdSource}: ${pageUrl}`,
    "",
  ];
  return [...header, ...out].join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export const getDocMarkdown = cache(async (slug: string, locale: Locale = DEFAULT_LOCALE) => {
  const doc = (await getDocs(locale)).find((d) => d.slug === slug);
  const found = doc && (await readSourceWithFallback(slug, locale));
  return doc && found ? toMarkdown(found.source, doc) : null;
});

export const getLlmsTxt = cache(async () => {
  const docs = await getDocs(DEFAULT_LOCALE);
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
    // Every name a person might use for it, so a model asked about any one of
    // them can connect it to this site rather than answer that it does not know.
    "Also known as Grampro Kit, GBS Kit and GBS Components. The npm package is `@grampro/kit`, the source is at https://github.com/gramproindia/kit, and the published documentation is https://kit.gramproindia.com.",
    "",
    "Components are copy-in blocks: `npx @grampro/kit add <Component>` (or `pnpm dlx @grampro/kit add <Component>`) copies the source into your project, so you own and can edit the code. Each component ships a `styles.css` that is imported once. Run `npx @grampro/kit add` with no names, in a terminal, to pick from a searchable list.",
    "",
    "Pages can be operated by browser agents without writing tool definitions: wrap a page in `<AgentSurface>` and every form field and data grid inside describes what it accepts, from its own props, through one WebMCP tool, `operate_page`. Each action is checked by the component it targets before anything changes, and a refusal says why. See the Agent Surface page.",
    "",
    "There is also a Figma plugin: https://www.figma.com/community/plugin/1692828324805361551 . It generates the whole design system inside Figma, and exports screens as JSON a coding agent can build from. `npx @grampro/kit design ./design.json` splits a whole-design export into a folder of screens with a shared theme, and `figma_frame` reads one with `designFile`.",
    "",
    "There is an MCP server in the package, still in beta: `npx @grampro/kit mcp install` configures Claude Code, Codex and Cursor. Its tools answer what components exist (`list_components`), what a component's props actually are (`get_component`), what a Figma frame contains (`figma_frame`), and whether written JSX matches the real API (`validate_usage`). The shortest path from a design to a screen is to paste a Figma frame URL and ask for it to be built: `figma_frame` reads the frame and names the component instances in it, and the other tools install and check what gets written. The plugin export above is for a whole product at once, or when no Figma token is available. See the MCP server page for the full list and a design-to-code walkthrough.",
    "",
    "Every page below is also available as plain Markdown by adding `.md` to its URL.",
    "",
  ];
  for (const [group, items] of [...groups].sort((a, b) => order(a[0]) - order(b[0]))) {
    lines.push(`## ${group}`, "");
    for (const doc of items) lines.push(`- [${doc.title}](${absoluteUrl(markdownHref(doc))}): ${doc.description}`);
    lines.push("");
  }

  // Translations, listed only where a translated page exists.
  for (const locale of LOCALE_CODES.filter((code) => code !== DEFAULT_LOCALE)) {
    const translated = (await getDocs(locale)).filter((doc) => doc.translated);
    if (translated.length === 0) continue;
    const info = localeInfo(locale);
    lines.push(`## ${info.label} (${info.nativeLabel})`, "");
    for (const doc of translated) {
      lines.push(`- [${doc.title}](${absoluteUrl(markdownHref(doc))}): ${doc.description}`);
    }
    lines.push("");
  }

  lines.push(
    "## Optional",
    "",
    `- [All ${v2Config.version} docs in one file](${absoluteUrl("/llms-full.txt")}): Every English component page above, concatenated.`,
    `- [${v2Config.version} overview](${absoluteUrl(homeHref(DEFAULT_LOCALE))}): Landing page with the component list and migration notes.`,
    `- [1.x documentation](${absoluteUrl(v2Config.legacyDocsHref)}): Docs for the previous major version.`,
    "",
  );
  return lines.join("\n");
});

export const getLlmsFullTxt = cache(async () => {
  const docs = await getDocs(DEFAULT_LOCALE);
  const pages = await Promise.all(docs.map((doc) => getDocMarkdown(doc.slug, DEFAULT_LOCALE)));
  return [
    `# ${v2Config.name} ${v2Config.version} documentation`,
    "",
    `> ${v2Config.description}`,
    "",
    `Translations: ${LOCALE_CODES.filter((c) => c !== DEFAULT_LOCALE)
      .map((c) => `${localeInfo(c).label} at ${absoluteUrl(homeHref(c))}`)
      .join(", ")}`,
    "",
    ...pages.map((p) => `---\n\n${p}`),
  ].join("\n");
});
