"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies the <pre> that shares its .v2-code container. */
export function CopyButton() {
  const [copied, setCopied] = useState(false);

  const copy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const text = event.currentTarget.closest(".v2-code")?.querySelector("pre")?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable (insecure context, permissions); nothing to do.
    }
  };

  return (
    <button type="button" onClick={copy} className="v2-copy" aria-label={copied ? "Copied" : "Copy code"}>
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
