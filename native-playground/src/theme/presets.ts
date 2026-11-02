import type { KitTokens } from "../../../source/components/shared/native";

/**
 * The web docs playground's presets (docs-site/app/(main)/_lib/theme-vars.ts),
 * with each `light-dark(a, b)` pair split into a light and a dark set.
 */
export type PresetId = "default" | "violet" | "teal" | "rose" | "square";

export interface Preset {
  id: PresetId;
  label: string;
  swatch: string;
  light: Partial<KitTokens>;
  dark: Partial<KitTokens>;
}

export const PRESETS: Preset[] = [
  { id: "default", label: "Default", swatch: "#2563eb", light: {}, dark: {} },
  {
    id: "violet",
    label: "Violet",
    swatch: "#7c3aed",
    light: { accent: "#7c3aed", accentSoft: "#f3e8ff", accentStrong: "#6d28d9", focus: "#7c3aed", radius: 10 },
    dark: { accent: "#c4b5fd", accentSoft: "#2e1065", accentStrong: "#ddd6fe", focus: "#c4b5fd", radius: 10 },
  },
  {
    id: "teal",
    label: "Teal",
    swatch: "#0f766e",
    light: { accent: "#0f766e", accentSoft: "#ecfdf5", accentStrong: "#115e59", focus: "#0f766e", radius: 4 },
    dark: { accent: "#5eead4", accentSoft: "#042f2e", accentStrong: "#99f6e4", focus: "#5eead4", radius: 4 },
  },
  {
    id: "rose",
    label: "Rose",
    swatch: "#e11d48",
    light: { accent: "#e11d48", accentSoft: "#fff1f2", accentStrong: "#be123c", focus: "#e11d48", radius: 14 },
    dark: { accent: "#fda4af", accentSoft: "#4c0519", accentStrong: "#fecdd3", focus: "#fda4af", radius: 14 },
  },
  {
    id: "square",
    label: "Square",
    swatch: "#18181b",
    light: { accent: "#18181b", accentFg: "#ffffff", accentSoft: "#f4f4f5", accentStrong: "#000000", focus: "#18181b", radius: 0 },
    dark: { accent: "#fafafa", accentFg: "#18181b", accentSoft: "#27272a", accentStrong: "#e4e4e7", focus: "#fafafa", radius: 0 },
  },
];

export const presetById = (id: PresetId): Preset => PRESETS.find((p) => p.id === id) ?? PRESETS[0];
