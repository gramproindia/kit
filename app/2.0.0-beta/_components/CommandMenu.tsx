"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, FileText, Hash, Search } from "lucide-react";
import { V2_BASE } from "../_lib/config";
import type { SearchEntry } from "../search.json/route";

let indexPromise: Promise<SearchEntry[]> | null = null;

/** The index is a static JSON file, fetched once on first intent to search. */
function loadIndex() {
  indexPromise ??= fetch(`${V2_BASE}/search.json`)
    .then((res) => (res.ok ? res.json() : []))
    .catch(() => {
      indexPromise = null;
      return [];
    });
  return indexPromise;
}

function score(entry: SearchEntry, terms: string[]) {
  const title = entry.title.toLowerCase();
  const page = entry.page.toLowerCase();
  let total = 0;
  for (const term of terms) {
    if (title.startsWith(term)) total += 6;
    else if (title.includes(term)) total += 4;
    else if (page.includes(term)) total += 1;
    else return 0;
  }
  return total + (entry.type === "page" ? 3 : 0);
}

export function CommandMenu() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const open = useCallback(() => {
    loadIndex().then(setEntries);
    setQuery("");
    setActive(0);
    dialog.current?.showModal();
  }, []);

  const close = () => dialog.current?.close();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault();
        if (dialog.current?.open) close();
        else open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return entries.filter((e) => e.type === "page");
    return entries
      .map((entry) => ({ entry, score: score(entry, terms) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((r) => r.entry);
  }, [entries, query]);

  const go = (entry: SearchEntry | undefined) => {
    if (!entry) return;
    close();
    router.push(entry.href);
  };

  const onInputKey = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = (active + (event.key === "ArrowDown" ? 1 : -1) + results.length) % Math.max(results.length, 1);
      setActive(next);
      list.current?.children[next]?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[active]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        onPointerEnter={loadIndex}
        onFocus={loadIndex}
        className="v2-search-trigger"
        aria-label="Search documentation"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Search docs…</span>
        <kbd className="ml-auto hidden sm:inline-flex">Ctrl K</kbd>
      </button>

      <dialog
        ref={dialog}
        className="v2-command"
        aria-label="Search documentation"
        onClick={(event) => event.target === event.currentTarget && close()}
      >
        <div className="flex items-center gap-3 border-b border-(--v2-border) px-4">
          <Search className="size-4 shrink-0 text-(--v2-faint)" aria-hidden />
          <input
            ref={input}
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Search components and sections…"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-(--v2-faint)"
            role="combobox"
            aria-expanded="true"
            aria-controls="v2-command-results"
            aria-activedescendant={results[active] ? `v2-cmd-${active}` : undefined}
            aria-autocomplete="list"
          />
          <kbd className="hidden sm:inline-flex">Esc</kbd>
        </div>

        <ul ref={list} id="v2-command-results" role="listbox" className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-10 text-center text-sm text-(--v2-muted)">
              {entries.length === 0 ? "Loading…" : `No results for “${query}”`}
            </li>
          )}
          {results.map((entry, i) => (
            <li
              key={entry.href}
              id={`v2-cmd-${i}`}
              role="option"
              aria-selected={i === active}
              onPointerMove={() => setActive(i)}
              onClick={() => go(entry)}
              className="v2-command-item"
            >
              {entry.type === "page" ? (
                <FileText className="size-4 shrink-0" aria-hidden />
              ) : (
                <Hash className="size-4 shrink-0" aria-hidden />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{entry.title}</span>
                <span className="block truncate text-xs text-(--v2-faint)">
                  {entry.type === "page" ? entry.group : entry.page}
                </span>
              </span>
              {i === active && <CornerDownLeft className="size-3.5 shrink-0 opacity-60" aria-hidden />}
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
