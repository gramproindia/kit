import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Info, Lightbulb, OctagonAlert } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { CommandTabs } from "./CommandTabs";
import { MermaidChart } from "./demo-runtime";
import { demoComponents } from "./generated/map";

type HeadingProps = ComponentPropsWithoutRef<"h2">;

function heading(Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  return function Heading({ id, children, ...props }: HeadingProps) {
    return (
      <Tag id={id} {...props}>
        {id ? (
          <a href={`#${id}`} className="v2-anchor">
            {children}
          </a>
        ) : (
          children
        )}
      </Tag>
    );
  };
}

function Anchor({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

function Pre({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  const language = (props as Record<string, unknown>)["data-language"];
  return (
    <div className="v2-code">
      <div className="v2-code-bar">
        <span>{typeof language === "string" && language !== "plaintext" ? language : "code"}</span>
        <CopyButton />
      </div>
      <pre {...props}>{children}</pre>
    </div>
  );
}

type CalloutType = "info" | "tip" | "warning" | "danger";

const calloutIcons = {
  info: Info,
  tip: Lightbulb,
  warning: AlertTriangle,
  danger: OctagonAlert,
};

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: CalloutType;
  title?: ReactNode;
  children?: ReactNode;
}) {
  const Icon = calloutIcons[type];
  return (
    <div className="v2-callout" data-type={type} role={type === "danger" ? "alert" : "note"}>
      <Icon className="v2-callout-icon" aria-hidden />
      <div className="min-w-0">
        {title && <p className="v2-callout-title">{title}</p>}
        <div className="v2-callout-body">{children}</div>
      </div>
    </div>
  );
}

/** Legacy <Notice message link /> from the 1.x docs. */
function Notice({ message, link }: { message?: string; link?: string }) {
  return (
    <Callout type="info">
      {message}
      {link && (
        <>
          {" "}
          <Anchor href={link}>Learn more</Anchor>
        </>
      )}
    </Callout>
  );
}

/** Legacy <WarningBanner /> from the 1.x docs. */
function WarningBanner({
  title = "Breaking API Specification",
  children,
}: {
  title?: string;
  stability?: string;
  children?: ReactNode;
}) {
  return (
    <Callout type="warning" title={title}>
      {children}
    </Callout>
  );
}

/**
 * A link to the plugin on the Figma Community, carrying Figma's mark.
 *
 * The five shapes are Figma's logo and its brand colours, so it reads as
 * "this goes to Figma" before the words are read. `aria-hidden` because the
 * link's own text already says where it goes; announcing the logo as well
 * would say it twice.
 */
function FigmaLogo() {
  return (
    <svg
      viewBox="0 0 38 57"
      width="15"
      height="22"
      aria-hidden="true"
      focusable="false"
      style={{ flex: "none" }}
    >
      <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE" />
      <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83" />
      <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" fill="#FF7262" />
      <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E" />
      <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF" />
    </svg>
  );
}

/** <FigmaPlugin /> — the install button for the Figma Community listing. */
function FigmaPlugin({
  label = "Get the plugin on Figma Community",
}: {
  label?: string;
}) {
  return (
    <p style={{ margin: "1.25rem 0" }}>
      <a
        className="v2-btn"
        href="https://www.figma.com/community/plugin/1692828324805361551"
        target="_blank"
        rel="noreferrer"
      >
        <FigmaLogo />
        {label}
      </a>
    </p>
  );
}
export const mdxComponents = {
  h1: heading("h2"), // The page header owns the only <h1>.
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
  h5: heading("h5"),
  h6: heading("h6"),
  a: Anchor,
  pre: Pre,
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="v2-table" tabIndex={0} role="region" aria-label="Table">
      <table {...props} />
    </div>
  ),
  img: ({ alt = "", ...props }: ComponentPropsWithoutRef<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} loading="lazy" decoding="async" {...props} />
  ),
  Callout,
  Notice,
  FigmaPlugin,
  WarningBanner,
  CommandTabs,
  MermaidChart,
  // Every live demo, generated from the wrapper files on disk.
  ...demoComponents,
};
