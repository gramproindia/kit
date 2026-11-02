import { Children, useMemo, type ReactNode } from "react";
import {
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { ChevronGlyph } from "../../../components/shared/native/glyphs";
import { createThemedStyles, useInsets, useKitTheme } from "../../../components/shared/native/KitProvider";
import { mix } from "../../../components/shared/native/theme";
import { defaultAppBarText, type AppBarLocaleText } from "./locale";

export type AppBarVariant = "small" | "center" | "medium" | "large";

export type AppBarSlot = "root" | "bar" | "title" | "subtitle" | "actions";

export interface AppBarProps {
  /** Default `small`. `medium` and `large` put the title on its own row under the toolbar. */
  variant?: AppBarVariant;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Before the title: a back or menu button. Overrides `onBack`. */
  leading?: ReactNode;
  /** Shows a back button that calls this. */
  onBack?(event: GestureResponderEvent): void;
  /** Buttons at the end, usually `AppBarAction`s. `children` are appended. */
  actions?: ReactNode;
  children?: ReactNode;
  /** Always draw the raised surface and shadow. */
  elevated?: boolean;
  /** The content under the bar has scrolled: draw a divider and the raised surface. */
  scrolled?: boolean;
  /** Pad the top by the safe-area inset (status bar, notch). Default true. */
  safeArea?: boolean;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    bar: StyleProp<ViewStyle>;
    title: StyleProp<TextStyle>;
    subtitle: StyleProp<TextStyle>;
    actions: StyleProp<ViewStyle>;
  }>;
  localeText?: Partial<AppBarLocaleText>;
}

const BAR_HEIGHT = 56;

const themed = createThemedStyles((t) => ({
  root: { backgroundColor: t.bg, borderBottomWidth: 1, borderColor: "transparent" },
  raised: { backgroundColor: t.raised, boxShadow: t.shadow },
  divider: { borderColor: t.border },
  bar: { height: BAR_HEIGHT, flexDirection: "row", alignItems: "center", paddingHorizontal: 4, gap: 4 },
  heading: { flex: 1, minWidth: 0, paddingHorizontal: 8, justifyContent: "center" },
  centered: { alignItems: "center" },
  noLead: { paddingStart: 12 },
  title: { fontSize: t.fontSize + 3, fontWeight: "600", color: t.fg },
  subtitle: { fontSize: t.fontSize - 2, color: t.muted, marginTop: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: 2 },
  slot: { minWidth: 44, flexDirection: "row", alignItems: "center" },
  big: { paddingHorizontal: 16, paddingBottom: 12 },
  mediumTitle: { fontSize: t.fontSize + 9, fontWeight: "600", color: t.fg },
  largeTitle: { fontSize: t.fontSize + 17, fontWeight: "700", color: t.fg, letterSpacing: -0.5 },
  action: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
}));

function line(node: ReactNode, style: StyleProp<TextStyle>, lines: number) {
  if (node === undefined || node === null || node === false) return null;
  return typeof node === "string" || typeof node === "number" ? (
    <Text style={style} numberOfLines={lines}>
      {node}
    </Text>
  ) : (
    node
  );
}

/**
 * The bar at the top of a screen: title, an optional back or menu button, and
 * actions. `medium` and `large` show a big title under the toolbar row, the
 * Material 3 and iOS large-title pattern; pass `scrolled` while the content is
 * scrolled to lift the bar off it.
 */
export function AppBar({
  variant = "small",
  title,
  subtitle,
  leading,
  onBack,
  actions,
  children,
  elevated = false,
  scrolled = false,
  safeArea = true,
  style,
  styles: slots,
  localeText,
}: AppBarProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const insets = useInsets();
  const text = useMemo(() => ({ ...defaultAppBarText, ...localeText }), [localeText]);

  const lead =
    leading ??
    (onBack ? (
      <AppBarAction aria-label={text.back} onPress={onBack}>
        <ChevronGlyph direction="left" size={22} color={tokens.fg} />
      </AppBarAction>
    ) : null);
  const end = [...Children.toArray(actions), ...Children.toArray(children)];
  const big = variant === "medium" || variant === "large";
  const center = variant === "center";

  const heading = (
    <View style={[s.heading, center && s.centered, !lead && !center && s.noLead]}>
      {line(title, [s.title, slots?.title], 1)}
      {line(subtitle, [s.subtitle, slots?.subtitle], 1)}
    </View>
  );

  return (
    <View
      style={[
        s.root,
        (elevated || scrolled) && s.raised,
        scrolled && s.divider,
        { paddingTop: safeArea ? insets.top : 0 },
        slots?.root,
        style,
      ]}
    >
      <View role="toolbar" style={[s.bar, slots?.bar]}>
        {/* A centred title stays centred: the leading and trailing slots share a width. */}
        {/* No leading button: no empty slot, the title starts at the 16dp margin. */}
        {(lead || center) && (
          <View style={[s.slot, center && { minWidth: Math.max(44, end.length * 46) }]}>{lead}</View>
        )}
        {big ? <View style={{ flex: 1 }} /> : heading}
        <View
          style={[
            s.actions,
            center && { minWidth: Math.max(44, end.length * 46), justifyContent: "flex-end" },
            slots?.actions,
          ]}
        >
          {end}
        </View>
      </View>
      {big && (
        <View style={s.big}>
          <View role="heading">
            {line(title, [variant === "large" ? s.largeTitle : s.mediumTitle, slots?.title], 2)}
          </View>
          {line(subtitle, [s.subtitle, slots?.subtitle], 1)}
        </View>
      )}
    </View>
  );
}

export interface AppBarActionProps {
  /** Required: an icon button has no visible text to be read. */
  "aria-label": string;
  onPress?(event: GestureResponderEvent): void;
  disabled?: boolean;
  /** The icon. */
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** A 44dp round icon button for the app bar's leading slot or actions. */
export function AppBarAction({ "aria-label": label, onPress, disabled, children, style }: AppBarActionProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.action,
        pressed && { backgroundColor: mix(tokens.bg, tokens.fg, 0.1) },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
