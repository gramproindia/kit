/*
 * The overlay host behind KitProvider, kept apart from KitProvider.tsx (which
 * imports react-native) so it can be tested in Node.
 *
 * Why layers: every Kit overlay is an RN `Modal`, a separate native window
 * above the app. Portal entries (toasts, tooltips) rendered in the app's own
 * view tree would sit under any open overlay. So each open Overlay claims a
 * layer, and the newest claim (the top-most window) renders the entries
 * inside its Modal; the provider's own outlet renders them only when no
 * overlay is open. One outlet at a time, so an entry never renders twice.
 */

export type PortalEntry<Node> = { key: number; node: Node };

export interface PortalHost<Node> {
  mount(node: Node): number;
  update(key: number, node: Node): void;
  unmount(key: number): void;
  subscribe(listener: () => void): () => void;
  /** The current entries; a new array only when they change. */
  entries(): readonly PortalEntry<Node>[];
  /** The top-most claimed layer, or null when no overlay is open. */
  top(): object | null;
  /** Claim the top layer for an open overlay; `release` gives it back. */
  claimLayer(): { layer: object; release(): void };
}

export function createPortalHost<Node>(): PortalHost<Node> {
  let list: readonly PortalEntry<Node>[] = [];
  let layers: object[] = [];
  let nextKey = 0;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());

  const claimLayer = () => {
    const layer = {};
    layers = [...layers, layer];
    emit();
    return {
      layer,
      release() {
        if (!layers.includes(layer)) return;
        layers = layers.filter((other) => other !== layer);
        emit();
      },
    };
  };

  return {
    mount(node) {
      const key = nextKey++;
      list = [...list, { key, node }];
      emit();
      return key;
    },
    update(key, node) {
      if (!list.some((entry) => entry.key === key)) return;
      list = list.map((entry) => (entry.key === key ? { key, node } : entry));
      emit();
    },
    unmount(key) {
      if (!list.some((entry) => entry.key === key)) return;
      list = list.filter((entry) => entry.key !== key);
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    entries: () => list,
    top: () => layers[layers.length - 1] ?? null,
    claimLayer,
  };
}

function shallowEqual(a: object | undefined, b: object | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/**
 * Two theme overrides that would resolve to the same tokens: equal values, one
 * level down for `{ light, dark }`. Lets KitProvider keep its tokens object
 * when the app passes a fresh inline `theme={{ … }}` on every render.
 */
export function sameTheme(a: object | undefined, b: object | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => {
    const x = (a as Record<string, unknown>)[key];
    const y = (b as Record<string, unknown>)[key];
    if (Object.is(x, y)) return true;
    return (
      typeof x === "object" && x !== null && typeof y === "object" && y !== null && shallowEqual(x, y)
    );
  });
}

/** Same keys, same values. Used for the `icons` override map. */
export { shallowEqual as sameIcons };
