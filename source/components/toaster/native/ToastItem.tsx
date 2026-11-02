import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { CheckGlyph, CloseGlyph } from "../../shared/native/glyphs";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { useReducedMotion } from "../../shared/native/motion";
import { Ring } from "../../shared/native/primitives";
import type { KitTokens } from "../../shared/native/theme";
import type { ToastStore } from "../core/store";
import type { ToastAction, ToastActionEvent, ToasterLocaleText, ToastRecord, ToastType } from "../core/types";

/** Horizontal drag, in dp, that dismisses a toast. */
const SWIPE_DISMISS = 64;

export type ToasterSlot =
  | "region"
  | "list"
  | "toast"
  | "icon"
  | "content"
  | "title"
  | "description"
  | "actions"
  | "action"
  | "cancel"
  | "close";

export type ToasterStyles = Partial<Record<ToasterSlot, StyleProp<ViewStyle & TextStyle>>>;

export function typeColor(t: KitTokens, type: ToastType): string {
  switch (type) {
    case "success":
      return t.success;
    case "error":
      return t.danger;
    case "warning":
      return t.warning;
    case "info":
      return t.info;
    default:
      return t.fg;
  }
}

export const toastStyles = createThemedStyles((t) => ({
  toast: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 8,
    backgroundColor: t.raised,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: t.radius,
    boxShadow: t.shadow,
  },
  icon: { width: 20, height: 20, alignItems: "center", justifyContent: "center", marginTop: 1 },
  badge: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 12, fontWeight: "800", color: t.raised, lineHeight: 14 },
  content: { flex: 1, minWidth: 0, gap: 2, paddingRight: 4 },
  title: { fontSize: t.fontSize, fontWeight: "600", color: t.fg, lineHeight: t.fontSize * 1.35 },
  description: { fontSize: t.fontSize - 1, color: t.muted, lineHeight: (t.fontSize - 1) * 1.4 },
  actions: { flexDirection: "row", gap: 6, marginTop: 8 },
  button: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: t.radius - 2,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: t.fontSize - 1, fontWeight: "600" },
  close: { width: 32, height: 32, borderRadius: 6, alignItems: "center", justifyContent: "center", marginTop: -6 },
}));

function DefaultIcon({ type }: { type: ToastType }) {
  const { tokens } = useKitTheme();
  const s = toastStyles(tokens);
  const color = typeColor(tokens, type);
  if (type === "default") return null;
  if (type === "loading") return <Ring size={16} color={tokens.muted} />;
  if (type === "success") return <CheckGlyph size={18} color={color} stroke={2.5} />;
  return (
    <View style={[s.badge, { backgroundColor: color }]}>
      <Text style={s.badgeText}>{type === "info" ? "i" : "!"}</Text>
    </View>
  );
}

/** Plain text gets `<Text>`; anything else renders as given. */
function textOf(node: ReactNode, style: StyleProp<TextStyle>) {
  return typeof node === "string" || typeof node === "number" ? <Text style={style}>{node}</Text> : node;
}

/** A spoken summary for iOS, which has no live regions. */
function spoken(toast: ToastRecord): string {
  return [toast.title, toast.description].filter((part) => typeof part === "string").join(". ");
}

interface ToastItemProps {
  toast: ToastRecord;
  store: ToastStore;
  closeButton: boolean;
  /** Top-positioned toasts enter from above, bottom ones from below. */
  fromTop: boolean;
  icons?: Partial<Record<ToastType, ReactNode>>;
  styles?: ToasterStyles;
  text: ToasterLocaleText;
}

