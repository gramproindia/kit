import React from "react";

export interface WarningBannerProps {
  /** Optional badge text, defaults to "WARNING" */
  badgeText?: string;
  /** Header title, e.g. "Breaking API Specification" */
  title?: string;
  /** Stability label value, e.g. "Experimental" */
  stability?: string;
  /** Callout body message */
  children?: React.ReactNode;
  /** Optional additional class names */
  className?: string;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({
  badgeText = "WARNING",
  title = "Breaking API Specification",
  stability = "Experimental",
  children = "Beta Components are subjected to change and may break your code. Use at your own risk.",
  className = "",
}) => {
  return (
    <aside
      role="alert"
      aria-label={`${badgeText}: ${title}`}
      className={`w-full mt-4 overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-red-600 dark:text-zinc-300 font-sans ${className}`}
    >
      {/* Top Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 px-4 py-3 bg-zinc-900/30">
        <div className="flex items-center gap-2.5">
          {/* Crimson / Coral Alert Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-md border dark:border-rose-500/25 dark:bg-rose-950/40 border-rose-600 bg-rose-950 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-rose-400 uppercase">
            {/* Zero-dependency inline warning triangle icon */}
            <svg
              className="h-3.5 w-3.5 flex-shrink-0 text-rose-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{badgeText}</span>
          </span>

          {/* Specification Title */}
          {title && (
            <span className="text-sm font-medium tracking-tight text-zinc-200">
              {title}
            </span>
          )}
        </div>

        {/* Stability Meta Label */}
        {stability && (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-zinc-500">Stability:</span>
            <span className="font-semibold text-amber-500">{stability}</span>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="px-4 py-3.5 text-sm text-white leading-relaxed font-normal">
        {children}
      </div>
    </aside>
  );
};

export default WarningBanner;
