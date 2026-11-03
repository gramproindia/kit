import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { alpha } from "../../shared/native/theme";
import { spinnerPixels } from "../core/visibility";
import { defaultSpinnerText } from "../core/locale";
import type { SpinnerLocaleText, SpinnerSize, SpinnerVariant } from "../core/types";
import { useDelayedLoading } from "../hooks/useDelayedLoading";
import { useReducedMotion } from "../../shared/native/motion";

export type SpinnerSlot = "root" | "status" | "indicator" | "label" | "content" | "overlay";

export interface SpinnerProps extends Omit<ViewProps, "children" | "style"> {
  /** Default true. With `children`, the spinner covers them while this is true. */
  loading?: boolean;
  /** Default `md` (24 dp); a number is dp. */
  size?: SpinnerSize | number;
  /** Default `ring`. */
  variant?: SpinnerVariant;
  /** Colour of the indicator. Default: the accent colour (the web uses `currentColor`). */
  color?: string;
  /** What screen readers announce. Default "Loading". */
  label?: string;
  /** Show the label next to the spinner. */
  showLabel?: boolean;
  /** Milliseconds to wait before showing, so fast work doesn't flash. Default 0. */
  delay?: number;
  /** Once shown, stay at least this many milliseconds. Default 0. */
  minDuration?: number;
  /** Content to cover while loading. It stops taking touches and is hidden from screen readers. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    status: StyleProp<ViewStyle>;
    indicator: StyleProp<ViewStyle>;
    label: StyleProp<TextStyle>;
    content: StyleProp<ViewStyle>;
    overlay: StyleProp<ViewStyle>;
  }>;
  localeText?: Partial<SpinnerLocaleText>;
}

const themed = createThemedStyles((t) => ({
  root: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  status: { flexDirection: "row", alignItems: "center", gap: 8 },
  indicator: { alignItems: "center", justifyContent: "center" },
  dots: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  label: { fontSize: t.fontSize, color: t.fg },
  container: { position: "relative" },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(t.bg, 0.72),
  },
  srOnly: { position: "absolute", width: 1, height: 1, opacity: 0 },
}));

/** The web's ring: a track plus a 28% arc, drawn with borders instead of SVG. */
function RingIndicator({ size, color, duration }: { size: number; color: string; duration: number }) {
  const turn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    turn.setValue(0);
    const loop = Animated.loop(
      Animated.timing(turn, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [turn, duration]);
  const width = Math.max(2, size * (2.5 / 24));
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const ring = { position: "absolute", top: 0, left: 0, width: size, height: size, borderRadius: size / 2, borderWidth: width } as const;
  return (
    <View style={{ width: size, height: size }}>
      <View style={[ring, { borderColor: alpha(color, 0.18) }]} />
      <Animated.View style={[ring, { borderColor: "transparent", borderTopColor: color, transform: [{ rotate }] }]} />
    </View>
  );
}

// The web's sp-pulse keyframes: low at 0% and 80–100%, full at 40%.
function pulse(phase: number): number {
  if (phase <= 0.4) return phase / 0.4;
  if (phase <= 0.8) return 1 - (phase - 0.4) / 0.4;
  return 0;
}

const SAMPLES = Array.from({ length: 41 }, (_, k) => k / 40);

/**
 * Three dots pulsing in turn, as on the web. One clock drives all three, each
 * reading it with its own delay, so they can never drift apart.
 */
function DotsIndicator({ size, color, duration }: { size: number; color: string; duration: number }) {
  const clock = useRef(new Animated.Value(0)).current;
  const cycle = duration * 1.4;
  useEffect(() => {
    clock.setValue(0);
    const loop = Animated.loop(
      Animated.timing(clock, { toValue: 1, duration: cycle, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [clock, cycle]);
  // Built once rather than on every render: each interpolation is a node the
  // native driver has to attach, and a parent re-rendering mid-spin would
  // otherwise swap all six for identical copies.
  const dots = useMemo(
    () =>
      [0, 1, 2].map((index) => {
        const offset = (duration * 0.18 * index) / cycle;
        const level = SAMPLES.map((t) => pulse((((t - offset) % 1) + 1) % 1));
        return {
          opacity: clock.interpolate({ inputRange: SAMPLES, outputRange: level.map((l) => 0.25 + 0.75 * l) }),
          scale: clock.interpolate({ inputRange: SAMPLES, outputRange: level.map((l) => 0.7 + 0.3 * l) }),
        };
      }),
    [clock, duration, cycle],
  );
  const dot = size * 0.22;
  return (
    <View style={{ width: size, height: size, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: size * 0.1 }}>
      {dots.map(({ opacity, scale }, index) => (
        <Animated.View
          key={index}
          style={{
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: color,
            opacity,
            transform: [{ scale }],
          }}
        />
      ))}
    </View>
  );
}

/** A loading indicator, on its own or covering content that is busy. */
export function Spinner(props: SpinnerProps) {
  const {
    loading = true,
    size = "md",
    variant = "ring",
    color,
    label,
    showLabel = false,
    delay = 0,
    minDuration = 0,
    children,
    style,
    styles: slots,
    localeText,
    ...rest
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultSpinnerText, ...localeText }), [localeText]);
  const visible = useDelayedLoading(loading, { delay, minDuration });
  // Reduced motion slows it rather than stopping it: a frozen spinner reads as a hang.
  const duration = useReducedMotion() ? 2400 : 800;
  const pixels = spinnerPixels(size);
  const ink = color ?? tokens.accent;
  const spoken = label ?? text.loading;

  const status = (
    <View role="status" aria-label={spoken} style={[s.status, slots?.status]}>
      <View style={[s.indicator, slots?.indicator]} aria-hidden>
        {variant === "dots" ? (
          <DotsIndicator size={pixels} color={ink} duration={duration} />
        ) : (
          <RingIndicator size={pixels} color={ink} duration={duration} />
        )}
      </View>
      <Text style={showLabel ? [s.label, slots?.label] : s.srOnly}>{spoken}</Text>
    </View>
  );

  if (children === undefined) {
    if (!visible) return null;
    return (
      <View {...rest} style={[s.root, slots?.root, style]}>
        {status}
      </View>
    );
  }

  return (
    <View {...rest} style={[s.container, slots?.root, style]} aria-busy={visible || undefined}>
      <View
        style={slots?.content}
        // The web's `inert`: no touches, and hidden from screen readers.
        pointerEvents={visible ? "none" : "auto"}
        aria-hidden={visible || undefined}
        importantForAccessibility={visible ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>
      {visible && <View style={[s.overlay, slots?.overlay]}>{status}</View>}
    </View>
  );
}
