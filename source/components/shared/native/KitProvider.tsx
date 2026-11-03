import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
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
import { KitIconsContext, type KitIcons } from "./icons";
import { mergeIcons } from "./icons-merge";
import { createPortalHost, sameIcons, sameTheme, type PortalHost } from "./portal-host";
import { resolveTokens, type ColorScheme, type KitTheme, type KitTokens } from "./theme";

interface ThemeValue {
  tokens: KitTokens;
  scheme: ColorScheme;
}

const ThemeContext = createContext<ThemeValue | null>(null);

interface PortalValue {
  mount(node: ReactNode): number;
  update(key: number, node: ReactNode): void;
  unmount(key: number): void;
}
const PortalContext = createContext<PortalValue | null>(null);
// The full host, for Overlay: it claims the top layer while open and renders
// the portal outlet inside its Modal. See portal-host.ts for why.
const PortalHostContext = createContext<PortalHost<ReactNode> | null>(null);
// True inside a portal outlet, so an overlay rendered from a portal entry does
// not pull the outlet into itself (which would unmount it, and loop).
const InsideOutletContext = createContext(false);

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
  /**
   * Your icon pack for Kit's built-in marks (chevrons, close, check, search…),
   * e.g. `{ close: ({ size, color }) => <Ionicons name="close" size={size} color={color} /> }`.
   * Marks you leave out keep Kit's drawing. A nested provider adds to the outer one's.
   */
  icons?: Partial<KitIcons>;
  children?: ReactNode;
}

/**
 * Mount once at the app root, around everything. Supplies the theme, follows
 * the device's light/dark setting, and hosts overlays (toasts, dialogs, menus)
 * above the rest of the app.
 */
export function KitProvider({ theme, colorScheme = "system", insets, icons, children }: KitProviderProps) {
  const device = useColorScheme();
  const scheme: ColorScheme =
    colorScheme === "system" ? (device === "dark" ? "dark" : "light") : colorScheme;
  // Keep the last theme and icons while the new ones are equal, so an inline
  // `theme={{ … }}` does not rebuild tokens (and every consumer's styles) on
  // each render of the parent.
  const stableTheme = useStable(theme, sameTheme);
  const stableIcons = useStable(icons, sameIcons);
  const value = useMemo(() => ({ tokens: resolveTokens(scheme, stableTheme), scheme }), [scheme, stableTheme]);
  const { top = 0, right = 0, bottom = 0, left = 0 } = insets ?? {};
  const edges = useMemo(() => ({ top, right, bottom, left }), [top, right, bottom, left]);
  const outerIcons = useContext(KitIconsContext);
  const iconSet = useMemo(() => mergeIcons(outerIcons, stableIcons), [outerIcons, stableIcons]);

  const [host] = useState(() => createPortalHost<ReactNode>());
  const portal = useMemo<PortalValue>(
    () => ({ mount: host.mount, update: host.update, unmount: host.unmount }),
    [host],
  );

  return (
    <ThemeContext.Provider value={value}>
      <InsetsContext.Provider value={edges}>
      <KitIconsContext.Provider value={iconSet}>
      <PortalContext.Provider value={portal}>
      <PortalHostContext.Provider value={host}>
        <View style={styles.root}>
          {children}
          <PortalOutlet layer={null} />
        </View>
      </PortalHostContext.Provider>
      </PortalContext.Provider>
      </KitIconsContext.Provider>
      </InsetsContext.Provider>
    </ThemeContext.Provider>
  );
}

/** `value`, or the previous one while it is still equal by `same`. */
function useStable<T>(value: T, same: (a: T, b: T) => boolean): T {
  const ref = useRef(value);
  if (ref.current !== value && !same(ref.current, value)) ref.current = value;
  return ref.current;
}

/**
 * Where portal entries render: the provider's own view (`layer` null) while no
 * overlay is open, else inside the top-most open overlay's Modal. Only the
 * outlet whose layer is on top renders anything, so no entry renders twice.
 */
function PortalOutlet({ layer }: { layer: object | null }) {
  const host = useContext(PortalHostContext);
  const entries = useSyncExternalStore(host ? host.subscribe : noSubscribe, () => host?.entries() ?? EMPTY);
  const top = useSyncExternalStore(host ? host.subscribe : noSubscribe, () => host?.top() ?? null);
  if (!host || top !== layer || entries.length === 0) return null;
  return (
    <InsideOutletContext.Provider value>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {entries.map((entry) => (
          <View key={entry.key} style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {entry.node}
          </View>
        ))}
      </View>
    </InsideOutletContext.Provider>
  );
}
const EMPTY: readonly never[] = [];
const noSubscribe = () => () => undefined;

/**
 * For Overlay: while `active`, claim the top layer, so portal entries (toasts,
 * tooltips) move into this overlay's Modal and stay above it. Returns the
 * outlet to render inside the Modal, after the overlay's own content.
 */
export function useOverlayPortalOutlet(active: boolean): ReactNode {
  const host = useContext(PortalHostContext);
  const inside = useContext(InsideOutletContext);
  const [layer, setLayer] = useState<object | null>(null);
  useEffect(() => {
    if (!active || !host || inside) return undefined;
    const claim = host.claimLayer();
    setLayer(claim.layer);
    return () => {
      claim.release();
      setLayer(null);
    };
  }, [active, host, inside]);
  return layer ? <PortalOutlet layer={layer} /> : null;
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

// flexGrow, not flex: 1. At the app root it still fills the screen; nested
// around one section (scoped theming) it takes its content's height instead
// of collapsing to zero inside a ScrollView.
// Grow and shrink, from the content's size. At the app root that fills the
// screen and no more, so a ScrollView inside can scroll (grow-only stretched to
// the full content height and nothing scrolled). Nested inside scroll content,
// where there is no height to fill, it is just as tall as what it wraps (flex: 1
// collapsed it to zero there).
const styles = StyleSheet.create({ root: { flexGrow: 1, flexShrink: 1 } });
