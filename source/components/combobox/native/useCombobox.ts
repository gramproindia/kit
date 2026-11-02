import { useCallback, useEffect, useEffectEvent, useMemo, useState } from "react";
import {
  buildListItems,
  filterOptions,
  firstEnabledIndex,
  matchRanges,
  splitTerms,
  toggleValue,
} from "../core/filter";
import type { ComboboxOption, OptionValue } from "../core/types";
import type { ComboboxHandle } from "./props";

export interface UseComboboxParams<V extends OptionValue> {
  options: readonly ComboboxOption<V>[];
  multiple: boolean;
  /** Controlled values. `undefined` keeps them internal. */
  value?: V[];
  defaultValue: V[];
  onValuesChange(values: V[], options: ComboboxOption<V>[]): void;
  mode?: "client" | "server";
  onSearchChange?(search: string): void;
  searchDebounce?: number;
  disabled?: boolean;
  filterFn?(option: ComboboxOption<V>, search: string): boolean;
  allowCreate?: boolean;
  onCreate?(label: string): void;
  closeOnSelect?: boolean;
  max?: number;
  onOpenChange?(open: boolean): void;
}

/**
 * The native combobox engine: the same filtering, grouping, selection and
 * create rules as the web `useCombobox` (all from `core/`), without the DOM
 * focus and keyboard plumbing a touch list does not need. Exported so an app
 * can draw its own picker on the same engine.
 */
export function useCombobox<V extends OptionValue>(params: UseComboboxParams<V>) {
  const {
    options,
    multiple,
    value,
    defaultValue,
    onValuesChange,
    mode = "client",
    onSearchChange,
    searchDebounce = 250,
    disabled = false,
    filterFn,
    allowCreate = false,
    onCreate,
    closeOnSelect = !multiple,
    max,
    onOpenChange,
  } = params;

  const [open, setOpenState] = useState(false);
  const [search, setSearchState] = useState("");
  const [internalValues, setInternalValues] = useState<V[]>(defaultValue);
  /** Labels of options chosen earlier, so they survive a server-side search. */
  const [known, setKnown] = useState<ReadonlyMap<V, ComboboxOption<V>>>(() => new Map());

  const values = value ?? internalValues;

  // Server mode shows what the server returned; the search only highlights.
  const entries = useMemo(() => {
    if (mode === "server") {
      const terms = splitTerms(search);
      return options.map((option) => ({ option, matches: matchRanges(option.label, terms) ?? [] }));
    }
    return filterOptions(options, search, filterFn);
  }, [options, search, mode, filterFn]);

  const items = useMemo(() => buildListItems(entries), [entries]);
  const optionsByValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  const selectedSet = useMemo(() => new Set(values), [values]);

  const resolveOption = useCallback(
    (v: V): ComboboxOption<V> =>
      optionsByValue.get(v) ?? known.get(v) ?? ({ value: v, label: String(v) } as ComboboxOption<V>),
    [optionsByValue, known],
  );
  const selectedOptions = useMemo(() => values.map(resolveOption), [values, resolveOption]);
  const isSelected = useCallback((v: V) => selectedSet.has(v), [selectedSet]);

  /** Where the list starts when it opens: the selected option, else the first enabled one. */
  const initialIndex = useMemo(() => {
    const selected = entries.findIndex((e) => !e.option.disabled && selectedSet.has(e.option.value));
    return selected === -1 ? firstEnabledIndex(entries) : selected;
  }, [entries, selectedSet]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (next && disabled) return;
      if (next === open) return;
      setOpenState(next);
      if (!next) setSearchState("");
      onOpenChange?.(next);
    },
    [open, disabled, onOpenChange],
  );

  const commit = useCallback(
    (next: V[]) => {
      if (value === undefined) setInternalValues(next);
      onValuesChange(next, next.map(resolveOption));
    },
    [value, onValuesChange, resolveOption],
  );

  const selectOption = useCallback(
    (option: ComboboxOption<V>) => {
      if (option.disabled || disabled) return;
      setKnown((prev) => (prev.has(option.value) ? prev : new Map(prev).set(option.value, option)));
      commit(multiple ? toggleValue(values, option.value, max) : [option.value]);
      if (closeOnSelect) setOpen(false);
      else if (!multiple) setSearchState("");
    },
    [disabled, multiple, values, max, commit, closeOnSelect, setOpen],
  );

  const removeValue = useCallback(
    (v: V) => {
      if (disabled) return;
      commit(values.filter((current) => current !== v));
    },
    [disabled, values, commit],
  );

  const clear = useCallback(() => {
    if (disabled) return;
    commit([]);
  }, [disabled, commit]);

  const selectAllVisible = useCallback(() => {
    const added = entries
      .filter((entry) => !entry.option.disabled && !selectedSet.has(entry.option.value))
      .map((entry) => entry.option);
    const room = max === undefined ? added.length : Math.max(0, max - values.length);
    const next = [...values, ...added.slice(0, room).map((option) => option.value)];
    setKnown((prev) => {
      const map = new Map(prev);
      for (const option of added) map.set(option.value, option);
      return map;
    });
    commit(next);
  }, [entries, values, selectedSet, max, commit]);

  const trimmed = search.trim();
  const createLabel =
    allowCreate && trimmed && !entries.some((e) => e.option.label.toLocaleLowerCase() === trimmed.toLocaleLowerCase())
      ? trimmed
      : null;

  const commitCreate = useCallback(() => {
    if (!createLabel) return;
    onCreate?.(createLabel);
    setSearchState("");
    if (!multiple) setOpen(false);
  }, [createLabel, onCreate, multiple, setOpen]);

  // Search requests: debounced in server mode, immediate when opening. As on
  // the web, only whether there is a handler is a dependency, so an inline
  // handler does not restart the debounce on every parent render.
  const wantsSearch = onSearchChange !== undefined;
  const emitSearch = useEffectEvent((term: string) => onSearchChange?.(term));
  useEffect(() => {
    if (!wantsSearch || !open) return;
    const delay = mode === "server" && search ? searchDebounce : 0;
    const timer = setTimeout(() => emitSearch(search), delay);
    return () => clearTimeout(timer);
  }, [open, search, mode, searchDebounce, wantsSearch]);

  const handle = useMemo<ComboboxHandle<V>>(
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen(!open),
      // Nothing to focus but the list itself; opening is the touch equivalent.
      focus: () => setOpen(true),
      clear: () => commit([]),
      setValue: (next) => {
        const list = next == null ? [] : Array.isArray(next) ? [...next] : [next as V];
        if (!multiple) return commit(list.slice(0, 1));
        commit(max === undefined ? list : list.slice(0, max));
      },
      getValue: () => [...values],
      getSelectedOptions: () => selectedOptions,
    }),
    [setOpen, open, commit, values, selectedOptions, multiple, max],
  );

  return {
    open,
    setOpen,
    search,
    setSearch: setSearchState,
    entries,
    items,
    initialIndex,
    values,
    selectedOptions,
    isSelected,
    selectOption,
    removeValue,
    clear,
    selectAllVisible,
    createLabel,
    commitCreate,
    handle,
  };
}

export type ComboboxState<V extends OptionValue> = ReturnType<typeof useCombobox<V>>;
