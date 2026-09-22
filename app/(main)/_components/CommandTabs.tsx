"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

/*
 * The same command for npm and pnpm. The choice is remembered per reader, so
 * picking pnpm once keeps every other command block on pnpm.
 */

const MANAGERS = ["npm", "pnpm"] as const;
type Manager = (typeof MANAGERS)[number];

const STORAGE_KEY = "gbs-package-manager";
/** Live subscribers, so every block on the page switches together. */
const listeners = new Set<(value: Manager) => void>();

function usePackageManager(): [Manager, (value: Manager) => void] {
  // npm on the server and on first paint, so the markup always matches.
  const [manager, setManager] = useState<Manager>("npm");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "pnpm" || stored === "npm") setManager(stored);
    } catch {
      /* storage can be unavailable */
    }
    const listener = (value: Manager) => setManager(value);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const choose = (value: Manager) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    for (const listener of listeners) listener(value);
  };

  return [manager, choose];
}

export function CommandTabs({ npm, pnpm, className }: { npm: string; pnpm?: string; className?: string }) {
  const [manager, choose] = usePackageManager();
  const [copied, setCopied] = useState(false);
  const commands: Record<Manager, string> = { npm, pnpm: pnpm ?? npm };
  const command = commands[manager];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard can be unavailable */
    }
  };

  return (
    <div className={`v2-code v2-cmd ${className ?? ""}`}>
      <div className="v2-code-bar">
        <div className="v2-cmd-tabs" role="tablist" aria-label="Package manager">
          {MANAGERS.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={manager === option}
              className="v2-cmd-tab"
              onClick={() => choose(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className="v2-copy" aria-label={copied ? "Copied" : "Copy command"}>
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre>
        <code>
          {command.split("\n").map((line, index) => (
            <span key={index} className="v2-cmd-line">
              <span className="v2-cmd-prompt" aria-hidden>
                ${" "}
              </span>
              {line}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
