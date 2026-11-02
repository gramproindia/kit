import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import {
  darkTokens,
  lightTokens,
  type ColorScheme,
  type KitTheme,
  type KitTokens,
} from "../../../source/components/shared/native";
import { presetById, type PresetId } from "./presets";
import { isShared } from "./tokens";

export type SchemeSetting = ColorScheme | "system";
type Overrides = { light: Partial<KitTokens>; dark: Partial<KitTokens> };

interface SettingsValue {
  scheme: SchemeSetting;
  /** The scheme actually showing. */
  resolved: ColorScheme;
  preset: PresetId;
  overrides: Overrides;
  /** Preset plus overrides, ready for `<KitProvider theme>`. */
  theme: { light: Partial<KitTokens>; dark: Partial<KitTokens> };
  setScheme(scheme: SchemeSetting): void;
  /** Like the web playground: picking a preset replaces any edits. */
  setPreset(preset: PresetId): void;
  /** One token for one scheme; lengths (radius, font size) go to both. */
  setToken<K extends keyof KitTokens>(scheme: ColorScheme, key: K, value: KitTokens[K]): void;
  /** Back to the preset, dropping edits. */
  reset(): void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const device = useColorScheme();
  const [scheme, setScheme] = useState<SchemeSetting>("system");
  const [preset, setPresetState] = useState<PresetId>("default");
  const [overrides, setOverrides] = useState<Overrides>({ light: {}, dark: {} });

  const value = useMemo<SettingsValue>(() => {
    const base = presetById(preset);
    return {
      scheme,
      resolved: scheme === "system" ? (device === "dark" ? "dark" : "light") : scheme,
      preset,
      overrides,
      theme: {
        light: { ...base.light, ...overrides.light },
        dark: { ...base.dark, ...overrides.dark },
      },
      setScheme,
      setPreset(next) {
        setPresetState(next);
        setOverrides({ light: {}, dark: {} });
      },
      setToken(target, key, tokenValue) {
        setOverrides((current) => {
          const both = isShared(key);
          return {
            light: both || target === "light" ? { ...current.light, [key]: tokenValue } : current.light,
            dark: both || target === "dark" ? { ...current.dark, [key]: tokenValue } : current.dark,
          };
        });
      },
      reset() {
        setOverrides({ light: {}, dark: {} });
      },
    };
  }, [scheme, preset, overrides, device]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useAppSettings needs <AppSettingsProvider>.");
  return value;
}

/**
 * The `gbs.theme.ts` a project would paste, with only the tokens that differ
 * from Kit's defaults, mirroring the web playground's CSS export.
 */
export function themeSource(theme: KitTheme & { light: Partial<KitTokens>; dark: Partial<KitTokens> }): string {
  const diff = (values: Partial<KitTokens>, defaults: KitTokens) =>
    (Object.keys(values) as (keyof KitTokens)[])
      .filter((key) => values[key] !== undefined && values[key] !== defaults[key])
      .map((key) => `    ${key}: ${JSON.stringify(values[key])},`);
  const light = diff(theme.light, lightTokens);
  const dark = diff(theme.dark, darkTokens);
  const block = (name: string, lines: string[]) =>
    lines.length ? `  ${name}: {\n${lines.join("\n")}\n  },` : `  ${name}: {},`;
  return [
    'import type { KitTheme } from "./shared/native";',
    "",
    "// Pass to <KitProvider theme={theme}>. Only tokens that differ from Kit's defaults.",
    "export const theme: KitTheme = {",
    block("light", light),
    block("dark", dark),
    "};",
    "",
  ].join("\n");
}
