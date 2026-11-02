import { useCallback, useState } from "react";

/** The panel's open state, reporting real changes (and only those) to `onOpenChange`. */
export function useOpen(onOpenChange?: (open: boolean) => void) {
  const [open, setOpenState] = useState(false);
  const setOpen = useCallback(
    (next: boolean) => {
      if (next === open) return;
      setOpenState(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );
  return [open, setOpen] as const;
}
