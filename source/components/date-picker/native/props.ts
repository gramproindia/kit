import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { DateInput, DatePickerLocaleText, DatePickerSize } from "../core/types";
import type { DatePickerStyles } from "./Field";
import type { DateFormat } from "./useCalendar";

/** Imperative control, the same shape as the web pickers' handle. */
export interface DatePickerHandle<TValue> {
  open(): void;
  close(): void;
  toggle(): void;
  /** Opens the calendar: on native, focusing the field means showing it. */
  focus(): void;
  clear(): void;
  /** Sets the value as picking would; ignored while disabled or read-only. */
  setValue(next: TValue | string | null): void;
  getValue(): TValue;
}

/**
 * The web's `DatePickerSharedProps`, less what has no meaning without a DOM:
 * `name` (no form posting), `id`, `allowInput` (no typed entry yet) and
 * `className`/`classNames`, which become `style`/`styles`.
 */
export interface DatePickerSharedProps {
  min?: DateInput | null;
  max?: DateInput | null;
  isDateDisabled?(date: Date): boolean;
  /** BCP-47 tag for month names, digits and the first day of the week. */
  locale?: string;
  /** 0 = Sunday. Defaults to the locale's first day of the week. */
  weekStartsOn?: number;
  format?: DateFormat;
  /** Months shown, stacked. Default 1 on native, for every picker. */
  numberOfMonths?: number;
  showWeekNumbers?: boolean;
  /** "Today" in the footer. */
  showToday?: boolean;
  /** Always six week rows, so the panel never changes height. Default true. */
  fixedWeeks?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Show the clear button. Default true. */
  clearable?: boolean;
  /** Default `md`. */
  size?: DatePickerSize;
  /** Sheet on phones, anchored panel on tablets. Default `auto`. */
  presentation?: "auto" | "sheet" | "popover";
  style?: StyleProp<ViewStyle>;
  styles?: DatePickerStyles;
  localeText?: Partial<DatePickerLocaleText>;
  onOpenChange?(open: boolean): void;
}
