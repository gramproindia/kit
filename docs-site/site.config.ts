export const siteConfig = {
  name: "GramproKit Docs",
  description: "GramproKit: an agent-native UI runtime for React.",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://kit.gramproindia.com",
  /*
   * Where the tutorial videos are served from.
   *
   * An R2 bucket rather than this repository: a re-encode replaces every
   * segment at once, and git would keep all of them forever. R2 also
   * charges nothing for egress, which is the line item that makes people
   * nervous about self-hosting video in the first place.
   *
   * This must be the PUBLIC url - a custom domain, or the bucket's r2.dev
   * development url. The S3 endpoint (<account>.r2.cloudflarestorage.com)
   * needs signed requests and will 401 a video player.
   *
   * Falls back to /video, so an unconfigured checkout serves whatever is
   * in public/video and nothing breaks.
   */
  videoBase: process.env.NEXT_PUBLIC_VIDEO_BASE || "/video",
  nav: [
    { label: "Docs", href: "/1.x.x-legacy/docs/getting-started" },
    { label: "Bug Report", href: "/1.x.x-legacy/bug-tracker" },
    {
      label: "Download Source",
      href: "https://github.com/gramproindia/kit/archive/refs/heads/main.zip",
    },
  ],
  socials: {
    github: "https://github.com/gramproindia/kit",
    twitter: "https://twitter.com",
  },
  metadata: {
    title: {
      template: "%s | GramproKit Docs",
      default: "GramproKit Docs",
    },
    // The fallback for any page that sets none of its own. It used to be a
    // byline, which told a search result nothing about what the site is.
    description:
      "GramproKit (Grampro Kit) is an open-source React component library you copy into your project, with zero runtime dependencies and an MCP server for AI coding agents.",
    keywords: [
      "React",
      "React 19",
      "component library",
      "agent-native",
      "UI runtime",
      "AI agents",
      "WebMCP",
      "data grid",
      "copy-in components",
      "Documentation",
    ],
    authors: [{ name: "Grampro R&D Team" }],
    creator: "Grampro",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://kit.gramproindia.com",
      siteName: "GramproKit Docs",
      // Without an image a shared link renders as a bare line of text in Slack,
      // X, LinkedIn and most chat apps. Rendered by scripts/build-diagrams.mjs.
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "GramproKit — copy-paste React components with an MCP server" }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@grampro",
      images: ["/og.png"],
    },
  },
};
