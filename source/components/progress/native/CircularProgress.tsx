import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useKitTheme } from "../../shared/native/KitProvider";
import { defaultProgressText } from "../core/locale";
import { describeProgress } from "../core/progress";
import type { ProgressLocaleText, ProgressVariant } from "../core/types";
import { useReducedMotion } from "../../shared/native/motion";
import { barColor, trackColor } from "./Progress";

export type CircularProgressSlot = "root" | "track" | "bar" | "label";

export interface CircularProgressProps {
  value?: number | null;
  max?: number;
  /** Diameter in dp. Default 44. */
  size?: number;
  /** Ring thickness in dp. Default 4. */
  thickness?: number;
  variant?: ProgressVariant;
  /** Names the ring for assistive technology. */
  label?: string;
  /** Print the percentage in the middle, or your own node. */
  showValue?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    track: StyleProp<ViewStyle>;
    bar: StyleProp<ViewStyle>;
    label: StyleProp<TextStyle>;
  }>;
  localeText?: Partial<ProgressLocaleText>;
}

/**
 * The same progress as a ring, for a tile or a list row where a bar would be
 * too wide.
 *
 * Without SVG, the arc is two half-rings, each clipped to one side of the
 * circle and rotated into view: the right half fills the first 50%, the left
 * half the rest. A half-ring is a bordered circle with only its top and right
 * borders coloured, turned 45° so the coloured half sits on one side. The ends
 * are square rather than round, the one visible difference from the web.
 */
export function CircularProgress(props: CircularProgressProps) {
  const {
    value = null,
    max = 100,
    size = 44,
    thickness = 4,
    variant = "accent",
    label,
    showValue = false,
    children,
    style,
    styles: slots,
    localeText,
  } = props;

  const { tokens } = useKitTheme();
  const text = useMemo(() => ({ ...defaultProgressText, ...localeText }), [localeText]);
  const state = describeProgress(value, max);
  const reduced = useReducedMotion();
  // An indeterminate ring shows a quarter arc that spins.
  const filled = state.indeterminate ? 0.25 : state.fraction;

  const fraction = useRef(new Animated.Value(filled)).current;
  useEffect(() => {
    if (reduced) {
      fraction.setValue(filled);
      return;
    }
    const animation = Animated.timing(fraction, {
      toValue: filled,
      duration: 240,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [fraction, filled, reduced]);

  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!state.indeterminate) return;
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: reduced ? 3000 : 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, state.indeterminate, reduced]);

  const color = barColor(tokens, variant);
  const half = size / 2;
  const ring = {
    position: "absolute",
    top: 0,
    width: size,
    height: size,
    borderRadius: half,
    borderWidth: thickness,
    borderColor: "transparent",
    borderTopColor: color,
    borderRightColor: color,
  } as const;

  // 0 → hidden (half-ring turned onto the clipped-away side), 0.5 → full half.
  const rightTurn = fraction.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["-135deg", "45deg", "45deg"],
  });
  const leftTurn = fraction.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["45deg", "45deg", "225deg"],
  });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const middle = children ?? (showValue && !state.indeterminate ? `${state.percent}%` : null);

  return (
    <View
      role="progressbar"
      aria-label={label ?? text.label}
      aria-valuemin={state.indeterminate ? undefined : 0}
      aria-valuemax={state.indeterminate ? undefined : max}
      aria-valuenow={state.indeterminate ? undefined : (state.value ?? undefined)}
      aria-valuetext={state.indeterminate ? undefined : text.valueText(state.percent)}
      aria-busy={state.indeterminate || undefined}
      style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, slots?.root, style]}
    >
      <View
        style={[
          { position: "absolute", top: 0, left: 0, width: size, height: size, borderRadius: half, borderWidth: thickness, borderColor: trackColor(tokens) },
          slots?.track,
        ]}
      />
      <Animated.View
        style={[{ position: "absolute", top: 0, left: 0, width: size, height: size }, state.indeterminate && { transform: [{ rotate }] }]}
        aria-hidden
      >
        {/* Right half: clip to the right, ring offset back to the centre. */}
        <View style={{ position: "absolute", top: 0, left: half, width: half, height: size, overflow: "hidden" }}>
          <Animated.View style={[ring, { left: -half, transform: [{ rotate: rightTurn }] }, slots?.bar]} />
        </View>
        {/* Left half. */}
        <View style={{ position: "absolute", top: 0, left: 0, width: half, height: size, overflow: "hidden" }}>
          <Animated.View style={[ring, { left: 0, transform: [{ rotate: leftTurn }] }, slots?.bar]} />
        </View>
      </Animated.View>
      {middle !== null &&
        (typeof middle === "string" || typeof middle === "number" ? (
          <Text
            aria-hidden
            style={[{ fontSize: Math.max(10, Math.round(size * 0.24)), fontWeight: "600", color: tokens.fg, fontVariant: ["tabular-nums"] }, slots?.label]}
          >
            {middle}
          </Text>
        ) : (
          <View aria-hidden>{middle}</View>
        ))}
    </View>
  );
}
