import {
  Fragment,
  useEffect,
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
  Animated,
  Platform,
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
import { activeCell, sanitizeOtp, separatorsAfter } from "../core/otp";
import { defaultInputText } from "../core/locale";
import type { FieldSize, InputLocaleText, OtpMode } from "../core/types";

type TextInputInstance = ComponentRef<typeof TextInput>;

export type OtpSlot = "root" | "label" | "cells" | "cell" | "separator" | "description" | "error";

/** What `style` and `styles` callbacks receive: the native stand-in for `data-*`. */
export interface OtpStyleState {
  focused: boolean;
  disabled: boolean;
  invalid: boolean;
  size: FieldSize;
  /** For the `cell` slot: this cell's index, whether it is filled and whether it has the caret. */
  index?: number;
  filled?: boolean;
  active?: boolean;
}

type Styleable<S> = StyleProp<S> | ((state: OtpStyleState) => StyleProp<S>);

export interface OtpInputProps
  extends Omit<
    TextInputProps,
    "value" | "defaultValue" | "style" | "editable" | "maxLength" | "keyboardType" | "inputMode" | "secureTextEntry"
  > {
  /** Number of characters. Default 6. */
  length?: number;
  /** Default `numeric`. */
  mode?: OtpMode;
  /** Turn letters into capitals as they are typed. */
  uppercase?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?(value: string): void;
  /** Every cell is filled. */
  onComplete?(value: string): void;
  /** Group sizes with a separator between them, e.g. `[3, 3]`. */
  groups?: number[];
  /** Show dots instead of the characters. */
  mask?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  size?: FieldSize;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  style?: Styleable<ViewStyle>;
  styles?: Partial<{
    root: Styleable<ViewStyle>;
    label: Styleable<TextStyle>;
    cells: Styleable<ViewStyle>;
    cell: Styleable<ViewStyle>;
    separator: Styleable<ViewStyle>;
    description: Styleable<TextStyle>;
    error: Styleable<TextStyle>;
  }>;
  localeText?: Partial<InputLocaleText>;
  /** The `TextInput`. */
  ref?: Ref<TextInputInstance>;
}

const CELL: Record<FieldSize, number> = { sm: 38, md: 46, lg: 54 };

const themed = createThemedStyles((t) => ({
  root: { gap: 6 },
  label: { color: t.fg, fontSize: t.fontSize - 1, fontWeight: "600" },
  required: { color: t.danger },
  cells: { flexDirection: "row", alignItems: "center", gap: 8 },
  cell: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: t.radius },
  char: { color: t.fg, fontWeight: "600" },
  caret: { width: 2, borderRadius: 1, backgroundColor: t.accent },
  separator: { width: 10, height: 2, borderRadius: 1, backgroundColor: t.borderControl },
  // The real field covers the cells, invisible: taps, paste and SMS autofill
  // all land on one TextInput, as they expect to.
  input: { position: "absolute", inset: 0, opacity: 0.011, color: "transparent" },
  description: { color: t.muted, fontSize: t.fontSize - 2 },
  error: { color: t.danger, fontSize: t.fontSize - 2 },
}));

function apply<S>(value: Styleable<S> | undefined, state: OtpStyleState): StyleProp<S> {
  return typeof value === "function"
    ? (value as (state: OtpStyleState) => StyleProp<S>)(state)
    : (value as StyleProp<S>);
}

function plain(node: ReactNode): string | undefined {
  return typeof node === "string" || typeof node === "number" ? String(node) : undefined;
}

/** A blinking caret, on the native driver. */
function Caret({ height, style }: { height: number; style: StyleProp<ViewStyle> }) {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: 500, delay: 300, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 0, delay: 200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);
  return <Animated.View style={[style, { height, opacity: blink }]} />;
}

/**
 * A one-time-code field. It is a single real `TextInput` drawn as separate
 * cells, so SMS autofill (iOS and Android), paste and screen readers treat it
 * as one field, the way they expect.
 */
