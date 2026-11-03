import { useEffect, useState, type ComponentRef, type ReactNode, type RefObject } from "react";
import {
  Animated,
  Dimensions,
  I18nManager,
  Keyboard,
  Platform,
  StatusBar,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type View,
  type ViewStyle,
} from "react-native";
import { placePopover, type Align, type AnchorRect, type Side } from "../core/position";
import { createThemedStyles, useInsets, useKitTheme } from "./KitProvider";
import { Overlay } from "./Overlay";

export interface AnchoredProps {
  open: boolean;
  onDismiss?(): void;
  /**
   * Android back (and the screen reader's escape gesture). Defaults to
   * `onDismiss`; pass it to tell back apart from a tap outside.
   */
  onBack?(): void;
  /** The trigger the panel is placed against. */
  anchorRef: RefObject<ComponentRef<typeof View> | null>;
  /** Default `bottom`; flips when there is no room. */
  side?: Side;
  /** Default `start`. */
  align?: Align;
  /** Distance from the anchor. Default 6. */
  gap?: number;
  /** The content scrolls: cap it to the room available. Default false. */
  fitHeight?: boolean;
  /** At least as wide as the anchor (selects, menus). Default false. */
  matchWidth?: boolean;
  /** Tapping outside dismisses. Default true. */
  dismissible?: boolean;
  onClosed?(): void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

const themed = createThemedStyles((t) => ({
  panel: {
    position: "absolute",
    backgroundColor: t.raised,
    borderRadius: t.radius,
    borderWidth: 1,
    borderColor: t.border,
    boxShadow: t.shadow,
    overflow: "hidden",
  },
}));

type Box = { width: number; height: number };

/**
 * A panel placed against its trigger: below it, or above when there is no
 * room, kept on screen. The placement is the web's `placePopover`, unchanged;
 * only the measuring is native (`measureInWindow`, `onLayout`).
 */
export function Anchored({
  open,
  onDismiss,
  onBack,
  anchorRef,
  side = "bottom",
  align = "start",
  gap = 6,
  fitHeight = false,
  matchWidth = false,
  dismissible = true,
  onClosed,
  style,
  children,
}: AnchoredProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const insets = useInsets();
  const viewport = useWindowDimensions();
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const [size, setSize] = useState<Box | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const measure = () =>
      anchorRef.current?.measureInWindow((x, y, width, height) => {
        setAnchor({ left: x, top: y, width, height, right: x + width, bottom: y + height });
      });
    measure();
    // The keyboard showing or hiding can move the trigger (a resized or scrolled
    // screen) without changing the window size, so measure again then.
    const shown = Keyboard.addListener("keyboardDidShow", measure);
    const hidden = Keyboard.addListener("keyboardDidHide", measure);
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, [open, anchorRef, viewport.width, viewport.height]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (!size || Math.abs(size.width - width) > 0.5 || Math.abs(size.height - height) > 0.5) {
      setSize({ width, height });
    }
  };

  const edge = 8;
  // `measureInWindow` is relative to the app's window, but the overlay is a
  // full-screen layer. On Android the app window may start below the status
  // bar (not edge-to-edge, as in Expo Go): then shift by the status bar. When
  // the app is edge-to-edge, the window is the screen and nothing shifts.
  const screen = Dimensions.get("screen");
  const statusBar = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;
  const windowTop = statusBar > 0 && screen.height - viewport.height >= statusBar - 0.5 ? statusBar : 0;
  const windowBottom = Platform.OS === "android" ? Math.max(0, screen.height - viewport.height - windowTop) : 0;
  // Safe area still inside the window: what the bars cover that the window does not exclude.
  const safe = {
    top: Math.max(0, insets.top - windowTop),
    bottom: Math.max(0, insets.bottom - windowBottom),
    left: insets.left,
    right: insets.right,
  };
  const box = {
    width: viewport.width - safe.left - safe.right,
    height: viewport.height - safe.top - safe.bottom,
  };
  const placement =
    anchor && size
      ? placePopover(
          {
            ...anchor,
            left: anchor.left - safe.left,
            right: anchor.right - safe.left,
            top: anchor.top - safe.top,
            bottom: anchor.bottom - safe.top,
          },
          size,
          box,
          { side, align, gap, edge, rtl: I18nManager.isRTL, fitHeight, minHeight: 120 },
        )
      : null;

  // `placement.left` is a physical offset from the left edge. In RTL, React
  // Native swaps `left` and `right` (unless the app turned that off), so the
  // physical left edge is then set through `right`.
  const swapped = I18nManager.isRTL && I18nManager.doLeftAndRightSwapInRTL;
  const x = placement ? placement.left + safe.left : 0;

  return (
    <Overlay
      open={open}
      onDismiss={onDismiss}
      onBack={onBack}
      dismissible={dismissible}
      backdrop="none"
      duration={120}
      onClosed={() => {
        setSize(null);
        setAnchor(null);
        onClosed?.();
      }}
    >
      {(progress) => (
        <Animated.View
          onLayout={onLayout}
          // The screen reader's escape gesture does what Android back does here.
          onAccessibilityEscape={onBack ?? onDismiss}
          style={[
            s.panel,
            {
              // Rendered once invisibly to be measured, then placed.
              ...(swapped ? { right: x } : { left: x }),
              top: placement ? placement.top + safe.top + windowTop : 0,
              maxHeight: placement?.maxHeight,
              maxWidth: box.width - edge * 2,
              minWidth: matchWidth && anchor ? anchor.width : undefined,
              opacity: placement ? progress : 0,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [placement?.side === "top" ? 4 : -4, 0],
                  }),
                },
              ],
            },
            style,
          ]}
        >
          {children}
        </Animated.View>
      )}
    </Overlay>
  );
}

/**
 * Sheet on a phone, anchored popover on a tablet or a wide window. `auto`
 * decides by window width (600dp, Material's compact breakpoint).
 */
export function usePresentation(mode: "auto" | "sheet" | "popover" = "auto"): "sheet" | "popover" {
  const { width } = useWindowDimensions();
  if (mode !== "auto") return mode;
  return width < 600 ? "sheet" : "popover";
}
