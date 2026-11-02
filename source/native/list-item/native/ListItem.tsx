import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  type ReactNode,
} from "react";
import {
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { ChevronGlyph } from "../../../components/shared/native/glyphs";
import { createThemedStyles, useKitTheme } from "../../../components/shared/native/KitProvider";
import { mix } from "../../../components/shared/native/theme";

export type ListVariant = "plain" | "inset";

/** Set by `List`, so each row knows whether it draws its own divider. */
const ListContext = createContext<{ variant: ListVariant; divided: boolean } | null>(null);

const themed = createThemedStyles((t) => ({
  list: { backgroundColor: t.bg },
  inset: {
    backgroundColor: t.raised,
    borderRadius: t.radius * 1.5,
    borderWidth: 1,
    borderColor: t.border,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  leading: { alignItems: "center", justifyContent: "center", minWidth: 24 },
  body: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: t.fontSize, color: t.fg },
  description: { fontSize: t.fontSize - 2, color: t.muted, lineHeight: (t.fontSize - 2) * 1.35 },
  trailing: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  value: { fontSize: t.fontSize, color: t.muted, maxWidth: 160 },
  divider: { height: 1, backgroundColor: t.borderSubtle },
  section: { gap: 6 },
  header: {
    fontSize: t.fontSize - 3,
    fontWeight: "600",
    color: t.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: 16,
  },
  footer: { fontSize: t.fontSize - 3, color: t.muted, paddingHorizontal: 16, lineHeight: (t.fontSize - 3) * 1.4 },
}));

export interface ListProps {
  /** `plain`: full-width rows. `inset`: a rounded card of rows (iOS settings). Default `plain`. */
  variant?: ListVariant;
  /** Hairlines between rows, inset past the leading slot. Default true. */
  divided?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** A column of `ListItem`s with dividers between them. */
export function List({ variant = "plain", divided = true, style, children }: ListProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <ListContext.Provider value={{ variant, divided }}>
      <View role="list" style={[variant === "inset" ? s.inset : s.list, style]}>
        {items.map((item, index) => (
          <Fragment key={item.key ?? index}>
            {divided && index > 0 && (
              <View
                style={[
                  s.divider,
                  // Inset past the leading slot when the row below has one.
                  { marginLeft: (item.props as { leading?: unknown }).leading ? 52 : 16 },
                ]}
              />
            )}
            {item}
          </Fragment>
        ))}
      </View>
    </ListContext.Provider>
  );
}

export interface ListSectionProps {
  /** Small caps label above the group. */
  header?: ReactNode;
  /** Explanatory text below the group. */
  footer?: ReactNode;
  variant?: ListVariant;
  divided?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** A titled group of rows, with an optional note under it. */
export function ListSection({ header, footer, variant = "inset", divided, style, children }: ListSectionProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  return (
    <View style={[s.section, style]}>
      {header !== undefined &&
        (typeof header === "string" ? (
          <Text role="heading" style={s.header}>
            {header}
          </Text>
        ) : (
          header
        ))}
      <List variant={variant} divided={divided}>
        {children}
      </List>
      {footer !== undefined && (typeof footer === "string" ? <Text style={s.footer}>{footer}</Text> : footer)}
    </View>
  );
}

export interface ListItemProps {
  /** Icon or avatar before the text. */
  leading?: ReactNode;
  title: ReactNode;
  /** Supporting text under the title. */
  description?: ReactNode;
  /** Lines of description before truncating. Default 2. */
  numberOfLines?: number;
  /** Settings-style value text at the end, e.g. "English". */
  value?: ReactNode;
  /** Anything at the end: a Switch, a Badge, a button. */
  trailing?: ReactNode;
  /** A disclosure chevron at the end: the row opens something. */
  chevron?: boolean;
  /** Red text for delete / sign out rows. */
  destructive?: boolean;
  disabled?: boolean;
  onPress?(event: GestureResponderEvent): void;
  onLongPress?(event: GestureResponderEvent): void;
  "aria-label"?: string;
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  styles?: Partial<{
    leading: StyleProp<ViewStyle>;
    title: StyleProp<TextStyle>;
    description: StyleProp<TextStyle>;
    value: StyleProp<TextStyle>;
    trailing: StyleProp<ViewStyle>;
  }>;
}

/**
 * One row: leading icon, title and supporting text, and a trailing value,
 * control or chevron. Pressable when given `onPress`. At least 44dp tall, 56dp
 * with a description.
 */
export function ListItem({
  leading,
  title,
  description,
  numberOfLines = 2,
  value,
  trailing,
  chevron = false,
  destructive = false,
  disabled = false,
  onPress,
  onLongPress,
  style,
  styles: slots,
  ...rest
}: ListItemProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const list = useContext(ListContext);
  const interactive = Boolean(onPress || onLongPress);
  const base = list?.variant === "inset" ? tokens.raised : "transparent";
  const minHeight = Math.max(tokens.touchTarget, description !== undefined ? 56 : 44);

  const content = (
    <>
      {leading !== undefined && (
        <View style={[s.leading, slots?.leading]} aria-hidden>
          {leading}
        </View>
      )}
      <View style={s.body}>
        {typeof title === "string" || typeof title === "number" ? (
          <Text
            numberOfLines={1}
            style={[s.title, destructive && { color: tokens.danger }, slots?.title]}
          >
            {title}
          </Text>
        ) : (
          title
        )}
        {description !== undefined &&
          (typeof description === "string" || typeof description === "number" ? (
            <Text numberOfLines={numberOfLines} style={[s.description, slots?.description]}>
              {description}
            </Text>
          ) : (
            description
          ))}
      </View>
      {(value !== undefined || trailing !== undefined || chevron) && (
        <View style={[s.trailing, slots?.trailing]}>
          {value !== undefined &&
            (typeof value === "string" || typeof value === "number" ? (
              <Text numberOfLines={1} style={[s.value, slots?.value]}>
                {value}
              </Text>
            ) : (
              value
            ))}
          {trailing}
          {chevron && <ChevronGlyph direction="right" size={14} color={tokens.muted} />}
        </View>
      )}
    </>
  );

  if (!interactive) {
    return (
      <View
        role="listitem"
        aria-label={rest["aria-label"]}
        aria-disabled={disabled || undefined}
        style={[
          s.row,
          { minHeight, backgroundColor: base, opacity: disabled ? 0.5 : 1 },
          typeof style === "function" ? style({ pressed: false }) : style,
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      role={chevron ? "link" : "button"}
      aria-label={rest["aria-label"]}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        s.row,
        {
          minHeight,
          backgroundColor: pressed ? mix(list?.variant === "inset" ? tokens.raised : tokens.bg, tokens.fg, 0.07) : base,
          opacity: disabled ? 0.5 : 1,
        },
        typeof style === "function" ? style({ pressed }) : style,
      ]}
    >
      {content}
    </Pressable>
  );
}
