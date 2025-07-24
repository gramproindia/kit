import fs from "fs/promises";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { Button } from "@/component-lib/button";
import DataGridWrapper from "@/app/components/DataGridWrapper";

const CodeBlock = ({ children, className, ...props }: any) => {
  const isInline = !className;

  if (isInline) {
    return (
      <code
        className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-red-600 dark:text-red-400"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-6">
      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-700">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};

const Callout = ({
  children,
  type = "info",
}: {
  children: ReactNode;
  type?: "info" | "warning" | "error" | "success";
}) => {
  const styles = {
    info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    warning:
      "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
    error:
      "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    success:
      "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 my-6 ${styles[type]}`}>
      {children}
    </div>
  );
};

// MDX Components
const mdxComponents = {
  // Headings
  h1: ({ children, ...props }: any) => (
    <h1
      className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8 mt-12 first:mt-0 pb-4 border-b border-gray-200 dark:border-gray-700"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2
      className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-6 mt-10 pb-2 border-b border-gray-200 dark:border-gray-700"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3
      className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-8"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4
      className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6"
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: any) => (
    <h5
      className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: any) => (
    <h6
      className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4"
      {...props}
    >
      {children}
    </h6>
  ),

  // Paragraphs
  p: ({ children, ...props }: any) => (
    <p className="text-gray-700 dark:text-gray-300 leading-7 mb-4" {...props}>
      {children}
    </p>
  ),

  // Lists
  ul: ({ children, ...props }: any) => (
    <ul
      className="space-y-2 mb-6 ml-6 list-disc text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol
      className="space-y-2 mb-6 ml-6 list-decimal text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),

  // Links
  a: ({ children, href, ...props }: any) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 hover:decoration-blue-600 dark:hover:decoration-blue-400 transition-colors"
      {...props}
    >
      {children}
    </a>
  ),

  // Code
  code: CodeBlock,
  pre: ({ children, ...props }: any) => <div {...props}>{children}</div>,

  // Blockquotes
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-gray-300 dark:border-gray-600 pl-6 py-2 my-6 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-r"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Tables
  table: ({ children, ...props }: any) => (
    <div className="my-6 overflow-x-auto">
      <table
        className="min-w-full border-collapse border border-gray-300 dark:border-gray-600"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-gray-100 dark:bg-gray-800" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: any) => (
    <th
      className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td
      className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </td>
  ),

  // Horizontal rule
  hr: ({ ...props }: any) => (
    <hr
      className="my-8 border-0 border-t border-gray-300 dark:border-gray-600"
      {...props}
    />
  ),

  // Images
  img: ({ src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 my-6"
      {...props}
    />
  ),

  // Custom components
  Callout,

  // Keyboard keys
  kbd: ({ children, ...props }: any) => (
    <kbd
      className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm"
      {...props}
    >
      {children}
    </kbd>
  ),

  Button,
  DataGridWrapper,
};

export async function generateStaticParams() {
  const files = await fs.readdir(path.join(process.cwd(), "content", "docs"));
  return files.map((file) => ({
    slug: file.replace(/\.mdx$/, ""),
  }));
}

export default async function DocsPage({
  params,
}: {
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

  const mdxResult = await compileMDX({
    source,
    components: mdxComponents, // Pass components here
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  return (
    <article className="overflow-hidden px-4 py-4 md:px-20 md:py-12">
      {mdxResult.content}
    </article>
  );
}
