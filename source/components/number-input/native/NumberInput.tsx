import {
  useCallback,
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
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { CloseGlyph } from "../../shared/native/glyphs";
import { KitIcon } from "../../shared/native/icons";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { alpha } from "../../shared/native/theme";
import { formatNumber } from "../core/format";
import { defaultNumberInputText } from "../core/locale";
import { parseNumber, toEditText } from "../core/parse";
import { clamp, round, shiftDecimal, snapToStep, stepBy } from "../core/step";
import type { ClampBehavior, NumberInputLocaleText, NumberSize, NumberStyle } from "../core/types";

type TextInputInstance = ComponentRef<typeof TextInput>;

/** Press and hold: the wait before repeating, then the gap between repeats. */
const REPEAT_DELAY = 400;
const REPEAT_INTERVAL = 60;

const HEIGHT: Record<NumberSize, number> = { sm: 36, md: 44, lg: 52 };

export type NumberInputSlot = "root" | "label" | "control" | "input" | "stepper" | "description" | "error";

/** What `style` and `styles` callbacks receive: the native stand-in for `data-*`. */
export interface NumberInputStyleState {
  focused: boolean;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
  size: NumberSize;
}

type Styleable<S> = StyleProp<S> | ((state: NumberInputStyleState) => StyleProp<S>);

export interface NumberInputProps
  extends Omit<
    TextInputProps,
    "value" | "defaultValue" | "style" | "editable" | "onChangeText" | "keyboardType" | "inputMode"
  > {
  /** The number, or `null` for an empty field (controlled). */
  value?: number | null;
  defaultValue?: number | null;
  /** Fires with the parsed number, or `null` when the field is emptied. */
  onValueChange?(value: number | null): void;
  /** Smallest accepted value, applied on blur by default (see `clampBehavior`). */
  min?: number;
  /** Largest accepted value, applied the same way as `min`. */
  max?: number;
  /** How much one stepper press moves. Default 1. */
  step?: number;
  /** Kept for API parity; touch has no Page Up / Page Down. Default ten steps. */
  largeStep?: number;
  /** Round every committed value onto the step grid, counting from `min`. */
  snapToStep?: boolean;
  /** Fraction digits to show, and to round to. */
  decimals?: number;
  /** BCP 47 tag deciding the separators and digits, for reading and showing. */
  locale?: string;
  /** Default `decimal`. `percent` shows 0.45 as 45%, as `Intl` does. */
  format?: NumberStyle;
  /** ISO 4217 code, for `format="currency"`. */
  currency?: string;
  /** Thousands separators while the field is not being edited. Default true. */
  useGrouping?: boolean;
  /** When a value outside the limits is pulled back. Default `blur`. */
  clampBehavior?: ClampBehavior;
  /** The − and + buttons. Default true. */
  stepper?: boolean;
  /** A button that empties the field. */
  clearable?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  /** The validation message; also marks the field invalid. */
  error?: ReactNode;
  /** Default `md`. */
  size?: NumberSize;
  /** Before the number: a currency symbol, a unit. */
  leading?: ReactNode;
  /** After the number: a unit, a suffix. */
  trailing?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  /** Marks the label with an asterisk. */
  required?: boolean;
  style?: Styleable<ViewStyle>;
  styles?: Partial<{
    root: Styleable<ViewStyle>;
    label: Styleable<TextStyle>;
    control: Styleable<ViewStyle>;
    input: Styleable<TextStyle>;
    stepper: Styleable<ViewStyle>;
    description: Styleable<TextStyle>;
    error: Styleable<TextStyle>;
  }>;
  localeText?: Partial<NumberInputLocaleText>;
  /** The `TextInput`. */
  ref?: Ref<TextInputInstance>;
}

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
    paddingLeft: 12,
    overflow: "hidden",
  },
  input: { flex: 1, alignSelf: "stretch", padding: 0, color: t.fg, fontVariant: ["tabular-nums"] },
  adornmentText: { color: t.muted, fontSize: t.fontSize },
  iconButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  stepper: { flexDirection: "row", alignSelf: "stretch", borderLeftWidth: 1, borderColor: t.border },
  step: { width: 44, alignItems: "center", justifyContent: "center" },
  stepDivider: { borderLeftWidth: 1, borderColor: t.border },
  description: { color: t.muted, fontSize: t.fontSize - 2 },
  error: { color: t.danger, fontSize: t.fontSize - 2 },
}));

