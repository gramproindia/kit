import {
  cloneElement,
  isValidElement,
  useCallback,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Anchored, usePresentation } from "../../shared/native/Anchored";
import { ChevronGlyph } from "../../shared/native/glyphs";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { Sheet } from "../../shared/native/Sheet";
import { useControllableState } from "../../shared/react/useControllableState";
import { defaultMenuText } from "../core/locale";
import type { MenuAlign, MenuCloseReason, MenuLocaleText, MenuSide } from "../core/types";
import { MenuContext, useMenuContext, type MenuContextValue, type MenuStyles, type SubmenuEntry } from "./context";
import { menuStyles, MenuRow } from "./items";

export interface MenuHandle {
  open(): void;
  close(): void;
}

type TriggerProps = {
  ref?: Ref<unknown>;
  onPress?(event: GestureResponderEvent): void;
  [prop: string]: unknown;
};

export interface MenuProps {
  /**
   * The element that opens the menu, cloned with a ref (to measure where it
   * is) and an `onPress`. Any Kit button, or any Pressable, works.
   */
  trigger: ReactElement<TriggerProps>;
  children: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Open to begin with, when you are not controlling `open`. */
  defaultOpen?: boolean;
  /**
   * `reason` is `outside` (tap outside), `escape` (Android back),
   * `trigger`, `select` or `api`, and undefined when opening.
   */
  onOpenChange?(open: boolean, reason?: MenuCloseReason): void;
  /** Names the menu for screen readers. Defaults to the locale text. */
  label?: string;
  /** Default `bottom`. Popover presentation only. */
  side?: MenuSide;
  /** Default `start`. Popover presentation only. */
  align?: MenuAlign;
  /** Distance from the trigger. Default 4. */
  gap?: number;
  /** Close the menu when an item is chosen. Default true. */
  closeOnSelect?: boolean;
  /**
   * `auto` (default): an action sheet on phones, a popover on tablets.
   * Or force `sheet` or `popover`.
   */
  presentation?: "auto" | "sheet" | "popover";
  /** The list's style. */
  style?: StyleProp<ViewStyle>;
  styles?: MenuStyles;
  localeText?: Partial<MenuLocaleText>;
  ref?: Ref<MenuHandle>;
}

const themed = createThemedStyles((t) => ({
  back: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: t.touchTarget, paddingHorizontal: 12 },
  backText: { fontSize: t.fontSize + 1, fontWeight: "700", color: t.fg, flexShrink: 1 },
  divider: { height: 1, backgroundColor: t.border },
}));

function composeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(value);
      else if (ref) (ref as { current: T | null }).current = value;
    }
  };
}

/**
 * A menu of commands. On a phone it opens as an action sheet with large rows,
 * where a submenu replaces the list and a back row returns; on a tablet it is
 * a popover against the trigger, with submenus to the side. Tap outside or
 * press back to close.
 */
