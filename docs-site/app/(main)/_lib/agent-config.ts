/*
 * Plain data about the GBS SE Agent section, with no server-only imports, so
 * client components (the sidebar, the header) can use it. Reading the pages
 * from disk lives in agent-docs.ts.
 */

export const AGENT_BASE = "/se-agent";

/** Sidebar group order. */
export const AGENT_GROUPS = ["Start", "Guides", "Reference", "Architecture", "Project"];

export const agentConfig = {
  name: "GBS SE Agent",
  description:
    "GBS SE Agent is an open-source coding agent for VS Code that runs on local models (Ollama, LM Studio, llama.cpp, vLLM) or any OpenAI-compatible endpoint, with skills and MCP support.",
  repo: "https://github.com/gramproindia/GBS-SE-Agent",
  marketplace: "https://marketplace.visualstudio.com/items?itemName=gbs-internal-toolchain.gbs-software-agent",
  pdf: "/se-agent/GBS-SE-Agent-Explained.pdf",
};

export interface AgentDoc {
  slug: string;
  title: string;
  description: string;
  group: string;
  order: number;
  href: string;
}

export interface AgentNavGroup {
  name: string;
  items: Pick<AgentDoc, "slug" | "title" | "href">[];
}

export const agentHref = (slug: string) => (slug === "index" ? AGENT_BASE : `${AGENT_BASE}/${slug}`);

export const isAgentPath = (pathname: string) => pathname === AGENT_BASE || pathname.startsWith(`${AGENT_BASE}/`);
