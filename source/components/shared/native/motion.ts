import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";

/*
 * One store for the whole app. Every Overlay, Skeleton and Tab reads this, so
 * it asks the OS once and keeps one listener, instead of one query and one
 * listener per instance.
 */
let reduced = false;
let queried = false;
const listeners = new Set<() => void>();
let subscription: { remove(): void } | null = null;

function set(value: boolean) {
  queried = true;
  if (value === reduced) return;
  reduced = value;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!subscription) {
    subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", set);
    // Ask once; after that the change event keeps the cached value current.
    if (!queried) {
      AccessibilityInfo.isReduceMotionEnabled().then(set, () => undefined);
    }
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && subscription) {
      subscription.remove();
      subscription = null;
      // Changes while nobody listened were missed; ask again next time.
      queried = false;
    }
  };
}

const getSnapshot = () => reduced;

/**
 * The device's "reduce motion" setting, the native `prefers-reduced-motion`.
 * Follows changes while the app is open.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
