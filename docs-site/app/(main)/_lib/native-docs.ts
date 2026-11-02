import fs from "fs/promises";
import path from "path";
import { cache } from "react";
import matter from "gray-matter";
import { headingsOf, type Heading } from "./docs";
import { NATIVE_GROUPS, nativeHref, type NativeDoc, type NativeNavGroup } from "./native-config";
import { NATIVE_COMPONENTS, type NativeComponentEntry } from "./native-components";

export * from "./native-config";

/*
 * The React Native pages, under /native/docs.
 *
 * Two kinds of page share one sidebar:
 * - guides, written as MDX in app/content/native/ (index.mdx is /native/docs);
 * - one page per component, built from native-components.ts plus the props
 *   read from the components' TypeScript (native-preview/generated/props.json)
 *   and the demo source from native-playground/demos.
 *
 * Both end as an MDX string, so the same renderer, Markdown copy and
 * llms.txt serve them. English only, like the SE Agent section.
 */
const CONTENT_DIR = path.join(process.cwd(), "app", "content", "native");
const PROPS_FILE = path.join(process.cwd(), "native-preview", "generated", "props.json");
const DEMOS_DIR = path.join(process.cwd(), "..", "native-playground", "demos");

type PropsEntry = { extends: string[]; members: { name: string; type: string; optional: boolean; doc: string }[] };

const readProps = cache(async (): Promise<Record<string, PropsEntry>> => {
  try {
    return JSON.parse(await fs.readFile(PROPS_FILE, "utf8"));
  } catch {
    return {};
  }
});

const readGuide = cache(async (slug: string) => {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return await fs.readFile(path.join(CONTENT_DIR, `${slug}.mdx`), "utf8");
  } catch {
    return null;
  }
});

/** Text outside backticks made safe for MDX: braces and angle brackets are JSX there. */
function mdxText(text: string) {
  return text
    .split(/(`[^`]*`)/g)
    .map((part, i) => (i % 2 ? part : part.replace(/[{}<>]/g, (c) => `\\${c}`)))
    .join("");
}

/** A type for a table cell: inline code, with the cell separator escaped. */
function typeCell(type: string) {
  const short = type.length > 90 ? `${type.slice(0, 87)}…` : type;
  return `\`${short.replace(/\|/g, "\\|").replace(/`/g, "'")}\``;
}

function propsTable(name: string, entry: PropsEntry) {
  const lines = [`### ${name}`, ""];
  if (entry.members.length) {
    lines.push("| Prop | Type | Description |", "|---|---|---|");
    for (const m of entry.members) {
      const doc = mdxText(m.doc).replace(/\|/g, "\\|") || " ";
      lines.push(`| \`${m.name}\`${m.optional ? "" : " (required)"} | ${typeCell(m.type)} | ${doc} |`);
    }
    lines.push("");
  }
  if (entry.extends.length) {
    lines.push(`Also accepts the props of ${entry.extends.map((e) => `\`${e.replace(/`/g, "'")}\``).join(", ")}.`, "");
  }
  return lines;
}

/** The demo, with its imports pointed where `add` puts components in an app. */
async function demoSource(demo: string) {
  try {
    const files = await fs.readdir(DEMOS_DIR);
    for (const file of files.filter((f) => f.endsWith(".tsx"))) {
      const text = await fs.readFile(path.join(DEMOS_DIR, file), "utf8");
      if (!new RegExp(`export function ${demo}\\b`).test(text)) continue;
      return text
        .replace(/["']\.\.\/\.\.\/source\/(?:components|native)\/([^"']+)["']/g, '"@/component-lib/$1"')
        .replace(/["']\.\/layout["'];?/g, '"./layout"; // Section and Row: page layout for the demo');
    }
  } catch {
    // The playground is not part of a docs-only checkout; the page still works.
  }
  return null;
}

async function componentSource(entry: NativeComponentEntry) {
  const [props, source] = await Promise.all([readProps(), demoSource(entry.demo)]);
  const folderImport = `@/component-lib/${entry.folder}`;
  const lines = [
    "---",
    `title: ${JSON.stringify(entry.title)}`,
    `description: ${JSON.stringify(entry.description)}`,
    `group: ${JSON.stringify(entry.group)}`,
    "---",
    "",
    // The live phone, with the demo's code beside it. The fence must not be
    // indented and needs blank lines around it, or MDX reads it as text.
    ...(source
      ? [`<NativePreview demo="${entry.demo}">`, "", "```tsx", source.trimEnd(), "```", "", "</NativePreview>"]
      : [`<NativePreview demo="${entry.demo}" />`]),
    "",
    "## Install",
    "",
    "```bash",
    `npx @grampro/kit@native add ${entry.imports[0]}`,
    "```",
    "",
    "## Usage",
    "",
    "```tsx",
    `import { ${entry.imports.join(", ")} } from "${folderImport}";`,
    "",
    entry.usage,
    "```",
    "",
    "## Props",
    "",
  ];
  for (const name of entry.props) {
    const found = props[`${entry.folder}/${name}`];
    if (found) lines.push(...propsTable(name, found));
  }
  lines.push(entry.mobileOnly ? "## Notes" : "## Native and web", "");
  for (const note of entry.notes) lines.push(`- ${note}`);
  if (entry.web) {
    lines.push(`- Web version: [${entry.title} on the web](${entry.web}).`);
  } else if (entry.mobileOnly) {
    lines.push("- Mobile only: there is no web version of this component.");
  }
  lines.push("");

  return lines.join("\n");
}

/** The MDX for any native page: a guide's file, or a component page built from data. */
export const readNativeSource = cache(async (slug: string) => {
  const entry = NATIVE_COMPONENTS.find((c) => c.slug === slug);
  if (entry) return componentSource(entry);
  return readGuide(slug);
});

export const getNativeDocs = cache(async (): Promise<NativeDoc[]> => {
  const files = (await fs.readdir(CONTENT_DIR, { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.endsWith(".mdx"))
    .map((e) => e.name.replace(/\.mdx$/, ""));

  const guides = await Promise.all(
    files.map(async (slug) => {
      const { data } = matter((await readGuide(slug)) ?? "");
      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        group: data.group ?? "Get started",
        order: data.order ?? 999,
        href: nativeHref(slug),
        kind: "guide" as const,
      };
    }),
  );

  const components = NATIVE_COMPONENTS.map((c, i) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    group: c.group,
    order: i,
    href: nativeHref(c.slug),
    kind: "component" as const,
  }));

  const rank = (group: string) => {
    const i = NATIVE_GROUPS.indexOf(group);
    return i === -1 ? Infinity : i;
  };
  return [...guides, ...components].sort((a, b) => rank(a.group) - rank(b.group) || a.order - b.order);
});

/** Plain data, so the client-side sidebar and drawer can take it as a prop. */
export const getNativeNav = cache(async (): Promise<NativeNavGroup[]> => {
  const groups = new Map<string, NativeNavGroup["items"]>();
  for (const { slug, title, href, group } of await getNativeDocs()) {
    groups.set(group, [...(groups.get(group) ?? []), { slug, title, href }]);
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }));
});

export const getNativeHeadings = cache(async (slug: string): Promise<Heading[]> => {
  const source = await readNativeSource(slug);
  return source ? headingsOf(source) : [];
});
