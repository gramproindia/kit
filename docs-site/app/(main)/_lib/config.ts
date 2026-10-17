import { LIBRARY_VERSION } from "../_components/generated/version";

/** The 2.0 docs are the site root. */
export const V2_BASE = "";

/** Where the previous major version now lives. */
export const LEGACY_BASE = "/1.x.x-legacy";

export const v2Config = {
  name: "GramproKit",
  /* Stamped from the library's package.json by scripts/generate-demos.mjs. */
  version: LIBRARY_VERSION,
  description:
    "GramproKit: an agent-native UI runtime for React. Copy-in components you own, each publishing a machine-readable contract. Ships an MCP server so coding agents (Claude Code, Codex, Cursor) can read the real API and build from a Figma design.",
  legacyDocsHref: "/1.x.x-legacy/docs/getting-started",
  github: "https://github.com/gramproindia/kit",
  /** GBS SE Agent: a coding agent with skills for building with these components. */
  seAgent: "https://anandhuremanan.github.io/gb-codex/",
  /** The published plugin. Read by the install button and by the Markdown
   * conversion, so the two cannot disagree about where it lives. */
  figmaPlugin: "https://www.figma.com/community/plugin/1692828324805361551",
  /** The 2.0.0 design file. Link without Figma's ?t= session token. */
  figma: "https://www.figma.com/design/GTLm5L1yxSb7xWC8Ung3I6/Kit.gramproindia",
  bugReportHref:
    "https://github.com/gramproindia/kit/issues",
  /** Sidebar group order; groups not listed here are sorted after these. */
  groups: ["General", "Data", "Inputs", "Navigation", "Overlays", "Feedback", "Display"],
};
