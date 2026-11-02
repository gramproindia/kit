/**
 * The native mirror of the `--gbs-*` CSS tokens. Same names (camelCase), same
 * default palette, so a brand set once in Figma themes web and native alike.
 *
 * Colours are hex so components can mix them (pressed fills, soft tints); a
 * non-hex value still works everywhere, it just is not mixed.
 */
export interface KitTokens {
  bg: string;
  fg: string;
  muted: string;
  border: string;
  borderControl: string;
  borderSubtle: string;
  hover: string;
  subtle: string;
  inputBg: string;
  readonlyBg: string;
  accent: string;
  accentFg: string;
  accentSoft: string;
  accentStrong: string;
  danger: string;
  dangerFg: string;
  success: string;
  warning: string;
  info: string;
  focus: string;
  skeleton: string;
  backdrop: string;
  /** Surface of raised things (elevated cards, sheets, menus). Lighter than `bg` in dark mode, where shadows barely show. */
  raised: string;
  /** CSS `box-shadow` for raised things, as `--gbs-shadow`. */
  shadow: string;
  tooltipBg: string;
  tooltipFg: string;
  /** Corner radius, in dp. */
  radius: number;
  /** Body text size, in dp. Mobile reads larger than the web's 13px. */
  fontSize: number;
  /** Smallest height for anything tappable (44 iOS, 48 Material; 44 by default). */
  touchTarget: number;
}

export type ColorScheme = "light" | "dark";

export const lightTokens: KitTokens = {
  bg: "#ffffff",
  fg: "#18181b",
  muted: "#71717a",
  border: "#e4e4e7",
  borderControl: "#a1a1aa",
  borderSubtle: "#f0f0f2",
  hover: "#f4f4f5",
  subtle: "#f4f4f5",
  inputBg: "#ffffff",
  readonlyBg: "#fafafa",
  accent: "#2563eb",
  accentFg: "#ffffff",
  accentSoft: "#eff6ff",
  accentStrong: "#1d4ed8",
  danger: "#dc2626",
  dangerFg: "#ffffff",
  success: "#15803d",
  warning: "#b45309",
  info: "#2563eb",
  focus: "#2563eb",
  skeleton: "#ececee",
  backdrop: "rgba(9, 9, 11, 0.5)",
  raised: "#ffffff",
  shadow: "0 10px 30px -8px rgba(0, 0, 0, 0.18)",
  tooltipBg: "#18181b",
  tooltipFg: "#fafafa",
  radius: 8,
  fontSize: 15,
  touchTarget: 44,
};

export const darkTokens: KitTokens = {
  ...lightTokens,
  bg: "#0b0b0e",
  fg: "#f4f4f5",
  muted: "#a1a1aa",
  border: "#27272a",
  borderControl: "#52525b",
  borderSubtle: "#1c1c20",
  hover: "#1f1f23",
  subtle: "#1c1c20",
  inputBg: "#121216",
  readonlyBg: "#0e0e12",
  accent: "#60a5fa",
  accentFg: "#0b1220",
  accentSoft: "#172554",
  accentStrong: "#bfdbfe",
  danger: "#f87171",
  dangerFg: "#1c0606",
  success: "#4ade80",
  warning: "#fbbf24",
  info: "#60a5fa",
  focus: "#60a5fa",
  skeleton: "#232329",
  backdrop: "rgba(0, 0, 0, 0.6)",
  raised: "#18181c",
  shadow: "0 10px 30px -8px rgba(0, 0, 0, 0.6)",
  tooltipBg: "#f4f4f5",
  tooltipFg: "#18181b",
};

/** Overrides per scheme, or one set for both. What `gbs.theme.ts` exports. */
export type KitTheme =
  | Partial<KitTokens>
  | { light?: Partial<KitTokens>; dark?: Partial<KitTokens> };

export function resolveTokens(scheme: ColorScheme, theme?: KitTheme): KitTokens {
  const base = scheme === "dark" ? darkTokens : lightTokens;
  if (!theme) return base;
  const perScheme = "light" in theme || "dark" in theme;
  const overrides = perScheme
    ? (theme as { light?: Partial<KitTokens>; dark?: Partial<KitTokens> })[scheme]
    : (theme as Partial<KitTokens>);
  return overrides ? { ...base, ...overrides } : base;
}

const HEX = /^#([0-9a-f]{6})$/i;

/** `a` moved towards `b` by `amount` (0–1), like CSS `color-mix(in srgb)`. */
export function mix(a: string, b: string, amount: number): string {
  const x = HEX.exec(a);
  const y = HEX.exec(b);
  if (!x || !y) return a;
  const p = parseInt(x[1], 16);
  const q = parseInt(y[1], 16);
  const channel = (shift: number) => {
    const from = (p >> shift) & 255;
    const to = (q >> shift) & 255;
    return Math.round(from + (to - from) * amount);
  };
  const value = (channel(16) << 16) | (channel(8) << 8) | channel(0);
  return `#${value.toString(16).padStart(6, "0")}`;
}

/** `color` at `opacity` (0–1), for tints over any background. */
export function alpha(color: string, opacity: number): string {
  const x = HEX.exec(color);
  if (!x) return color;
  const value = parseInt(x[1], 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${opacity})`;
}
