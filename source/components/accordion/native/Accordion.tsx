import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Animated,
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
  body: { position: "absolute", left: 0, right: 0, top: 0 },
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
    style,
    styles: slots,
  } = props;
  const { tokens } = useKitTheme();
  const s = themed(tokens);

  const [open, setOpen] = useControllableState<string[]>(value, defaultValue ?? []);
  const settings = useMemo(() => ({ multiple, collapsible }), [multiple, collapsible]);
  const effective = useMemo(
    () => normalizeOpen(open, items ? items.map((item) => item.value) : open, settings),
    [open, items, settings],
  );

  const toggle = useCallback(
    (item: string) => {
      const next = toggleOpen(effective, item, settings);
      setOpen(next);
      onValueChange?.(next);
    },
    [effective, settings, setOpen, onValueChange],
  );

  const context = useMemo<AccordionContextValue>(
    () => ({ open: effective, toggle, size, variant, iconPosition }),
    [effective, toggle, size, variant, iconPosition],
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
  const { value, title, description, children, meta, icon, disabled = false, style, styles: slots } = props;
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

  // Height animates from 0 to the body's measured height. Height cannot use
  // the native driver; one value per item, so the JS thread copes.
  const [measured, setMeasured] = useState(0);
  const height = useRef(new Animated.Value(open ? 1 : 0)).current;
  const turn = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    const to = open ? 1 : 0;
    if (reduced) {
      height.setValue(to);
      turn.setValue(to);
      return;
    }
    const animation = Animated.parallel([
      Animated.timing(height, { toValue: to, duration: 200, useNativeDriver: false }),
      Animated.timing(turn, { toValue: to, duration: 200, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [open, reduced, height, turn]);

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

      <Animated.View
        nativeID={`${id}-content`}
        role="region"
        aria-labelledby={`${id}-header`}
        // Closed content stays mounted (state survives) but leaves the
        // accessibility tree, as a closed <details> does.
        aria-hidden={!open}
        importantForAccessibility={open ? "auto" : "no-hide-descendants"}
        style={[
          s.content,
          { height: height.interpolate({ inputRange: [0, 1], outputRange: [0, measured] }) },
          slots?.content,
        ]}
      >
        <View
          style={[s.body, { paddingHorizontal: padX, paddingBottom: pad.y }, slots?.body]}
          onLayout={(event) => setMeasured(event.nativeEvent.layout.height)}
        >
          {renderText(children, [s.text, { fontSize }])}
        </View>
      </Animated.View>
    </View>
  );
}
