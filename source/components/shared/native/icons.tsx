import { createContext, useContext, type ReactNode } from "react";
import { View } from "react-native";

/**
 * Kit draws its own small marks (chevrons, ×, checks, a magnifier…) with
 * Views, so it needs no icon or SVG library. An app that uses an icon pack can
 * swap any of them through `<KitProvider icons={…}>`: each entry renders the
 * mark at the size and colour Kit asks for. Marks with no entry keep Kit's
 * drawing.
 */
export interface KitIconProps {
  size: number;
  color: string;
  /** Only for `chevron`: which way it points. */
  direction?: "up" | "down" | "left" | "right";
}

export type KitIconRender = (props: KitIconProps) => ReactNode;

export interface KitIcons {
  /** Disclosure, select fields, month paging, list rows, back buttons. */
  chevron: KitIconRender;
  /** Clear, dismiss and close buttons. */
  close: KitIconRender;
  /** Selected rows in menus and pickers, segmented buttons. */
  check: KitIconRender;
  /** SearchBar. */
  search: KitIconRender;
  /** Input's password reveal button, while hidden. */
  eye: KitIconRender;
  /** Input's password reveal button, while shown. */
  eyeOff: KitIconRender;
  /** Date picker fields. */
  calendar: KitIconRender;
  /** NumberInput's + stepper. */
  plus: KitIconRender;
  /** NumberInput's − stepper. */
  minus: KitIconRender;
  /** FileUploader's drop zone. */
  upload: KitIconRender;
  /** FileUploader's pause button. */
  pause: KitIconRender;
  /** FileUploader's resume button. */
  play: KitIconRender;
  /** FileUploader's retry button. */
  retry: KitIconRender;
}

export type KitIconName = keyof KitIcons;

const NO_ICONS: Partial<KitIcons> = {};

export const KitIconsContext = createContext<Partial<KitIcons>>(NO_ICONS);

/** The icon overrides given to `KitProvider`; empty without one. */
export function useKitIcons(): Partial<KitIcons> {
  return useContext(KitIconsContext);
}

export { mergeIcons } from "./icons-merge";

/**
 * The app's icon for `name` if it gave one, otherwise `fallback` (Kit's
 * drawing). Wrapped so screen readers skip it: the control carries the label.
 */
export function KitIcon({
  name,
  size,
  color,
  direction,
  fallback,
}: KitIconProps & { name: KitIconName; fallback: ReactNode }) {
  const render = useKitIcons()[name];
  if (!render) return <>{fallback}</>;
  // A fixed, centred box: icon fonts and SVG packs size their glyphs
  // differently, and the layout around the mark should not move with them.
  return (
    <View
      aria-hidden
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      {render({ size, color, direction })}
    </View>
  );
}
