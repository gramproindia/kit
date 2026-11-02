import { useId, useMemo, type ReactNode } from "react";
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { useControllableState } from "../../shared/react/useControllableState";
import { groupState, toggleAll, toggleValue } from "../core/group";
import { defaultCheckboxText } from "../core/locale";
import type { CheckboxLocaleText, CheckboxOption, CheckboxSize } from "../core/types";
import { Checkbox } from "./Checkbox";
import { CheckboxGroupContext, type CheckboxGroupContextValue } from "./context";

export type CheckboxGroupSlot = "root" | "legend" | "description" | "items" | "error";

export interface CheckboxGroupProps {
  /** Checked values (controlled). */
  value?: string[];
  /** The values checked to begin with, when you are not controlling `value`. */
  defaultValue?: string[];
  /** The checked values after a change, in the order they were checked. */
  onValueChange?(values: string[]): void;
  /** Render these options, or pass `<Checkbox value="…">` children. */
  options?: readonly CheckboxOption[];
  children?: ReactNode;
  /** The group's name, shown as its legend. */
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  size?: CheckboxSize;
  /** Default `vertical`. */
  orientation?: "vertical" | "horizontal";
  /** With `options`, a parent box that checks or clears them all. `true` uses the default label. */
  selectAll?: boolean | ReactNode;
  style?: StyleProp<ViewStyle>;
  styles?: Partial<{
    root: StyleProp<ViewStyle>;
    legend: StyleProp<TextStyle>;
    description: StyleProp<TextStyle>;
    items: StyleProp<ViewStyle>;
    error: StyleProp<TextStyle>;
  }>;
  localeText?: Partial<CheckboxLocaleText>;
}

const themed = createThemedStyles((t) => ({
  root: { gap: 4 },
  legend: { color: t.fg, fontSize: t.fontSize, fontWeight: "600" },
  required: { color: t.danger },
  description: { color: t.muted, fontSize: t.fontSize - 2 },
  items: { gap: 0 },
  horizontal: { flexDirection: "row", flexWrap: "wrap", columnGap: 20 },
  selectAll: { borderBottomWidth: 1, borderColor: t.borderSubtle },
  error: { color: t.danger, fontSize: t.fontSize - 2 },
}));

/** A labelled set of checkboxes sharing one array of values. */
export function CheckboxGroup(props: CheckboxGroupProps) {
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
    selectAll,
    style,
    styles: slots,
    localeText,
  } = props;

  const id = useId();
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultCheckboxText, ...localeText }), [localeText]);
  const [values, setValues] = useControllableState<string[]>(value, defaultValue ?? []);

  const context = useMemo<CheckboxGroupContextValue>(() => {
    const commit = (next: string[]) => {
      setValues(next);
      onValueChange?.(next);
    };
    return {
      values,
      toggle: (item, checked) => commit(toggleValue(values, item, checked)),
      disabled,
      invalid: Boolean(error),
      size,
    };
  }, [values, setValues, onValueChange, disabled, error, size]);

  const showSelectAll = Boolean(selectAll) && options !== undefined && options.length > 0;

  return (
    <View
      role="group"
      aria-labelledby={label ? `${id}-legend` : undefined}
      style={[s.root, style, slots?.root]}
    >
      {label ? (
        <Text nativeID={`${id}-legend`} style={[s.legend, slots?.legend]}>
          {label}
          {required && <Text style={s.required}> *</Text>}
        </Text>
      ) : null}
      {description ? <Text style={[s.description, slots?.description]}>{description}</Text> : null}

      {showSelectAll && (
        <Checkbox
          label={selectAll === true ? text.selectAll : selectAll}
          size={size}
          disabled={disabled}
          checked={groupState(values, options)}
          style={s.selectAll}
          onCheckedChange={() => {
            const next = toggleAll(values, options);
            setValues(next);
            onValueChange?.(next);
          }}
        />
      )}

      <CheckboxGroupContext value={context}>
        <View style={[s.items, orientation === "horizontal" && s.horizontal, slots?.items]}>
          {options
            ? options.map((option) => (
                <Checkbox
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  description={option.description}
                  disabled={option.disabled}
                />
              ))
            : children}
        </View>
      </CheckboxGroupContext>

      {error ? (
        <Text role="alert" aria-live="polite" style={[s.error, slots?.error]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
