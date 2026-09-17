"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Copy, FileText } from "lucide-react";

function ChatGptIcon() {
  return (
    <svg viewBox="0 0 320 320" fill="currentColor" className="size-4" aria-hidden>
      <path d="m297.06 130.97c7.26-21.79 4.76-45.66-6.85-65.48-17.46-30.4-52.56-46.04-86.84-38.68-15.25-17.18-37.16-26.95-60.13-26.81-35.04-.08-66.13 22.48-76.91 55.82-22.51 4.61-41.94 18.7-53.31 38.67-17.59 30.32-13.58 68.54 9.92 94.54-7.26 21.79-4.76 45.66 6.85 65.48 17.46 30.4 52.56 46.04 86.84 38.68 15.24 17.18 37.16 26.95 60.13 26.8 35.06.09 66.16-22.49 76.94-55.86 22.51-4.61 41.94-18.7 53.31-38.67 17.57-30.32 13.55-68.51-9.94-94.51zm-120.28 168.11c-14.03.02-27.62-4.89-38.39-13.88.49-.26 1.34-.73 1.89-1.07l63.72-36.8c3.26-1.85 5.26-5.32 5.24-9.07v-89.83l26.93 15.55c.29.14.48.42.52.74v74.39c-.04 33.08-26.83 59.9-59.91 59.97zm-128.84-55.03c-7.03-12.14-9.56-26.37-7.15-40.18.47.28 1.3.79 1.89 1.13l63.72 36.8c3.23 1.89 7.23 1.89 10.47 0l77.79-44.92v31.1c.02.32-.13.63-.38.83l-64.41 37.19c-28.69 16.52-65.33 6.7-81.92-21.95zm-16.77-139.09c7-12.16 18.05-21.46 31.21-26.29 0 .55-.03 1.52-.03 2.2v73.61c-.02 3.74 1.98 7.21 5.23 9.06l77.79 44.91-26.93 15.55c-.27.18-.61.21-.91.08l-64.42-37.22c-28.63-16.58-38.45-53.21-21.95-81.89zm221.26 51.49-77.79-44.92 26.93-15.54c.27-.18.61-.21.91-.08l64.42 37.19c28.68 16.57 38.51 53.26 21.94 81.94-7.01 12.14-18.05 21.44-31.2 26.28v-75.81c.03-3.74-1.96-7.2-5.2-9.06zm26.8-40.34c-.47-.29-1.3-.79-1.89-1.13l-63.72-36.8c-3.23-1.89-7.23-1.89-10.47 0l-77.79 44.92v-31.1c-.02-.32.13-.63.38-.83l64.41-37.16c28.69-16.55 65.37-6.7 81.91 22 6.99 12.12 9.52 26.31 7.15 40.1zm-168.51 55.43-26.94-15.55c-.29-.14-.48-.42-.52-.74v-74.39c.02-33.12 26.89-59.96 60.01-59.94 14.01 0 27.57 4.92 38.34 13.88-.49.26-1.33.73-1.89 1.07l-63.72 36.8c-3.26 1.85-5.26 5.31-5.24 9.06l-.04 89.79zm14.63-31.54 34.65-20.01 34.65 20v40.01l-34.65 20-34.65-20z" />
    </svg>
  );
}

/** A spark in Claude's brand color. */
function ClaudeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <g stroke="#D97757" strokeWidth="2.6" strokeLinecap="round">
        <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
      </g>
    </svg>
  );
}

export function PageActions({ title, markdownPath }: { title: string; markdownPath: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // The menu opens toward whichever side has room (the button wraps to the left edge on phones).
  const [alignStart, setAlignStart] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLButtonElement>("[aria-haspopup]")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    root.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copyMarkdown = async () => {
    const markdown = fetch(markdownPath).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    });
    try {
      // Passing the promise keeps the click's user activation (required by Safari).
      await navigator.clipboard.write([
        new ClipboardItem({ "text/plain": markdown.then((text) => new Blob([text], { type: "text/plain" })) }),
      ]);
    } catch {
      try {
        await navigator.clipboard.writeText(await markdown);
      } catch {
        return;
      }
    }
    setCopied(true);
    setOpen(false);
    setTimeout(() => setCopied(false), 1800);
  };

  // Links are built while the menu is open, from the URL the reader is on.
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const pageUrl = typeof window === "undefined" ? "" : window.location.href.split("#")[0];
  const prompt = `Read the GramproKit ${title} documentation at ${origin}${markdownPath} (web page: ${pageUrl}) so I can ask questions about it.`;

  const onMenuKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>("[role=menuitem]")];
    const index = items.indexOf(document.activeElement as HTMLElement);
    items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };

  return (
    <div ref={root} className="v2-page-actions">
      <div className="v2-split">
        <button type="button" onClick={copyMarkdown} className="v2-split-main" aria-live="polite">
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          <span>{copied ? "Copied" : "Copy page"}</span>
        </button>
        <button
          type="button"
          className="v2-split-toggle"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label="More page actions"
          onClick={() => {
            const rect = root.current?.getBoundingClientRect();
            setAlignStart(!!rect && rect.right < 16.5 * 16 + 16);
            setOpen((value) => !value);
          }}
        >
          <ChevronDown className="size-3.5" aria-hidden />
        </button>
      </div>

      {open && (
        <div id={menuId} role="menu" aria-label="Page actions" className="v2-menu" data-align={alignStart ? "start" : "end"} onKeyDown={onMenuKey}>
          <button type="button" role="menuitem" className="v2-menu-item" onClick={copyMarkdown}>
            <Copy className="size-4" aria-hidden />
            <span>
              <span className="v2-menu-title">Copy page</span>
              <span className="v2-menu-desc">Copy as Markdown for LLMs</span>
            </span>
          </button>
          <a role="menuitem" className="v2-menu-item" href={markdownPath} target="_blank" rel="noopener" onClick={() => setOpen(false)}>
            <FileText className="size-4" aria-hidden />
            <span>
              <span className="v2-menu-title">View as Markdown</span>
              <span className="v2-menu-desc">Plain text version of this page</span>
            </span>
          </a>
          <a
            role="menuitem"
            className="v2-menu-item"
            href={`https://chatgpt.com/?hints=search&prompt=${encodeURIComponent(prompt)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            <ChatGptIcon />
            <span>
              <span className="v2-menu-title">Open in ChatGPT</span>
              <span className="v2-menu-desc">Ask questions about this page</span>
            </span>
          </a>
          <a
            role="menuitem"
            className="v2-menu-item"
            href={`https://claude.ai/new?q=${encodeURIComponent(prompt)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            <ClaudeIcon />
            <span>
              <span className="v2-menu-title">Open in Claude</span>
              <span className="v2-menu-desc">Ask questions about this page</span>
            </span>
          </a>
        </div>
      )}
    </div>
  );
}
