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
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { renderText } from "../../shared/native/primitives";
import { mix, type KitTokens } from "../../shared/native/theme";
import { liveness } from "../core/live";
import { defaultAlertText } from "../core/locale";
import type { AlertLocaleText, AlertSize, AlertVariant } from "../core/types";

export type AlertSlot = "root" | "icon" | "content" | "title" | "description" | "actions" | "dismiss";

export interface AlertProps extends Omit<ViewProps, "children" | "style" | "role"> {
  /** Default `info`. */
  variant?: AlertVariant;
  /** Default `md`. */
  size?: AlertSize;
  title?: ReactNode;
  /** The message. `children` works too. */
  description?: ReactNode;
  children?: ReactNode;
  /** Replace the variant's glyph, or pass `false` for none. */
  icon?: ReactNode | false;
  /** Buttons under the message: "Try again", "Go to billing". */
  actions?: ReactNode;
  /** Show a close button. The alert does not hide itself; remove it in the handler. */
  onDismiss?(): void;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    icon: StyleProp<ViewStyle>;
    content: StyleProp<ViewStyle>;
    title: StyleProp<TextStyle>;
    description: StyleProp<TextStyle>;
    actions: StyleProp<ViewStyle>;
    dismiss: StyleProp<ViewStyle>;
  }>;
  localeText?: Partial<AlertLocaleText>;
  ref?: Ref<ComponentRef<typeof View>>;
}

function accentOf(t: KitTokens, variant: AlertVariant): string {
  switch (variant) {
    case "success":
      return t.success;
    case "warning":
      return t.warning;
    case "danger":
      return t.danger;
    case "neutral":
      return t.muted;
    default:
      return t.info;
  }
}

/** A glyph per variant, so colour is never the only signal: i, ✓, !, ! in a circle. */
function VariantGlyph({ variant, color, size }: { variant: AlertVariant; color: string; size: number }) {
  const mark = variant === "success" ? "✓" : variant === "warning" || variant === "danger" ? "!" : "i";
  const triangle = variant === "warning";
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: triangle ? 3 : size / 2,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
        transform: triangle ? [{ rotate: "45deg" }] : undefined,
      }}
    >
      <Text
        style={{
          color,
          fontSize: size * 0.62,
          lineHeight: size * 0.8,
          fontWeight: "800",
          transform: triangle ? [{ rotate: "-45deg" }] : undefined,
        }}
      >
        {mark}
      </Text>
    </View>
  );
}

const themed = createThemedStyles((t) => ({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderStartWidth: 3,
    borderColor: t.border,
    borderRadius: t.radius,
  },
  md: { gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  sm: { gap: 8, paddingVertical: 8, paddingHorizontal: 10 },
  icon: { marginTop: 2 },
  content: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontWeight: "600", color: t.fg },
  description: { color: t.fg },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 8 },
  dismiss: {
    width: 24,
    height: 24,
    marginTop: -2,
    marginEnd: -4,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  xBar: { position: "absolute", width: 12, height: 1.5, borderRadius: 1, backgroundColor: t.muted },
}));

/**
 * A message that stays in the page: a trial ending, a read-only record, the
 * summary above a form that failed validation. Use a Dialog for a decision and
 * a Toast for something that already happened.
 */
export function Alert(props: AlertProps) {
  const {
    ref,
    variant = "info",
    size = "md",
    title,
    description,
    children,
    icon,
    actions,
    onDismiss,
    style,
    styles: slots,
    localeText,
    ...rest
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultAlertText, ...localeText }), [localeText]);
  const { role, live } = liveness(variant);
  const accent = accentOf(tokens, variant);
  const fontSize = size === "sm" ? tokens.fontSize - 1 : tokens.fontSize;
  const lineHeight = Math.round(fontSize * 1.45);

  return (
    <View
      {...rest}
      ref={ref}
      role={role}
      aria-live={live}
      style={[
        s.root,
        size === "sm" ? s.sm : s.md,
        { borderStartColor: accent, backgroundColor: mix(tokens.bg, accent, 0.07) },
        slots?.root,
        style,
      ]}
    >
      {icon !== false && (
        <View style={[s.icon, slots?.icon]} aria-hidden>
          {icon ?? <VariantGlyph variant={variant} color={accent} size={size === "sm" ? 14 : 16} />}
        </View>
      )}

      <View style={[s.content, slots?.content]}>
        {title !== undefined && renderText(title, [s.title, { fontSize, lineHeight }, slots?.title])}
        {description !== undefined &&
          renderText(description, [s.description, { fontSize, lineHeight }, slots?.description])}
        {children !== undefined && renderText(children, [s.description, { fontSize, lineHeight }, slots?.description])}
        {actions && <View style={[s.actions, slots?.actions]}>{actions}</View>}
      </View>

      {onDismiss && (
        <Pressable
          role="button"
          aria-label={text.dismiss}
          onPress={onDismiss}
          hitSlop={10}
          style={({ pressed }) => [s.dismiss, pressed && { backgroundColor: tokens.hover }, slots?.dismiss]}
        >
          <View style={[s.xBar, { transform: [{ rotate: "45deg" }] }]} />
          <View style={[s.xBar, { transform: [{ rotate: "-45deg" }] }]} />
        </Pressable>
      )}
    </View>
  );
}
