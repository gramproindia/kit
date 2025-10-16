"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export const CodeBlock = ({ children, className, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const isInline = !className;

  // Handle inline code
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

  // Extract language from className (format: "language-javascript")
  const language = className?.replace(/language-/, "") || "text";

  // Get the code content as string
  const codeContent = String(children).replace(/\n$/, "");

  // Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="relative my-6 group">
      {/* Language label and copy button */}
      <div className="flex items-center justify-between dark:bg-black px-4 py-2 text-xs font-medium rounded-t-lg border border-gray-700">
        <span className="uppercase tracking-wide">{language}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0 0 0.5rem 0.5rem",
          fontSize: "0.875rem",
          lineHeight: "1.5",
        }}
        showLineNumbers={false}
        wrapLines={true}
        wrapLongLines={true}
        {...props}
      >
        {codeContent}
      </SyntaxHighlighter>
    </div>
  );
};
