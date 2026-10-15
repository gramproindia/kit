import type { ReactNode } from "react";

export type DialogKind = "alert" | "confirm" | "prompt";
export type DialogIntent = "default" | "info" | "success" | "warning" | "danger";
export type DialogSize = "sm" | "md";

export interface DialogBaseOptions {
  title: ReactNode;
  /** The detail under the title - what is about to happen, and to what. */
  description?: ReactNode;
  /** Sets the icon and the confirm button's color. `danger` also focuses Cancel first. */
  intent?: DialogIntent;
  /** Replaces the intent's icon; `null` hides it. */
  icon?: ReactNode;
  /**
   * The confirming button's text. Defaults to OK for an alert and Confirm
   * otherwise; naming the action ("Delete project") reads better than
   * either.
   */
  confirmLabel?: ReactNode;
  /** Escape and a backdrop click count as Cancel. Default true. */
  dismissible?: boolean;
  /** Default `md`. */
  size?: DialogSize;
}

export interface AlertOptions extends DialogBaseOptions {
  /** Runs on OK. The dialog waits while it runs and shows its error if it throws. */
  onConfirm?(): void | Promise<void>;
}

export interface ConfirmOptions extends DialogBaseOptions {
  /** The dismissing button's text. Defaults to Cancel. */
  cancelLabel?: ReactNode;
  /** Runs on Confirm. The dialog waits while it runs and shows its error if it throws. */
  onConfirm?(): void | Promise<void>;
}

export interface PromptOptions extends DialogBaseOptions {
  /** The dismissing button's text. Defaults to Cancel. */
  cancelLabel?: ReactNode;
  defaultValue?: string;
  placeholder?: string;
  /** Names the text field. Without it the field is named by the title. */
  inputLabel?: ReactNode;
  /**
   * The field's input type, which picks the on-screen keyboard on a phone.
   * Default `text`. The value still arrives as a string.
   */
  inputType?: "text" | "email" | "password" | "number" | "url" | "tel";
  required?: boolean;
  /** Return a message to block confirming. */
  validate?(value: string): string | null | undefined;
  /** Runs with the value on Confirm. The dialog waits while it runs and shows its error if it throws. */
  onConfirm?(value: string): void | Promise<void>;
}

export type DialogRequest =
  | { id: string; kind: "alert"; options: AlertOptions }
  | { id: string; kind: "confirm"; options: ConfirmOptions }
  | { id: string; kind: "prompt"; options: PromptOptions };

export interface DialogSnapshot {
  /** The first request is on screen; the rest wait their turn. */
  queue: readonly DialogRequest[];
}

export interface DialogLocaleText {
  ok: string;
  confirm: string;
  cancel: string;
  required: string;
}
