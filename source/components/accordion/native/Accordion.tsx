import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  LayoutAnimation,
  Pressable,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { ChevronGlyph } from "../../shared/native/glyphs";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { useReducedMotion } from "../../shared/native/motion";
import { renderText } from "../../shared/native/primitives";
import { useControllableState } from "../../shared/react/useControllableState";
import { normalizeOpen, toggleOpen } from "../core/open";
import type {
  AccordionIconPosition,
  AccordionItemData,
  AccordionSize,
  AccordionVariant,
} from "../core/types";
import { AccordionContext, useAccordionContext, type AccordionContextValue } from "./context";

const PAD: Record<AccordionSize, { x: number; y: number; font: number }> = {
  sm: { x: 10, y: 10, font: -1 },
  md: { x: 14, y: 14, font: 0 },
  lg: { x: 18, y: 18, font: 1 },
};

const themed = createThemedStyles((t) => ({
  root: { gap: 8 },
  contained: { gap: 0, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, overflow: "hidden" },
  plain: { gap: 0 },
  item: { borderWidth: 1, borderColor: t.border, borderRadius: t.radius, backgroundColor: t.bg, overflow: "hidden" },
  // Contained and plain: dividers. -1 margin tucks the last divider under the
  // container's own border (contained) or keeps rows flush (plain).
  divided: { borderWidth: 0, borderBottomWidth: 1, borderRadius: 0, marginBottom: -1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: t.touchTarget },
  heading: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontWeight: "600", color: t.fg },
  description: { color: t.muted },
  content: { overflow: "hidden" },
  // In the flow: the content sizes to it when open, and clips it at height 0.
  body: {},
  text: { color: t.fg, lineHeight: t.fontSize * 1.45 },
}));

export type AccordionSlot = "root";
export type AccordionItemSlot = "root" | "header" | "title" | "description" | "icon" | "content" | "body";

export interface AccordionProps {
  /** Open panels, by value (controlled). */
  value?: string[];
  /** Panels open to begin with, when you are not controlling `value`. */
  defaultValue?: string[];
  /** The open panels after a change, always an array even with `multiple` off. */
  onValueChange?(value: string[]): void;
  /** Render these panels, or pass `<AccordionItem>` children. */
  items?: readonly AccordionItemData[];
  children?: ReactNode;
  /** Allow more than one panel open at a time. Default false. */
  multiple?: boolean;
  /** Allow the open panel to be closed again. Default true. */
  collapsible?: boolean;
  /** Default `separated`. */
  variant?: AccordionVariant;
  /** Default `md`. */
  size?: AccordionSize;
  /** Which side the chevron sits on. Default `end`. */
  iconPosition?: AccordionIconPosition;
  /**
   * Mount every panel from the start. By default a panel mounts the first
   * time it opens and then stays mounted, so its state survives closing.
   * Default false. (On the web, closed `<details>` content is always in the
   * page, so find-in-page can reach it.)
   */
  keepMounted?: boolean;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<Record<AccordionSlot, StyleProp<ViewStyle>>>;
}

/**
 * Sections that open one at a time. The open/close rules are the web's
 * `toggleOpen` / `normalizeOpen`, unchanged.
 */
export function Accordion(props: AccordionProps) {
  const {
    value,
    defaultValue,
    onValueChange,
    items,
    children,
    multiple = false,
    collapsible = true,
    variant = "separated",
    size = "md",
    iconPosition = "end",
    keepMounted = false,
    style,
    styles: slots,
  } = props;
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const reduced = useReducedMotion();

  const [open, setOpen] = useControllableState<string[]>(value, defaultValue ?? []);
  const settings = useMemo(() => ({ multiple, collapsible }), [multiple, collapsible]);
  const effective = useMemo(
    () => normalizeOpen(open, items ? items.map((item) => item.value) : open, settings),
    [open, items, settings],
  );

  const toggle = useCallback(
    (item: string) => {
      const next = toggleOpen(effective, item, settings);
      // The panels' heights change in the next commit; LayoutAnimation runs
      // that resize on the UI thread, so it stays smooth while a panel mounts.
      // Only "update": views created or removed in the same commit should not fade.
      if (!reduced) {
        LayoutAnimation.configureNext({
          duration: 200,
          update: { type: LayoutAnimation.Types.easeInEaseOut },
        });
      }
      setOpen(next);
      onValueChange?.(next);
    },
    [effective, settings, setOpen, onValueChange, reduced],
  );

  const context = useMemo<AccordionContextValue>(
    () => ({ open: effective, toggle, size, variant, iconPosition, keepMounted }),
    [effective, toggle, size, variant, iconPosition, keepMounted],
  );

  return (
    <View
      style={[s.root, variant === "contained" && s.contained, variant === "plain" && s.plain, slots?.root, style]}
    >
      <AccordionContext value={context}>
        {items
          ? items.map((item) => (
              <AccordionItem
                key={item.value}
                value={item.value}
                title={item.title}
                description={item.description}
                disabled={item.disabled}
              >
                {item.content}
              </AccordionItem>
            ))
          : children}
      </AccordionContext>
    </View>
  );
}

