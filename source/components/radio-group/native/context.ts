import { createContext } from "react";
import type { RadioSize, RadioVariant } from "../core/types";

// The native twin of react/context.ts. That file is DOM-free too, but native
// installs do not copy react/, so the native components keep their own. There
// is no `name` here: native has no form posting to group radios by.
export interface RadioGroupContextValue {
  value: string | null;
  select(value: string): void;
  disabled: boolean;
  invalid: boolean;
  size?: RadioSize;
  variant: RadioVariant;
}

/** Lets each Radio inside a RadioGroup read the group's value and change it. */
export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);