export function Menu(props: MenuProps) {
  const {
    ref,
    trigger,
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    label,
    side = "bottom",
    align = "start",
    gap = 4,
    closeOnSelect = true,
    presentation: presentationProp = "auto",
    style,
    styles: slots,
    localeText,
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const list = menuStyles(tokens);
  const text = useMemo(() => ({ ...defaultMenuText, ...localeText }), [localeText]);
  const presentation = usePresentation(presentationProp);
  const anchorRef = useRef<ComponentRef<typeof View>>(null);
  const [open, setOpenState] = useControllableState(openProp, defaultOpen);
  const [stack, setStack] = useState<SubmenuEntry[]>([]);

  const setOpen = useCallback(
    (next: boolean, reason?: MenuCloseReason) => {
      setOpenState(next);
      onOpenChange?.(next, reason);
    },
    [setOpenState, onOpenChange],
  );

  useImperativeHandle(
    ref,
    () => ({ open: () => setOpen(true), close: () => setOpen(false, "api") }),
    [setOpen],
  );

  const context = useMemo<MenuContextValue>(
    () => ({
      close: (reason) => setOpen(false, reason),
      closeOnSelect,
      styles: slots,
      depth: 0,
      presentation,
      push: (entry) => setStack((current) => [...current, entry]),
      refresh: (entry) =>
        setStack((current) => {
          const index = current.findIndex((open) => open.id === entry.id);
          if (index === -1) return current;
          const was = current[index];
          // Same state back means no re-render, which is what ends the loop.
          if (was.label === entry.label && was.children === entry.children) return current;
          return current.map((open, at) => (at === index ? entry : open));
        }),
      text,
    }),
    [setOpen, closeOnSelect, slots, presentation, text],
  );

  if (!isValidElement(trigger)) {
    throw new Error("Menu: `trigger` must be a single React element.");
  }

  const triggerProps = trigger.props;
  const clone = cloneElement(trigger, {
    ref: composeRefs(triggerProps.ref, anchorRef),
    "aria-haspopup": "menu",
    "aria-expanded": open,
    onPress(event: GestureResponderEvent) {
      triggerProps.onPress?.(event);
      if (open) setOpen(false, "trigger");
      else setOpen(true);
    },
  } as Partial<TriggerProps>);

  if (presentation === "sheet") {
    const top = stack[stack.length - 1];
    // Every level stays mounted and only the top one is shown. A submenu's
    // content is rendered from the latest props its MenuSub reported, and the
    // MenuSub can only report them while its own level is still rendered.
    const levels = [
      { key: "root", label: label ?? text.label, children, depth: 0 },
      ...stack.map((entry, index) => ({
        key: entry.id,
        label: typeof entry.label === "string" ? entry.label : undefined,
        children: entry.children,
        depth: index + 1,
      })),
    ];
    return (
      <>
        {clone}
        <Sheet
          open={open}
          onDismiss={() => setOpen(false, "outside")}
          // Android back steps out of a submenu first, then closes like Escape.
          onBack={() => {
            if (stack.length > 0) setStack((current) => current.slice(0, -1));
            else setOpen(false, "escape");
          }}
          onClosed={() => setStack([])}
        >
          {top && (
            <>
              <Pressable
                role="button"
                aria-label={`${text.back}, ${typeof top.label === "string" ? top.label : ""}`}
                onPress={() => setStack((current) => current.slice(0, -1))}
                style={({ pressed }) => [s.back, pressed && { backgroundColor: tokens.hover }]}
              >
                <ChevronGlyph direction="left" size={18} color={tokens.fg} />
                {typeof top.label === "string" ? (
                  <Text style={s.backText} numberOfLines={1}>
                    {top.label}
                  </Text>
                ) : (
                  top.label
                )}
              </Pressable>
              <View style={s.divider} />
            </>
          )}
          <ScrollView>
            {levels.map((level, index) => (
              <SheetLevel key={level.key} context={context} depth={level.depth}>
                <View
                  role="menu"
                  aria-label={level.label}
                  style={[list.sheetList, slots?.list, style, index !== levels.length - 1 && hidden]}
                >
                  {level.children}
                </View>
              </SheetLevel>
            ))}
          </ScrollView>
        </Sheet>
      </>
    );
  }

  return (
    <>
      {clone}
      <Anchored
        open={open}
        onDismiss={() => setOpen(false, "outside")}
        onBack={() => setOpen(false, "escape")}
        anchorRef={anchorRef}
        side={side}
        align={align}
        gap={gap}
        fitHeight
        matchWidth
      >
        <ScrollView>
          <MenuContext value={context}>
            <View role="menu" aria-label={label ?? text.label} style={[list.list, slots?.list, style]}>
              {children}
            </View>
          </MenuContext>
        </ScrollView>
      </Anchored>
    </>
  );
}

const hidden = { display: "none" } as const;

/** One level of a sheet menu, with a context whose depth is stable across renders. */
function SheetLevel({ context, depth, children }: { context: MenuContextValue; depth: number; children: ReactNode }) {
  const value = useMemo(() => (depth === 0 ? context : { ...context, depth }), [context, depth]);
  return <MenuContext value={value}>{children}</MenuContext>;
}

/* ---------------------------------------------------------------- submenus */

export interface MenuSubProps {
  /** The label of the item that opens the submenu. */
  label: ReactNode;
  children: ReactNode;
  /** Drawn before the submenu's label. */
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A nested menu. In a sheet it replaces the list, with a back row; in a
 * popover it opens to the side of its row.
 */
export function MenuSub({ label, children, icon, disabled = false, style }: MenuSubProps) {
  const parent = useMenuContext("MenuSub");
  const id = useId();
  const { tokens } = useKitTheme();
  const list = menuStyles(tokens);
  const [open, setOpen] = useState(false);
  const rowRef = useRef<ComponentRef<typeof View>>(null);
  const context = useMemo(() => ({ ...parent, depth: parent.depth + 1 }), [parent]);
  const name = typeof label === "string" ? parent.text.submenu(label) : undefined;
  const arrow = <ChevronGlyph direction="right" size={14} color={tokens.muted} />;
  const refresh = parent.presentation === "sheet" ? parent.refresh : undefined;

  // In a sheet the open submenu is drawn by the Menu from what was pushed.
  // Re-report this render's children so it never shows stale ticks.
  useLayoutEffect(() => {
    refresh?.({ id, label, children });
  }, [refresh, id, label, children]);

  if (parent.presentation === "sheet") {
    return (
      <MenuRow
        menu={parent}
        role="menuitem"
        disabled={disabled}
        icon={icon}
        label={label}
        trailing={arrow}
        accessibilityLabel={name}
        style={style}
        onPress={() => parent.push?.({ id, label, children })}
      />
    );
  }

  return (
    <>
      <MenuRow
        ref={rowRef}
        menu={parent}
        role="menuitem"
        disabled={disabled}
        icon={icon}
        label={label}
        trailing={arrow}
        accessibilityLabel={name}
        expanded={open}
        style={style}
        onPress={() => setOpen(true)}
      />
      <Anchored
        open={open}
        onDismiss={() => setOpen(false)}
        anchorRef={rowRef}
        side="right"
        align="start"
        gap={2}
        fitHeight
      >
        <ScrollView>
          <MenuContext value={context}>
            <View
              role="menu"
              aria-label={typeof label === "string" ? label : undefined}
              style={[list.list, parent.styles?.list, parent.styles?.submenu]}
            >
              {children}
            </View>
          </MenuContext>
        </ScrollView>
      </Anchored>
    </>
  );
}
