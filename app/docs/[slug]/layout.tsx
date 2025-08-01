import { DocsLayout } from "@/app/components/DocsLayout";
import React, { ReactNode } from "react";
import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import { extractTocFromMdx } from "@/lib/toc";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/lib/mdxcomponents";

export async function generateStaticParams() {
  try {
    const docsDir = path.join(process.cwd(), "app", "content", "docs");
    const files = await fs.readdir(docsDir);
    const mdxFiles = files.filter(
      (file) => file.endsWith(".mdx") || file.endsWith(".md")
    );

    return mdxFiles.map((file) => ({
      slug: file.replace(/\.mdx?$/, ""),
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const filePath = path.join(
    process.cwd(),
    "app",
    "content",
    "docs",
    `${slug}.mdx`
  );

  let source;
  try {
    await fs.access(filePath);
    source = await fs.readFile(filePath, "utf8");
  } catch (error) {
    console.error(`Failed to read file: ${filePath}`, error);
    notFound();
  }

  let tocItems;
  let mdxResult;

  try {
    tocItems = extractTocFromMdx(source);
    mdxResult = await compileMDX({
      source,
      components: mdxComponents,
      options: {
        parseFrontmatter: true,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
        },
      },
    });
  } catch (error) {
    console.error(`Failed to compile MDX for ${slug}:`, error);
    notFound();
  }

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
