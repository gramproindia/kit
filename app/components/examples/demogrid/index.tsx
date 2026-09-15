"use client";

import { useState } from "react";
import { ClientDemo } from "./ClientDemo";
import { ServerDemo } from "./ServerDemo";

const TABS = [
  { id: "client", label: "Client · 100k rows" },
  { id: "server", label: "Server mode" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function DemoGrid() {
  const [tab, setTab] = useState<TabId>("client");
  const [dark, setDark] = useState(false);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  };

  return (
    <div className="">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            Zero-dependency, virtualized data grid for React 19
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            className="flex rounded-lg border border-zinc-300 p-0.5 dark:border-zinc-700"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className="rounded-md px-3 py-1.5 text-sm aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            {dark ? "Light" : "Dark"} mode
          </button>
        </div>
      </header>
      <main>{tab === "client" ? <ClientDemo /> : <ServerDemo />}</main>
    </div>
  );
}

export default DemoGrid;
