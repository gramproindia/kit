import { createContext, use } from "react";
import type { TabsOrientation, TabsSize, TabsVariant } from "../core/types";

/** Where a tab sits inside its list, for the sliding indicator. */
export interface TabLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TabsContextValue {
  id: string;
  value: string | undefined;
  select(value: string): void;
  orientation: TabsOrientation;
  variant: TabsVariant;
  size: TabsSize;
  keepMounted: boolean;
  /**
   * Each tab's measured layout, keyed by value, as of the moment it is read.
   * Measurements no longer re-render everything under `Tabs`; only the tab
   * list follows them.
   */
  readonly layouts: Record<string, TabLayout>;
  /** Tabs report their order, disabled state and layout here. */
  register(value: string, entry: { disabled: boolean }): () => void;
  setLayout(value: string, layout: TabLayout): void;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

/**
 * The tabs' measured layouts, kept outside React state. Every tab reports its
 * layout on mount; held in context, each report re-rendered every tab and
 * panel, so mounting N tabs cost N² renders. Only the indicator subscribes.
 */
export interface TabLayoutStore {
  get(): Record<string, TabLayout>;
  set(value: string, layout: TabLayout): void;
  subscribe(listener: () => void): () => void;
}

export function createTabLayoutStore(): TabLayoutStore {
  let layouts: Record<string, TabLayout> = {};
  const listeners = new Set<() => void>();
  return {
    get: () => layouts,
    set(value, layout) {
      const old = layouts[value];
      if (
        old &&
        old.x === layout.x &&
        old.y === layout.y &&
        old.width === layout.width &&
        old.height === layout.height
      ) {
        return;
      }
      layouts = { ...layouts, [value]: layout };
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Not exported from the package: how the tab list reaches the store. */
export const TabLayoutContext = createContext<TabLayoutStore | null>(null);

export function useTabsContext(): TabsContextValue {
  const context = use(TabsContext);
  if (!context) throw new Error("TabList, Tab and TabPanel must be used inside <Tabs>.");
  return context;
}
