import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

export interface DocItem {
  slug: string;
  title: string;
  description?: string;
  order?: number;
  category?: string;
  href: string;
}

export interface DocCategory {
  name: string;
  items: DocItem[];
  order?: number;
}

export interface DocsStructure {
  categories: DocCategory[];
  uncategorized: DocItem[];
}

// Helper function to convert filename to title
function formatTitle(filename: string): string {
  return filename
    .replace(/^\d+-/, "") // Remove number prefix like "01-"
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// Get all docs and organize them
export async function getDocsStructure(): Promise<DocsStructure> {
  const docsDir = path.join(process.cwd(), "app", "content", "docs");

  try {
    const files = await fs.readdir(docsDir);
    const mdxFiles = files.filter(
      (file) => file.endsWith(".mdx") || file.endsWith(".md")
    );

    const docs: DocItem[] = [];

    // Process each file
    for (const file of mdxFiles) {
      const filePath = path.join(docsDir, file);
      const fileContent = await fs.readFile(filePath, "utf8");
      const { data: frontMatter } = matter(fileContent);

      const slug = file.replace(/\.mdx?$/, "");

      const docItem: DocItem = {
        slug,
        title: frontMatter.title || formatTitle(slug),
        description: frontMatter.description,
        order: frontMatter.order || 999,
        category: frontMatter.category,
        href: `/docs/${slug}`,
      };

      docs.push(docItem);
    }

    // Sort docs by order
    docs.sort((a, b) => (a.order || 999) - (b.order || 999));

    // Group by category
    const categorized = new Map<string, DocItem[]>();
    const uncategorized: DocItem[] = [];

    docs.forEach((doc) => {
      if (doc.category) {
        if (!categorized.has(doc.category)) {
          categorized.set(doc.category, []);
        }
        categorized.get(doc.category)!.push(doc);
      } else {
        uncategorized.push(doc);
      }
    });

    // Convert to categories array
    const categories: DocCategory[] = Array.from(categorized.entries()).map(
      ([name, items]) => ({
        name,
        items,
        order: items[0]?.order || 999,
      })
    );

    // Sort categories by the order of their first item
    categories.sort((a, b) => (a.order || 999) - (b.order || 999));

    return {
      categories,
      uncategorized,
    };
  } catch (error) {
    console.error("Error reading docs directory:", error);
    return {
      categories: [],
      uncategorized: [],
    };
  }
}
