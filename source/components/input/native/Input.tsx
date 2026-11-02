import {
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
  type Ref,
} from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { alpha } from "../../shared/native/theme";
import { useControllableState } from "../../shared/react/useControllableState";
import { countCharacters } from "../core/count";
import { defaultInputText } from "../core/locale";
import type { FieldSize, InputLocaleText } from "../core/types";
import { EyeIcon, XIcon } from "./icons";

type TextInputInstance = ComponentRef<typeof TextInput>;

export type InputSlot = "root" | "label" | "control" | "input" | "description" | "error" | "count";

/** What `style` and `styles` callbacks receive: the native stand-in for `data-*`. */
export interface InputStyleState {
  focused: boolean;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
  size: FieldSize;
}

type Styleable<S> = StyleProp<S> | ((state: InputStyleState) => StyleProp<S>);

/** The web `type`s that mean something on a phone keyboard. */
export type InputType = "text" | "password" | "email" | "number" | "tel" | "url" | "search";

export interface InputProps
  extends Omit<TextInputProps, "value" | "defaultValue" | "style" | "editable" | "secureTextEntry"> {
  value?: string;
  defaultValue?: string;
  /** The new text on every change. `onChangeText` fires as well. */
  onValueChange?(value: string): void;
  /** Picks the keyboard, autofill and secure entry, as `type` does on the web. Default `text`. */
  type?: InputType;
  /** The field's name, shown above it. */
  label?: ReactNode;
  /** A hint under the field, read as the field's hint. */
  description?: ReactNode;
  /** Message below the field; also marks it invalid. */
  error?: ReactNode;
  /** Default `md`. */
  size?: FieldSize;
  /** Content before the text, e.g. an icon or "https://". */
  leading?: ReactNode;
  /** Content after the text, e.g. a unit such as "kg". */
  trailing?: ReactNode;
  /** A button that empties the field. Default false. */
  clearable?: boolean;
  /** For `type="password"`, a button that shows the text. Default true. */
  revealPassword?: boolean;
  /** A character counter under the field; shows `count / maxLength` when `maxLength` is set. */
  showCount?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Marks the label with an asterisk. Native has no form validation of its own. */
  required?: boolean;
  style?: Styleable<ViewStyle>;
  styles?: Partial<{
    root: Styleable<ViewStyle>;
    label: Styleable<TextStyle>;
    control: Styleable<ViewStyle>;
    input: Styleable<TextStyle>;
    description: Styleable<TextStyle>;
    error: Styleable<TextStyle>;
    count: Styleable<TextStyle>;
  }>;
  localeText?: Partial<InputLocaleText>;
  /** The `TextInput`. */
  ref?: Ref<TextInputInstance>;
}

const HEIGHT: Record<FieldSize, number> = { sm: 36, md: 44, lg: 52 };

const KEYBOARD: Record<InputType, Pick<TextInputProps, "keyboardType" | "autoComplete" | "autoCapitalize" | "autoCorrect" | "inputMode" | "returnKeyType">> = {
  text: {},
  password: { autoComplete: "current-password", autoCapitalize: "none", autoCorrect: false },
  email: { keyboardType: "email-address", inputMode: "email", autoComplete: "email", autoCapitalize: "none", autoCorrect: false },
  number: { keyboardType: "decimal-pad", inputMode: "decimal" },
  tel: { keyboardType: "phone-pad", inputMode: "tel", autoComplete: "tel" },
  url: { keyboardType: "url", inputMode: "url", autoComplete: "url", autoCapitalize: "none", autoCorrect: false },
  search: { inputMode: "search", returnKeyType: "search" },
};

const themed = createThemedStyles((t) => ({
  root: { gap: 6 },
  label: { color: t.fg, fontSize: t.fontSize - 1, fontWeight: "600" },
  required: { color: t.danger },
  control: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: t.radius,
    paddingHorizontal: 12,
  },
  input: { flex: 1, alignSelf: "stretch", padding: 0, color: t.fg },
  adornment: { flexDirection: "row", alignItems: "center" },
  adornmentText: { color: t.muted, fontSize: t.fontSize },
  iconButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  footer: { flexDirection: "row", gap: 12 },
  description: { flex: 1, color: t.muted, fontSize: t.fontSize - 2 },
  count: { marginLeft: "auto", color: t.muted, fontSize: t.fontSize - 2, fontVariant: ["tabular-nums"] },
  error: { color: t.danger, fontSize: t.fontSize - 2 },
}));

function apply<S>(value: Styleable<S> | undefined, state: InputStyleState): StyleProp<S> {
  return typeof value === "function"
    ? (value as (state: InputStyleState) => StyleProp<S>)(state)
    : (value as StyleProp<S>);
}

function plain(node: ReactNode): string | undefined {
  return typeof node === "string" || typeof node === "number" ? String(node) : undefined;
}

/** Strings become muted text; anything else (an icon) is used as is. */
function adornment(node: ReactNode, style: StyleProp<TextStyle>): ReactNode {
  return typeof node === "string" || typeof node === "number" ? <Text style={style}>{node}</Text> : node;
}

