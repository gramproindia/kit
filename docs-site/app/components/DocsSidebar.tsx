"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { DocsStructure } from "@/lib/docs";

interface DocsSidebarProps {
  docsStructure: DocsStructure;
}

export function DocsSidebar({ docsStructure }: DocsSidebarProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(docsStructure.categories.map((cat) => cat.name))
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const asideRef = useRef<HTMLDivElement>(null);

  // Restore scroll position on pathname change
  useEffect(() => {
    const saved = sessionStorage.getItem("docsSidebarScroll");
    if (saved && asideRef.current) {
      asideRef.current.scrollTop = parseInt(saved, 10);
    }
  }, [pathname]);

  // Close sidebar when pathname changes (on mobile)
  useEffect(() => {
    setSidebarOpen(false);
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
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden w-full fixed top-11 z-50 text-start rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle sidebar"
      >
        <div className="z-30 px-6 bg-white/80 py-3 backdrop-blur-sm backdrop-saturate-200 dark:bg-black/50">
          Menu
        </div>
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={asideRef}
        onScroll={handleScroll}
        className={`fixed md:sticky top-0 md:top-8 left-0 h-screen md:h-[calc(100vh-2rem)] w-64 dark:border-gray-700 overflow-y-auto transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen
            ? "translate-x-0 dark:bg-zinc-800 bg-zinc-200 z-50"
            : "-translate-x-full md:translate-x-0"
        }`}
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
                        className={`flex items-center gap-2 py-2 rounded-md text-sm transition-colors ${
                          isActive(doc.href)
                            ? "text-blue-700 font-bold"
                            : "text-gray-600 dark:text-gray-400 hover:font-bold hover:text-gray-900 dark:hover:text-gray-300"
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
    </>
  );
}
