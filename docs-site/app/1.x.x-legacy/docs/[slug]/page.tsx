import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { extractTocFromMdx } from "@/lib/toc";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import { remarkMermaid } from "@/lib/remark-mermaid";
import { mdxComponents } from "@/lib/mdxcomponents";
import { TableOfContents } from "@/app/components/TableOfContents";
import OpenInChatGpt from "@/app/components/OpenInChatGpt";
import { Breadcrumb } from "@/legacy-components/breadcrumb";
import { siteConfig } from "@/site.config";

/** @type {import('rehype-pretty-code').Options} */
const prettyCodeOptions = {
  theme: {
    dark: "github-dark-dimmed",
    light: "github-light",
  },
  keepBackground: false,
};

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const filePath = path.join(
      process.cwd(),
      "app",
      "content",
      "docs",
      `${slug}.mdx`
    );

    const source = await fs.readFile(filePath, "utf8");
    const { data: frontMatter } = matter(source);
    const title = frontMatter.title || slug;
    const description = frontMatter.description || siteConfig.description;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | ${siteConfig.name}`,
        description,
        type: "article",
        url: `${siteConfig.baseUrl}/1.x.x-legacy/docs/${slug}`,
        siteName: siteConfig.name,
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | ${siteConfig.name}`,
        description,
      },
    };
  } catch (error) {
    return {
      title: slug,
    };
  }
}

export default async function DocsPage({
  params,
}: {
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
          remarkPlugins: [remarkGfm, remarkMermaid],
          rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
        },
      },
    });
  } catch (error) {
    console.error(`Failed to compile MDX for ${slug}:`, error);
    notFound();
  }

  return (
    <>
      <main className="flex-1 overflow-x-auto">
        <article className="flex-1 max-w-4xl mx-auto py-12 px-6">
          <div className="flex justify-between items-center">
            <Breadcrumb />
            <OpenInChatGpt />
          </div>
          {mdxResult.content}
        </article>
      </main>
      <TableOfContents items={tocItems} />
    </>
  );
}
