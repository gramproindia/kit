import { useCallback, useId, useMemo, type ReactNode } from "react";
import { Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { useControllableState } from "../../shared/react/useControllableState";
import { hasEnabledOption, normalizeOptions, resolveValue } from "../core/group";
import { defaultRadioGroupText } from "../core/locale";
import type {
  RadioGroupLocaleText,
  RadioOption,
  RadioOrientation,
  RadioSize,
  RadioVariant,
} from "../core/types";
import { RadioGroupContext, type RadioGroupContextValue } from "./context";
import { Radio } from "./Radio";

export type RadioGroupSlot = "root" | "legend" | "description" | "items" | "clear" | "error";

export interface RadioGroupProps {
  /** The chosen value (controlled). `null` for nothing chosen. */
  value?: string | null;
  /** The choice selected to begin with, when you are not controlling `value`. */
  defaultValue?: string | null;
  /** The chosen value, or `null` when the group was emptied with `clearable`. */
  onValueChange?(value: string | null): void;
  /** Render these choices, or pass `<Radio value="…">` children. Plain strings work too. */
  options?: readonly (string | RadioOption)[];
  children?: ReactNode;
  /** The question the choices answer, shown as the group's legend. */
  label?: ReactNode;
  description?: ReactNode;
  /** The validation message for the question. Marks every radio invalid. */
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Default `md`. */
  size?: RadioSize;
  /** Default `vertical`. */
  orientation?: RadioOrientation;
  /** Default `default`. `card` draws each choice as a tile. */
  variant?: RadioVariant;
  /** Offer a button that empties the group. */
  clearable?: boolean;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    legend: StyleProp<TextStyle>;
    description: StyleProp<TextStyle>;
    items: StyleProp<ViewStyle>;
    clear: StyleProp<TextStyle>;
    error: StyleProp<TextStyle>;
  }>;
  localeText?: Partial<RadioGroupLocaleText>;
}

const themed = createThemedStyles((t) => ({
  root: { gap: 4 },
  legend: { color: t.fg, fontSize: t.fontSize, fontWeight: "600" },
  required: { color: t.danger },
  description: { color: t.muted, fontSize: t.fontSize - 2 },
  items: { gap: 0 },
  cards: { gap: 8 },
  horizontal: { flexDirection: "row", flexWrap: "wrap", columnGap: 20 },
  clearButton: { alignSelf: "flex-start", minHeight: t.touchTarget, justifyContent: "center" },
  clear: { color: t.accent, fontSize: t.fontSize - 1, fontWeight: "600" },
  error: { color: t.danger, fontSize: t.fontSize - 2 },
}));

/** A labelled set of radios sharing one value. */
export function RadioGroup(props: RadioGroupProps) {
  const {
    value,
    defaultValue,
    onValueChange,
    options,
    children,
    label,
    description,
    error,
    required = false,
    disabled = false,
    size,
    orientation = "vertical",
    variant = "default",
    clearable = false,
    style,
    styles: slots,
    localeText,
  } = props;

  const id = useId();
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultRadioGroupText, ...localeText }), [localeText]);
  const [current, setCurrent] = useControllableState<string | null>(value, defaultValue ?? null);

  const items = useMemo(() => (options ? normalizeOptions(options) : null), [options]);
  // With children rather than options there is nothing to check the value against.
  const selected = items ? resolveValue(items, current) : (current ?? null);

  const commit = useCallback(
    (next: string | null) => {
      setCurrent(next);
      onValueChange?.(next);
    },
    [setCurrent, onValueChange],
  );

  const context = useMemo<RadioGroupContextValue>(
    () => ({
      value: selected,
      select: commit,
      disabled,
      invalid: Boolean(error),
      size,
      variant,
    }),
    [selected, commit, disabled, error, size, variant],
  );

  const showClear = clearable && selected !== null && hasEnabledOption(items ?? [], disabled);

  return (
    <View
      role="radiogroup"
      aria-labelledby={label ? `${id}-legend` : undefined}
      aria-disabled={disabled || undefined}
      style={[s.root, style, slots?.root]}
    >
      {label ? (
        <Text nativeID={`${id}-legend`} style={[s.legend, slots?.legend]}>
          {label}
          {required && <Text style={s.required}> *</Text>}
        </Text>
      ) : null}
      {description ? <Text style={[s.description, slots?.description]}>{description}</Text> : null}

      <RadioGroupContext value={context}>
        <View
          style={[
            s.items,
            variant === "card" && s.cards,
            orientation === "horizontal" && s.horizontal,
            slots?.items,
          ]}
        >
          {items
            ? items.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  description={option.description}
                  disabled={option.disabled}
                />
              ))
            : children}
        </View>
      </RadioGroupContext>

      {showClear && (
        <Pressable role="button" onPress={() => commit(null)} style={s.clearButton}>
          <Text style={[s.clear, slots?.clear]}>{text.clear}</Text>
        </Pressable>
      )}

      {error ? (
        <Text role="alert" aria-live="polite" style={[s.error, slots?.error]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
