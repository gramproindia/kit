"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DocsStructure } from "@/lib/docs";

interface DocsSidebarProps {
  docsStructure: DocsStructure;
}

export function DocsSidebar({ docsStructure }: DocsSidebarProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(docsStructure.categories.map((cat) => cat.name))
  );
  const asideRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Restore scroll position on pathname change
  useEffect(() => {
    const saved = sessionStorage.getItem("docsSidebarScroll");
    if (saved && asideRef.current) {
      asideRef.current.scrollTop = parseInt(saved, 10);
    }
  }, [pathname]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(categoryName)) {
        newExpanded.delete(categoryName);
      } else {
        newExpanded.add(categoryName);
      }
      return newExpanded;
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollPos = e.currentTarget.scrollTop;
    sessionStorage.setItem("docsSidebarScroll", scrollPos.toString());
  };

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      ref={asideRef}
      onScroll={handleScroll}
      className="hidden md:block w-64 dark:border-gray-700 h-screen sticky top-0 overflow-y-auto"
    >
      <div className="p-6">
        <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Documentation
        </h2>
        <nav className="space-y-2">
          {/* Uncategorized items first */}
          {docsStructure.uncategorized.map((doc) => (
            <Link
              key={doc.slug}
              href={doc.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive(doc.href)
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {doc.title}
            </Link>
          ))}
          {/* Categorized items */}
          {docsStructure.categories.map((category) => (
            <div key={category.name} className="space-y-1">
              <button
                onClick={() => toggleCategory(category.name)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">{category.name}</div>
                {expandedCategories.has(category.name) ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
              {expandedCategories.has(category.name) && (
                <div className="ml-4 space-y-1">
                  {category.items.map((doc) => (
                    <Link
                      key={doc.slug}
                      href={doc.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive(doc.href)
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                      }`}
                    >
                      {doc.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
