import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View, type ScrollViewProps } from "react-native";
import { useKitTheme } from "../../../source/components/shared/native";
import { AppBar, AppBarAction, type AppBarProps } from "../../../source/native/app-bar";
import { useCanGoBack, useNav } from "../navigation/Navigator";

/** A text glyph standing in for an icon set (Kit ships no icons on native). */
export function Icon({ glyph, color, size = 20 }: { glyph: string; color?: string; size?: number }) {
  const { tokens } = useKitTheme();
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

/**
 * Every screen: an AppBar (with back when the screen was pushed), then
 * scrolling content. The bar raises once content scrolls under it.
 */
export function Screen({ children, scroll = true, header, overlay, scrollProps, ...bar }: ScreenProps) {
  const { tokens } = useKitTheme();
  const nav = useNav();
  const canGoBack = useCanGoBack();
  const [scrolled, setScrolled] = useState(false);
  return (
    <View style={[styles.screen, { backgroundColor: tokens.bg }]}>
      <AppBar
        {...bar}
        variant={bar.variant === "large" && scrolled ? "small" : bar.variant}
        scrolled={scrolled}
        onBack={bar.onBack ?? (canGoBack ? nav.pop : undefined)}
      />
      {header}
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          scrollEventThrottle={16}
          {...scrollProps}
          onScroll={(event) => {
            setScrolled(event.nativeEvent.contentOffset.y > 4);
            scrollProps?.onScroll?.(event);
          }}
          contentContainerStyle={[styles.content, scrollProps?.contentContainerStyle]}
        >
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
});
