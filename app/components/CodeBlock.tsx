"use client";

import { Copy, Check } from "lucide-react";
import { useState, useRef } from "react";

export const PreBlock = ({ children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const copyToClipboard = async () => {
    const code = preRef.current?.querySelector("code")?.textContent || "";
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // Extract the language from the data-language attribute on the child <code>
  const codeChild = Array.isArray(children) ? children[0] : children;
  const language = codeChild?.props?.["data-language"] || "";

  return (
    <div className="code-block-wrapper group relative my-6">
      {/* Header bar */}
      <div className="code-block-header flex items-center justify-between px-4 py-2 text-xs font-medium rounded-t-xl">
        <span className="uppercase tracking-wider opacity-60">{language}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-white/10"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code block */}
      <pre ref={preRef} {...props} className="code-block-pre">
        {children}
      </pre>
    </div>
  );
};

export const CodeBlock = ({ children, className, ...props }: any) => {
  // Inline code (no data-language or className from rehype-pretty-code)
  const isInline = !props["data-language"] && !className?.includes("language-");

  if (isInline) {
    return (
      <code
        className="inline-code px-1.5 py-0.5 rounded-md text-[0.85em] font-mono font-medium"
        {...props}
      >
        {children}
      </code>
    );
  }

  // Block code — already highlighted by rehype-pretty-code
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};
