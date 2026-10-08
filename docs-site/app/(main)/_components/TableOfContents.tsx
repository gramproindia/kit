"use client";

import { useEffect, useState } from "react";
import type { Heading } from "../_lib/docs";

/**
 * Headings above this line (px from the viewport top) count as reached. It sits
 * below where anchor jumps land a heading (header + scroll padding + heading
 * spacing), so the item you click is the one highlighted.
 */
const READ_LINE = 200;

export function TableOfContents({ items, title = "On this page" }: { items: Heading[]; title?: string }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = elements[0];
      if (atBottom) {
        current = elements[elements.length - 1];
      } else {
        // The last heading scrolled past the read line is the section being read.
        for (const el of elements) {
          if (el.getBoundingClientRect().top > READ_LINE) break;
          current = el;
        }
      }
      setActiveId(current.id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  return (
    <nav aria-label={title}>
      <p className="v2-nav-heading">{title}</p>
      <ul className="v2-toc">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              data-level={item.level}
              aria-current={activeId === item.id ? "location" : undefined}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
