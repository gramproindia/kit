import { useMemo, useState, type ComponentRef, type ReactNode, type Ref } from "react";
import {
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { renderText, Ring } from "../../shared/native/primitives";
import { mix, type KitTokens } from "../../shared/native/theme";
import { buttonState, isPromiseLike } from "../core/state";
import type { ButtonLocaleText, ButtonSize, ButtonVariant } from "../core/types";
import { defaultButtonText } from "../core/locale";

export type ButtonSlot = "root" | "content" | "label" | "spinner" | "icon";

/** What `style` and `styles` callbacks receive: the native stand-in for `data-*`. */
export interface ButtonStyleState {
  pressed: boolean;
  busy: boolean;
  disabled: boolean;
  variant: ButtonVariant;
  size: ButtonSize;
}

type Styleable<S> = StyleProp<S> | ((state: ButtonStyleState) => StyleProp<S>);

export interface ButtonProps
  extends Omit<PressableProps, "children" | "style" | "onPress" | "disabled"> {
  /** Default `primary`. */
  variant?: ButtonVariant;
  /** Default `md`. Every size keeps a 44dp touch target. */
  size?: ButtonSize;
  /** Show a spinner and ignore presses, keeping the button's width. */
  loading?: boolean;
  /** Text shown next to the spinner while busy, instead of keeping the label. */
  loadingText?: ReactNode;
  /** Icon before the label. */
  leading?: ReactNode;
  /** Icon after the label. */
  trailing?: ReactNode;
  /** An icon-only button. Give it an `aria-label`. */
  icon?: ReactNode;
  /** Fill the width of the container. */
  fullWidth?: boolean;
  disabled?: boolean;
  /** Return a promise to show the loading state until it settles. */
  onPress?(event: GestureResponderEvent): unknown;
  children?: ReactNode;
  /** Root style, or a function of the button's state. */
  style?: Styleable<ViewStyle>;
  styles?: Partial<{
    root: Styleable<ViewStyle>;
    content: Styleable<ViewStyle>;
    label: Styleable<TextStyle>;
    spinner: Styleable<ViewStyle>;
    icon: Styleable<ViewStyle>;
  }>;
  localeText?: Partial<ButtonLocaleText>;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

const HEIGHT: Record<ButtonSize, number> = { sm: 34, md: 44, lg: 52 };
const PAD: Record<ButtonSize, number> = { sm: 12, md: 16, lg: 20 };

function colors(t: KitTokens, variant: ButtonVariant, pressed: boolean) {
  const press = (fill: string) => (pressed ? mix(fill, t.fg, 0.12) : fill);
  switch (variant) {
    case "secondary":
      return { fill: press(t.subtle), ink: t.fg, line: t.subtle };
    case "outline":
      return { fill: pressed ? t.hover : "transparent", ink: t.fg, line: t.border };
    case "ghost":
      return { fill: pressed ? t.hover : "transparent", ink: t.fg, line: "transparent" };
    case "danger":
      return { fill: press(t.danger), ink: t.dangerFg, line: press(t.danger) };
    case "link":
      return { fill: "transparent", ink: pressed ? t.accentStrong : t.accent, line: "transparent" };
    default:
      return { fill: press(t.accent), ink: t.accentFg, line: press(t.accent) };
  }
}

const themed = createThemedStyles((t) => ({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: t.radius,
  },
  fullWidth: { alignSelf: "stretch" },
  content: { flexDirection: "row", alignItems: "center", gap: 8 },
  hidden: { opacity: 0 },
  label: { fontSize: t.fontSize, fontWeight: "600" },
  link: { textDecorationLine: "underline" },
  spinner: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: { alignItems: "center", justifyContent: "center" },
  srOnly: { position: "absolute", width: 1, height: 1, opacity: 0 },
}));

function apply<S>(value: Styleable<S> | undefined, state: ButtonStyleState): StyleProp<S> {
  return typeof value === "function"
    ? (value as (state: ButtonStyleState) => StyleProp<S>)(state)
    : (value as StyleProp<S>);
}

/**
 * A button with variants, sizes, icons and a loading state. An async `onPress`
 * shows progress by itself.
 */
export function Button(props: ButtonProps) {
  const {
    ref,
    variant = "primary",
    size = "md",
    loading = false,
    loadingText,
    leading,
    trailing,
    icon,
    fullWidth = false,
    disabled = false,
    onPress,
    children,
    style,
    styles: slots,
    localeText,
    hitSlop,
    ...rest
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultButtonText, ...localeText }), [localeText]);
  const [pressPending, setPressPending] = useState(false);
  const state = buttonState({ disabled, loading, pending: pressPending });
  const iconOnly = icon !== undefined && (children === undefined || children === null);

  const handlePress = (event: GestureResponderEvent) => {
    if (state.inactive) return;
    const result = onPress?.(event);
    if (!isPromiseLike(result)) return;
    setPressPending(true);
    const done = () => setPressPending(false);
    Promise.resolve(result).then(done, (error: unknown) => {
      done();
      throw error;
    });
  };

  const height = HEIGHT[size];
  // A small button still gets a full-size target.
  const slop = hitSlop ?? Math.max(0, Math.ceil((tokens.touchTarget - height) / 2));

  return (
    <Pressable
      ref={ref}
      role="button"
      aria-busy={state.busy || undefined}
      aria-disabled={state.inactive || undefined}
      disabled={state.inactive}
      hitSlop={slop}
      onPress={handlePress}
      {...rest}
      style={({ pressed }) => {
        const st: ButtonStyleState = { pressed, busy: state.busy, disabled, variant, size };
        const c = colors(tokens, variant, pressed);
        return [
          s.root,
          {
            height,
            minWidth: iconOnly ? height : undefined,
            paddingHorizontal: iconOnly ? 0 : variant === "link" ? 0 : PAD[size],
            backgroundColor: c.fill,
            borderColor: c.line,
            opacity: disabled ? 0.5 : 1,
          },
          fullWidth && s.fullWidth,
          apply(slots?.root, st),
          apply(style, st),
        ];
      }}
    >
      {({ pressed }) => {
        const st: ButtonStyleState = { pressed, busy: state.busy, disabled, variant, size };
        const c = colors(tokens, variant, pressed);
        const label = [
          s.label,
          { color: c.ink, fontSize: size === "sm" ? tokens.fontSize - 2 : size === "lg" ? tokens.fontSize + 1 : tokens.fontSize },
          variant === "link" && s.link,
          apply(slots?.label, st),
        ];
        const iconStyle = [s.icon, apply(slots?.icon, st)];
        const spinner = <Ring size={size === "sm" ? 14 : 18} color={c.ink} />;
        // With loading text the button sizes to that text, as on the web;
        // without it the label stays (hidden) so the width does not jump.
        if (state.busy && loadingText) {
          return (
            <View style={[s.content, apply(slots?.spinner, st)]}>
              {spinner}
              {renderText(loadingText, label, 1)}
            </View>
          );
        }
        return (
          <>
            <View style={[s.content, state.busy && s.hidden, apply(slots?.content, st)]}>
              {leading && <View style={iconStyle} aria-hidden>{leading}</View>}
              {iconOnly ? <View style={iconStyle}>{icon}</View> : renderText(children, label, 1)}
              {trailing && <View style={iconStyle} aria-hidden>{trailing}</View>}
            </View>
            {state.busy && (
              <View style={[s.spinner, apply(slots?.spinner, st)]}>
                {spinner}
                <Text style={s.srOnly}>{text.loading}</Text>
              </View>
            )}
          </>
        );
      }}
    </Pressable>
  );
}
