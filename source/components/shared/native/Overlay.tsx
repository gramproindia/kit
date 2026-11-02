import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from "react-native";
import { useKitTheme } from "./KitProvider";
import { useReducedMotion } from "./motion";

export interface OverlayProps {
  open: boolean;
  /** Back button (Android), backdrop tap, or a sheet dragged down. */
  onDismiss?(): void;
  /** Tapping the backdrop dismisses. Default true. */
  dismissible?: boolean;
  /** Android back dismisses. Default true. */
  closeOnBack?: boolean;
  /** `dim` darkens the app behind; `none` is for menus and popovers. Default `dim`. */
  backdrop?: "dim" | "none";
  /** After the exit animation, once nothing is on screen. */
  onClosed?(): void;
  /** Enter/exit duration in ms. Default 180; 0 under Reduce Motion. */
  duration?: number;
  /**
   * The layer's content, positioned by the caller. A function receives the
   * 0→1 enter progress (native driver) to animate with.
   */
  children: ReactNode | ((progress: Animated.Value) => ReactNode);
}

/**
 * The top layer every Kit overlay sits on: a transparent `Modal`, so it is
 * above everything including navigation, gets Android back for free, and
 * keeps screen readers inside it (the native `showModal()`). Stays mounted
 * through its exit animation.
 */
export function Overlay({
  open,
  onDismiss,
  dismissible = true,
  closeOnBack = true,
  backdrop = "dim",
  onClosed,
  duration = 180,
  children,
}: OverlayProps) {
  const { tokens } = useKitTheme();
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(open);
  const time = reduced ? 0 : duration;

  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: time,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !open) {
        setMounted(false);
        onClosed?.();
      }
    });
    return () => animation.stop();
    // onClosed is a notification; re-running the animation for a new callback would restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted, progress, time]);

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {
        if (closeOnBack) onDismiss?.();
      }}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents={open ? "box-none" : "none"}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: progress, backgroundColor: backdrop === "dim" ? tokens.backdrop : "transparent" },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissible ? onDismiss : undefined}
            accessible={false}
            importantForAccessibility="no"
          />
        </Animated.View>
        {typeof children === "function" ? children(progress) : children}
      </View>
    </Modal>
  );
}