export function ToastItem({ toast, store, closeButton, fromTop, icons, styles: slots, text }: ToastItemProps) {
  const { tokens } = useKitTheme();
  const s = toastStyles(tokens);
  const reduced = useReducedMotion();
  const { action, cancel, render } = toast;
  const closing = toast.state === "closing";

  const enter = useRef(new Animated.Value(0)).current;
  const swipe = useRef(new Animated.Value(0)).current;

  const dismiss = () => store.dismiss(toast.id);

  // In on mount, out when the store marks it closing (it removes it after EXIT_DURATION).
  useEffect(() => {
    const animation = Animated.timing(enter, {
      toValue: closing ? 0 : 1,
      duration: reduced ? 0 : closing ? 180 : 220,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [closing, enter, reduced]);

  // iOS has no live regions: announce new and updated toasts explicitly.
  useEffect(() => {
    if (Platform.OS !== "ios" || closing) return;
    const message = spoken(toast);
    if (message) AccessibilityInfo.announceForAccessibility(message);
    // Announce on show and on each update (version), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.version]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          toast.dismissible && !closing && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => store.pause(),
        onPanResponderMove: (_, g) => swipe.setValue(g.dx),
        onPanResponderRelease: (_, g) => {
          store.resume();
          if (Math.abs(g.dx) >= SWIPE_DISMISS || Math.abs(g.vx) > 0.8) {
            Animated.timing(swipe, {
              toValue: g.dx > 0 ? 500 : -500,
              duration: 160,
              useNativeDriver: false,
            }).start();
            dismiss();
          } else {
            Animated.spring(swipe, { toValue: 0, useNativeDriver: false }).start();
          }
        },
        onPanResponderTerminate: () => {
          store.resume();
          Animated.spring(swipe, { toValue: 0, useNativeDriver: false }).start();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toast.dismissible, closing, store, swipe, toast.id],
  );

  const runAction = (item: ToastAction) => {
    let prevented = false;
    const event: ToastActionEvent = {
      preventDefault: () => {
        prevented = true;
      },
      get defaultPrevented() {
        return prevented;
      },
    };
    item.onClick(event);
    if (!prevented) dismiss();
  };

  // `null` from the toast or the Toaster hides the icon; `undefined` means the default.
  const icon =
    toast.icon !== undefined
      ? toast.icon
      : icons !== undefined && Object.prototype.hasOwnProperty.call(icons, toast.type)
        ? icons[toast.type]
        : <DefaultIcon type={toast.type} />;

  return (
    // Enter/exit runs on the native driver; the swipe is JS-driven on an inner layer, so they never mix.
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [fromTop ? -12 : 12, 0] }) },
        ],
      }}
    >
      <Animated.View
        {...responder.panHandlers}
        role={toast.type === "error" ? "alert" : "status"}
        aria-live={toast.type === "error" ? "assertive" : "polite"}
        // Holding a toast keeps it open while it is read.
        onTouchStart={() => store.pause()}
        onTouchEnd={() => store.resume()}
        onTouchCancel={() => store.resume()}
        style={[
          s.toast,
          {
            transform: [{ translateX: swipe }],
            opacity: swipe.interpolate({
              inputRange: [-200, 0, 200],
              outputRange: [0.2, 1, 0.2],
              extrapolate: "clamp",
            }),
          },
          slots?.toast,
        ]}
      >
        {!render && icon != null && (
          <View style={[s.icon, slots?.icon]} aria-hidden>
            {icon}
          </View>
        )}

        <View style={[s.content, slots?.content]}>
          {render ? (
            render({ id: toast.id, dismiss })
          ) : (
            <>
              {textOf(toast.title, [s.title, slots?.title])}
              {toast.description != null && textOf(toast.description, [s.description, slots?.description])}
            </>
          )}
          {!render && (action || cancel) && (
            <View style={[s.actions, slots?.actions]}>
              {cancel && (
                <Pressable
                  role="button"
                  onPress={() => runAction(cancel)}
                  style={({ pressed }) => [s.button, pressed && { backgroundColor: tokens.hover }, slots?.cancel]}
                >
                  {textOf(cancel.label, [s.buttonText, { color: tokens.muted }])}
                </Pressable>
              )}
              {action && (
                <Pressable
                  role="button"
                  onPress={() => runAction(action)}
                  style={({ pressed }) => [
                    s.button,
                    { backgroundColor: pressed ? tokens.accentStrong : tokens.accent },
                    slots?.action,
                  ]}
                >
                  {textOf(action.label, [s.buttonText, { color: tokens.accentFg }])}
                </Pressable>
              )}
            </View>
          )}
        </View>

        {closeButton && toast.dismissible && (
          <Pressable
            role="button"
            aria-label={text.close}
            hitSlop={6}
            onPress={dismiss}
            style={({ pressed }) => [s.close, pressed && { backgroundColor: tokens.hover }, slots?.close]}
          >
            <CloseGlyph size={12} color={tokens.muted} />
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
}
