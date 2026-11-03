"use client";

import {
  useId,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type SyntheticEvent,
} from "react";
import { ChevronDownIcon } from "../../shared/react/icons";
import { useAccordionContext } from "./context";
import { cx, type AccordionItemSlot } from "./props";

// Controls that do their own thing when clicked, rather than toggle the section.
const INTERACTIVE = "a[href], button, input, select, textarea, label, [contenteditable]";

export interface AccordionItemProps {
  /** Identifies the panel in the accordion's value. */
  value: string;
  title: ReactNode;
  /** A second line under the title. */
  description?: ReactNode;
  children?: ReactNode;
  /** Something at the end of the header: a badge, a count. */
  meta?: ReactNode;
  /** Replaces the chevron. */
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  classNames?: Partial<Record<AccordionItemSlot, string>>;
  style?: CSSProperties;
  ref?: Ref<HTMLDetailsElement>;
}

/**
 * One section. A `<details>` whose open state the accordion owns, so the group
 * can close the others and refuse to close the last one.
 */
export function AccordionItem(props: AccordionItemProps) {
  const {
    ref,
    value,
    title,
    description,
    children,
    meta,
    icon,
    disabled = false,
    className,
    classNames,
    style,
  } = props;

  const context = useAccordionContext("AccordionItem");
  const id = useId();
  const open = context.open.includes(value);

  const onClick = (event: MouseEvent<HTMLElement>) => {
    // A link or button placed in the title, description or meta does its own
    // job, and the browser does not toggle the section for it either.
    const control = (event.target as Element).closest(INTERACTIVE);
    if (control && control !== event.currentTarget && event.currentTarget.contains(control)) return;
    // The accordion decides; letting the browser toggle as well would fight it.
    event.preventDefault();
    if (!disabled) context.toggle(value);
  };

  // The browser can open a section by itself — find-in-page does, to show a
  // match inside. Follow it, so the state and the screen agree; a disabled
  // section is closed again. Our own changes also fire this, and match.
  const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    // React passes a nested accordion's toggles up through this one.
    if (event.target !== event.currentTarget) return;
    const details = event.currentTarget;
    if (details.open === open) return;
    if (disabled) details.open = open;
    else context.toggle(value);
  };

  return (
    <details
      ref={ref}
      className={cx("ac-item", classNames?.root, className)}
      style={style}
      open={open}
      data-disabled={disabled || undefined}
      onToggle={onToggle}
    >
      <summary
        id={`${id}-header`}
        className={cx("ac-header", classNames?.header)}
        /*
         * An explicit button role, because a bare <summary> is exposed as a
         * group in Chromium and `aria-expanded` on it is ignored — so the one
         * thing a screen reader most needs to know, whether the section is
         * open, never gets announced. The role changes nothing about the
         * keyboard: Enter and Space still come from <details> itself.
         */
        role="button"
        aria-expanded={open}
        aria-controls={`${id}-content`}
        // A disabled section is marked rather than removed from the tab order:
        // the heading of something you cannot open is still worth reading, and
        // dropping it loses it silently.
        aria-disabled={disabled || undefined}
        onClick={onClick}
      >
        {context.iconPosition === "start" && (
          <span className={cx("ac-icon", classNames?.icon)} aria-hidden="true">
            {icon ?? <ChevronDownIcon />}
          </span>
        )}

        <span className="ac-heading">
          <span className={cx("ac-title", classNames?.title)}>{title}</span>
          {description && (
            <span className={cx("ac-description", classNames?.description)}>{description}</span>
          )}
        </span>

        {meta && <span className="ac-meta">{meta}</span>}

        {context.iconPosition === "end" && (
          <span className={cx("ac-icon", classNames?.icon)} aria-hidden="true">
            {icon ?? <ChevronDownIcon />}
          </span>
        )}
      </summary>

      <div
        id={`${id}-content`}
        className={cx("ac-content", classNames?.content)}
        role="region"
        aria-labelledby={`${id}-header`}
      >
        <div className={cx("ac-body", classNames?.body)}>{children}</div>
      </div>
    </details>
  );
}
