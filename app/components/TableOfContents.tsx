"use client";

import { useEffect, useState } from "react";
import { TocItem } from "@/lib/toc";

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveId(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0.1,
      }
    );

    // Observe all headings
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [items]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      setActiveId(id);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <aside className="hidden md:block w-64">
      <div className="sticky top-0 max-h-screen overflow-y-auto p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide">
          On This Page
        </h3>

        <nav className="space-y-1">
          {items.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              onClick={() => scrollToHeading(item.id)}
              className={`block w-full text-left text-sm py-1 transition-colors ${
                activeId === item.id
                  ? "text-blue-600 dark:text-blue-400 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
              style={{
                paddingLeft: `${(item.level - 1) * 0.75}rem`,
              }}
            >
              {item.title}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
