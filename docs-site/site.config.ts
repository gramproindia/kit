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
    description: "By Research and Development Team, Grampro",
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
    },
    twitter: {
      card: "summary_large_image",
      creator: "@grampro",
    },
  },
};
