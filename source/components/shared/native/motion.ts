import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * The device's "reduce motion" setting, the native `prefers-reduced-motion`.
 * Follows changes while the app is open.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => alive && setReduced(value),
      () => undefined,
    );
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
