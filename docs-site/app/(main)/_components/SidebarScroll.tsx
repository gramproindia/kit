"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/*
 * Each page renders its own sidebar, so moving to another page builds a new
 * one, scrolled to the top. This keeps the reader's place instead: the scroll
 * position is saved per section and put back on the next page.
 */
const KEY = "v2-sidebar-scroll:";

export function SidebarScroll({ section, children }: { section: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let saved: number | null = null;
    try {
      const raw = sessionStorage.getItem(KEY + section);
      saved = raw === null ? null : Number(raw);
    } catch {
      // Storage can be blocked (private modes, embedded frames); start at the top.
    }
    if (saved !== null && Number.isFinite(saved)) el.scrollTop = saved;

    // The current page's link stays in sight: on a first visit, or when the
    // reader arrived from search or a link far down the list.
    const active = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) {
      const box = el.getBoundingClientRect();
      const link = active.getBoundingClientRect();
      if (link.top < box.top || link.bottom > box.bottom) {
        el.scrollTop += link.top - box.top - box.height / 3;
      }
    }

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(KEY + section, String(Math.round(el.scrollTop)));
        } catch {}
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
    };
  }, [section]);

  return (
    <div ref={ref} className="v2-sidebar">
      {children}
    </div>
  );
}
