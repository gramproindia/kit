// @ts-nocheck — react-native-web ships no types; this file is only reached through the bundler alias.
"use client";

/*
 * `react-native` for the docs' phone-frame previews: react-native-web, with
 * three things made to fit a phone drawn inside a web page.
 *
 * 1. Modal renders inside the phone's screen, not over the whole browser
 *    window (react-native-web portals it to <body>).
 * 2. useWindowDimensions reports the phone screen's size, so components that
 *    choose a bottom sheet on phones (usePresentation) see a phone.
 * 3. measureInWindow answers relative to the phone screen, which is the
 *    "window" that overlays position against.
 *
 * Only the previews import `react-native`; next.config.ts aliases it here.
 */
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Animated as WebAnimated, useWindowDimensions as webWindowDimensions } from "react-native-web";
import UIManager from "react-native-web/dist/exports/UIManager";

export * from "react-native-web";

// (4) Animations run on the JS driver. Kit asks for the native driver, which
// the web does not have; react-native-web falls back for single animations,
// but Animated.loop reads the raw flag and hands the loop to a native module
// that is not there, so spinners turn once and stop.
const jsDriver = <C extends { useNativeDriver?: boolean }>(fn: (value: unknown, config: C) => unknown) =>
  (value: unknown, config: C) => fn(value, { ...config, useNativeDriver: false });
export const Animated = {
  ...WebAnimated,
  timing: jsDriver(WebAnimated.timing),
  spring: jsDriver(WebAnimated.spring),
  decay: jsDriver(WebAnimated.decay),
  event: (mapping: unknown, config?: { useNativeDriver?: boolean }) =>
    WebAnimated.event(mapping, { ...config, useNativeDriver: false }),
};

// (5) Development only: React StrictMode mounts every effect twice. The
// simulated unmount detaches an animated view, react-native-web then stops
// the value's animation, and the re-mount never restarts it, so sheets and
// dialogs stay off screen in `next dev`. Let animations survive a momentary
// detach; components still stop their own animations in their cleanups.
// Production has no double mount and is left as react-native-web ships it.
if (process.env.NODE_ENV !== "production") {
  const valueProto = Object.getPrototypeOf(new WebAnimated.Value(0));
  if (!valueProto.__kitPatched) {
    const nodeDetach = Object.getPrototypeOf(valueProto).__detach;
    valueProto.__detach = function detachWithoutStopping() {
      nodeDetach.call(this);
    };
    valueProto.__kitPatched = true;
  }
}

export interface Screen {
  node: HTMLElement | null;
  width: number;
  height: number;
}

export const ScreenContext = createContext<Screen | null>(null);

const SCREEN_ATTR = "data-rn-screen";

// (3) Coordinates relative to the phone screen an element sits in.
const measure = UIManager.measureInWindow;
if (!(measure as { __kitPatched?: boolean }).__kitPatched) {
  const patched = (node: HTMLElement, callback: (x: number, y: number, w: number, h: number) => void) =>
    measure(node, (x: number, y: number, w: number, h: number) => {
      const screen = node?.closest?.(`[${SCREEN_ATTR}]`);
      if (!screen) return callback(x, y, w, h);
      const r = screen.getBoundingClientRect();
      // The phone is drawn at real device size and scaled down to fit the page;
      // getBoundingClientRect is in scaled pixels, layout is not. Undo the scale.
      const scale = (screen as HTMLElement).offsetWidth ? r.width / (screen as HTMLElement).offsetWidth : 1;
      callback((x - r.left) / scale, (y - r.top) / scale, w / scale, h / scale);
    });
  patched.__kitPatched = true;
  UIManager.measureInWindow = patched;
}

// (2)
export function useWindowDimensions() {
  const screen = useContext(ScreenContext);
  const web = webWindowDimensions();
  return screen ? { width: screen.width, height: screen.height, scale: web.scale, fontScale: web.fontScale } : web;
}

// (1)
export function Modal({
  visible = true,
  onRequestClose,
  children,
}: {
  visible?: boolean;
  onRequestClose?: () => void;
  children?: ReactNode;
}) {
  const screen = useContext(ScreenContext);

  // Escape stands in for Android back.
  useEffect(() => {
    if (!visible || !onRequestClose) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onRequestClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onRequestClose]);

  if (!visible || !screen?.node) return null;
  return createPortal(
    <div
      role="presentation"
      style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", flexDirection: "column" }}
    >
      {children}
    </div>,
    screen.node,
  );
}

export { SCREEN_ATTR };
