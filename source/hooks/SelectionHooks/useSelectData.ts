import { useCallback, useEffect, useMemo, useRef } from "react";
import { getSourceData } from "../../utils";
import type { ItemsProps } from "./type";

export const useSelectData = (
  items: ItemsProps[] | string | undefined,
  setWorkingDataSource: (data: ItemsProps[]) => void,
  workingDataSource: ItemsProps[],
  searchTerm: string,
  lazy: boolean,
  selectedItem?: string
) => {
  // Only the newest request may set the items: an older, slower response
  // arriving late would otherwise overwrite newer data.
  const pending = useRef<AbortController | null>(null);

  const getSelectItems = useCallback(
    async (itemsApi: string) => {
      pending.current?.abort();
      const controller = typeof AbortController === "undefined" ? null : new AbortController();
      pending.current = controller;
      const itemsData = await getSourceData(itemsApi, controller ? { signal: controller.signal } : undefined);
      if (controller?.signal.aborted) return;
      if (pending.current === controller) pending.current = null;
      // A failed request or an unexpected shape leaves an empty list, not a crash.
      setWorkingDataSource(Array.isArray(itemsData?.sourcedata) ? itemsData.sourcedata : []);
    },
    [setWorkingDataSource]
  );

  useEffect(() => {
    // New items replace whatever an earlier URL is still fetching.
    pending.current?.abort();
    if (!items) {
      setWorkingDataSource([]);
      return;
    }

    if (Array.isArray(items)) {
      setWorkingDataSource(items);
    } else if (typeof items === "string") {
      getSelectItems(items);
    }
  }, [items, getSelectItems, setWorkingDataSource]);

  // Unmounting drops whatever is still in flight.
  useEffect(() => () => pending.current?.abort(), []);

  const selectedDisplay = useMemo(() => {
    if (selectedItem && workingDataSource.length > 0) {
      const selected = workingDataSource.find(
        (item) => item.value === selectedItem
      );
      return selected ? selected.label : "";
    }
    return "";
  }, [selectedItem, workingDataSource]);

  const filteredItems = useMemo(() => {
    if (!searchTerm || lazy) return workingDataSource;
    const needle = searchTerm.toLowerCase();
    return workingDataSource.filter((item) =>
      Object.values(item).some(
        // Data from an API can hold null or undefined fields; skip them.
        (val) => val != null && String(val).toLowerCase().includes(needle)
      )
    );
  }, [workingDataSource, searchTerm, lazy]);

  return {
    getSelectItems,
    selectedDisplay,
    filteredItems,
  };
};
