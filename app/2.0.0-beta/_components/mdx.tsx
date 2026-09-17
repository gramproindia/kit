import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Info, Lightbulb, OctagonAlert } from "lucide-react";
import { CopyButton } from "./CopyButton";
import {
  DatePickerWrapperBeta,
  DateRangePickerWrapper,
  DemoGrid,
  FileUploaderWrapperBeta,
  MermaidChart,
  MultiSelectWrapper,
  SelectWrapper,
  ToasterWrapper,
} from "./demos";

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
  WarningBanner,
  DemoGrid,
  SelectWrapper,
  MultiSelectWrapper,
  DatePickerWrapperBeta,
  DateRangePickerWrapper,
  FileUploaderWrapperBeta,
  ToasterWrapper,
  MermaidChart,
};