/**
 * A text field with label, hint, error, adornments, clear and password-reveal
 * buttons and a character counter. Every other prop goes to the `TextInput`.
 */
export function Input(props: InputProps) {
  const {
    ref,
    value: valueProp,
    defaultValue,
    onChangeText,
    onValueChange,
    type = "text",
    label,
    description,
    error,
    size = "md",
    leading,
    trailing,
    clearable = false,
    revealPassword = true,
    showCount = false,
    disabled = false,
    readOnly = false,
    required,
    maxLength,
    style,
    styles: slots,
    localeText,
    onFocus,
    onBlur,
    "aria-label": ariaLabel,
    accessibilityHint,
    ...inputProps
  } = props;

  const id = useId();
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultInputText, ...localeText }), [localeText]);
  const inputRef = useRef<TextInputInstance>(null);
  useImperativeHandle(ref, () => inputRef.current as TextInputInstance, []);

  // Mirrors the text even when uncontrolled, for the counter and the clear button.
  const [current, setCurrent] = useControllableState(valueProp, defaultValue ?? "");
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);

  const change = (next: string) => {
    setCurrent(next);
    onChangeText?.(next);
    onValueChange?.(next);
  };

  const invalid = Boolean(error);
  const isPassword = type === "password";
  const count = countCharacters(current);
  const st: InputStyleState = { focused, disabled, readOnly, invalid, size };
  const fontSize = size === "sm" ? tokens.fontSize - 1 : size === "lg" ? tokens.fontSize + 1 : tokens.fontSize;
  const hint = [plain(error), plain(description), accessibilityHint].filter(Boolean).join(". ");
  const border = invalid ? tokens.danger : focused ? tokens.focus : tokens.borderControl;

  return (
    <View style={[s.root, { opacity: disabled ? 0.55 : 1 }, apply(slots?.root, st), apply(style, st)]}>
      {label ? (
        <Text nativeID={`${id}-label`} style={[s.label, apply(slots?.label, st)]}>
          {label}
          {required && <Text style={s.required}> *</Text>}
        </Text>
      ) : null}

      <Pressable
        // A press on the padding or an adornment focuses the text, like a native field.
        onPress={() => inputRef.current?.focus()}
        disabled={disabled}
        accessible={false}
        style={[
          s.control,
          {
            minHeight: Math.max(HEIGHT[size], size === "sm" ? 0 : tokens.touchTarget),
            borderColor: border,
            backgroundColor: readOnly ? tokens.readonlyBg : tokens.inputBg,
            // The focus ring: an outline outside the border, so nothing shifts.
            outlineColor: alpha(invalid ? tokens.danger : tokens.focus, 0.3),
            outlineWidth: focused ? 3 : 0,
            outlineStyle: "solid",
          },
          apply(slots?.control, st),
        ]}
      >
        {leading ? <View style={s.adornment}>{adornment(leading, s.adornmentText)}</View> : null}
        <TextInput
          {...KEYBOARD[type]}
          {...inputProps}
          ref={inputRef}
          value={current}
          onChangeText={change}
          editable={!disabled && !readOnly}
          secureTextEntry={isPassword && !revealed}
          maxLength={maxLength}
          placeholderTextColor={tokens.muted}
          selectionColor={tokens.accent}
          aria-label={ariaLabel ?? plain(label)}
          aria-labelledby={label && !plain(label) ? `${id}-label` : undefined}
          aria-disabled={disabled || undefined}
          accessibilityHint={hint || undefined}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[s.input, { fontSize, minHeight: HEIGHT[size] - 2 }, apply(slots?.input, st)]}
        />
        {clearable && current !== "" && !disabled && !readOnly && (
          <Pressable
            role="button"
            aria-label={text.clear}
            hitSlop={6}
            onPress={() => {
              change("");
              inputRef.current?.focus();
            }}
            style={({ pressed }) => [s.iconButton, pressed && { backgroundColor: tokens.hover }]}
          >
            <XIcon color={tokens.muted} />
          </Pressable>
        )}
        {isPassword && revealPassword && (
          <Pressable
            role="button"
            aria-label={revealed ? text.hidePassword : text.showPassword}
            aria-pressed={revealed}
            disabled={disabled}
            hitSlop={6}
            onPress={() => setRevealed((shown) => !shown)}
            style={({ pressed }) => [s.iconButton, pressed && { backgroundColor: tokens.hover }]}
          >
            <EyeIcon color={tokens.muted} crossed={revealed} />
          </Pressable>
        )}
        {trailing ? <View style={s.adornment}>{adornment(trailing, s.adornmentText)}</View> : null}
      </Pressable>

      {(description || showCount) && (
        <View style={s.footer}>
          {description ? <Text style={[s.description, apply(slots?.description, st)]}>{description}</Text> : null}
          {showCount && (
            <Text
              style={[
                s.count,
                maxLength !== undefined && count > maxLength && { color: tokens.danger },
                apply(slots?.count, st),
              ]}
            >
              {text.characterCount(String(count), maxLength !== undefined ? String(maxLength) : undefined)}
            </Text>
          )}
        </View>
      )}
      {error ? (
        <Text role="alert" aria-live="polite" style={[s.error, apply(slots?.error, st)]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
