import type { KitIcons } from "./icons";

/**
 * Overrides layered over the ones from an outer KitProvider, so a nested
 * provider can change one mark and keep the rest. Kept apart from icons.tsx,
 * which imports react-native, so it can be tested in Node.
 */
export function mergeIcons(outer: Partial<KitIcons>, inner?: Partial<KitIcons>): Partial<KitIcons> {
  if (!inner) return outer;
  return { ...outer, ...inner };
}