function apply<S>(value: Styleable<S> | undefined, state: NumberInputStyleState): StyleProp<S> {
  return typeof value === "function"
    ? (value as (state: NumberInputStyleState) => StyleProp<S>)(state)
    : (value as StyleProp<S>);
}

const plain = (node: ReactNode) =>
  typeof node === "string" || typeof node === "number" ? String(node) : undefined;

/** + and −: the app's `plus`/`minus` icons if KitProvider has them, else drawn. */
function StepGlyph({ plus, color }: { plus: boolean; color: string }) {
  return (
    <KitIcon name={plus ? "plus" : "minus"} size={14} color={color} fallback={<DrawnStep plus={plus} color={color} />} />
  );
}

/** + and −, drawn so no icon font is needed. */
function DrawnStep({ plus, color }: { plus: boolean; color: string }) {
  return (
    <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }} aria-hidden>
      <View style={{ position: "absolute", width: 14, height: 2, borderRadius: 1, backgroundColor: color }} />
      {plus && <View style={{ position: "absolute", width: 2, height: 14, borderRadius: 1, backgroundColor: color }} />}
    </View>
  );
}

/**
 * A numeric field that reads and writes numbers the way the locale does:
 * `1.234,56` in German, `12,34,567` in India. Parsing, stepping and
 * formatting are the web field's core, unchanged.
 */
