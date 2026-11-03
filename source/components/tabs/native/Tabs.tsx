import {
  Activity,
  useCallback,
  useEffect,
  useId,
  useMemo,
  use,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { useReducedMotion } from "../../shared/native/motion";
import { renderText } from "../../shared/native/primitives";
import { useControllableState } from "../../shared/react/useControllableState";
import { tabDomId } from "../core/navigation";
import type { TabsActivation, TabsOrientation, TabsSize, TabsVariant } from "../core/types";
import {
  createTabLayoutStore,
  TabLayoutContext,
  TabsContext,
  useTabsContext,
  type TabLayout,
  type TabsContextValue,
} from "./context";

const HEIGHT: Record<TabsSize, number> = { sm: 36, md: 44, lg: 52 };
const PAD: Record<TabsSize, number> = { sm: 10, md: 14, lg: 18 };

const themed = createThemedStyles((t) => ({
  root: { gap: 8 },
  vertical: { flexDirection: "row", gap: 12 },
  list: { flexDirection: "row", alignItems: "center" },
  listVertical: { flexDirection: "column", alignItems: "stretch" },
  lineList: { borderBottomWidth: 1, borderColor: t.border },
  lineListVertical: { borderBottomWidth: 0, borderRightWidth: 1, borderColor: t.border },
  enclosedList: { padding: 3, borderRadius: t.radius, backgroundColor: t.subtle },
  indicator: { position: "absolute" },
  tab: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  tabVertical: { justifyContent: "flex-start" },
  label: { fontWeight: "500" },
  badge: {
    minWidth: 18,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: t.hover,
    alignItems: "center",
  },
  badgeText: { fontSize: t.fontSize - 3, color: t.fg, fontVariant: ["tabular-nums"] },
  panel: { flexShrink: 1 },
  hidden: { display: "none" },
}));

/* ------------------------------------------------------------------- Tabs */

export interface TabsProps extends Omit<ViewProps, "children"> {
  /** Selected tab (controlled). */
  value?: string;
  /** Selected tab at first. Without either, the first enabled tab is selected. */
  defaultValue?: string;
  /** The newly selected tab. Not fired when the same tab is pressed again. */
  onValueChange?(value: string): void;
  /** Default `horizontal`. */
  orientation?: TabsOrientation;
  /**
   * Kept for API parity with the web. Touch has no arrow-key focus to follow,
   * so a press always selects.
   */
  activation?: TabsActivation;
  /** Default `line`. */
  variant?: TabsVariant;
  /** Default `md`. */
  size?: TabsSize;
  /**
   * Keep hidden panels mounted, preserving their state (form input, scroll)
   * through React's `<Activity>`. Default false.
   */
  keepMounted?: boolean;
  children?: ReactNode;
}

/** Tabs following the WAI-ARIA pattern. Compose with `TabList`, `Tab` and `TabPanel`. */
export function Tabs(props: TabsProps) {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    orientation = "horizontal",
    activation: _activation,
    variant = "line",
    size = "md",
    keepMounted = false,
    style,
    children,
    ...rest
  } = props;
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const id = useId();
  const [value, setValue] = useControllableState(valueProp, defaultValue);

  // Registration order is the visual order: tabs mount in the order written.
  const registry = useRef(new Map<string, { disabled: boolean; order: number }>());
  const counter = useRef(0);
  const [registered, setRegistered] = useState(0);
  const [layoutStore] = useState(createTabLayoutStore);

  const select = useCallback(
    (next: string) => {
      setValue(next);
      if (next !== value) onValueChange?.(next);
    },
    [setValue, value, onValueChange],
  );

  const register = useCallback((tab: string, entry: { disabled: boolean }) => {
    const existing = registry.current.get(tab);
    registry.current.set(tab, { disabled: entry.disabled, order: existing?.order ?? counter.current++ });
    setRegistered((n) => n + 1);
    return () => {
      registry.current.delete(tab);
      setRegistered((n) => n + 1);
    };
  }, []);

  const setLayout = useCallback(
    (tab: string, layout: TabLayout) => layoutStore.set(tab, layout),
    [layoutStore],
  );

  // Without a matching value, select the first enabled tab. Asked once per
  // mismatch: a controlled parent that keeps passing a value matching no tab
  // would otherwise get onValueChange on every re-render.
  const autoSelected = useRef<string | null>(null);
  useEffect(() => {
    if (value !== undefined && registry.current.has(value)) {
      autoSelected.current = null;
      return;
    }
    const first = [...registry.current.entries()]
      .filter(([, entry]) => !entry.disabled)
      .sort((a, b) => a[1].order - b[1].order)[0];
    if (!first) return;
    const attempt = JSON.stringify([value ?? null, first[0]]);
    if (autoSelected.current === attempt) return;
    autoSelected.current = attempt;
    select(first[0]);
  }, [registered, value, select]);

  const context = useMemo<TabsContextValue>(
    () => ({
      id,
      value,
      select,
      orientation,
      variant,
      size,
      keepMounted,
      register,
      setLayout,
      get layouts() {
        return layoutStore.get();
      },
    }),
    [id, value, select, orientation, variant, size, keepMounted, register, setLayout, layoutStore],
  );

  return (
    <TabsContext value={context}>
      <TabLayoutContext value={layoutStore}>
        <View {...rest} style={[s.root, orientation === "vertical" && s.vertical, style]}>
          {children}
        </View>
      </TabLayoutContext>
    </TabsContext>
  );
}

