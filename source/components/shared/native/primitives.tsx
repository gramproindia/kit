import { Children, isValidElement, useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Text, View, type StyleProp, type TextStyle } from "react-native";

/**
 * Wraps bare strings and numbers in `<Text>`, which React Native requires,
 * and leaves elements alone, so `<Button>Save</Button>` and
 * `<Button><Icon/> Save</Button>` both work.
 */
export function renderText(
  children: ReactNode,
  style: StyleProp<TextStyle>,
  /** Truncate after this many lines. Default: wrap freely. */
  numberOfLines?: number,
): ReactNode {
  const parts = Children.toArray(children);
  if (parts.length === 0) return null;
  if (parts.every((part) => typeof part === "string" || typeof part === "number")) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {parts.join("")}
      </Text>
    );
  }
  return parts.map((part, index) =>
    isValidElement(part) ? (
      part
    ) : (
      <Text key={index} style={style}>
        {String(part)}
      </Text>
    ),
  );
}

export interface RingProps {
  size: number;
  color: string;
  /** Default `size / 8`, at least 2. */
  thickness?: number;
}

/**
 * A spinning ring drawn with borders, so no SVG library is needed. Runs on the
 * native driver: it keeps turning while JavaScript is busy, which is exactly
 * when a spinner is on screen.
 */
export function Ring({ size, color, thickness }: RingProps) {
  const turn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [turn]);

  const width = thickness ?? Math.max(2, Math.round(size / 8));
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={{ width: size, height: size }} aria-hidden>
      <View
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: size / 2,
          borderWidth: width,
          borderColor: color,
          opacity: 0.25,
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: size / 2,
          borderWidth: width,
          borderColor: "transparent",
          borderTopColor: color,
          transform: [{ rotate }],
        }}
      />
    </View>
  );
}
