import { createContext } from "react";
import type { CheckboxSize } from "../core/types";

// The native twin of react/context.ts. That file is DOM-free too, but native
// installs do not copy react/, so the native components keep their own.
export interface CheckboxGroupContextValue {
  values: readonly string[];
  toggle(value: string, checked: boolean): void;
  disabled: boolean;
  invalid: boolean;
  size?: CheckboxSize;
}

/** Lets each Checkbox inside a CheckboxGroup read and change the group's values. */
export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);
