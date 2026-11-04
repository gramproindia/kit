import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Keyboard,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useInsets, useKitTheme } from "./KitProvider";
import { Overlay } from "./Overlay";

export interface SheetProps {
  open: boolean;
  onDismiss?(): void;
  /** Heading at the top of the sheet, also its accessible name. */
  title?: ReactNode;
  /** Tapping outside, dragging down or Android back dismisses. Default true. */
  dismissible?: boolean;
  /**
   * Android back (and the screen reader's escape gesture), handled by the
   * caller: when given, it is called instead of `onDismiss`, even when
   * `dismissible` is false. Without it, back dismisses only when `dismissible`.
   */
  onBack?(): void;
  /** Largest height, as a fraction of the screen. Default 0.9. */
  maxHeight?: number;
  onClosed?(): void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

const themed = createThemedStyles((t) => ({
  panel: { position: "absolute", left: 0, right: 0, bottom: 0 },
  surface: {
    flexShrink: 1,
    backgroundColor: t.raised,
    borderTopLeftRadius: t.radius * 2,
    borderTopRightRadius: t.radius * 2,
    boxShadow: t.shadow,
    overflow: "hidden",
  },
  grip: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: t.borderControl },
  title: {
    fontSize: t.fontSize + 2,
    fontWeight: "700",
    color: t.fg,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
}));

/**
 * Keyboard height, so a sheet with a search field stays above the keyboard.
 * Listens only while `active` (the sheet is on screen): a closed sheet costs nothing.
 */
function useKeyboardHeight(active: boolean): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    // A keyboard already up when the sheet opens sent its event before we listened.
    // Optional: react-native-web (Expo web, the docs previews) has no metrics().
    const metrics = Keyboard.metrics?.();
    setHeight(metrics ? metrics.height : 0);
    const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const a = Keyboard.addListener(show, (e) => setHeight(e.endCoordinates.height));
    const b = Keyboard.addListener(hide, () => setHeight(0));
    return () => {
      a.remove();
      b.remove();
    };
  }, [active]);
  return height;
}

/**
 * A bottom sheet: the phone-sized home for pickers, menus and forms. Drag the
 * handle or title down to dismiss; Android back dismisses too. No gesture or
 * animation library: core `Animated` and `PanResponder`.
 */
export function Sheet({
  open,
  onDismiss,
  onBack,
  title,
  dismissible = true,
  maxHeight = 0.9,
  onClosed,
  style,
  children,
}: SheetProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const insets = useInsets();
  const { height: screen } = useWindowDimensions();
  // Kept on through the exit slide, so the panel does not jump as it leaves.
  const [shown, setShown] = useState(open);
  if (open && !shown) setShown(true);
  const keyboard = useKeyboardHeight(shown);
  const drag = useRef(new Animated.Value(0)).current;

  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  // The drag-dismiss reset timer, cleared if the sheet unmounts first.
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    },
    [],
  );

  // Android back and the escape gesture: the caller's handler, else dismiss
  // only when the sheet is dismissible.
  const back = onBack ?? (dismissible ? onDismiss : undefined);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => dismissible && g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 80 || g.vy > 0.8) {
            dismissRef.current?.();
            // The exit slide continues from here; reset once it is off screen.
            if (resetTimer.current !== null) clearTimeout(resetTimer.current);
            resetTimer.current = setTimeout(() => {
              resetTimer.current = null;
              drag.setValue(0);
            }, 250);
          } else {
            Animated.spring(drag, { toValue: 0, useNativeDriver: false, bounciness: 4 }).start();
          }
        },
        onPanResponderTerminate: () =>
          Animated.spring(drag, { toValue: 0, useNativeDriver: false }).start(),
      }),
    [dismissible, drag],
  );

  return (
    <Overlay
      open={open}
      onDismiss={onDismiss}
      dismissible={dismissible}
      onBack={onBack}
      closeOnBack={dismissible}
      onClosed={() => {
        setShown(false);
        onClosed?.();
      }}
      duration={240}
    >
      {(progress) => (
        <Animated.View
          style={[
            s.panel,
            {
              maxHeight: screen * maxHeight - keyboard,
              marginBottom: keyboard,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [screen, 0] }) }],
            },
          ]}
          role="dialog"
          aria-modal
          accessibilityViewIsModal
          onAccessibilityEscape={back}
        >
          {/* Drag is JS-driven; it moves an inner layer so it never mixes with the native-driven slide. */}
          <Animated.View
            style={[
              s.surface,
              { paddingBottom: keyboard ? 8 : Math.max(insets.bottom, 12), transform: [{ translateY: drag }] },
              style,
            ]}
          >
            <View {...responder.panHandlers}>
              <View style={s.grip} aria-hidden>
                <View style={s.handle} />
              </View>
              {title !== undefined &&
                (typeof title === "string" ? (
                  <Text role="heading" style={s.title}>
                    {title}
                  </Text>
                ) : (
                  title
                ))}
            </View>
            <View style={{ flexShrink: 1 }}>{children}</View>
          </Animated.View>
        </Animated.View>
      )}
    </Overlay>
  );
}
