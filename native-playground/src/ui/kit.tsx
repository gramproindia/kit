import Ionicons from "@expo/vector-icons/Ionicons";
import { createContext, useContext, useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View, type ScrollViewProps } from "react-native";
import { useKitTheme } from "../../../source/components/shared/native";
import { AppBar, AppBarAction, type AppBarProps } from "../../../source/native/app-bar";
import { router, useNavigation, useRoute } from "expo-router";

/*
 * Kit ships no icon set: every icon slot (Button `icon`/`leading`, Fab `icon`,
 * BottomNavigation `icon`, AppBar actions, ListItem `leading`) takes any React
 * node. This app passes Ionicons from @expo/vector-icons, which every Expo app
 * can use and Expo Go already contains. Text glyphs were the stand-in before;
 * their font metrics sat them off-centre, most visibly the Fab's "+".
 */
const IONICONS: Record<string, ComponentProps<typeof Ionicons>["name"]> = {
  "⌂": "home-outline",
  "＋": "add",
  "+": "add",
  "▦": "grid-outline",
  "⚙": "settings-outline",
  "⌕": "search",
  "⋮": "ellipsis-vertical",
  "ⓘ": "information-circle-outline",
  "↺": "refresh",
  "⤴": "share-outline",
  "⧉": "copy-outline",
  "✆": "logo-whatsapp",
  "✉": "mail-outline",
  "⤓": "download-outline",
};

/** An icon by its old glyph name; unknown glyphs still render as text. */
export function Icon({ glyph, color, size = 20 }: { glyph: string; color?: string; size?: number }) {
  const { tokens } = useKitTheme();
  const name = IONICONS[glyph];
  if (name) return <Ionicons name={name} size={size} color={color ?? tokens.fg} />;
  return <Text style={{ fontSize: size, lineHeight: size + 2, color: color ?? tokens.fg }}>{glyph}</Text>;
}

/** An app bar icon button with a text glyph. */
export function BarAction({ glyph, label, onPress }: { glyph: string; label: string; onPress?(): void }) {
  return (
    <AppBarAction aria-label={label} onPress={onPress}>
      <Icon glyph={glyph} size={22} />
    </AppBarAction>
  );
}

export interface ScreenProps extends Omit<AppBarProps, "children"> {
  children?: ReactNode;
  /** Wrap the content in a ScrollView. Default true. */
  scroll?: boolean;
  /** Extra content under the bar, outside the scroll (search bars, tabs). */
  header?: ReactNode;
  /** Floats over the content (Fab). */
  overlay?: ReactNode;
  scrollProps?: ScrollViewProps;
}

/** Scroll distance after which the large title has gone under the bar. */
const LARGE_TITLE_HEIGHT = 56;

/**
 * Every screen: an AppBar (with back when the screen was pushed), then
 * scrolling content. The bar raises once content scrolls under it.
 *
 * A large title collapses the iOS way: the bar keeps one height, the large
 * title is the first row of the scroll content and scrolls away, and the
 * small title appears in the bar once it has. Switching the bar itself from
 * `large` to `small` on scroll changed its height, which moved the content,
 * which moved the scroll position back across the threshold: jitter.
 */
/**
 * Whether this screen was pushed onto its tab's stack, so it shows a back
 * button. Only the nearest navigator counts: a tab's first screen has no back
 * arrow even though the router could go back to another tab.
 */
function usePushed(): boolean {
  const navigation = useNavigation();
  const route = useRoute();
  const state = navigation.getState();
  if (!state || state.type !== "stack") return false;
  const index = state.routes.findIndex((r) => r.key === route.key);
  // getState() is a snapshot, not a subscription: on a pushed screen's first
  // render it can still predate the push and not list this screen at all, and
  // nothing re-renders when it catches up. Missing from the snapshot means it
  // is being pushed, unless it is a stack's first screen (`index`).
  return index > 0 || (index === -1 && route.name !== "index");
}

export function Screen({ children, scroll = true, header, overlay, scrollProps, ...bar }: ScreenProps) {
  const { tokens } = useKitTheme();
  const pushed = usePushed();
  const [scrolled, setScrolled] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const large = bar.variant === "large" && scroll;
  const showBarTitle = !large || collapsed;
  return (
    <View style={[styles.screen, { backgroundColor: tokens.bg }]}>
      <AppBar
        {...bar}
        variant={large ? "small" : bar.variant}
        title={showBarTitle ? bar.title : undefined}
        subtitle={showBarTitle ? bar.subtitle : undefined}
        scrolled={scrolled}
        onBack={bar.onBack ?? (pushed ? () => router.back() : undefined)}
      />
      {header}
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          scrollEventThrottle={16}
          {...scrollProps}
          onScroll={(event) => {
            const y = event.nativeEvent.contentOffset.y;
            // Setting a state to the value it already has does not re-render,
            // so this costs nothing between the two thresholds.
            setScrolled(y > 4);
            setCollapsed(y > LARGE_TITLE_HEIGHT);
            scrollProps?.onScroll?.(event);
          }}
          contentContainerStyle={[styles.content, scrollProps?.contentContainerStyle]}
        >
          {large && (
            <View style={styles.largeTitle}>
              <Text
                role="heading"
                numberOfLines={2}
                style={{ color: tokens.fg, fontSize: tokens.fontSize + 17, fontWeight: "700", letterSpacing: -0.5 }}
              >
                {bar.title}
              </Text>
              {bar.subtitle !== undefined && (
                <Text style={{ color: tokens.muted, fontSize: tokens.fontSize - 2, marginTop: 2 }}>{bar.subtitle}</Text>
              )}
            </View>
          )}
          {children}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{children}</View>
      )}
      {overlay}
    </View>
  );
}

/** A heading for a block of a screen. */
export function Heading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const { tokens } = useKitTheme();
  return (
    <View style={styles.heading}>
      <Text role="heading" style={{ color: tokens.fg, fontSize: tokens.fontSize + 2, fontWeight: "700", flex: 1 }}>
        {children}
      </Text>
      {action}
    </View>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  const { tokens } = useKitTheme();
  return <Text style={{ color: tokens.muted, fontSize: tokens.fontSize - 2 }}>{children}</Text>;
}

/*
 * Root hosts. <Toaster/> and <DialogHost/> are mounted once at the app root.
 * A few catalog demos mount their own (so they work standalone in the docs);
 * while one is open, the root ones step aside so nothing shows twice.
 */
const HostsContext = createContext<{ suppressed: boolean; setSuppressed(v: boolean): void }>({
  suppressed: false,
  setSuppressed: () => undefined,
});

export function HostsProvider({ children }: { children: ReactNode }) {
  const [suppressed, setSuppressed] = useState(false);
  return <HostsContext.Provider value={{ suppressed, setSuppressed }}>{children}</HostsContext.Provider>;
}

export const useRootHostsSuppressed = () => useContext(HostsContext).suppressed;

/** Call in a screen whose content mounts its own Toaster/DialogHost. */
export function useSuppressRootHosts(active: boolean) {
  const { setSuppressed } = useContext(HostsContext);
  useEffect(() => {
    if (!active) return;
    setSuppressed(true);
    return () => setSuppressed(false);
  }, [active, setSuppressed]);
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 120, gap: 20 },
  heading: { flexDirection: "row", alignItems: "center", gap: 8 },
  // The content's own gap and padding sit below; pull the title up to the bar.
  largeTitle: { marginTop: -8, marginBottom: -4 },
});