export function OtpInput(props: OtpInputProps) {
  const {
    ref,
    length = 6,
    mode = "numeric",
    uppercase = false,
    value: valueProp,
    defaultValue = "",
    onValueChange,
    onComplete,
    groups,
    mask = false,
    label,
    description,
    error,
    size = "md",
    disabled = false,
    readOnly = false,
    required,
    style,
    styles: slots,
    localeText,
    onChangeText,
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

  const [internal, setInternal] = useState(() => sanitizeOtp(defaultValue, length, mode, uppercase));
  const value = valueProp !== undefined ? sanitizeOtp(valueProp, length, mode, uppercase) : internal;
  const [focused, setFocused] = useState(false);

  const change = (raw: string) => {
    // Pasting "Your code: 123-456" fills all six cells with 123456.
    const next = sanitizeOtp(raw, length, mode, uppercase);
    if (valueProp === undefined) setInternal(next);
    onChangeText?.(next);
    onValueChange?.(next);
    if (next.length === length && next !== value) onComplete?.(next);
  };

  const invalid = Boolean(error);
  const separators = separatorsAfter(groups, length);
  // The caret sits where the next character goes; native keeps it at the end.
  const active = focused ? activeCell(value.length, length, value.length) : -1;
  const cell = CELL[size];
  const st: OtpStyleState = { focused, disabled, invalid, size };
  const hint = [plain(error), plain(description), accessibilityHint].filter(Boolean).join(". ");

  return (
    <View style={[s.root, { opacity: disabled ? 0.55 : 1 }, apply(slots?.root, st), apply(style, st)]}>
      {label ? (
        <Text nativeID={`${id}-label`} style={[s.label, apply(slots?.label, st)]}>
          {label}
          {required && <Text style={s.required}> *</Text>}
        </Text>
      ) : null}

      {/* Codes read left to right in every language. */}
      <View style={[s.cells, { direction: "ltr" }, apply(slots?.cells, st)]}>
        {Array.from({ length }, (_, index) => {
          const char = value[index];
          const isActive = index === active;
          const cellState: OtpStyleState = { ...st, index, filled: Boolean(char), active: isActive };
          return (
            <Fragment key={index}>
              <View
                aria-hidden
                style={[
                  s.cell,
                  {
                    width: cell,
                    height: Math.round(cell * 1.15),
                    borderColor: invalid ? tokens.danger : isActive ? tokens.focus : tokens.borderControl,
                    backgroundColor: readOnly ? tokens.readonlyBg : tokens.inputBg,
                    outlineColor: alpha(invalid ? tokens.danger : tokens.focus, 0.3),
                    outlineWidth: isActive ? 3 : 0,
                    outlineStyle: "solid",
                  },
                  apply(slots?.cell, cellState),
                ]}
              >
                {char ? (
                  <Text style={[s.char, { fontSize: Math.round(cell * 0.45) }]}>{mask ? "•" : char}</Text>
                ) : isActive ? (
                  <Caret height={Math.round(cell * 0.45)} style={s.caret} />
                ) : null}
              </View>
              {separators.has(index) && <View aria-hidden style={[s.separator, apply(slots?.separator, st)]} />}
            </Fragment>
          );
        })}

        <TextInput
          {...inputProps}
          ref={inputRef}
          value={value}
          onChangeText={change}
          editable={!disabled && !readOnly}
          // No maxLength: it would cut a paste such as "123-456" to "123-45"
          // before `change` could strip the dash. sanitizeOtp caps the length.
          keyboardType={mode === "numeric" ? "number-pad" : "default"}
          inputMode={mode === "numeric" ? "numeric" : "text"}
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
          autoCorrect={false}
          autoCapitalize={uppercase ? "characters" : "none"}
          spellCheck={false}
          caretHidden
          contextMenuHidden={false}
          selection={{ start: value.length, end: value.length }}
          secureTextEntry={mask}
          aria-label={ariaLabel ?? plain(label) ?? text.otpLabel}
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
          style={s.input}
        />
      </View>

      {description ? <Text style={[s.description, apply(slots?.description, st)]}>{description}</Text> : null}
      {error ? (
        <Text role="alert" aria-live="polite" style={[s.error, apply(slots?.error, st)]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
