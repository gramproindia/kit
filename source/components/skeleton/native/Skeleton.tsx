import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Text,
  View,
  type DimensionValue,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { lineWidths } from "../core/lines";
import type { SkeletonAnimation, SkeletonVariant } from "../core/types";
import { useReducedMotion } from "../../shared/native/motion";

export type { SkeletonSlot } from "../core/types";

export interface SkeletonProps {
  /** Default `text`. */
  variant?: SkeletonVariant;
  /** Number of bars, for `text`. Default 1. */
  lines?: number;
  /** Width of the last line as a percentage, for `text`. Default 60. */
  lastLineWidth?: number;
  /** A number is dp; a string is a percentage such as `"50%"`. */
  width?: DimensionValue;
  /**
   * A number is dp. Left out, each variant uses its own height, which is what
   * keeps a skeleton the size of the thing it stands in for.
   */
  height?: DimensionValue;
  /** Corner radius for `rect`, in dp. */
  radius?: number;
  /** Default `pulse`. The device's reduce-motion setting turns any of them off. */
  animation?: SkeletonAnimation;
  /**
   * Announced while the placeholder is up. Leave it out inside a region that
   * already says it is busy: two announcements are worse than one.
   */
  label?: string;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{ root: StyleProp<ViewStyle>; line: StyleProp<ViewStyle> }>;
}

const themed = createThemedStyles((t) => ({
  root: { gap: Math.round(t.fontSize * 0.6) },
  line: { backgroundColor: t.skeleton, borderRadius: t.radius, overflow: "hidden" },
  srOnly: { position: "absolute", width: 1, height: 1, opacity: 0 },
}));

/**
 * A placeholder in the shape of the content that is loading.
 *
 * Hidden from assistive technology: a screen reader gains nothing from being
 * told the shape of a grey box. Use `label`, or say the region is busy where it
 * makes more sense, so the wait is announced once.
 */
export function Skeleton(props: SkeletonProps) {
  const {
    variant = "text",
    lines = 1,
    lastLineWidth = 60,
    width,
    height,
    radius,
    animation = "pulse",
    label,
    style,
    styles: slots,
  } = props;

  const { tokens, scheme } = useKitTheme();
  const s = themed(tokens);
  const reduced = useReducedMotion();
  const motion: SkeletonAnimation = reduced ? "none" : animation;

  const clock = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (motion === "none") return;
    clock.setValue(0);
    const loop = Animated.loop(
      Animated.timing(clock, {
        toValue: 1,
        duration: 1400,
        easing: motion === "pulse" ? Easing.inOut(Easing.ease) : Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [clock, motion]);

  // The wave's sheen travels the width of the root, so it needs measuring.
  const [rootWidth, setRootWidth] = useState(0);

  const circle = variant === "circle";
  const rootWidthValue: DimensionValue = width ?? (circle ? 40 : "100%");
  const rootHeight: DimensionValue | undefined =
    variant === "text" ? undefined : (height ?? (circle ? (width ?? 40) : 80));
  const lineHeight: DimensionValue =
    variant === "text" ? (height ?? Math.round(tokens.fontSize * 0.85)) : "100%";
  const widths = variant === "text" ? lineWidths(lines, lastLineWidth) : ["100%"];
  const corner = circle ? 9999 : variant === "text" ? 4 : (radius ?? tokens.radius);
  const sheen = scheme === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.65)";

  const pulse = motion === "pulse"
    ? { opacity: clock.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.45, 1] }) }
    : undefined;

  return (
    <View
      style={[s.root, { width: rootWidthValue, height: rootHeight }, slots?.root, style]}
      onLayout={motion === "wave" ? (event: LayoutChangeEvent) => setRootWidth(event.nativeEvent.layout.width) : undefined}
    >
      {widths.map((lineWidth, index) => (
        <Animated.View
          // The bars are decoration with no identity of their own, so their
          // position is the only key there is.
          key={index}
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          style={[
            s.line,
            { width: lineWidth as DimensionValue, height: lineHeight, borderRadius: corner },
            pulse,
            slots?.line,
          ]}
        >
          {motion === "wave" && rootWidth > 0 && (
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: rootWidth,
                backgroundImage: `linear-gradient(90deg, transparent, ${sheen}, transparent)`,
                transform: [
                  {
                    translateX: clock.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-rootWidth, rootWidth],
                    }),
                  },
                ],
              }}
            />
          )}
        </Animated.View>
      ))}
      {label && (
        <Text role="status" style={s.srOnly}>
          {label}
        </Text>
      )}
    </View>
  );
}
