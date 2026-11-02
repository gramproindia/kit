import type { ReactNode } from "react";
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";

export type { EmptySlot } from "../core/types";

export interface EmptyProps {
  /** What is missing, in a few words. */
  title: ReactNode;
  /** Why it is empty, and what to do about it. */
  description?: ReactNode;
  /** Decorative: an illustration or icon above the title. */
  icon?: ReactNode;
  /** The way out: usually one button, occasionally two. */
  actions?: ReactNode;
  /** Default `md`. `sm` suits an empty panel inside a screen. */
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    icon: StyleProp<ViewStyle>;
    title: StyleProp<TextStyle>;
    description: StyleProp<TextStyle>;
    actions: StyleProp<ViewStyle>;
  }>;
}

const PADDING = { sm: [24, 16], md: [40, 24], lg: [64, 24] } as const;

const themed = createThemedStyles((t) => ({
  root: { alignItems: "center", gap: 6 },
  icon: { marginBottom: 4 },
  title: { fontSize: Math.round(t.fontSize * 1.05), fontWeight: "600", color: t.fg, textAlign: "center" },
  description: { fontSize: t.fontSize, color: t.muted, textAlign: "center", maxWidth: 360, lineHeight: Math.round(t.fontSize * 1.45) },
  actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 10 },
}));

/**
 * The state a list or panel shows when there is nothing in it.
 *
 * A normal region rather than a live one: an empty result is part of the
 * screen, not an alert. Say what is missing and offer the way out.
 */
export function Empty(props: EmptyProps) {
  const { title, description, icon, actions, size = "md", style, styles: slots } = props;
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const [vertical, horizontal] = PADDING[size];
  const titleSize = size === "lg" ? { fontSize: Math.round(tokens.fontSize * 1.2) } : undefined;

  return (
    <View style={[s.root, { paddingVertical: vertical, paddingHorizontal: horizontal }, slots?.root, style]}>
      {icon && (
        <View style={[s.icon, size === "sm" && { marginBottom: 0 }, slots?.icon]} aria-hidden>
          {icon}
        </View>
      )}
      {typeof title === "string" || typeof title === "number" ? (
        <Text role="heading" style={[s.title, titleSize, slots?.title]}>
          {title}
        </Text>
      ) : (
        title
      )}
      {description !== undefined &&
        description !== null &&
        (typeof description === "string" || typeof description === "number" ? (
          <Text style={[s.description, slots?.description]}>{description}</Text>
        ) : (
          description
        ))}
      {actions && <View style={[s.actions, slots?.actions]}>{actions}</View>}
    </View>
  );
}
