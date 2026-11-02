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
  /** Each tab's measured layout, keyed by value. */
  layouts: Record<string, TabLayout>;
  /** Tabs report their order, disabled state and layout here. */
  register(value: string, entry: { disabled: boolean }): () => void;
  setLayout(value: string, layout: TabLayout): void;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(): TabsContextValue {
  const context = use(TabsContext);
  if (!context) throw new Error("TabList, Tab and TabPanel must be used inside <Tabs>.");
  return context;
}
