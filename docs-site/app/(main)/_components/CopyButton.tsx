"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copies the <pre> in the nearest code container.
 *
 * Two shapes use this: a prose code block (`.v2-code`) and a live demo's code
 * view, where the button sits in the demo's own bar rather than a second one
 * stacked beneath it.
 */
export function CopyButton() {
  const [copied, setCopied] = useState(false);

  const copy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const container = event.currentTarget.closest(".v2-code, figure.v2-demo");
    const text = container?.querySelector("pre")?.textContent ?? "";
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
