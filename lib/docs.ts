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
  content?: string; // Add content for search
  excerpt?: string; // Add excerpt for search results
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

export interface SearchResult extends DocItem {
  score: number;
  matchedContent?: string;
  matchType: "title" | "description" | "content";
}

// Helper function to convert filename to title
function formatTitle(filename: string): string {
  return filename
    .replace(/^\d+-/, "") // Remove number prefix like "01-"
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// Helper function to strip markdown and get plain text
function stripMarkdown(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]*`/g, "") // Remove inline code
    .replace(/#+\s/g, "") // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
    .replace(/\*([^*]+)\*/g, "$1") // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

// Helper function to create excerpt from content
function createExcerpt(content: string, maxLength: number = 150): string {
  const plainText = stripMarkdown(content);
  if (plainText.length <= maxLength) return plainText;

  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > maxLength * 0.8
    ? truncated.substring(0, lastSpace) + "..."
    : truncated + "...";
}

// Enhanced function to get docs with search capability
export async function getDocsStructure(
  includeContent: boolean = false
): Promise<DocsStructure> {
  const docsDir = path.join(process.cwd(), "app", "content", "docs");

  try {
    // Check if directory exists
    await fs.access(docsDir);

    const files = await fs.readdir(docsDir);
    const mdxFiles = files.filter(
      (file) => file.endsWith(".mdx") || file.endsWith(".md")
    );

    if (mdxFiles.length === 0) {
      console.warn("No MDX files found in docs directory");
      return {
        categories: [],
        uncategorized: [],
      };
    }

    const docs: DocItem[] = [];

    // Process each file
    for (const file of mdxFiles) {
      try {
        const filePath = path.join(docsDir, file);
        const fileContent = await fs.readFile(filePath, "utf8");
        const { data: frontMatter, content } = matter(fileContent);

        const slug = file.replace(/\.mdx?$/, "");

        const docItem: DocItem = {
          slug,
          title: frontMatter.title || formatTitle(slug),
          description: frontMatter.description,
          order: frontMatter.order || 999,
          category: frontMatter.category,
          href: `/docs/${slug}`,
        };

        // Add content and excerpt if requested
        if (includeContent) {
          docItem.content = content;
          docItem.excerpt = createExcerpt(content);
        }

        docs.push(docItem);
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError);
        // Continue processing other files
      }
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
    // Return empty structure instead of throwing
    return {
      categories: [],
      uncategorized: [],
    };
  }
}

// Search function
export async function searchDocs(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const { categories, uncategorized } = await getDocsStructure(true);
  const allDocs: DocItem[] = [
    ...categories.flatMap((cat) => cat.items),
    ...uncategorized,
  ];

  const results: SearchResult[] = [];
  const searchTerms = query
    .toLowerCase()
    .split(" ")
    .filter((term) => term.length > 0);

  for (const doc of allDocs) {
    let score = 0;
    let matchType: SearchResult["matchType"] = "content";
    let matchedContent = "";

    // Search in title (highest priority)
    const titleMatches = searchTerms.filter((term) =>
      doc.title.toLowerCase().includes(term)
    );
    if (titleMatches.length > 0) {
      score += titleMatches.length * 10;
      matchType = "title";
      matchedContent = doc.title;
    }

    // Search in description (medium priority)
    if (doc.description) {
      const descMatches = searchTerms.filter((term) =>
        doc.description!.toLowerCase().includes(term)
      );
      if (descMatches.length > 0) {
        score += descMatches.length * 5;
        if (matchType === "content") {
          matchType = "description";
          matchedContent = doc.description;
        }
      }
    }

    // Search in content (lower priority but comprehensive)
    if (doc.content) {
      const plainContent = stripMarkdown(doc.content).toLowerCase();
      const contentMatches = searchTerms.filter((term) =>
        plainContent.includes(term)
      );

      if (contentMatches.length > 0) {
        score += contentMatches.length * 2;

        // Find context around first match for snippet
        if (!matchedContent) {
          const firstTerm = contentMatches[0];
          const index = plainContent.indexOf(firstTerm);
          const start = Math.max(0, index - 50);
          const end = Math.min(plainContent.length, index + 100);
          matchedContent = "..." + plainContent.substring(start, end) + "...";
        }
      }
    }

    // Boost score for exact phrase matches
    const fullQuery = query.toLowerCase();
    if (doc.title.toLowerCase().includes(fullQuery)) {
      score += 20;
    } else if (doc.description?.toLowerCase().includes(fullQuery)) {
      score += 15;
    } else if (
      doc.content &&
      stripMarkdown(doc.content).toLowerCase().includes(fullQuery)
    ) {
      score += 10;
    }

    if (score > 0) {
      results.push({
        ...doc,
        score,
        matchedContent: matchedContent || doc.excerpt || doc.description || "",
        matchType,
      });
    }
  }

  // Sort by score (descending) and return limited results
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
