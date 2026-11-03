"use client";

import {
  memo,
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { ToastStore } from "../core/store";
import type { ToastAction, ToasterLocaleText, ToastRecord, ToastType } from "../core/types";
import { ErrorIcon, InfoIcon, SpinnerIcon, SuccessIcon, WarningIcon, XIcon } from "./icons";
import { cx, type ToasterSlot } from "./props";

/** Horizontal drag, in pixels, that dismisses a toast. */
const SWIPE_DISMISS = 64;

const DEFAULT_ICONS: Record<ToastType, ReactNode> = {
  default: null,
  success: <SuccessIcon />,
  error: <ErrorIcon />,
  warning: <WarningIcon />,
  info: <InfoIcon />,
  loading: <SpinnerIcon />,
};

interface ToastItemProps {
  toast: ToastRecord;
  store: ToastStore;
  closeButton: boolean;
  icons?: Partial<Record<ToastType, ReactNode>>;
  classNames?: Partial<Record<ToasterSlot, string>>;
  text: ToasterLocaleText;
}

/**
 * Memoised: pausing and resuming the timers re-renders the Toaster, and none of
 * that should reach toasts whose record has not changed.
 */
export const ToastItem = memo(function ToastItem({
  toast,
  store,
  closeButton,
  icons,
  classNames,
  text,
}: ToastItemProps) {
  const itemRef = useRef<HTMLLIElement>(null);
  const drag = useRef<{ pointerId: number; startX: number } | null>(null);
  const swipe = useRef({ offset: 0, frame: 0 });
  const { action, cancel, render } = toast;
  const closing = toast.state === "closing";

  useEffect(() => () => cancelAnimationFrame(swipe.current.frame), []);

  /**
   * The drag offset goes straight to a CSS variable, at most once a frame,
   * instead of through state: a re-render per pointermove is wasted work.
   */
  const setSwipe = (offset: number) => {
    swipe.current.offset = offset;
    if (swipe.current.frame) return;
    swipe.current.frame = requestAnimationFrame(() => {
      swipe.current.frame = 0;
      const element = itemRef.current;
      if (!element) return;
      const value = swipe.current.offset;
      element.style.setProperty("--ts-swipe", `${value}px`);
      element.toggleAttribute("data-swiping", value !== 0);
    });
  };

  const dismiss = () => {
    // A focused button that is removed fires no focusout, so the Toaster would
    // think focus is still inside and hold every timer. Hand focus to the list
    // first, as Escape does, so it stays in the region and blur works later.
    const element = itemRef.current;
    if (element?.contains(document.activeElement)) {
      element.closest<HTMLElement>(".ts-list")?.focus();
    }
    store.dismiss(toast.id);
  };

  // `null` from the toast or the Toaster hides the icon; `undefined` means "use the default".
  const icon =
    toast.icon !== undefined
      ? toast.icon
      : icons !== undefined && Object.hasOwn(icons, toast.type)
        ? icons[toast.type]
        : DEFAULT_ICONS[toast.type];

  const runAction = (item: ToastAction, event: MouseEvent<HTMLButtonElement>) => {
    item.onClick(event);
    if (!event.defaultPrevented) dismiss();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key !== "Escape" || !toast.dismissible) return;
    event.preventDefault();
    // dismiss() keeps focus in the notification region instead of dropping it on <body>.
    dismiss();
  };

  const onPointerDown = (event: PointerEvent<HTMLLIElement>) => {
    if (!toast.dismissible || closing || event.button !== 0) return;
    if ((event.target as Element).closest("button, a, input, select, textarea")) return;
    drag.current = { pointerId: event.pointerId, startX: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLLIElement>) => {
    const start = drag.current;
    if (start?.pointerId === event.pointerId) setSwipe(event.clientX - start.startX);
  };

  const endSwipe = (event: PointerEvent<HTMLLIElement>) => {
    const start = drag.current;
    if (start?.pointerId !== event.pointerId) return;
    drag.current = null;
    const far = Math.abs(event.clientX - start.startX) >= SWIPE_DISMISS;
    if (event.type === "pointerup" && far) dismiss();
    else setSwipe(0);
  };

  return (
    <li
      ref={itemRef}
      className={cx("ts-toast", classNames?.toast, toast.className)}
      // The list is a polite live region; errors interrupt.
      role={toast.type === "error" ? "alert" : undefined}
      aria-atomic="true"
      tabIndex={0}
      data-type={toast.type}
      data-state={toast.state}
      data-custom={render ? "" : undefined}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
    >
      {!render && icon != null && (
        <span className={cx("ts-icon", classNames?.icon)} aria-hidden="true">
          {icon}
        </span>
      )}

      <div className={cx("ts-content", classNames?.content)}>
        {render ? (
          render({ id: toast.id, dismiss })
        ) : (
          <>
            <div className={cx("ts-title", classNames?.title)}>{toast.title}</div>
            {toast.description != null && (
              <div className={cx("ts-description", classNames?.description)}>
                {toast.description}
              </div>
            )}
          </>
        )}
      </div>

      {!render && (action || cancel) && (
        <div className={cx("ts-actions", classNames?.actions)}>
          {cancel && (
            <button
              type="button"
              className={cx("ts-button", classNames?.cancel)}
              data-variant="cancel"
              onClick={(event) => runAction(cancel, event)}
            >
              {cancel.label}
            </button>
          )}
          {action && (
            <button
              type="button"
              className={cx("ts-button", classNames?.action)}
              data-variant="action"
              onClick={(event) => runAction(action, event)}
            >
              {action.label}
            </button>
          )}
        </div>
      )}

      {closeButton && toast.dismissible && (
        <button
          type="button"
          className={cx("ts-close", classNames?.close)}
          aria-label={text.close}
          onClick={dismiss}
        >
          <XIcon />
        </button>
      )}
    </li>
  );
});
