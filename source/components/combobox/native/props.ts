import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import type {
  ComboboxLocaleText,
  ComboboxOption,
  ComboboxSize,
  OptionValue,
} from "../core/types";

/** Same slots as the web, as `styles` keys instead of `classNames`. */
export type ComboboxSlot =
  | "root"
  | "label"
  | "control"
  | "value"
  | "tag"
  | "popover"
  | "search"
  | "list"
  | "option"
  | "footer";

/** What `style` and `styles` callbacks receive: the native stand-in for `data-*`. */
export interface ComboboxStyleState {
  open: boolean;
  pressed: boolean;
  disabled: boolean;
  invalid: boolean;
  size: ComboboxSize;
}

export type Styleable<S> = StyleProp<S> | ((state: ComboboxStyleState) => StyleProp<S>);

export interface ComboboxStyles {
  root?: Styleable<ViewStyle>;
  label?: Styleable<TextStyle>;
  control?: Styleable<ViewStyle>;
  value?: Styleable<TextStyle>;
  tag?: Styleable<ViewStyle>;
  popover?: Styleable<ViewStyle>;
  search?: Styleable<TextStyle>;
  list?: Styleable<ViewStyle>;
  option?: Styleable<ViewStyle>;
  footer?: Styleable<ViewStyle>;
}

/** The imperative handle, identical to the web's. */
export interface ComboboxHandle<V extends OptionValue = string> {
  open(): void;
  close(): void;
  toggle(): void;
  /** Opens the list: on touch there is no separate focused-but-closed state. */
  focus(): void;
  clear(): void;
  /** Replace the selection as choosing would; `null` clears. See the web docs. */
  setValue(next: V | readonly V[] | null): void;
  getValue(): V[];
  getSelectedOptions(): ComboboxOption<V>[];
}

export interface OptionState {
  selected: boolean;
  /** Pressed on native; the web's keyboard-active row. */
  active: boolean;
}

/**
 * Shared Select / MultiSelect props: the web set less what has no meaning on a
 * phone (`name`, `id`, `virtualize`, `searchDebounce` keeps), with `style` /
 * `styles` for `className` / `classNames`.
 */
export interface ComboboxSharedProps<V extends OptionValue = string> {
  options: readonly ComboboxOption<V>[];
  /** `client` filters `options` locally; `server` expects `options` to be the current results. */
  mode?: "client" | "server";
  /** Shows a loading row; keeps current options visible. */
  loading?: boolean;
  /** Called with the search text (debounced in server mode), and on open. */
  onSearchChange?(search: string): void;
  /** Debounce for `onSearchChange` in server mode. Default 250 ms. */
  searchDebounce?: number;
  /** Show the search box. Default true. */
  searchable?: boolean;
  /** More results are available; the list calls `onLoadMore` near its end. */
  hasMore?: boolean;
  onLoadMore?(): void;
  filterFn?(option: ComboboxOption<NoInfer<V>>, search: string): boolean;
  renderOption?(option: ComboboxOption<NoInfer<V>>, state: OptionState): ReactNode;
  /** Offers "Create …" when the search matches no option. */
  allowCreate?: boolean;
  onCreate?(label: string): void;
  label?: ReactNode;
  placeholder?: string;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Show the clear button. Default true. */
  clearable?: boolean;
  /** Default `md`. */
  size?: ComboboxSize;
  /** Max height of the list in the tablet popover, in dp. Default 280. A phone sheet uses the screen. */
  maxHeight?: number;
  /** `auto` (default): bottom sheet on a phone, popover on a tablet. */
  presentation?: "auto" | "sheet" | "popover";
  /** Shown when nothing matches the search. Defaults to the locale text. */
  emptyMessage?: ReactNode;
  style?: Styleable<ViewStyle>;
  styles?: ComboboxStyles;
  localeText?: Partial<ComboboxLocaleText>;
  onOpenChange?(open: boolean): void;
  "aria-label"?: string;
}

export function applyStyle<S>(value: Styleable<S> | undefined, state: ComboboxStyleState): StyleProp<S> {
  return typeof value === "function"
    ? (value as (state: ComboboxStyleState) => StyleProp<S>)(state)
    : (value as StyleProp<S>);
}

/** A string for `aria-label` / sheet titles, when the node is plain text. */
export function plain(node: ReactNode): string | undefined {
  return typeof node === "string" || typeof node === "number" ? String(node) : undefined;
}
