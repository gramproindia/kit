/*
 * The shared --gbs-* variables, as documented on the Theming page. The
 * playground writes the ones you change onto :root, which is where the docs
 * tell you to set them — and the only place that reaches components rendered
 * in the top layer (menus, dialogs, toasts).
 *
 * Keep this in sync with app/content/2.0.0-beta/theming.mdx.
 */

export type VarKind = "color" | "length" | "raw";

export interface ThemeVar {
  /** Without the leading "--", e.g. "gbs-accent". */
  name: string;
  kind: VarKind;
  /** Defaults as documented, light / dark. */
  light: string;
  dark: string;
  use: string;
  /** For length inputs. */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface ThemeGroup {
  id: string;
  vars: ThemeVar[];
}

export const THEME_GROUPS: ThemeGroup[] = [
  {
    id: "surfaces",
    vars: [
      { name: "gbs-bg", kind: "color", light: "#ffffff", dark: "#0b0b0e", use: "Component background." },
      { name: "gbs-fg", kind: "color", light: "#18181b", dark: "#f4f4f5", use: "Body text." },
      { name: "gbs-muted", kind: "color", light: "#71717a", dark: "#a1a1aa", use: "Hints, counters, secondary text." },
      { name: "gbs-subtle", kind: "color", light: "#f4f4f5", dark: "#1c1c20", use: "Quiet fills, such as a secondary button." },
      { name: "gbs-hover", kind: "color", light: "#f4f4f5", dark: "#1f1f23", use: "Hover background on buttons and menu items." },
      { name: "gbs-input-bg", kind: "color", light: "#ffffff", dark: "#121216", use: "The inside of a field." },
      { name: "gbs-readonly-bg", kind: "color", light: "#fafafa", dark: "#0e0e12", use: "A field that cannot be edited." },
      { name: "gbs-header-bg", kind: "color", light: "#fafafa", dark: "#111114", use: "Grid header, modal footer." },
      { name: "gbs-header-fg", kind: "color", light: "#3f3f46", dark: "#d4d4d8", use: "Grid header text." },
    ],
  },
  {
    id: "shape",
    vars: [
      { name: "gbs-border", kind: "color", light: "#e4e4e7", dark: "#27272a", use: "Outer borders." },
      { name: "gbs-border-subtle", kind: "color", light: "#f0f0f2", dark: "#1c1c20", use: "Row separators and other quiet lines." },
      { name: "gbs-border-control", kind: "color", light: "#a1a1aa", dark: "#52525b", use: "The outline of a checkbox or radio." },
      { name: "gbs-radius", kind: "length", light: "8px", dark: "8px", use: "Corner radius.", min: 0, max: 24, step: 1, unit: "px" },
      { name: "gbs-font-size", kind: "length", light: "13px", dark: "13px", use: "Base size; everything else is relative to it.", min: 11, max: 20, step: 1, unit: "px" },
      { name: "gbs-shadow", kind: "raw", light: "0 10px 30px -8px rgb(0 0 0 / 0.18)", dark: "0 10px 30px -8px rgb(0 0 0 / 0.6)", use: "Popovers and menus." },
      { name: "gbs-backdrop", kind: "raw", light: "rgb(9 9 11 / 0.45)", dark: "rgb(0 0 0 / 0.65)", use: "Behind a modal or dialog." },
    ],
  },
  {
    id: "accent",
    vars: [
      { name: "gbs-accent", kind: "color", light: "#2563eb", dark: "#60a5fa", use: "Selected, checked, active." },
      { name: "gbs-accent-fg", kind: "color", light: "#ffffff", dark: "#0b1220", use: "Text on an accent fill." },
      { name: "gbs-accent-soft", kind: "color", light: "#eff6ff", dark: "#172554", use: "Tinted backgrounds." },
      { name: "gbs-accent-strong", kind: "color", light: "#1d4ed8", dark: "#bfdbfe", use: "The pressed state of an accent fill." },
      { name: "gbs-focus", kind: "color", light: "#2563eb", dark: "#60a5fa", use: "Focus rings." },
      { name: "gbs-danger", kind: "color", light: "#dc2626", dark: "#f87171", use: "Errors and destructive actions." },
      { name: "gbs-danger-fg", kind: "color", light: "#ffffff", dark: "#1c0606", use: "Text on a danger fill." },
      { name: "gbs-success", kind: "color", light: "#15803d", dark: "#4ade80", use: "Completed uploads, success toasts." },
      { name: "gbs-warning", kind: "color", light: "#d97706", dark: "#fbbf24", use: "Warnings." },
      { name: "gbs-info", kind: "color", light: "#2563eb", dark: "#60a5fa", use: "Informational dialogs and toasts. Falls back to the accent." },
    ],
  },
  {
    id: "rows",
    vars: [
      { name: "gbs-row-alt", kind: "color", light: "#fcfcfd", dark: "#0e0e12", use: "Striped rows." },
      { name: "gbs-row-hover", kind: "color", light: "#f4f4f5", dark: "#18181c", use: "Hovered row." },
      { name: "gbs-row-selected", kind: "color", light: "#eef4ff", dark: "#14213d", use: "Selected row." },
      { name: "gbs-row-selected-hover", kind: "color", light: "#e2ecff", dark: "#1a2a4d", use: "Selected and hovered." },
      { name: "gbs-cell-px", kind: "length", light: "12px", dark: "12px", use: "Horizontal cell padding.", min: 4, max: 32, step: 1, unit: "px" },
      { name: "gbs-pin-shadow", kind: "raw", light: "rgb(0 0 0 / 0.08)", dark: "rgb(0 0 0 / 0.5)", use: "Edge of a pinned column." },
    ],
  },
];

export const ALL_VARS = THEME_GROUPS.flatMap((group) => group.vars);

export function findVar(name: string) {
  return ALL_VARS.find((v) => v.name === name);
}

/** Ready-made palettes. Values are light/dark pairs written as light-dark(). */
export interface Preset {
  id: string;
  /** Swatch shown on the button. */
  swatch: string;
  values: Record<string, string>;
}

export const PRESETS: Preset[] = [
  { id: "default", swatch: "#2563eb", values: {} },
  {
    id: "violet",
    swatch: "#7c3aed",
    values: {
      "gbs-accent": "light-dark(#7c3aed, #c4b5fd)",
      "gbs-accent-soft": "light-dark(#f3e8ff, #2e1065)",
      "gbs-accent-strong": "light-dark(#6d28d9, #ddd6fe)",
      "gbs-focus": "light-dark(#7c3aed, #c4b5fd)",
      "gbs-radius": "10px",
    },
  },
  {
    id: "teal",
    swatch: "#0f766e",
    values: {
      "gbs-accent": "light-dark(#0f766e, #5eead4)",
      "gbs-accent-soft": "light-dark(#ecfdf5, #042f2e)",
      "gbs-accent-strong": "light-dark(#115e59, #99f6e4)",
      "gbs-focus": "light-dark(#0f766e, #5eead4)",
      "gbs-radius": "4px",
    },
  },
  {
    id: "rose",
    swatch: "#e11d48",
    values: {
      "gbs-accent": "light-dark(#e11d48, #fda4af)",
      "gbs-accent-soft": "light-dark(#fff1f2, #4c0519)",
      "gbs-accent-strong": "light-dark(#be123c, #fecdd3)",
      "gbs-focus": "light-dark(#e11d48, #fda4af)",
      "gbs-radius": "14px",
    },
  },
  {
    id: "square",
    swatch: "#18181b",
    values: {
      "gbs-accent": "light-dark(#18181b, #fafafa)",
      "gbs-accent-fg": "light-dark(#ffffff, #18181b)",
      "gbs-accent-soft": "light-dark(#f4f4f5, #27272a)",
      "gbs-accent-strong": "light-dark(#000000, #e4e4e7)",
      "gbs-focus": "light-dark(#18181b, #fafafa)",
      "gbs-radius": "0px",
    },
  },
];

/** The CSS you would paste into your own project. */
export function toCss(values: Record<string, string>) {
  const entries = Object.entries(values);
  if (entries.length === 0) return ":root {\n  /* Nothing changed yet — the defaults are in use. */\n}\n";
  return `:root {\n${entries.map(([name, value]) => `  --${name}: ${value};`).join("\n")}\n}\n`;
}

/** Reads a light-dark() pair, so the colour input can show the right half. */
export function resolveForScheme(value: string, scheme: "light" | "dark") {
  const match = /^light-dark\(\s*([^,]+),\s*([^)]+)\)$/.exec(value.trim());
  if (!match) return value.trim();
  return (scheme === "light" ? match[1] : match[2]).trim();
}

/** Writes back a light-dark() pair, keeping the half you are not editing. */
export function withScheme(current: string | undefined, next: string, scheme: "light" | "dark", fallback: ThemeVar) {
  const other = current
    ? resolveForScheme(current, scheme === "light" ? "dark" : "light")
    : scheme === "light"
      ? fallback.dark
      : fallback.light;
  return scheme === "light" ? `light-dark(${next}, ${other})` : `light-dark(${other}, ${next})`;
}
