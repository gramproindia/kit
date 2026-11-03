import { useMemo, type ComponentRef, type ReactNode, type Ref } from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { KitIcon } from "../../shared/native/icons";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { renderText } from "../../shared/native/primitives";
import { mix, type KitTokens } from "../../shared/native/theme";
import { formatCount, showCount } from "../core/count";
import { defaultBadgeText } from "../core/locale";
import type { BadgeAppearance, BadgeLocaleText, BadgeSize, BadgeVariant } from "../core/types";

export type BadgeSlot = "root" | "dot" | "icon" | "label";
export type TagSlot = "root" | "icon" | "label" | "remove";

/** Fill, text and border for a variant and appearance — the native `data-*` rules. */
function badgeColors(t: KitTokens, variant: BadgeVariant, appearance: BadgeAppearance) {
  const accent =
    variant === "accent"
      ? t.accent
      : variant === "success"
        ? t.success
        : variant === "warning"
          ? t.warning
          : variant === "danger"
            ? t.danger
            : variant === "info"
              ? t.info
              : t.fg;
  if (appearance === "solid") {
    return variant === "neutral"
      ? { fill: t.fg, ink: t.bg, line: t.fg }
      : { fill: accent, ink: t.accentFg, line: accent };
  }
  const ink = mix(accent, t.fg, 0.15);
  if (appearance === "outline") {
    return { fill: "transparent", ink, line: mix(t.border, accent, 0.4) };
  }
  // soft: a 12% tint of the accent over the page.
  const fill = mix(t.bg, accent, 0.12);
  return { fill, ink, line: fill };
}

const themed = createThemedStyles((t) => ({
  root: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    overflow: "hidden",
  },
  md: { height: 22, paddingHorizontal: 8 },
  sm: { height: 18, paddingHorizontal: 6 },
  count: { justifyContent: "center", paddingHorizontal: 5 },
  label: { fontWeight: "500", fontVariant: ["tabular-nums"] },
  labelMd: { fontSize: t.fontSize - 2 },
  labelSm: { fontSize: 11 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  icon: { alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.6 },
  remove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  xBar: { position: "absolute", width: 10, height: 1.5, borderRadius: 1 },
}));

export interface BadgeProps extends Omit<ViewProps, "children" | "style"> {
  children?: ReactNode;
  /** Default `neutral`. */
  variant?: BadgeVariant;
  /** Default `soft`. */
  appearance?: BadgeAppearance;
  /** Default `md`. */
  size?: BadgeSize;
  /** A number instead of children. Above `max` it reads "99+". */
  count?: number;
  /** Where the count stops. Default 99. */
  max?: number;
  /** Show a count of zero. Default false: an empty counter is noise. */
  showZero?: boolean;
  /** Format the number, e.g. with `Intl.NumberFormat`. */
  formatValue?(value: number): string;
  /** A small filled circle before the label, for a status. */
  dot?: boolean;
  /** An icon before the label, in place of `dot`. */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    dot: StyleProp<ViewStyle>;
    icon: StyleProp<ViewStyle>;
    label: StyleProp<TextStyle>;
  }>;
  ref?: Ref<ComponentRef<typeof View>>;
}

/**
 * A short, static label: a status, a category, a count. Text, not a control —
 * use **Tag** for something removable and **Button** for something pressable.
 */
export function Badge(props: BadgeProps) {
  const {
    ref,
    children,
    variant = "neutral",
    appearance = "soft",
    size = "md",
    count,
    max = 99,
    showZero = false,
    formatValue,
    dot = false,
    icon,
    style,
    styles: slots,
    ...rest
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const counted = count !== undefined;
  if (counted && !showCount(count, showZero)) return null;
  const label = counted ? formatCount(count, max, formatValue) : null;
  const c = badgeColors(tokens, variant, appearance);
  const textStyle = [s.label, size === "sm" ? s.labelSm : s.labelMd, { color: c.ink }, slots?.label];

  return (
    <View
      {...rest}
      ref={ref}
      // "99+" read aloud is a guess at a number; the spoken label says what it means.
      aria-label={label?.spoken ?? rest["aria-label"]}
      style={[
        s.root,
        size === "sm" ? s.sm : s.md,
        counted && s.count,
        counted && { minWidth: size === "sm" ? 18 : 22 },
        { backgroundColor: c.fill, borderColor: c.line },
        slots?.root,
        style,
      ]}
    >
      {dot && <View style={[s.dot, { backgroundColor: c.ink }, slots?.dot]} aria-hidden />}
      {icon && (
        <View style={[s.icon, slots?.icon]} aria-hidden>
          {icon}
        </View>
      )}
      {label ? (
        <Text style={textStyle} numberOfLines={1}>
          {label.text}
        </Text>
      ) : (
        renderText(children, textStyle, 1)
      )}
    </View>
  );
}

export interface TagProps extends Omit<ViewProps, "children" | "style"> {
  children?: ReactNode;
  variant?: BadgeVariant;
  appearance?: BadgeAppearance;
  size?: BadgeSize;
  /** An icon before the label. */
  icon?: ReactNode;
  /** Show a remove button. Without it a Tag is a Badge with a bit more padding. */
  onRemove?(): void;
  /** Names the remove button when the tag's own text is not a plain string. */
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    icon: StyleProp<ViewStyle>;
    label: StyleProp<TextStyle>;
    remove: StyleProp<ViewStyle>;
  }>;
  localeText?: Partial<BadgeLocaleText>;
  ref?: Ref<ComponentRef<typeof View>>;
}

/**
 * A chip the user can take off: a filter, a recipient, a selected value. The
 * remove button carries the tag's text in its name ("Remove Berlin").
 */
export function Tag(props: TagProps) {
  const {
    ref,
    children,
    variant = "neutral",
    appearance = "soft",
    size = "md",
    icon,
    onRemove,
    label,
    disabled = false,
    style,
    styles: slots,
    localeText,
    ...rest
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultBadgeText, ...localeText }), [localeText]);
  const name = label ?? (typeof children === "string" ? children : "");
  const c = badgeColors(tokens, variant, appearance);
  const textStyle = [s.label, size === "sm" ? s.labelSm : s.labelMd, { color: c.ink }, slots?.label];

  return (
    <View
      {...rest}
      ref={ref}
      aria-disabled={disabled || undefined}
      style={[
        s.root,
        size === "sm" ? s.sm : s.md,
        onRemove && { paddingEnd: 3 },
        { backgroundColor: c.fill, borderColor: c.line },
        disabled && s.disabled,
        slots?.root,
        style,
      ]}
    >
      {icon && (
        <View style={[s.icon, slots?.icon]} aria-hidden>
          {icon}
        </View>
      )}
      {renderText(children, textStyle, 1)}
      {onRemove && (
        <Pressable
          role="button"
          aria-label={text.remove(name)}
          aria-disabled={disabled || undefined}
          disabled={disabled}
          onPress={onRemove}
          // An 18dp circle is too small to hit; the slop makes it a fair target.
          hitSlop={12}
          style={({ pressed }) => [
            s.remove,
            pressed && { backgroundColor: mix(c.fill, c.ink, 0.18) },
            slots?.remove,
          ]}
        >
          <KitIcon
            name="close"
            size={12}
            color={c.ink}
            fallback={
              <>
                <View style={[s.xBar, { backgroundColor: c.ink, transform: [{ rotate: "45deg" }] }]} />
                <View style={[s.xBar, { backgroundColor: c.ink, transform: [{ rotate: "-45deg" }] }]} />
              </>
            }
          />
        </Pressable>
      )}
    </View>
  );
}
