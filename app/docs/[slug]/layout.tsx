import { DocsLayout } from "@/app/components/DocsLayout";
import React, { ReactNode } from "react";
import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import { extractTocFromMdx } from "@/lib/toc";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

import { mdxComponents } from "@/lib/mdxcomponents";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), "content", "docs", `${slug}.mdx`);

  let source;
  try {
    source = await fs.readFile(filePath, "utf8");
  } catch {
    notFound();
  }

  const tocItems = extractTocFromMdx(source);
  const mdxResult = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  return (
    <DocsLayout
      content={mdxResult.content}
      tocItems={tocItems}
      frontmatter={mdxResult.frontmatter}
    >
      {children}
    </DocsLayout>
  );
}