/** What `style` callbacks receive: the native stand-in for `open` / `data-disabled`. */
export interface AccordionItemStyleState {
  open: boolean;
  disabled: boolean;
  pressed: boolean;
}

export interface AccordionItemProps {
  /** Identifies the panel in the accordion's value. */
  value: string;
  title: ReactNode;
  /** A second line under the title. */
  description?: ReactNode;
  children?: ReactNode;
  /** Something at the end of the header: a badge, a count. */
  meta?: ReactNode;
  /** Replaces the chevron. */
  icon?: ReactNode;
  disabled?: boolean;
  /** Overrides `keepMounted` on `Accordion` for this panel. */
  keepMounted?: boolean;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    header: StyleProp<ViewStyle> | ((state: AccordionItemStyleState) => StyleProp<ViewStyle>);
    title: StyleProp<TextStyle>;
    description: StyleProp<TextStyle>;
    icon: StyleProp<ViewStyle>;
    content: StyleProp<ViewStyle>;
    body: StyleProp<ViewStyle>;
  }>;
}

/** One section. Its open state belongs to the accordion. */
export function AccordionItem(props: AccordionItemProps) {
  const {
    value,
    title,
    description,
    children,
    meta,
    icon,
    disabled = false,
    keepMounted,
    style,
    styles: slots,
  } = props;
  const context = useAccordionContext("AccordionItem");
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const reduced = useReducedMotion();
  const id = useId();
  const open = context.open.includes(value);
  const pad = PAD[context.size];
  const fontSize = tokens.fontSize + pad.font;
  const plain = context.variant === "plain";
  const padX = plain ? 0 : pad.x;

  // A panel is mounted once it has been opened, and stays mounted after, so
  // a long list of closed panels costs nothing until someone looks.
  const [visited, setVisited] = useState(open);
  if (open && !visited) setVisited(true);
  const mounted = open || visited || (keepMounted ?? context.keepMounted ?? false);

  // The height change is animated by the accordion's LayoutAnimation (UI
  // thread); only the chevron turns here, on the native driver.
  const turn = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    const to = open ? 1 : 0;
    if (reduced) {
      turn.setValue(to);
      return;
    }
    const animation = Animated.timing(turn, { toValue: to, duration: 200, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [open, reduced, turn]);

  const chevron = (
    <Animated.View
      aria-hidden
      style={[
        { transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] },
        slots?.icon,
      ]}
    >
      {icon ?? <ChevronGlyph size={16} color={tokens.muted} />}
    </Animated.View>
  );

  return (
    <View
      style={[s.item, context.variant !== "separated" && s.divided, slots?.root, style]}
    >
      <Pressable
        nativeID={`${id}-header`}
        role="button"
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onPress={() => context.toggle(value)}
        style={({ pressed }) => {
          const state = { open, disabled, pressed };
          const custom = typeof slots?.header === "function" ? slots.header(state) : slots?.header;
          return [
            s.header,
            { paddingHorizontal: padX, paddingVertical: pad.y, opacity: disabled ? 0.5 : 1 },
            pressed && !plain && { backgroundColor: tokens.hover },
            custom,
          ];
        }}
      >
        {context.iconPosition === "start" && chevron}
        <View style={s.heading}>
          {renderText(title, [s.title, { fontSize }, slots?.title])}
          {description !== undefined &&
            description !== null &&
            renderText(description, [s.description, { fontSize: fontSize - 1 }, slots?.description])}
        </View>
        {meta}
        {context.iconPosition === "end" && chevron}
      </Pressable>

      <View
        nativeID={`${id}-content`}
        role="region"
        aria-labelledby={`${id}-header`}
        // Closed content that stays mounted (its state survives) leaves the
        // accessibility tree, as a closed <details> does.
        aria-hidden={!open}
        importantForAccessibility={open ? "auto" : "no-hide-descendants"}
        style={[
          s.content,
          !open && { height: 0 },
          slots?.content,
        ]}
      >
        {mounted && (
          <View
            style={[s.body, { paddingHorizontal: padX, paddingBottom: pad.y }, slots?.body]}
          >
            {renderText(children, [s.text, { fontSize }])}
          </View>
        )}
      </View>
    </View>
  );
}
