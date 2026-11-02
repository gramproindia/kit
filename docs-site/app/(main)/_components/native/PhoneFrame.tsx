"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Moon, Sun } from "lucide-react";

/*
 * A drawn phone with a live React Native demo inside, rendered in the browser
 * by react-native-web. The React Native side lives in native-preview/ and is
 * loaded only in the browser, only once the frame scrolls near the viewport.
 */
const PhoneScreen = dynamic(() => import("@native-preview/runtime").then((m) => m.PhoneScreen), {
  ssr: false,
  loading: () => null,
});

/*
 * The screen is laid out at a real phone's logical size (iPhone 16: 393×852),
 * so text and controls have their true proportions, then the whole phone is
 * scaled down to fit the page. The preview runtime undoes the scale when
 * components measure themselves (rn-shim.tsx, measureInWindow).
 */
const DEVICE_WIDTH = 393;
const DEVICE_HEIGHT = 852;
const STATUS_BAR = 44;
const BEZEL = 12;
const OUTER_WIDTH = DEVICE_WIDTH + BEZEL * 2;
const OUTER_HEIGHT = DEVICE_HEIGHT + BEZEL * 2;
/** Widest the phone is drawn on the page, in CSS px. */
const MAX_WIDTH = 320;

export function PhoneFrame({
  demo,
  height = 680,
  label = true,
  defaultScheme = "light",
}: {
  /** A demo export from native-playground/demos, e.g. "ButtonDemo". */
  demo: string;
  /** Tallest the phone is drawn on the page, in CSS px. Its shape is always a real phone's. */
  height?: number;
  /** Show the "web preview" caption and scheme toggle. */
  label?: boolean;
  defaultScheme?: "light" | "dark";
}) {
  const [scheme, setScheme] = useState<"light" | "dark">(defaultScheme);
  const [error, setError] = useState<string | null>(null);
  const [near, setNear] = useState(false);
  const [maxWidth, setMaxWidth] = useState(MAX_WIDTH);
  const host = useRef<HTMLDivElement>(null);

  // Mount the React Native tree only when the frame is about to be seen.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Narrow windows get a smaller phone, same shape. Sized from the window, not
  // from a container: containers here shrink to fit the phone, so measuring
  // one would shrink the phone a little more on every resize.
  useEffect(() => {
    const fit = () => setMaxWidth(Math.min(MAX_WIDTH, Math.max(240, window.innerWidth - 48)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Start in the site's own theme (the `dark` class on <html>); the toggle
  // below still switches the phone on its own.
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) setScheme("dark");
  }, []);

  const onError = useCallback((message: string) => setError(message), []);
  const dark = scheme === "dark";
  const scale = Math.min(maxWidth / OUTER_WIDTH, height / OUTER_HEIGHT);
  const screenWidth = DEVICE_WIDTH;
  const screenHeight = DEVICE_HEIGHT - STATUS_BAR;

  return (
    <figure className="m-0 flex flex-col items-center gap-3">
      <div ref={host} style={{ width: OUTER_WIDTH * scale, height: OUTER_HEIGHT * scale }}>
      <div
        className="relative overflow-hidden shadow-xl"
        style={{
          width: OUTER_WIDTH,
          height: OUTER_HEIGHT,
          padding: BEZEL,
          borderRadius: 56,
          background: "#0b0b0e",
          boxShadow: "0 0 0 1px rgb(255 255 255 / 0.08) inset, 0 24px 60px -20px rgb(0 0 0 / 0.45)",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div
          className="relative flex h-full flex-col overflow-hidden"
          style={{ borderRadius: 46, background: dark ? "#0b0b0e" : "#ffffff" }}
        >
          <div
            aria-hidden
            className="flex shrink-0 items-center justify-between px-8 text-[15px] font-semibold"
            style={{ height: STATUS_BAR, color: dark ? "#f4f4f5" : "#18181b" }}
          >
            <span>9:41</span>
            <span className="absolute left-1/2 top-2.5 h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-4 rounded-[3px] border border-current" />
            </span>
          </div>
          {error ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm" style={{ color: dark ? "#a1a1aa" : "#71717a" }}>
              This component does not render in a web preview yet. It works in the app; see the code below or run
              native-playground on a device.
            </div>
          ) : near ? (
            <PhoneScreen demo={demo} scheme={scheme} width={screenWidth} height={screenHeight} onError={onError} />
          ) : null}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-1.5 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full"
            style={{ background: dark ? "#f4f4f5" : "#18181b", opacity: 0.6 }}
          />
        </div>
      </div>
      </div>
      {label && (
        <figcaption className="flex items-center gap-3 text-xs text-(--v2-faint)">
          <span>Web preview — real device may differ</span>
          <button
            type="button"
            className="v2-icon-btn"
            onClick={() => setScheme(dark ? "light" : "dark")}
            aria-label={dark ? "Show light mode" : "Show dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
          </button>
        </figcaption>
      )}
    </figure>
  );
}
