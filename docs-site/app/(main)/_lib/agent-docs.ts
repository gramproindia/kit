import fs from "fs/promises";
import path from "path";
import { cache } from "react";
import matter from "gray-matter";
import { headingsOf, type Heading } from "./docs";
import { AGENT_GROUPS, agentHref, type AgentDoc, type AgentNavGroup } from "./agent-config";

export * from "./agent-config";

/*
 * The GBS SE Agent pages, under /se-agent.
 *
 * A separate product from the component library, so they get their own
 * content folder, sidebar and section of llms.txt instead of joining the
 * component groups. They are English only: the agent's UI is English, and a
 * Malayalam route that showed English would only be a duplicate page.
 *
 * `index.mdx` is the section's landing page at /se-agent; every other file is
 * /se-agent/<slug>.
 */
const CONTENT_DIR = path.join(process.cwd(), "app", "content", "se-agent");

export const readAgentSource = cache(async (slug: string) => {
  // Slugs come from the URL; only allow plain file names.
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return await fs.readFile(path.join(CONTENT_DIR, `${slug}.mdx`), "utf8");
  } catch {
    return null;
  }
});

export const getAgentDocs = cache(async (): Promise<AgentDoc[]> => {
  const files = (await fs.readdir(CONTENT_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => entry.name.replace(/\.mdx$/, ""));

  const docs = await Promise.all(
    files.map(async (slug) => {
      const { data } = matter((await readAgentSource(slug)) ?? "");
      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        group: data.group ?? "Guides",
        order: data.order ?? 999,
        href: agentHref(slug),
      };
    }),
  );

  const rank = (group: string) => {
    const i = AGENT_GROUPS.indexOf(group);
    return i === -1 ? Infinity : i;
  };
  return docs.sort((a, b) => rank(a.group) - rank(b.group) || a.order - b.order || a.title.localeCompare(b.title));
});

/** Plain data, so the client-side header and drawer can take it as a prop. */
export const getAgentNav = cache(async (): Promise<AgentNavGroup[]> => {
  const groups = new Map<string, AgentNavGroup["items"]>();
  for (const { slug, title, href, group } of await getAgentDocs()) {
    groups.set(group, [...(groups.get(group) ?? []), { slug, title, href }]);
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }));
});

export const getAgentHeadings = cache(async (slug: string): Promise<Heading[]> => {
  const source = await readAgentSource(slug);
  return source ? headingsOf(source) : [];
});
