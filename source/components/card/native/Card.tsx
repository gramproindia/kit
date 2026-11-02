import { createContext, useContext, type ComponentRef, type ReactNode, type Ref } from "react";
import {
  Pressable,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { renderText } from "../../shared/native/primitives";
import { mix } from "../../shared/native/theme";
import type { CardPadding, CardVariant } from "../core/types";

const PADDING: Record<CardPadding, number> = { none: 0, sm: 12, md: 16, lg: 24 };

/** The card's padding, read by its header, body and footer. */
const PaddingContext = createContext(PADDING.md);

export const cardStyles = createThemedStyles((t) => ({
  root: { borderRadius: t.radius, backgroundColor: t.bg, overflow: "hidden" },
  outlined: { borderWidth: 1, borderColor: t.border },
  elevated: {
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: t.raised,
    boxShadow: t.shadow,
  },
  plain: { backgroundColor: "transparent" },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  heading: { flex: 1, minWidth: 0 },
  title: { fontSize: t.fontSize + 1, fontWeight: "600", color: t.fg },
  description: { marginTop: 2, fontSize: t.fontSize - 1, color: t.muted },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: t.border,
  },
  text: { fontSize: t.fontSize, color: t.fg },
}));

/** What `style` callbacks receive on a pressable card. */
export interface CardStyleState {
  pressed: boolean;
  variant: CardVariant;
}

export interface CardProps extends Omit<ViewProps, "children" | "style"> {
  children?: ReactNode;
  /** Default `outlined`. */
  variant?: CardVariant;
  /** Padding applied to the header, body and footer. Default `md`. */
  padding?: CardPadding;
  /**
   * Makes the whole card pressable (the web's `href`). Keep other pressable
   * content out of it: a button inside a pressable card is two targets in one.
   */
  onPress?(event: GestureResponderEvent): void;
  /** Darkens the card while pressed. On by default when `onPress` is set. */
  interactive?: boolean;
  style?: StyleProp<ViewStyle> | ((state: CardStyleState) => StyleProp<ViewStyle>);
  styles?: Partial<{ root: StyleProp<ViewStyle> }>;
  ref?: Ref<ComponentRef<typeof View>>;
}

/**
 * A surface that groups related content, with optional header, body and footer.
 */
export function Card(props: CardProps) {
  const {
    ref,
    children,
    variant = "outlined",
    padding = "md",
    onPress,
    interactive,
    style,
    styles: slots,
    ...rest
  } = props;

  const { tokens } = useKitTheme();
  const s = cardStyles(tokens);
  const base = [s.root, s[variant], slots?.root];
  const content = <PaddingContext.Provider value={PADDING[padding]}>{children}</PaddingContext.Provider>;
  const resolve = (pressed: boolean) =>
    typeof style === "function" ? style({ pressed, variant }) : style;

  if (onPress || interactive) {
    return (
      <Pressable
        {...rest}
        ref={ref}
        role={onPress ? "button" : undefined}
        onPress={onPress}
        style={({ pressed }) => [
          ...base,
          pressed && { backgroundColor: variant === "plain" ? tokens.hover : mix(tokens.bg, tokens.fg, 0.04) },
          resolve(pressed),
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View {...rest} ref={ref} style={[...base, resolve(false)]}>
      {content}
    </View>
  );
}

export interface CardHeaderProps {
  /** The heading. Announced as a heading by screen readers. */
  title?: ReactNode;
  /** A line under the heading, for context the title cannot carry. */
  description?: ReactNode;
  /** Buttons or a menu, aligned to the end of the header. */
  actions?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    header: StyleProp<ViewStyle>;
    title: StyleProp<TextStyle>;
    description: StyleProp<TextStyle>;
    actions: StyleProp<ViewStyle>;
  }>;
}

export function CardHeader({ title, description, actions, children, style, styles: slots }: CardHeaderProps) {
  const { tokens } = useKitTheme();
  const s = cardStyles(tokens);
  const px = useContext(PaddingContext);
  return (
    <View style={[s.header, { padding: px, paddingBottom: 0 }, slots?.header, style]}>
      <View style={s.heading}>
        {title !== undefined && (
          <View role="heading">{renderText(title, [s.title, slots?.title])}</View>
        )}
        {description !== undefined && renderText(description, [s.description, slots?.description])}
        {children}
      </View>
      {actions && <View style={[s.actions, slots?.actions]}>{actions}</View>}
    </View>
  );
}

export function CardBody({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { tokens } = useKitTheme();
  const s = cardStyles(tokens);
  const px = useContext(PaddingContext);
  return <View style={[{ padding: px }, style]}>{renderText(children, s.text)}</View>;
}

export function CardFooter({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { tokens } = useKitTheme();
  const s = cardStyles(tokens);
  const px = useContext(PaddingContext);
  return (
    <View style={[s.footer, { paddingHorizontal: px, paddingVertical: 12 }, style]}>
      {renderText(children, s.text)}
    </View>
  );
}
