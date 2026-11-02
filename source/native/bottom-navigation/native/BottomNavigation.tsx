import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useInsets, useKitTheme } from "../../../components/shared/native/KitProvider";
import { useReducedMotion } from "../../../components/shared/native/motion";
import { alpha } from "../../../components/shared/native/theme";
import { useControllableState } from "../../../components/shared/react/useControllableState";
import { defaultBottomNavigationText, type BottomNavigationLocaleText } from "./locale";

export interface BottomNavigationIconState {
  active: boolean;
  color: string;
}

export interface BottomNavigationItem {
  key: string;
  label: string;
  /** An element, or a function of the item's state to draw active and inactive icons. */
  icon?: ReactNode | ((state: BottomNavigationIconState) => ReactNode);
  /** A number shows a count (99+ past 99); `true` shows a dot. 0 and false show nothing. */
  badge?: number | boolean;
  disabled?: boolean;
}

export type BottomNavigationSlot = "root" | "item" | "indicator" | "label" | "badge";

export interface BottomNavigationProps {
  items: BottomNavigationItem[];
  /** The active item's key. */
  value?: string;
  defaultValue?: string;
  onValueChange?(key: string): void;
  /** Tapping the active item again: scroll to top, refresh. */
  onReselect?(key: string): void;
  /** Default `always`. */
  labelVisibility?: "always" | "active" | "never";
  /** Pad the bottom by the safe-area inset (home indicator, gesture bar). Default true. */
  safeArea?: boolean;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    item: StyleProp<ViewStyle>;
    indicator: StyleProp<ViewStyle>;
    label: StyleProp<TextStyle>;
    badge: StyleProp<ViewStyle>;
  }>;
  localeText?: Partial<BottomNavigationLocaleText>;
}

const BAR_HEIGHT = 64;

const themed = createThemedStyles((t) => ({
  root: {
    flexDirection: "row",
    backgroundColor: t.raised,
    borderTopWidth: 1,
    borderColor: t.border,
  },
  item: { flex: 1, minWidth: 80, height: BAR_HEIGHT, alignItems: "center", justifyContent: "center", gap: 4 },
  iconBox: { width: 64, height: 32, alignItems: "center", justifyContent: "center" },
  indicator: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, backgroundColor: t.accentSoft },
  label: { fontSize: t.fontSize - 3, fontWeight: "500", color: t.muted },
  activeLabel: { color: t.fg, fontWeight: "700" },
  badge: {
    position: "absolute",
    top: 0,
    left: 34,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: t.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { minWidth: 8, width: 8, height: 8, borderRadius: 4, top: 4, left: 38, paddingHorizontal: 0 },
  badgeText: { color: t.dangerFg, fontSize: 10, fontWeight: "700" },
}));

function Tab({
  item,
  active,
  showLabel,
  onPress,
  slots,
  text,
}: {
  item: BottomNavigationItem;
  active: boolean;
  showLabel: boolean;
  onPress(): void;
  slots: BottomNavigationProps["styles"];
  text: BottomNavigationLocaleText;
}) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const reduced = useReducedMotion();
  const shown = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(shown, {
      toValue: active ? 1 : 0,
      duration: reduced ? 0 : 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [active, reduced, shown]);

  const color = active ? tokens.accent : tokens.muted;
  const icon = typeof item.icon === "function" ? item.icon({ active, color }) : item.icon;
  const count = typeof item.badge === "number" && item.badge > 0 ? item.badge : 0;
  const dot = item.badge === true;
  const spoken = count
    ? `${item.label}, ${text.badgeCount.replace("{count}", String(count))}`
    : dot
      ? `${item.label}, ${text.badgeDot}`
      : item.label;

  return (
    <Pressable
      role="tab"
      aria-selected={active}
      aria-disabled={item.disabled || undefined}
      aria-label={spoken}
      disabled={item.disabled}
      onPress={onPress}
      style={[s.item, item.disabled && { opacity: 0.4 }, slots?.item]}
    >
      {({ pressed }) => (
        <>
          <View style={s.iconBox}>
            <Animated.View
              style={[
                s.indicator,
                { opacity: shown, transform: [{ scaleX: shown.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] },
                slots?.indicator,
              ]}
            />
            {pressed && !active && (
              <View style={[s.indicator, { backgroundColor: alpha(tokens.fg, 0.08) }]} />
            )}
            {icon}
            {(count > 0 || dot) && (
              <View style={[s.badge, dot && s.dot, slots?.badge]} aria-hidden>
                {count > 0 && <Text style={s.badgeText}>{count > 99 ? "99+" : count}</Text>}
              </View>
            )}
          </View>
          {showLabel && (
            <Text style={[s.label, active && s.activeLabel, slots?.label]} numberOfLines={1} aria-hidden>
              {item.label}
            </Text>
          )}
        </>
      )}
    </Pressable>
  );
}

/**
 * The bar of top-level destinations at the bottom of an app, Material 3 style:
 * an icon in a pill that lights up for the active item, labels, and badges.
 */
export function BottomNavigation({
  items,
  value: valueProp,
  defaultValue,
  onValueChange,
  onReselect,
  labelVisibility = "always",
  safeArea = true,
  style,
  styles: slots,
  localeText,
}: BottomNavigationProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const insets = useInsets();
  const text = useMemo(() => ({ ...defaultBottomNavigationText, ...localeText }), [localeText]);
  const [value, setValue] = useControllableState(valueProp, defaultValue ?? items[0]?.key ?? "");

  return (
    <View
      role="tablist"
      style={[s.root, { paddingBottom: safeArea ? insets.bottom : 0 }, slots?.root, style]}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Tab
            key={item.key}
            item={item}
            active={active}
            showLabel={labelVisibility === "always" || (labelVisibility === "active" && active)}
            slots={slots}
            text={text}
            onPress={() => {
              if (active) {
                onReselect?.(item.key);
                return;
              }
              setValue(item.key);
              onValueChange?.(item.key);
            }}
          />
        );
      })}
    </View>
  );
}
