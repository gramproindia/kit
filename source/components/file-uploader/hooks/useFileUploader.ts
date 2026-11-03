import { useEffect, useState, useSyncExternalStore } from "react";
import { createUploaderStore, type UploaderConfig, type UploaderStore } from "../core/store";
import type { UploaderSnapshot } from "../core/types";

export interface UseFileUploaderResult extends UploaderSnapshot {
  store: UploaderStore;
}

/**
 * An upload store that lives as long as the component, always using the latest
 * config and callbacks. Exported for building a different UI on the same engine.
 */
export function useFileUploader(config: UploaderConfig = {}): UseFileUploaderResult {
  const [store] = useState(() => createUploaderStore(config));

  // No dependency list on purpose: callbacks and limits stay current on every render.
  useEffect(() => {
    store.configure(config);
  });

  // Nothing should keep uploading for a component that is gone, and the app
  // shouldn't hear about uploads it no longer shows. The configure effect above
  // puts the callbacks back if React mounts the component again (Strict Mode).
  useEffect(
    () => () => {
      store.configure({
        onChange: undefined,
        onRejected: undefined,
        onFileSuccess: undefined,
        onFileError: undefined,
        onComplete: undefined,
      });
      store.cancel();
    },
    [store],
  );

  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return { store, ...snapshot };
}
