import createMDX from "@next/mdx";
import type { NextConfig } from "next";

/** @type {import('rehype-pretty-code').Options} */
const options = {
  theme: {
    dark: "github-dark-dimmed",
    light: "github-light",
  },
  keepBackground: false,
};

const nextConfig: NextConfig = {
  /* config options here */
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: [],
  },
  // /<slug>.md and /ml/<slug>.md serve pages as plain Markdown (for LLMs).
  async rewrites() {
    return [{ source: "/:path*.md", destination: "/md/:path*" }];
  },
  async redirects() {
    const betaDocs = ["combobox", "datagrid", "datepicker", "fileuploader", "toaster"].map((name) => ({
      // The 1.x pages that previewed the beta components.
      source: `/docs/${name}beta`,
      destination: `/${name}`,
      permanent: false,
    }));

    return [
      ...betaDocs,
      // 2.0 moved from its beta prefix to the site root.
      { source: "/2.0.0-beta", destination: "/", permanent: false },
      { source: "/2.0.0-beta/:path*", destination: "/:path*", permanent: false },
      // 1.x moved behind its own prefix. /docs/<slug> is not redirected: it
      // renders a signpost page so old links explain themselves.
      { source: "/docs", destination: "/1.x.x-legacy/docs/getting-started", permanent: false },
      { source: "/bug-tracker/:path*", destination: "/1.x.x-legacy/bug-tracker/:path*", permanent: false },
      { source: "/bug-tracker", destination: "/1.x.x-legacy/bug-tracker", permanent: false },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [["rehype-pretty-code", options]],
  },
  extension: /\.(md|mdx)$/,
});

export default withMDX(nextConfig);
