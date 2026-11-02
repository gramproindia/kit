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
import type { CheckboxSize, CheckedState } from "../core/types";
import { CheckboxGroupContext } from "./context";

export type CheckboxSlot = "root" | "control" | "label" | "description" | "error";

/** What `style` and `styles` callbacks receive: the native stand-in for `data-*`. */
export interface CheckboxStyleState {
  checked: CheckedState;
  pressed: boolean;
  disabled: boolean;
  invalid: boolean;
  size: CheckboxSize;
}

type Styleable<S> = StyleProp<S> | ((state: CheckboxStyleState) => StyleProp<S>);

export interface CheckboxProps
  extends Omit<PressableProps, "children" | "style" | "onPress" | "disabled"> {
  /** `true`, `false` or `"indeterminate"` (controlled). */
  checked?: CheckedState;
  /** The starting state when you are not controlling `checked`. */
  defaultChecked?: CheckedState;
  /**
   * The state after a change, as a plain boolean. Never fires with
   * `"indeterminate"`: pressing a mixed box resolves it.
   */
  onCheckedChange?(checked: boolean): void;
  /** Inside a CheckboxGroup, the value this box adds. */
  value?: string;
  /** The text beside the box. Pressing it toggles the box. */
  label?: ReactNode;
  /** A hint under the label, read as the box's hint. */
  description?: ReactNode;
  /** The validation message. Setting it marks the box invalid and announces it. */
  error?: ReactNode;
  /** Default `md`, or the size of the CheckboxGroup it sits in. */
  size?: CheckboxSize;
  disabled?: boolean;
  /** Marks the label with an asterisk. Native has no form validation of its own. */
  required?: boolean;
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

const BOX: Record<CheckboxSize, number> = { sm: 18, md: 22, lg: 26 };

const themed = createThemedStyles((t) => ({
  root: { flexDirection: "row", alignItems: "flex-start", gap: 10, minHeight: t.touchTarget, paddingVertical: 4 },
  control: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 5,
  },
  // Shrink, never grow: inside a horizontal, wrapping group a growing label has no width to grow into.
  text: { flexShrink: 1, gap: 2 },
  label: { color: t.fg, fontSize: t.fontSize },
  required: { color: t.danger },
  description: { color: t.muted, fontSize: t.fontSize - 2 },
  error: { color: t.danger, fontSize: t.fontSize - 2 },
  check: { borderColor: t.accentFg, borderLeftWidth: 2, borderBottomWidth: 2, transform: [{ rotate: "-45deg" }] },
  dash: { backgroundColor: t.accentFg, height: 2, borderRadius: 1 },
}));

function apply<S>(value: Styleable<S> | undefined, state: CheckboxStyleState): StyleProp<S> {
  return typeof value === "function"
    ? (value as (state: CheckboxStyleState) => StyleProp<S>)(state)
    : (value as StyleProp<S>);
}

/** Plain text of a node, for the accessible name and hint. */
function plain(node: ReactNode): string | undefined {
  return typeof node === "string" || typeof node === "number" ? String(node) : undefined;
}

/**
 * A checkbox with label, hint and error, including the mixed state. The whole
 * row is one pressable control, so the label is part of the touch target.
 */
export function Checkbox(props: CheckboxProps) {
  const {
    ref,
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    value,
    label,
    description,
    error,
    size: sizeProp,
    disabled: disabledProp,
    required,
    style,
    styles: slots,
    "aria-label": ariaLabel,
    accessibilityHint,
    ...rest
  } = props;

  const group = use(CheckboxGroupContext);
  const id = useId();
  const { tokens } = useKitTheme();
  const s = themed(tokens);

  const [own, setOwn] = useControllableState<CheckedState>(checkedProp, defaultChecked);
  const inGroup = group !== null && value !== undefined;
  // Inside a group the group owns the state, whoever owns it outside one.
  const state: CheckedState = inGroup ? group.values.includes(value) : own;
  const disabled = Boolean(disabledProp || group?.disabled);
  const invalid = Boolean(error) || (group?.invalid ?? false);
  const size = sizeProp ?? group?.size ?? "md";
  const box = BOX[size];

  const toggle = () => {
    // A mixed box resolves to checked, as a native one does.
    const next = state !== true;
    if (inGroup) group.toggle(value, next);
    else setOwn(next);
    onCheckedChange?.(next);
  };

  const hint = [plain(error), plain(description), accessibilityHint].filter(Boolean).join(". ");

  return (
    <Pressable
      ref={ref}
      role="checkbox"
      aria-checked={state === "indeterminate" ? "mixed" : state}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel ?? plain(label)}
      aria-labelledby={label && !plain(label) ? `${id}-label` : undefined}
      accessibilityHint={hint || undefined}
      disabled={disabled}
      onPress={toggle}
      {...rest}
      style={({ pressed }) => {
        const st: CheckboxStyleState = { checked: state, pressed, disabled, invalid, size };
        return [s.root, { opacity: disabled ? 0.5 : 1 }, apply(slots?.root, st), apply(style, st)];
      }}
    >
      {({ pressed }) => {
        const st: CheckboxStyleState = { checked: state, pressed, disabled, invalid, size };
        const on = state !== false;
        const line = invalid ? tokens.danger : on ? tokens.accent : tokens.borderControl;
        const fill = on ? (pressed ? mix(tokens.accent, tokens.fg, 0.12) : tokens.accent) : pressed ? tokens.hover : tokens.inputBg;
        return (
          <>
            <View
              style={[
                s.control,
                { width: box, height: box, marginTop: (tokens.fontSize * 1.35 - box) / 2, borderColor: on && !invalid ? fill : line, backgroundColor: fill },
                apply(slots?.control, st),
              ]}
              aria-hidden
            >
              {state === true && (
                <View style={[s.check, { width: box * 0.55, height: box * 0.3, marginTop: -box * 0.1 }]} />
              )}
              {state === "indeterminate" && <View style={[s.dash, { width: box * 0.5 }]} />}
            </View>
            {(label || description || error) && (
              <View style={s.text}>
                {label ? (
                  <Text nativeID={`${id}-label`} style={[s.label, size === "sm" && { fontSize: tokens.fontSize - 2 }, apply(slots?.label, st)]}>
                    {label}
                    {required && <Text style={s.required}> *</Text>}
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
