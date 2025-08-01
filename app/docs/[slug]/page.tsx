import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { Metadata } from "next";

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

    return {
      title: frontMatter.title || slug,
      description: frontMatter.description,
    };
  } catch (error) {
    return {
      title: slug,
    };
  }
}

export default function DocsPage() {
  return null;
}
