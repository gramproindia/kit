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

const WIDTH = 360;
const STATUS_BAR = 34;
const BEZEL = 10;

export function PhoneFrame({
  demo,
  height = 680,
  label = true,
  defaultScheme = "light",
}: {
  /** A demo export from native-playground/demos, e.g. "ButtonDemo". */
  demo: string;
  /** Outer height of the phone in px. */
  height?: number;
  /** Show the "web preview" caption and scheme toggle. */
  label?: boolean;
  defaultScheme?: "light" | "dark";
}) {
  const [scheme, setScheme] = useState<"light" | "dark">(defaultScheme);
  const [error, setError] = useState<string | null>(null);
  const [near, setNear] = useState(false);
  const [width, setWidth] = useState(WIDTH);
  const host = useRef<HTMLDivElement>(null);

  // Mount the React Native tree only when the frame is about to be seen.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Narrow pages get a narrower phone rather than a scaled one: scaling would
  // throw off the measurements overlays are placed with.
  useEffect(() => {
    const el = host.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.min(WIDTH, Math.max(280, el.clientWidth - 4))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Start in the site's own theme (the `dark` class on <html>); the toggle
  // below still switches the phone on its own.
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) setScheme("dark");
  }, []);

  const onError = useCallback((message: string) => setError(message), []);
  const dark = scheme === "dark";
  const screenWidth = width - BEZEL * 2;
  const screenHeight = height - BEZEL * 2 - STATUS_BAR;

  return (
    <figure className="m-0 flex flex-col items-center gap-3">
      <div
        ref={host}
        className="relative overflow-hidden shadow-xl"
        style={{
          width,
          height,
          padding: BEZEL,
          borderRadius: 46,
          background: "#0b0b0e",
          boxShadow: "0 0 0 1px rgb(255 255 255 / 0.08) inset, 0 24px 60px -20px rgb(0 0 0 / 0.45)",
        }}
      >
        <div
          className="relative flex h-full flex-col overflow-hidden"
          style={{ borderRadius: 36, background: dark ? "#0b0b0e" : "#ffffff" }}
        >
          <div
            aria-hidden
            className="flex shrink-0 items-center justify-between px-6 text-[13px] font-semibold"
            style={{ height: STATUS_BAR, color: dark ? "#f4f4f5" : "#18181b" }}
          >
            <span>9:41</span>
            <span className="absolute left-1/2 top-2 h-[22px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
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
