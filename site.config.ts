export const siteConfig = {
  name: "GramproKit Docs",
  description: "Documentation for GramproKit component library.",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://gramprokit.com",
  nav: [
    { label: "Docs", href: "/docs/getting-started" },
    { label: "Bug Report", href: "/bug-tracker" },
    {
      label: "Download Source",
      href: "https://github.com/anandhuremanan/headless-gbs-components/archive/refs/heads/main.zip",
    },
  ],
  socials: {
    github: "https://github.com/anandhuremanan/headless-gbs-components",
    twitter: "https://twitter.com",
  },
  metadata: {
    title: {
      template: "%s | GramproKit Docs",
      default: "GramproKit Docs",
    },
    description: "By Research and Development Team, Grampro",
    keywords: [
      "Next.js",
      "React",
      "Tailwind CSS",
      "Component Library",
      "Documentation",
    ],
    authors: [{ name: "Grampro R&D Team" }],
    creator: "Grampro",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://gramprokit.com",
      siteName: "GramproKit Docs",
    },
    twitter: {
      card: "summary_large_image",
      creator: "@grampro",
    },
  },
};
