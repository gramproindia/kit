import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  StyleSheet,
  useColorScheme,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { resolveTokens, type ColorScheme, type KitTheme, type KitTokens } from "./theme";

interface ThemeValue {
  tokens: KitTokens;
  scheme: ColorScheme;
}

const ThemeContext = createContext<ThemeValue | null>(null);

type PortalEntry = { key: number; node: ReactNode };
interface PortalValue {
  mount(node: ReactNode): number;
  update(key: number, node: ReactNode): void;
  unmount(key: number): void;
}
const PortalContext = createContext<PortalValue | null>(null);

/** Space taken by the status bar, notch and home indicator, in dp. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
const InsetsContext = createContext<Insets>(NO_INSETS);

export interface KitProviderProps {
  /** Token overrides: one set, or `{ light, dark }`. Usually your `gbs.theme.ts`. */
  theme?: KitTheme;
  /** Default follows the device setting. */
  colorScheme?: ColorScheme | "system";
  /**
   * Safe-area insets, so sheets and toasts clear the notch and the home
   * indicator. Kit has no dependency to read them; pass them from
   * `react-native-safe-area-context`: `insets={useSafeAreaInsets()}`.
   */
  insets?: Partial<Insets>;
  children?: ReactNode;
}

/**
 * Mount once at the app root, around everything. Supplies the theme, follows
 * the device's light/dark setting, and hosts overlays (toasts, dialogs, menus)
 * above the rest of the app.
 */
export function KitProvider({ theme, colorScheme = "system", insets, children }: KitProviderProps) {
  const device = useColorScheme();
  const scheme: ColorScheme =
    colorScheme === "system" ? (device === "dark" ? "dark" : "light") : colorScheme;
  const value = useMemo(() => ({ tokens: resolveTokens(scheme, theme), scheme }), [scheme, theme]);
  const { top = 0, right = 0, bottom = 0, left = 0 } = insets ?? {};
  const edges = useMemo(() => ({ top, right, bottom, left }), [top, right, bottom, left]);

  const [entries, setEntries] = useState<PortalEntry[]>([]);
  const nextKey = useRef(0);
  const portal = useMemo<PortalValue>(
    () => ({
      mount(node) {
        const key = nextKey.current++;
        setEntries((list) => [...list, { key, node }]);
        return key;
      },
      update(key, node) {
        setEntries((list) => list.map((entry) => (entry.key === key ? { key, node } : entry)));
      },
      unmount(key) {
        setEntries((list) => list.filter((entry) => entry.key !== key));
      },
    }),
    [],
  );

  return (
    <ThemeContext.Provider value={value}>
      <InsetsContext.Provider value={edges}>
      <PortalContext.Provider value={portal}>
        <View style={styles.root}>
          {children}
          {entries.length > 0 && (
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {entries.map((entry) => (
                <View key={entry.key} style={StyleSheet.absoluteFill} pointerEvents="box-none">
                  {entry.node}
                </View>
              ))}
            </View>
          )}
        </View>
      </PortalContext.Provider>
      </InsetsContext.Provider>
    </ThemeContext.Provider>
  );
}

/**
 * The current tokens and scheme. Works without a `KitProvider` too, with the
 * default palette and the device scheme, the way the CSS works without tokens.
 */
export function useKitTheme(): ThemeValue {
  const provided = useContext(ThemeContext);
  const device = useColorScheme();
  return useMemo(() => {
    if (provided) return provided;
    const scheme: ColorScheme = device === "dark" ? "dark" : "light";
    return { tokens: resolveTokens(scheme), scheme };
  }, [provided, device]);
}

/** Safe-area insets given to `KitProvider`, zero when none were. */
export function useInsets(): Insets {
  return useContext(InsetsContext);
}

/** Overlay host access. Throws without a `KitProvider`, naming the fix. */
export function usePortal(component: string): PortalValue {
  const portal = useContext(PortalContext);
  if (!portal) {
    throw new Error(`${component} needs <KitProvider> at the root of the app.`);
  }
  return portal;
}

/**
 * Styles built from tokens, cached per token object so every instance of a
 * component shares one StyleSheet.
 */
type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export function createThemedStyles<T extends NamedStyles>(
  build: (tokens: KitTokens) => T & NamedStyles,
): (tokens: KitTokens) => Readonly<T> {
  const cache = new WeakMap<KitTokens, Readonly<T>>();
  return (tokens) => {
    const cached = cache.get(tokens);
    if (cached !== undefined) return cached;
    const created = StyleSheet.create(build(tokens));
    cache.set(tokens, created);
    return created;
  };
}

/** A component's styles for the current theme. */
export function useThemedStyles<T>(styles: (tokens: KitTokens) => T): T {
  const { tokens } = useKitTheme();
  return styles(tokens);
}

const styles = StyleSheet.create({ root: { flex: 1 } });
