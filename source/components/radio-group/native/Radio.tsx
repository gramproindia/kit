import { use, useId, type ComponentRef, type ReactNode, type Ref } from "react";
import {
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { mix } from "../../shared/native/theme";
import { useControllableState } from "../../shared/react/useControllableState";
import type { RadioSize, RadioVariant } from "../core/types";
import { RadioGroupContext } from "./context";

export type RadioSlot = "root" | "control" | "label" | "description" | "error";

/** What `style` and `styles` callbacks receive: the native stand-in for `data-*`. */
export interface RadioStyleState {
  checked: boolean;
  pressed: boolean;
  disabled: boolean;
  invalid: boolean;
  size: RadioSize;
  variant: RadioVariant;
}

type Styleable<S> = StyleProp<S> | ((state: RadioStyleState) => StyleProp<S>);

export interface RadioProps
  extends Omit<PressableProps, "children" | "style" | "onPress" | "disabled"> {
  /** The value this choice contributes to its group. */
  value: string;
  /** Selected (controlled). Inside a RadioGroup the group decides instead. */
  checked?: boolean;
  /** Selected to begin with, for a standalone radio you are not controlling. */
  defaultChecked?: boolean;
  /** This radio was chosen. Only ever fires with `true`. */
  onCheckedChange?(checked: boolean): void;
  /** The text beside the radio. Pressing it selects this choice. */
  label?: ReactNode;
  /** A hint under the label. */
  description?: ReactNode;
  /** The validation message for this one choice. */
  error?: ReactNode;
  /** Default `md`, or the size of the RadioGroup it sits in. */
  size?: RadioSize;
  disabled?: boolean;
  style?: Styleable<ViewStyle>;
  styles?: Partial<{
    root: Styleable<ViewStyle>;
    control: Styleable<ViewStyle>;
    label: Styleable<TextStyle>;
    description: Styleable<TextStyle>;
    error: Styleable<TextStyle>;
  }>;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

const DOT: Record<RadioSize, number> = { sm: 18, md: 22, lg: 26 };

const themed = createThemedStyles((t) => ({
  root: { flexDirection: "row", alignItems: "flex-start", gap: 10, minHeight: t.touchTarget, paddingVertical: 4 },
  card: { borderWidth: 1, borderRadius: t.radius, padding: 12 },
  control: { alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  // Shrink, never grow: inside a horizontal, wrapping group a growing label has no width to grow into.
  text: { flexShrink: 1, gap: 2 },
  label: { color: t.fg, fontSize: t.fontSize },
  description: { color: t.muted, fontSize: t.fontSize - 2 },
  error: { color: t.danger, fontSize: t.fontSize - 2 },
}));

function apply<S>(value: Styleable<S> | undefined, state: RadioStyleState): StyleProp<S> {
  return typeof value === "function"
    ? (value as (state: RadioStyleState) => StyleProp<S>)(state)
    : (value as StyleProp<S>);
}

function plain(node: ReactNode): string | undefined {
  return typeof node === "string" || typeof node === "number" ? String(node) : undefined;
}

/**
 * One choice. Inside a `RadioGroup` the group owns the value; on its own it is
 * controlled through `checked` / `defaultChecked`.
 */
export function Radio(props: RadioProps) {
  const {
    ref,
    value,
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    label,
    description,
    error,
    size: sizeProp,
    disabled: disabledProp,
    style,
    styles: slots,
    "aria-label": ariaLabel,
    accessibilityHint,
    ...rest
  } = props;

  const group = use(RadioGroupContext);
  const id = useId();
  const { tokens } = useKitTheme();
  const s = themed(tokens);

  const [own, setOwn] = useControllableState(checkedProp, defaultChecked);
  const checked = group !== null ? group.value === value : own;
  const disabled = Boolean(disabledProp ?? group?.disabled);
  const invalid = Boolean(error) || (group?.invalid ?? false);
  const size = sizeProp ?? group?.size ?? "md";
  const variant = group?.variant ?? "default";
  const dot = DOT[size];

  const select = () => {
    if (group !== null) group.select(value);
    else setOwn(true);
    onCheckedChange?.(true);
  };

  const hint = [plain(error), plain(description), accessibilityHint].filter(Boolean).join(". ");

  return (
    <Pressable
      ref={ref}
      role="radio"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel ?? plain(label)}
      aria-labelledby={label && !plain(label) ? `${id}-label` : undefined}
      accessibilityHint={hint || undefined}
      disabled={disabled}
      onPress={select}
      {...rest}
      style={({ pressed }) => {
        const st: RadioStyleState = { checked, pressed, disabled, invalid, size, variant };
        return [
          s.root,
          variant === "card" && [
            s.card,
            {
              borderColor: invalid ? tokens.danger : checked ? tokens.accent : tokens.border,
              backgroundColor: checked ? tokens.accentSoft : pressed ? tokens.hover : "transparent",
            },
          ],
          { opacity: disabled ? 0.5 : 1 },
          apply(slots?.root, st),
          apply(style, st),
        ];
      }}
    >
      {({ pressed }) => {
        const st: RadioStyleState = { checked, pressed, disabled, invalid, size, variant };
        const line = invalid ? tokens.danger : checked ? tokens.accent : tokens.borderControl;
        return (
          <>
            <View
              style={[
                s.control,
                {
                  width: dot,
                  height: dot,
                  borderRadius: dot / 2,
                  marginTop: (tokens.fontSize * 1.35 - dot) / 2,
                  borderColor: pressed && checked ? mix(line, tokens.fg, 0.12) : line,
                  backgroundColor: pressed && !checked ? tokens.hover : tokens.inputBg,
                },
                apply(slots?.control, st),
              ]}
              aria-hidden
            >
              {checked && (
                <View style={{ width: dot * 0.5, height: dot * 0.5, borderRadius: dot / 4, backgroundColor: line }} />
              )}
            </View>
            {(label || description || error) && (
              <View style={s.text}>
                {label ? (
                  <Text
                    nativeID={`${id}-label`}
                    style={[s.label, size === "sm" && { fontSize: tokens.fontSize - 2 }, variant === "card" && { fontWeight: "600" }, apply(slots?.label, st)]}
                  >
                    {label}
                  </Text>
                ) : null}
                {description ? <Text style={[s.description, apply(slots?.description, st)]}>{description}</Text> : null}
                {error ? (
                  <Text role="alert" aria-live="polite" style={[s.error, apply(slots?.error, st)]}>
                    {error}
                  </Text>
                ) : null}
              </View>
            )}
          </>
        );
      }}
    </Pressable>
  );
}
