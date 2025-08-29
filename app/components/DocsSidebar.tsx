"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
import { DocsStructure } from "@/lib/docs";

interface DocsSidebarProps {
  docsStructure: DocsStructure;
}

export function DocsSidebar({ docsStructure }: DocsSidebarProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(docsStructure.categories.map((cat) => cat.name))
  );

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="hidden md:block w-64 dark:border-gray-700 h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
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
              <FileText size={16} />
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
                <div className="flex items-center gap-2">
                  <Folder size={16} />
                  {category.name}
                </div>
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
                      <FileText size={14} />
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
