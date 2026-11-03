"use client";

import { createContext } from "react";
import type { RadioSize, RadioVariant } from "../core/types";

export interface RadioGroupContextValue {
  value: string | null;
  /** `null` empties the group, as the clear button does. */
  select(value: string | null): void;
  name: string;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  size?: RadioSize;
  variant: RadioVariant;
}

/** Lets each Radio inside a RadioGroup read the group's value and change it. */
export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);
