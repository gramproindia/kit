/** The Figma logo: five shapes in its brand colors. */
export function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 54" className={className} aria-hidden>
      <path d="M18 0H9a9 9 0 0 0 0 18h9Z" fill="#F24E1E" />
      <path d="M18 0h9a9 9 0 0 1 0 18h-9Z" fill="#FF7262" />
      <path d="M18 18H9a9 9 0 0 0 0 18h9Z" fill="#A259FF" />
      <path d="M18 36H9a9 9 0 0 0 0 18h9Z" fill="#0ACF83" />
      <circle cx="27" cy="27" r="9" fill="#1ABCFE" />
    </svg>
  );
}
