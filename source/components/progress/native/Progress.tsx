import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  I18nManager,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { mix, type KitTokens } from "../../shared/native/theme";
import { defaultProgressText } from "../core/locale";
import { describeProgress } from "../core/progress";
import type { ProgressLocaleText, ProgressSize, ProgressVariant } from "../core/types";
import { useReducedMotion } from "../../shared/native/motion";

export type ProgressSlot = "root" | "header" | "label" | "value" | "track" | "bar";

export interface ProgressProps extends Omit<ViewProps, "children" | "style" | "role"> {
  /** How far along. `null` means the length is not known yet. */
  value?: number | null;
  /** What `value` is measured against. Default 100. */
  max?: number;
  /** Names the bar. Shown above it, and used as the accessible name. */
  label?: ReactNode;
  /** Show the percentage beside the label. */
  showValue?: boolean;
  /** Replace what is shown and read, e.g. "3.2 MB of 8 MB". */
  valueText?: ReactNode;
  /** Default `accent`. */
  variant?: ProgressVariant;
  /** Default `md`. */
  size?: ProgressSize;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    header: StyleProp<ViewStyle>;
    label: StyleProp<TextStyle>;
    value: StyleProp<TextStyle>;
    track: StyleProp<ViewStyle>;
    bar: StyleProp<ViewStyle>;
  }>;
  localeText?: Partial<ProgressLocaleText>;
}

/** Bar colour per variant; shared with CircularProgress. */
export function barColor(t: KitTokens, variant: ProgressVariant): string {
  switch (variant) {
    case "success":
      return t.success;
    case "warning":
      return t.warning;
    case "danger":
      return t.danger;
    default:
      return t.accent;
  }
}

/** The track: a step darker than `subtle`, as `--pr-track` is on the web. */
export const trackColor = (t: KitTokens) => mix(t.subtle, t.fg, 0.1);

const HEIGHT: Record<ProgressSize, number> = { sm: 4, md: 8, lg: 12 };

const themed = createThemedStyles((t) => ({
  root: { alignSelf: "stretch", gap: 6, minWidth: 0 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  label: { fontSize: t.fontSize, fontWeight: "500", color: t.fg, flexShrink: 1 },
  value: { fontSize: t.fontSize, color: t.muted, fontVariant: ["tabular-nums"] },
  track: { width: "100%", borderRadius: 999, overflow: "hidden", backgroundColor: trackColor(t) },
  bar: { position: "absolute", top: 0, bottom: 0, borderRadius: 999 },
}));

/**
 * A bar for something with a known end: an upload, an import, a quota.
 *
 * Use a **Spinner** when there is nothing to measure. A progress bar that
 * spends its life indeterminate is a spinner drawn as a promise it cannot keep.
 */
export function Progress(props: ProgressProps) {
  const {
    value = null,
    max = 100,
    label,
    showValue = false,
    valueText,
    variant = "accent",
    size = "md",
    style,
    styles: slots,
    localeText,
    "aria-label": ariaLabel,
    ...rest
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultProgressText, ...localeText }), [localeText]);
  const state = describeProgress(value, max);
  const shown = valueText ?? (state.indeterminate ? text.working : text.valueText(state.percent));
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const rtl = I18nManager.isRTL;

  // Determinate: scale from the start edge, drawn from the unrounded fraction.
  const fraction = useRef(new Animated.Value(state.fraction)).current;
  useEffect(() => {
    if (state.indeterminate) return;
    if (reduced) {
      fraction.setValue(state.fraction);
      return;
    }
    const animation = Animated.timing(fraction, {
      toValue: state.fraction,
      duration: 240,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [fraction, state.fraction, state.indeterminate, reduced]);

  // Indeterminate: a 35% bar sweeping across. Reduced motion slows it rather
  // than stopping it, because a stopped bar would look broken.
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!state.indeterminate) return;
    sweep.setValue(0);
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: reduced ? 3000 : 1300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep, state.indeterminate, reduced]);

  const color = barColor(tokens, variant);
  const height = HEIGHT[size];
  const labelStyle = size === "sm" ? { fontSize: tokens.fontSize - 2 } : undefined;
  const spokenValue = typeof shown === "string" ? shown : undefined;
  const spokenLabel = typeof label === "string" ? label : (ariaLabel ?? text.label);

  let bar: ReactNode;
  if (state.indeterminate) {
    const piece = width * 0.35;
    const from = rtl ? width : -piece;
    const to = rtl ? -piece : width;
    bar = (
      <Animated.View
        style={[
          s.bar,
          { width: piece, backgroundColor: color, left: 0 },
          { transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [from, to] }) }] },
          slots?.bar,
        ]}
      />
    );
  } else {
    bar = (
      <Animated.View
        style={[
          s.bar,
          { left: 0, right: 0, backgroundColor: color, transformOrigin: rtl ? "right" : "left" },
          { transform: [{ scaleX: fraction }] },
          slots?.bar,
        ]}
      />
    );
  }

  return (
    <View {...rest} style={[s.root, slots?.root, style]}>
      {(label || showValue) && (
        <View style={[s.header, slots?.header]}>
          {label ? (
            typeof label === "string" || typeof label === "number" ? (
              <Text style={[s.label, labelStyle, slots?.label]} numberOfLines={1}>
                {label}
              </Text>
            ) : (
              label
            )
          ) : (
            <View />
          )}
          {showValue &&
            (typeof shown === "string" || typeof shown === "number" ? (
              <Text style={[s.value, labelStyle, slots?.value]}>{shown}</Text>
            ) : (
              shown
            ))}
        </View>
      )}
      <View
        role="progressbar"
        aria-label={spokenLabel}
        // No value at all while the length is unknown: that is what tells a
        // screen reader to say "busy" rather than read out a zero.
        aria-valuemin={state.indeterminate ? undefined : 0}
        aria-valuemax={state.indeterminate ? undefined : max}
        aria-valuenow={state.indeterminate ? undefined : (state.value ?? undefined)}
        aria-valuetext={state.indeterminate ? undefined : spokenValue}
        aria-busy={state.indeterminate || undefined}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        style={[s.track, { height }, slots?.track]}
      >
        {bar}
      </View>
    </View>
  );
}