export function NumberInput(props: NumberInputProps) {
  const {
    ref,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    min,
    max,
    step = 1,
    largeStep: _largeStep,
    snapToStep: snap = false,
    decimals,
    locale,
    format = "decimal",
    currency,
    useGrouping = true,
    clampBehavior = "blur",
    stepper = true,
    clearable = false,
    label,
    description,
    error,
    size = "md",
    leading,
    trailing,
    disabled = false,
    readOnly = false,
    required,
    placeholder,
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
  const text = useMemo(() => ({ ...defaultNumberInputText, ...localeText }), [localeText]);
  const inputRef = useRef<TextInputInstance>(null);
  useImperativeHandle(ref, () => inputRef.current as TextInputInstance, []);

  const controlled = valueProp !== undefined;
  const [own, setOwn] = useState<number | null>(defaultValue);
  const value = controlled ? valueProp : own;
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const formatOptions = useMemo(
    () => ({ locale, style: format, currency, decimals, useGrouping }),
    [locale, format, currency, decimals, useGrouping],
  );

  // A percentage is edited in the units it is shown in: 45 for 45%, while the
  // value stays 0.45. Typing 45 must not mean 4,500%.
  const editPower = format === "percent" ? 2 : 0;
  const readTyped = useCallback(
    (typed: string): number | null => {
      const parsed = parseNumber(typed, locale, format === "currency" ? currency : undefined);
      return parsed === null ? null : shiftDecimal(parsed, -editPower);
    },
    [locale, format, currency, editPower],
  );

  // Formatted at rest, plain while being edited.
  const shown =
    draft ??
    (focused
      ? toEditText(value === null ? null : shiftDecimal(value, editPower), locale)
      : formatNumber(value, formatOptions));

  const commit = useCallback(
    (next: number | null) => {
      if (!controlled) setOwn(next);
      if (next !== value) onValueChange?.(next);
    },
    [controlled, value, onValueChange],
  );

  /** Rounds, snaps and clamps a raw number into what the field will hold. */
  const settle = useCallback(
    (raw: number): number => {
      // `decimals` counts the digits shown, two places on for a percentage.
      let next = decimals === undefined ? raw : round(raw, decimals + editPower);
      if (snap) next = snapToStep(next, { step, min, max });
      if (clampBehavior !== "none") next = clamp(next, min, max);
      return next;
    },
    [decimals, editPower, snap, step, min, max, clampBehavior],
  );

  const handleChange = (typed: string) => {
    setDraft(typed);
    const parsed = readTyped(typed);
    if (parsed === null) {
      if (typed.trim() === "") commit(null);
      return;
    }
    commit(clampBehavior === "strict" ? clamp(parsed, min, max) : parsed);
  };

  const applyStep = useCallback(
    (direction: 1 | -1, amount = step) => {
      if (disabled || readOnly) return;
      const from = draft === null ? value : (readTyped(draft) ?? value);
      const next = stepBy(from, direction, { step: amount, min, max });
      setDraft(null);
      commit(snap ? snapToStep(next, { step, min, max }) : next);
    },
    [disabled, readOnly, draft, value, readTyped, step, min, max, snap, commit],
  );

  // Press and hold repeats. The timer reads the latest step function through a
  // ref; the one captured at the press would step from a stale value forever.
  const latestStep = useRef(applyStep);
  useEffect(() => {
    latestStep.current = applyStep;
  }, [applyStep]);
  const repeat = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const repeating = useRef<1 | -1 | null>(null);
  const stopRepeat = useCallback(() => {
    clearTimeout(repeat.current);
    repeat.current = undefined;
    repeating.current = null;
  }, []);
  useEffect(() => stopRepeat, [stopRepeat]);
  const startRepeat = (direction: 1 | -1) => {
    // A second press before the first was released must not leave a timer behind.
    stopRepeat();
    applyStep(direction);
    repeating.current = direction;
    const tick = () => {
      latestStep.current(direction);
      repeat.current = setTimeout(tick, REPEAT_INTERVAL);
    };
    repeat.current = setTimeout(tick, REPEAT_DELAY);
  };

  const invalid = Boolean(error);
  const atMin = value !== null && min !== undefined && value <= min;
  const atMax = value !== null && max !== undefined && value >= max;
  // A Pressable disabled at the limit may never get its onPressOut, so the
  // repeat is stopped here rather than left running until unmount.
  useEffect(() => {
    const direction = repeating.current;
    if (direction !== null && (disabled || readOnly || (direction === 1 ? atMax : atMin))) stopRepeat();
  }, [disabled, readOnly, atMax, atMin, stopRepeat]);
  const st: NumberInputStyleState = { focused, disabled, readOnly, invalid, size };
  const fontSize = size === "sm" ? tokens.fontSize - 1 : size === "lg" ? tokens.fontSize + 1 : tokens.fontSize;
  const border = invalid ? tokens.danger : focused ? tokens.focus : tokens.borderControl;
  const hint = [plain(error), plain(description), accessibilityHint].filter(Boolean).join(". ");
  const integerOnly = min !== undefined && min >= 0 && decimals === 0;
  // iOS's number pads have no minus key; where a value can go below zero it
  // gets numbers-and-punctuation instead. Android's "numeric" pad has one.
  const signed = min === undefined || min < 0;
  const keyboardType: TextInputProps["keyboardType"] = integerOnly
    ? "number-pad"
    : signed
      ? Platform.OS === "ios"
        ? "numbers-and-punctuation"
        : "numeric"
      : "decimal-pad";

  const stepButton = (direction: 1 | -1) => {
    const blocked = disabled || (direction === 1 ? atMax : atMin);
    return (
      <Pressable
        role="button"
        aria-label={direction === 1 ? text.increment : text.decrement}
        aria-disabled={blocked || undefined}
        disabled={blocked}
        onPressIn={() => startRepeat(direction)}
        onPressOut={stopRepeat}
        style={({ pressed }) => [
          s.step,
          direction === 1 && s.stepDivider,
          pressed && { backgroundColor: tokens.hover },
          { opacity: blocked ? 0.35 : 1 },
        ]}
      >
        <StepGlyph plus={direction === 1} color={tokens.fg} />
      </Pressable>
    );
  };

  return (
    <View style={[s.root, { opacity: disabled ? 0.55 : 1 }, apply(slots?.root, st), apply(style, st)]}>
      {label ? (
        <Text nativeID={`${id}-label`} style={[s.label, apply(slots?.label, st)]}>
          {label}
          {required && <Text style={s.required}> *</Text>}
        </Text>
      ) : null}

      <Pressable
        onPress={() => inputRef.current?.focus()}
        disabled={disabled}
        accessible={false}
        style={[
          s.control,
          {
            minHeight: Math.max(HEIGHT[size], size === "sm" ? 0 : tokens.touchTarget),
            paddingRight: stepper && !readOnly ? 0 : 12,
            borderColor: border,
            backgroundColor: readOnly ? tokens.readonlyBg : tokens.inputBg,
            outlineColor: alpha(invalid ? tokens.danger : tokens.focus, 0.3),
            outlineWidth: focused ? 3 : 0,
            outlineStyle: "solid",
          },
          apply(slots?.control, st),
        ]}
      >
        {leading ? (plain(leading) ? <Text style={s.adornmentText}>{leading}</Text> : leading) : null}
        <TextInput
          {...inputProps}
          ref={inputRef}
          value={shown}
          onChangeText={handleChange}
          editable={!disabled && !readOnly}
          keyboardType={keyboardType}
          autoCorrect={false}
          autoComplete="off"
          placeholder={placeholder}
          placeholderTextColor={tokens.muted}
          selectionColor={tokens.accent}
          // A spin button: VoiceOver / TalkBack swipe up and down to step.
          role="spinbutton"
          aria-label={ariaLabel ?? plain(label)}
          aria-labelledby={label && !plain(label) ? `${id}-label` : undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value ?? undefined}
          aria-valuetext={value === null ? undefined : formatNumber(value, formatOptions)}
          aria-disabled={disabled || undefined}
          accessibilityHint={hint || undefined}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "increment") applyStep(1);
            if (event.nativeEvent.actionName === "decrement") applyStep(-1);
          }}
          onFocus={(event) => {
            setFocused(true);
            setDraft(null);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            const typed = draft;
            setDraft(null);
            onBlur?.(event);
            if (typed === null) return;
            if (typed.trim() === "") {
              commit(null);
              return;
            }
            // Something unreadable falls back to the last number held.
            const parsed = readTyped(typed);
            if (parsed !== null) commit(settle(parsed));
          }}
          style={[s.input, { fontSize, minHeight: HEIGHT[size] - 2 }, apply(slots?.input, st)]}
        />
        {clearable && shown !== "" && !disabled && !readOnly && (
          <Pressable
            role="button"
            aria-label={text.clear}
            hitSlop={6}
            onPress={() => {
              setDraft(null);
              commit(null);
            }}
            style={({ pressed }) => [s.iconButton, pressed && { backgroundColor: tokens.hover }]}
          >
            <CloseGlyph size={12} color={tokens.muted} />
          </Pressable>
        )}
        {trailing ? (plain(trailing) ? <Text style={s.adornmentText}>{trailing}</Text> : trailing) : null}
        {stepper && !readOnly && (
          <View style={[s.stepper, apply(slots?.stepper, st)]}>
            {stepButton(-1)}
            {stepButton(1)}
          </View>
        )}
      </Pressable>

      {description ? <Text style={[s.description, apply(slots?.description, st)]}>{description}</Text> : null}
      {error ? (
        <Text role="alert" aria-live="polite" style={[s.error, apply(slots?.error, st)]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
