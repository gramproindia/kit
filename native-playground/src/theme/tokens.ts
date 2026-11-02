import type { KitTokens } from "../../../source/components/shared/native";

/**
 * The editable tokens, grouped like the web playground's THEME_GROUPS. Names
 * are the camelCase KitTokens of the `--gbs-*` variables (gbs-input-bg →
 * inputBg). Web-only variables (header-bg/fg, grid row-*, cell-px, pin-shadow)
 * have no native component using them, so they are left out.
 */
export type TokenKind = "color" | "length" | "raw";

export interface TokenMeta {
  key: keyof KitTokens;
  /** The web variable it mirrors, or null for native-only tokens. */
  web: string | null;
  kind: TokenKind;
  use: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface TokenGroup {
  id: string;
  title: string;
  tokens: TokenMeta[];
}

export const TOKEN_GROUPS: TokenGroup[] = [
  {
    id: "surfaces",
    title: "Surfaces and text",
    tokens: [
      { key: "bg", web: "gbs-bg", kind: "color", use: "Component background." },
      { key: "fg", web: "gbs-fg", kind: "color", use: "Body text." },
      { key: "muted", web: "gbs-muted", kind: "color", use: "Hints, counters, secondary text." },
      { key: "subtle", web: "gbs-subtle", kind: "color", use: "Quiet fills, such as a secondary button." },
      { key: "hover", web: "gbs-hover", kind: "color", use: "Pressed background on buttons and rows." },
      { key: "inputBg", web: "gbs-input-bg", kind: "color", use: "The inside of a field." },
      { key: "readonlyBg", web: "gbs-readonly-bg", kind: "color", use: "A field that cannot be edited." },
      { key: "raised", web: null, kind: "color", use: "Sheets, menus, elevated cards (native only)." },
    ],
  },
  {
    id: "shape",
    title: "Borders and shape",
    tokens: [
      { key: "border", web: "gbs-border", kind: "color", use: "Outer borders." },
      { key: "borderSubtle", web: "gbs-border-subtle", kind: "color", use: "Row separators and other quiet lines." },
      { key: "borderControl", web: "gbs-border-control", kind: "color", use: "The outline of a checkbox, radio or field." },
      { key: "radius", web: "gbs-radius", kind: "length", use: "Corner radius, in dp.", min: 0, max: 24, step: 1 },
      { key: "fontSize", web: "gbs-font-size", kind: "length", use: "Base text size, in dp.", min: 12, max: 20, step: 1 },
      { key: "touchTarget", web: null, kind: "length", use: "Smallest tappable height (native only).", min: 36, max: 56, step: 2 },
      { key: "shadow", web: "gbs-shadow", kind: "raw", use: "Popovers, sheets and menus (CSS box-shadow)." },
      { key: "backdrop", web: "gbs-backdrop", kind: "raw", use: "Behind a modal, dialog or sheet." },
    ],
  },
  {
    id: "accent",
    title: "Accent and status",
    tokens: [
      { key: "accent", web: "gbs-accent", kind: "color", use: "Selected, checked, active." },
      { key: "accentFg", web: "gbs-accent-fg", kind: "color", use: "Text on an accent fill." },
      { key: "accentSoft", web: "gbs-accent-soft", kind: "color", use: "Tinted backgrounds." },
      { key: "accentStrong", web: "gbs-accent-strong", kind: "color", use: "The pressed state of an accent fill." },
      { key: "focus", web: "gbs-focus", kind: "color", use: "Focus rings." },
      { key: "danger", web: "gbs-danger", kind: "color", use: "Errors and destructive actions." },
      { key: "dangerFg", web: "gbs-danger-fg", kind: "color", use: "Text on a danger fill." },
      { key: "success", web: "gbs-success", kind: "color", use: "Completed uploads, success toasts." },
      { key: "warning", web: "gbs-warning", kind: "color", use: "Warnings." },
      { key: "info", web: "gbs-info", kind: "color", use: "Informational dialogs and toasts." },
    ],
  },
  {
    id: "other",
    title: "Other (native only)",
    tokens: [
      { key: "skeleton", web: null, kind: "color", use: "Skeleton placeholders." },
      { key: "tooltipBg", web: null, kind: "color", use: "Tooltip background." },
      { key: "tooltipFg", web: null, kind: "color", use: "Tooltip text." },
    ],
  },
];

/** Lengths apply to both schemes, as on the web (they have one value, not a pair). */
export const isShared = (key: keyof KitTokens) =>
  TOKEN_GROUPS.some((g) => g.tokens.some((t) => t.key === key && t.kind === "length"));

export const HEX = /^#[0-9a-f]{6}$/i;

/** Quick colours under each colour token. */
export const QUICK_COLORS = [
  "#2563eb", "#7c3aed", "#0f766e", "#e11d48", "#ea580c", "#ca8a04",
  "#15803d", "#0891b2", "#18181b", "#71717a", "#e4e4e7", "#ffffff",
];
