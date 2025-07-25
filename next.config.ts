import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import remarkGfm from "remark-gfm";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

const nextConfig: NextConfig = {
  /* config options here */
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: [],
  },
  experimental: {
    mdxRs: true,
  },
};

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  },
  extension: /\.(md|mdx)$/,
});

export default withMDX(nextConfig);
