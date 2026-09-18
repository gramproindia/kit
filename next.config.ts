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
  // /2.0.0-beta/<slug>.md serves the page as plain Markdown (for LLMs).
  async rewrites() {
    return [{ source: "/2.0.0-beta/:path*.md", destination: "/2.0.0-beta/md/:path*" }];
  },
  // The beta docs moved to the 2.0.0 beta site; keep old links working.
  async redirects() {
    return ["combobox", "datagrid", "datepicker", "fileuploader", "toaster"].map(
      (name) => ({
        source: `/docs/${name}beta`,
        destination: `/2.0.0-beta/${name}`,
        permanent: false,
      })
    );
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
