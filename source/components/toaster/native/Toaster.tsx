import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import { useInsets, usePortal } from "../../shared/native/KitProvider";
import { defaultToasterText } from "../core/locale";
import { visibleToasts, type ToastStore } from "../core/store";
import { toastStore } from "../core/toast";
import type { ToasterLocaleText, ToastPosition, ToastType } from "../core/types";
import { useToasts } from "../hooks/useToasts";
import { ToastItem, type ToasterStyles } from "./ToastItem";

export interface ToasterProps {
  /** Default `"top-center"` (the web defaults to `top-right`; a phone has no corner to spare). */
  position?: ToastPosition;
  /** Open toasts on screen at once; the rest wait their turn. Default 3. */
  limit?: number;
  /** Default auto-close delay in milliseconds. Default 5000. */
  duration?: number;
  /** Toasts allowed to wait beyond `limit`; the oldest waiting are dropped past it. Default 20. */
  maxQueue?: number;
  /** Show a close button on dismissible toasts. Default true. */
  closeButton?: boolean;
  /** Replace the icon per type; `null` hides it. */
  icons?: Partial<Record<ToastType, ReactNode>>;
  /** A store from `createToastStore()`. Defaults to the one behind `toast()`. */
  store?: ToastStore;
  /** The region holding the toasts. */
  style?: StyleProp<ViewStyle>;
  styles?: ToasterStyles;
  localeText?: Partial<ToasterLocaleText>;
}

const WIDTH = 356;
const OFFSET = 12;

/**
 * Mount once, inside `<KitProvider>`. Toasts come from `toast()` and render in
 * the provider's overlay host, above the app, without blocking touches on it.
 */
export function Toaster(props: ToasterProps) {
  const portal = usePortal("Toaster");
  const key = useRef<number | null>(null);
  const { position, limit, duration, maxQueue, closeButton, icons, store, style, styles, localeText } = props;

  // Mount into the host once; hand it new props only when one changes.
  useEffect(() => {
    key.current = portal.mount(null);
    return () => {
      if (key.current !== null) portal.unmount(key.current);
      key.current = null;
    };
  }, [portal]);

  useEffect(() => {
    if (key.current === null) return;
    portal.update(
      key.current,
      <ToastRegion
        position={position}
        limit={limit}
        duration={duration}
        maxQueue={maxQueue}
        closeButton={closeButton}
        icons={icons}
        store={store}
        style={style}
        styles={styles}
        localeText={localeText}
      />,
    );
  }, [portal, position, limit, duration, maxQueue, closeButton, icons, store, style, styles, localeText]);

  return null;
}

function ToastRegion({
  position = "top-center",
  limit,
  duration,
  maxQueue,
  closeButton = true,
  icons,
  store = toastStore,
  style,
  styles: slots,
  localeText,
}: ToasterProps) {
  const snapshot = useToasts(store);
  const insets = useInsets();
  const window = useWindowDimensions();
  const text = useMemo(() => ({ ...defaultToasterText, ...localeText }), [localeText]);

  useEffect(() => {
    store.configure({ limit, duration, maxQueue });
  }, [store, limit, duration, maxQueue]);

  const empty = snapshot.toasts.length === 0;
  useEffect(() => {
    // A toast that disappears under a finger never gets its touch end.
    if (empty) store.resume();
  }, [empty, store]);

  const top = position.startsWith("top");
  const [, horizontal] = position.split("-") as [string, "left" | "center" | "right"];
  const width = Math.min(WIDTH, window.width - insets.left - insets.right - OFFSET * 2);
  // Newest nearest the edge it enters from.
  const toasts = visibleToasts(snapshot);
  const ordered = top ? toasts : [...toasts].reverse();

  return (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        {
          paddingTop: insets.top + OFFSET,
          paddingBottom: insets.bottom + OFFSET,
          paddingLeft: insets.left + OFFSET,
          paddingRight: insets.right + OFFSET,
          justifyContent: top ? "flex-start" : "flex-end",
          alignItems: horizontal === "left" ? "flex-start" : horizontal === "right" ? "flex-end" : "center",
        },
        slots?.region,
        style,
      ]}
    >
      {/* Always mounted, even when empty, so the first toast is announced (Android). */}
      <View pointerEvents="box-none" aria-live="polite" style={[{ width, gap: 8 }, slots?.list]}>
        {ordered.map((item) => (
          <ToastItem
            key={item.id}
            toast={item}
            store={store}
            closeButton={closeButton}
            fromTop={top}
            icons={icons}
            styles={slots}
            text={text}
          />
        ))}
      </View>
    </View>
  );
}
