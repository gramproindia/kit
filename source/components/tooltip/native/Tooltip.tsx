import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  I18nManager,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { placePopover, type AnchorRect } from "../../shared/core/position";
import { createThemedStyles, useKitTheme, usePortal } from "../../shared/native/KitProvider";
import { useReducedMotion } from "../../shared/native/motion";
import { renderText } from "../../shared/native/primitives";
import type { TooltipAlign, TooltipSide } from "../core/types";

type ChildProps = {
  ref?: Ref<unknown>;
  onLongPress?(event: GestureResponderEvent): void;
  onPressOut?(event: GestureResponderEvent): void;
  onPress?(event: GestureResponderEvent): void;
  delayLongPress?: number;
  accessibilityHint?: string;
  [prop: string]: unknown;
};

export interface TooltipProps {
  /** The short label. Keep it to a few words. */
  content: ReactNode;
  /**
   * The control it describes: a single pressable element (any Kit button),
   * cloned with a ref, `onLongPress`, `onPressOut` and an accessibility hint.
   */
  children: ReactElement<ChildProps>;
  /** Default `top`. */
  side?: TooltipSide;
  /** Default `center`. */
  align?: TooltipAlign;
  /** Distance from the control. Default 6. */
  gap?: number;
  /** How long to press before it shows, in ms. Default 400. */
  delay?: number;
  /** How long it stays after the finger lifts, in ms. Default 1500. */
  duration?: number;
  disabled?: boolean;
  /** The bubble's style. */
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{ content: StyleProp<ViewStyle>; text: StyleProp<TextStyle> }>;
}

const themed = createThemedStyles((t) => ({
  bubble: {
    position: "absolute",
    maxWidth: 240,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Math.max(4, t.radius - 2),
    backgroundColor: t.tooltipBg,
  },
  text: { color: t.tooltipFg, fontSize: t.fontSize - 2, lineHeight: (t.fontSize - 2) * 1.35 },
}));

function composeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(value);
      else if (ref) (ref as { current: T | null }).current = value;
    }
  };
}

/**
 * A short label for a control. There is no hover on a phone, so it shows on a
 * long press and fades after the finger lifts; screen readers get the same
 * text as the control's accessibility hint.
 *
 * It is drawn in the `KitProvider` overlay host and never takes touches, so
 * it can't block what is under it. Never put anything here that is not
 * available some other way.
 */
export function Tooltip(props: TooltipProps) {
  const {
    content,
    children,
    side = "top",
    align = "center",
    gap = 6,
    delay = 400,
    duration = 1500,
    disabled = false,
    style,
    styles: slots,
  } = props;

  const portal = usePortal("Tooltip");
  const anchorRef = useRef<ComponentRef<typeof View>>(null);
  const [open, setOpen] = useState(false);
  const [held, setHeld] = useState(false);

  // Hide `duration` after the finger lifts. Re-pressing restarts the clock.
  useEffect(() => {
    if (!open || held) return;
    const timer = setTimeout(() => setOpen(false), duration);
    return () => clearTimeout(timer);
  }, [open, held, duration]);

  const bubble = open && !disabled && (
    <Bubble
      anchorRef={anchorRef}
      side={side}
      align={align}
      gap={gap}
      style={[style, slots?.content]}
      textStyle={slots?.text}
    >
      {content}
    </Bubble>
  );

  // The bubble lives in the provider's overlay host, above the app.
  const key = useRef<number | null>(null);
  useEffect(() => {
    if (!bubble) return;
    key.current = portal.mount(bubble);
    return () => {
      if (key.current !== null) portal.unmount(key.current);
      key.current = null;
    };
    // Mount once per opening; `bubble` changes identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, disabled, portal]);
  useEffect(() => {
    if (bubble && key.current !== null) portal.update(key.current, bubble);
  });

  useEffect(() => {
    if (open && typeof content === "string") AccessibilityInfo.announceForAccessibility(content);
  }, [open, content]);

  if (!isValidElement(children)) {
    throw new Error("Tooltip: `children` must be a single React element.");
  }

  const childProps = children.props;
  return cloneElement(children, {
    ref: composeRefs(childProps.ref, anchorRef),
    // Describes, never names: the control keeps its own label.
    accessibilityHint:
      [childProps.accessibilityHint, typeof content === "string" ? content : undefined]
        .filter(Boolean)
        .join(". ") || undefined,
    delayLongPress: childProps.delayLongPress ?? delay,
    onLongPress(event: GestureResponderEvent) {
      childProps.onLongPress?.(event);
      if (disabled) return;
      setHeld(true);
      setOpen(true);
    },
    onPressOut(event: GestureResponderEvent) {
      childProps.onPressOut?.(event);
      setHeld(false);
    },
    onPress(event: GestureResponderEvent) {
      childProps.onPress?.(event);
      // A tap acts; it should not leave a label hanging over the result.
      setOpen(false);
    },
  } as Partial<ChildProps>);
}

interface BubbleProps {
  anchorRef: RefObject<ComponentRef<typeof View> | null>;
  side: TooltipSide;
  align: TooltipAlign;
  gap: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children: ReactNode;
}

/**
 * Measured against the overlay host itself, not the window, so it lines up
 * however the app's root is laid out - including when the host is an open
 * overlay's outlet rather than the provider's root, since host and anchor are
 * measured the same way and only their difference is used.
 */
function Bubble({ anchorRef, side, align, gap, style, textStyle, children }: BubbleProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const reduced = useReducedMotion();
  const hostRef = useRef<ComponentRef<typeof View>>(null);
  const [host, setHost] = useState<AnchorRect | null>(null);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const measure = () => {
    hostRef.current?.measureInWindow((x, y, width, height) =>
      setHost({ left: x, top: y, width, height, right: x + width, bottom: y + height }),
    );
    anchorRef.current?.measureInWindow((x, y, width, height) =>
      setAnchor({ left: x, top: y, width, height, right: x + width, bottom: y + height }),
    );
  };

  const placement =
    host && anchor && size
      ? placePopover(
          {
            left: anchor.left - host.left,
            right: anchor.right - host.left,
            top: anchor.top - host.top,
            bottom: anchor.bottom - host.top,
            width: anchor.width,
            height: anchor.height,
          },
          size,
          { width: host.width, height: host.height },
          { side, align, gap, edge: 8, rtl: I18nManager.isRTL, fitHeight: false, minHeight: 0 },
        )
      : null;

  // `placement.left` is a physical offset from the host's left edge. In RTL,
  // React Native swaps `left` and `right` (unless the app turned that off), so
  // the physical left edge is then set through `right`, as Anchored does.
  const swapped = I18nManager.isRTL && I18nManager.doLeftAndRightSwapInRTL;
  const x = placement?.left ?? 0;

  useEffect(() => {
    if (!placement) return;
    Animated.timing(fade, { toValue: 1, duration: reduced ? 0 : 120, useNativeDriver: true }).start();
  }, [placement !== null, fade, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (!size || Math.abs(size.width - width) > 0.5 || Math.abs(size.height - height) > 0.5) {
      setSize({ width, height });
    }
  };

  return (
    <View ref={hostRef} collapsable={false} style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={measure}>
      <Animated.View
        role="tooltip"
        onLayout={onLayout}
        style={[
          s.bubble,
          { ...(swapped ? { right: x } : { left: x }), top: placement?.top ?? 0, opacity: placement ? fade : 0 },
          style,
        ]}
      >
        {renderText(children, [s.text, textStyle])}
      </Animated.View>
    </View>
  );
}
