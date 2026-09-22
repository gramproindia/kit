/** The 2.0 docs are the site root. */
export const V2_BASE = "";

/** Where the previous major version now lives. */
export const LEGACY_BASE = "/1.x.x-legacy";

export const v2Config = {
  name: "GramproKit",
  version: "2.0.0-beta",
  description:
    "Documentation for the GramproKit 2.0.0 beta components — rebuilt for React 19 with no peer dependencies.",
  legacyDocsHref: "/1.x.x-legacy/docs/getting-started",
  github: "https://github.com/anandhuremanan/headless-gbs-components",
  /** Every component with all its options, to try against the docs. */
  devDemo: "https://gramprokit-devdemo.vercel.app/",
  /** The 2.0.0 design file. Link without Figma's ?t= session token. */
  figma: "https://www.figma.com/design/GTLm5L1yxSb7xWC8Ung3I6/Kit.gramproindia",
  bugReportHref:
    "https://github.com/anandhuremanan/headless-gbs-components/issues",
  /** Sidebar group order; groups not listed here are sorted after these. */
  groups: ["General", "Data", "Inputs", "Navigation", "Overlays", "Feedback"],
};
