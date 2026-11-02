import { Fragment, useMemo, useRef, useState, type ComponentRef, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { ChevronGlyph } from "../../shared/native/glyphs";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { defaultBreadcrumbText } from "../core/locale";
import { collapseItems } from "../core/trail";
import type { BreadcrumbItem, BreadcrumbLocaleText } from "../core/types";

export type BreadcrumbSize = "sm" | "md" | "lg";

export interface BreadcrumbProps {
  /** From the top level to the current page. The last item is the current page. */
  items: readonly BreadcrumbItem[];
  /**
   * Called when a crumb with an `href` is pressed: navigate with your router,
   * e.g. `(item) => router.push(item.href!)`. A crumb's own `onClick` runs too.
   */
  onNavigate?(item: BreadcrumbItem, index: number): void;
  /** Between crumbs. Default a chevron. */
  separator?: ReactNode;
  /** Collapse the middle of the trail when it has more crumbs than this. */
  maxItems?: number;
  /** Crumbs kept before the collapsed part. Default 1. */
  itemsBeforeCollapse?: number;
  /** Crumbs kept after the collapsed part. Default 1. */
  itemsAfterCollapse?: number;
  /** Default `md`. */
  size?: BreadcrumbSize;
  "aria-label"?: string;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    list: StyleProp<ViewStyle>;
    item: StyleProp<ViewStyle>;
    link: StyleProp<TextStyle>;
    current: StyleProp<TextStyle>;
    separator: StyleProp<ViewStyle>;
    ellipsis: StyleProp<ViewStyle>;
  }>;
  localeText?: Partial<BreadcrumbLocaleText>;
}

const FONT: Record<BreadcrumbSize, number> = { sm: -2, md: -1, lg: 0 };

const themed = createThemedStyles((t) => ({
  list: { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 2 },
  item: { flexDirection: "row", alignItems: "center", gap: 2 },
  crumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 6,
    borderRadius: Math.max(4, t.radius - 2),
  },
  link: { color: t.muted },
  current: { color: t.fg, fontWeight: "600" },
  separator: { paddingHorizontal: 2 },
  ellipsis: { minWidth: 36, minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  ellipsisText: { color: t.muted, fontWeight: "700" },
}));

/**
 * Where the current screen sits in the app's hierarchy. One row that scrolls
 * sideways when it is too long, kept scrolled to the current crumb.
 */
export function Breadcrumb(props: BreadcrumbProps) {
  const {
    items,
    onNavigate,
    separator,
    maxItems,
    itemsBeforeCollapse = 1,
    itemsAfterCollapse = 1,
    size = "md",
    "aria-label": ariaLabel,
    style,
    styles: slots,
    localeText,
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultBreadcrumbText, ...localeText }), [localeText]);
  const [expanded, setExpanded] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const fontSize = tokens.fontSize + FONT[size];

  const slotsList = expanded
    ? collapseItems(items.length)
    : collapseItems(items.length, maxItems, itemsBeforeCollapse, itemsAfterCollapse);
  const lastIndex = items.length - 1;

  const renderItem = (item: BreadcrumbItem, index: number) => {
    const current = index === lastIndex;
    const label =
      typeof item.label === "string" || typeof item.label === "number" ? (
        <Text
          numberOfLines={1}
          style={[{ fontSize }, current ? s.current : s.link, current ? slots?.current : slots?.link]}
        >
          {item.label}
        </Text>
      ) : (
        item.label
      );
    const content = (
      <>
        {item.icon !== undefined && <View aria-hidden>{item.icon}</View>}
        {label}
      </>
    );
    const pressable = !current && (item.href !== undefined || item.onClick !== undefined);
    if (!pressable) {
      return (
        <View
          style={s.crumb}
          // The current page: React Native has no aria-current, so it is announced as selected.
          accessibilityState={current ? { selected: true } : undefined}
          accessible
        >
          {content}
        </View>
      );
    }
    return (
      <Pressable
        role="link"
        onPress={() => {
          item.onClick?.();
          if (item.href !== undefined) onNavigate?.(item, index);
        }}
        style={({ pressed }) => [s.crumb, pressed && { backgroundColor: tokens.hover }]}
      >
        {content}
      </Pressable>
    );
  };

  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      role="navigation"
      aria-label={ariaLabel ?? text.label}
      style={style}
      // Keep the current page in view when the trail is longer than the screen.
      onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
    >
      <View role="list" style={[s.list, slots?.list]}>
        {slotsList.map((slot, position) => (
          <Fragment key={slot.kind === "item" ? slot.index : "ellipsis"}>
            {position > 0 && (
              <View style={[s.separator, slots?.separator]} aria-hidden>
                {separator ?? <ChevronGlyph direction="right" size={12} color={tokens.muted} />}
              </View>
            )}
            <View role="listitem" style={[s.item, slots?.item]}>
              {slot.kind === "item" ? (
                renderItem(items[slot.index], slot.index)
              ) : (
                <Pressable
                  role="button"
                  aria-label={text.showMore(String(slot.hidden.length))}
                  onPress={() => setExpanded(true)}
                  style={({ pressed }) => [s.ellipsis, pressed && { backgroundColor: tokens.hover }, slots?.ellipsis]}
                >
                  <Text style={[s.ellipsisText, { fontSize }]}>…</Text>
                </Pressable>
              )}
            </View>
          </Fragment>
        ))}
      </View>
    </ScrollView>
  );
}