/* ---------------------------------------------------------------- TabList */

const noSubscription = () => () => undefined;

export interface TabListProps extends Omit<ViewProps, "children"> {
  /** The tab row, scrolled horizontally when the tabs do not fit. */
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{ list: StyleProp<ViewStyle>; indicator: StyleProp<ViewStyle> }>;
  children?: ReactNode;
}

export function TabList(props: TabListProps) {
  const { style, styles: slots, children, ...rest } = props;
  const context = useTabsContext();
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const reduced = useReducedMotion();
  const horizontal = context.orientation === "horizontal";
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const width = useRef<number>(0);

  // Only the list follows the tabs' measurements; see TabLayoutStore.
  const store = use(TabLayoutContext);
  const layouts = useSyncExternalStore(store?.subscribe ?? noSubscription, () =>
    store ? store.get() : context.layouts,
  );
  const active = context.value !== undefined ? layouts[context.value] : undefined;
  const start = active ? (horizontal ? active.x : active.y) : 0;
  const extent = active ? (horizontal ? active.width : active.height) : 0;

  // The indicator is laid out at the selected tab's size and moved with
  // transforms, which run on the native driver. On a change it starts scaled
  // to look like the old tab, then eases to rest at scale 1, so its rounded
  // ends are exact once it settles.
  const offset = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const placed = useRef<{ start: number; extent: number } | null>(null);

  useLayoutEffect(() => {
    if (!active) return;
    const from = placed.current;
    if (from && from.start === start && from.extent === extent) return;
    placed.current = { start, extent };
    if (!from || reduced || from.extent <= 0 || extent <= 0) {
      offset.setValue(start);
      scale.setValue(1);
    } else {
      offset.setValue(from.start);
      scale.setValue(from.extent / extent);
      Animated.parallel([
        Animated.timing(offset, { toValue: start, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
    // Keep the selected tab in view on a scrolling list.
    if (horizontal) {
      scroll.current?.scrollTo({ x: Math.max(0, start - (width.current - extent) / 2), animated: !reduced });
    }
  }, [active, start, extent, horizontal, reduced, offset, scale]);

  const { variant } = context;
  // Pinned to the list's start edge and scaled from it, so the maths above holds.
  const motion: Animated.WithAnimatedValue<ViewStyle> = horizontal
    ? { left: 0, width: extent, transformOrigin: "0% 50%", transform: [{ translateX: offset }, { scaleX: scale }] }
    : { top: 0, height: extent, transformOrigin: "50% 0%", transform: [{ translateY: offset }, { scaleY: scale }] };
  const indicatorStyle: ViewStyle =
    variant === "line"
      ? horizontal
        ? { bottom: -1, height: 2, borderRadius: 2, backgroundColor: tokens.accent }
        : { right: -1, width: 2, borderRadius: 2, backgroundColor: tokens.accent }
      : variant === "pills"
        ? horizontal
          ? { top: 0, bottom: 0, borderRadius: tokens.radius - 2, backgroundColor: tokens.accentSoft }
          : { left: 0, right: 0, borderRadius: tokens.radius - 2, backgroundColor: tokens.accentSoft }
        : horizontal
          ? { top: 3, bottom: 3, borderRadius: tokens.radius - 2, backgroundColor: tokens.bg, boxShadow: tokens.shadow }
          : { left: 3, right: 3, borderRadius: tokens.radius - 2, backgroundColor: tokens.bg, boxShadow: tokens.shadow };

  const listStyle = [
    horizontal ? s.list : s.listVertical,
    variant === "line" && (horizontal ? s.lineList : s.lineListVertical),
    variant === "enclosed" && s.enclosedList,
  ];

  const content = (
    <View {...rest} role="tablist" aria-orientation={context.orientation} style={[listStyle, slots?.list, style]}>
      {/* Behind the tabs; drawn first so labels sit on top. */}
      <Animated.View
        style={[s.indicator, indicatorStyle, motion, { opacity: active ? 1 : 0 }, slots?.indicator]}
        pointerEvents="none"
        aria-hidden
      />
      {children}
    </View>
  );

  if (!horizontal) return content;
  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(e) => {
        width.current = e.nativeEvent.layout.width;
      }}
      contentContainerStyle={{ flexGrow: 1 }}
      style={{ flexGrow: 0 }}
    >
      {content}
    </ScrollView>
  );
}

/* -------------------------------------------------------------------- Tab */

/** What `style` callbacks receive: the native stand-in for `aria-selected` and friends. */
export interface TabStyleState {
  selected: boolean;
  pressed: boolean;
  disabled: boolean;
}

export interface TabProps extends Omit<PressableProps, "children" | "style" | "disabled"> {
  /** Identifies the tab and its panel. */
  value: string;
  disabled?: boolean;
  /** An icon before the tab's text. */
  icon?: ReactNode;
  /** A small count or label after the text, e.g. unread items. */
  badge?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle> | ((state: TabStyleState) => StyleProp<ViewStyle>);
  styles?: Partial<{ label: StyleProp<TextStyle>; badge: StyleProp<ViewStyle>; icon: StyleProp<ViewStyle> }>;
}

export function Tab(props: TabProps) {
  const { value, icon, badge, disabled = false, style, styles: slots, children, onPress, onLayout, ...rest } = props;
  const context = useTabsContext();
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const selected = context.value === value;
  const { register, setLayout, orientation, variant, size } = context;

  useEffect(() => register(value, { disabled }), [register, value, disabled]);

  const height = HEIGHT[size] - (variant === "enclosed" ? 6 : 0);
  const fontSize = size === "sm" ? tokens.fontSize - 2 : size === "lg" ? tokens.fontSize + 1 : tokens.fontSize;
  const ink = selected ? (variant === "pills" ? tokens.accent : tokens.fg) : tokens.muted;

  return (
    <Pressable
      {...rest}
      role="tab"
      nativeID={tabDomId(context.id, "tab", value)}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onLayout={(event) => {
        onLayout?.(event);
        setLayout(value, event.nativeEvent.layout);
      }}
      onPress={(event) => {
        onPress?.(event);
        if (!disabled) context.select(value);
      }}
      style={({ pressed }) => {
        const state = { selected, pressed, disabled };
        return [
          s.tab,
          orientation === "vertical" && s.tabVertical,
          { height, paddingHorizontal: PAD[size], opacity: disabled ? 0.45 : pressed ? 0.7 : 1 },
          typeof style === "function" ? style(state) : style,
        ];
      }}
    >
      {icon && (
        <View aria-hidden style={slots?.icon}>
          {icon}
        </View>
      )}
      {renderText(children, [s.label, { fontSize, color: ink }, slots?.label], 1)}
      {badge !== undefined && badge !== null && (
        <View style={[s.badge, selected && { backgroundColor: tokens.accentSoft }, slots?.badge]}>
          {renderText(badge, [s.badgeText, selected && { color: tokens.accent }], 1)}
        </View>
      )}
    </Pressable>
  );
}

/* --------------------------------------------------------------- TabPanel */

export interface TabPanelProps extends Omit<ViewProps, "children"> {
  value: string;
  /** Overrides `keepMounted` on `Tabs` for this panel. */
  keepMounted?: boolean;
  children?: ReactNode;
}

export function TabPanel(props: TabPanelProps) {
  const { value, keepMounted, style, children, ...rest } = props;
  const context = useTabsContext();
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const selected = context.value === value;
  const keep = keepMounted ?? context.keepMounted;
  if (!selected && !keep) return null;

  return (
    <View
      {...rest}
      role="tabpanel"
      nativeID={tabDomId(context.id, "panel", value)}
      aria-labelledby={tabDomId(context.id, "tab", value)}
      style={[s.panel, !selected && s.hidden, style]}
    >
      {keep ? <Activity mode={selected ? "visible" : "hidden"}>{children}</Activity> : children}
    </View>
  );
}
