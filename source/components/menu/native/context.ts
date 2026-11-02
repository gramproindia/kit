import { createContext, use, type ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import type { MenuCloseReason, MenuLocaleText } from "../core/types";

/** Style per part, the native counterpart of the web's `classNames`. */
export type MenuStyles = Partial<{
  list: StyleProp<ViewStyle>;
  item: StyleProp<ViewStyle>;
  icon: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  shortcut: StyleProp<TextStyle>;
  separator: StyleProp<ViewStyle>;
  group: StyleProp<ViewStyle>;
  groupLabel: StyleProp<TextStyle>;
  indicator: StyleProp<ViewStyle>;
  submenu: StyleProp<ViewStyle>;
}>;

/** A submenu shown in place of its parent, in a sheet. */
export interface SubmenuEntry {
  label: ReactNode;
  children: ReactNode;
}

export interface MenuContextValue {
  /** Closes this menu and, for a submenu, everything above it. */
  close(reason: MenuCloseReason): void;
  /** Close the whole stack after a choice. False keeps it open, e.g. for checkboxes. */
  closeOnSelect: boolean;
  styles?: MenuStyles;
  depth: number;
  /** A sheet on phones (big rows, submenus replace the list), a popover on tablets. */
  presentation: "sheet" | "popover";
  /** Sheet only: show a submenu in place of the current list. */
  push?(entry: SubmenuEntry): void;
  text: MenuLocaleText;
}

export const MenuContext = createContext<MenuContextValue | null>(null);

export function useMenuContext(component: string): MenuContextValue {
  const context = use(MenuContext);
  if (!context) throw new Error(`${component} must be rendered inside a <Menu>.`);
  return context;
}

export interface RadioGroupContextValue {
  value: string | undefined;
  select(value: string): void;
}

export const MenuRadioContext = createContext<RadioGroupContextValue | null>(null);
