export const siteConfig = {
  name: "GramproKit Docs",
  description: "GramproKit: an agent-native UI runtime for React.",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://kit.gramproindia.com",
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
