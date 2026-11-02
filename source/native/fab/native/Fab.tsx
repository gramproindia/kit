import { useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode, type Ref } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useInsets, useKitTheme } from "../../../components/shared/native/KitProvider";
import { useReducedMotion } from "../../../components/shared/native/motion";
import { Ring } from "../../../components/shared/native/primitives";
import { mix, type KitTokens } from "../../../components/shared/native/theme";
import { defaultFabText, type FabLocaleText } from "./locale";

export type FabSize = "sm" | "md" | "lg";
export type FabVariant = "primary" | "secondary" | "surface";
export type FabPlacement = "bottom-end" | "bottom-center" | "bottom-start" | "none";

export interface FabProps {
  /** Default `md` (56dp). `sm` is 40dp, `lg` 96dp. */
  size?: FabSize;
  /** Default `primary`. */
  variant?: FabVariant;
  icon?: ReactNode;
  /** Text next to the icon: an extended FAB. */
  label?: string;
  /** With a `label`: show it (true) or collapse to the icon (false), animated. Default true. */
  extended?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /**
   * Where it floats over its parent. Default `bottom-end`, which follows RTL.
   * `none` leaves layout to you.
   */
  placement?: FabPlacement;
  /** Extra distance from the bottom, e.g. a BottomNavigation's height. Default 0. */
  offset?: number;
  /** Respect safe-area insets when placed. Default true. */
  safeArea?: boolean;
  /** Required for an icon-only FAB; defaults to `label` otherwise. */
  "aria-label"?: string;
  /** Set by SpeedDial: the FAB opens something. */
  "aria-expanded"?: boolean;
  onPress?(event: GestureResponderEvent): void;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{ root: StyleProp<ViewStyle>; label: StyleProp<TextStyle>; icon: StyleProp<ViewStyle> }>;
  localeText?: Partial<FabLocaleText>;
  ref?: Ref<ComponentRef<typeof View>>;
}

const SIZE: Record<FabSize, { box: number; radius: number; icon: number }> = {
  sm: { box: 40, radius: 12, icon: 18 },
  md: { box: 56, radius: 16, icon: 22 },
  lg: { box: 96, radius: 28, icon: 32 },
};

export function fabColors(t: KitTokens, variant: FabVariant) {
  switch (variant) {
    case "secondary":
      return { fill: t.accentSoft, ink: t.accentStrong };
    case "surface":
      return { fill: t.raised, ink: t.accent };
    default:
      return { fill: t.accent, ink: t.accentFg };
  }
}

const themed = createThemedStyles((t) => ({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
    boxShadow: t.shadow,
  },
  icon: { alignItems: "center", justifyContent: "center" },
  label: { fontSize: t.fontSize, fontWeight: "600" },
  measure: { position: "absolute", opacity: 0, left: 0, top: 0, width: 4000 },
  srOnly: { position: "absolute", width: 1, height: 1, opacity: 0 },
  layer: { position: "absolute", left: 0, right: 0, flexDirection: "row" },
}));

/** Where a placed FAB sits: an absolute, touch-transparent row across its parent's bottom. */
export function usePlacement(placement: FabPlacement, offset: number, safeArea: boolean) {
  const insets = useInsets();
  if (placement === "none") return null;
  return {
    bottom: 16 + offset + (safeArea ? insets.bottom : 0),
    paddingStart: 16 + (safeArea ? insets.left : 0),
    paddingEnd: 16 + (safeArea ? insets.right : 0),
    justifyContent:
      placement === "bottom-center" ? "center" : placement === "bottom-start" ? "flex-start" : "flex-end",
  } as const;
}

/**
 * The floating action button: the screen's main action, floating over the
 * content. With a `label` it is an extended FAB; toggle `extended` (say, while
 * the list scrolls down) to collapse it to the icon.
 */
export function Fab({
  size = "md",
  variant = "primary",
  icon,
  label,
  extended = true,
  loading = false,
  disabled = false,
  placement = "bottom-end",
  offset = 0,
  safeArea = true,
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
  onPress,
  style,
  styles: slots,
  localeText,
  ref,
}: FabProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const reduced = useReducedMotion();
  const text = useMemo(() => ({ ...defaultFabText, ...localeText }), [localeText]);
  const dims = SIZE[size];
  const colors = fabColors(tokens, variant);
  const place = usePlacement(placement, offset, safeArea);

  // The label's width, measured once off-screen, drives the extend animation.
  const [labelWidth, setLabelWidth] = useState(0);
  const open = Boolean(label) && extended;
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    // Width cannot run on the native driver; the label fade rides along.
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: reduced ? 0 : 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [open, reduced, progress]);

  const inactive = disabled || loading;
  const gap = 12;
  const extra = label ? labelWidth + gap + dims.box * 0.3 : 0;
  const iconOffset = (dims.box - dims.icon) / 2;

  const button = (
    <Animated.View
      ref={ref}
      style={[
        { width: label ? progress.interpolate({ inputRange: [0, 1], outputRange: [dims.box, dims.box + extra] }) : dims.box },
      ]}
    >
      <Pressable
        role="button"
        aria-label={ariaLabel ?? label}
        aria-busy={loading || undefined}
        aria-expanded={ariaExpanded}
        aria-disabled={inactive || undefined}
        disabled={inactive}
        onPress={onPress}
        style={({ pressed }) => [
          s.root,
          {
            height: dims.box,
            borderRadius: dims.radius,
            paddingStart: iconOffset,
            backgroundColor: pressed ? mix(colors.fill, tokens.fg, 0.12) : colors.fill,
            opacity: disabled ? 0.5 : 1,
          },
          slots?.root,
          style,
        ]}
      >
        <View style={[s.icon, { width: dims.icon, height: dims.icon }, slots?.icon]} aria-hidden>
          {loading ? <Ring size={dims.icon} color={colors.ink} /> : icon}
        </View>
        {label && (
          <Animated.Text
            numberOfLines={1}
            style={[s.label, { color: colors.ink, marginStart: gap, opacity: progress }, slots?.label]}
          >
            {label}
          </Animated.Text>
        )}
        {loading && <Text style={s.srOnly}>{text.loading}</Text>}
      </Pressable>
      {label && (
        // A wide, invisible box so the label is measured unwrapped.
        <View style={s.measure} pointerEvents="none" aria-hidden>
          <Text
            style={[s.label, slots?.label, { alignSelf: "flex-start" }]}
            numberOfLines={1}
            onLayout={(e: LayoutChangeEvent) => setLabelWidth(Math.ceil(e.nativeEvent.layout.width))}
          >
            {label}
          </Text>
        </View>
      )}
    </Animated.View>
  );

  if (!place) return button;
  return (
    <View
      pointerEvents="box-none"
      style={[s.layer, { bottom: place.bottom, paddingStart: place.paddingStart, paddingEnd: place.paddingEnd, justifyContent: place.justifyContent }]}
    >
      {button}
    </View>
  );
}
