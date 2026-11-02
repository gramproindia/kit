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
import { defaultTextareaText } from "../core/locale";
import { fitHeight, heightForRows } from "../core/size";
import type { FieldSize, TextareaLocaleText } from "../core/types";

type TextInputInstance = ComponentRef<typeof TextInput>;

export type TextareaSlot = "root" | "label" | "textarea" | "description" | "error" | "count";

/** What `style` and `styles` callbacks receive: the native stand-in for `data-*`. */
export interface TextareaStyleState {
  focused: boolean;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
  size: FieldSize;
}

type Styleable<S> = StyleProp<S> | ((state: TextareaStyleState) => StyleProp<S>);

export interface TextareaProps
  extends Omit<TextInputProps, "value" | "defaultValue" | "style" | "editable" | "multiline"> {
  value?: string;
  defaultValue?: string;
  /** The new text on every change. `onChangeText` fires as well. */
  onValueChange?(value: string): void;
  /** The field's name, shown above it. */
  label?: ReactNode;
  /** A hint under the field, read as the field's hint. */
  description?: ReactNode;
  /** Message below the field; also marks it invalid. */
  error?: ReactNode;
  /** Default `md`. */
  size?: FieldSize;
  /** Height in rows when not auto-resizing. Default 3. */
  rows?: number;
  /** Grow and shrink with the text, between `minRows` and `maxRows`. Default false. */
  autoResize?: boolean;
  /** Smallest height in rows. Default `rows`, or 3. */
  minRows?: number;
  /** Largest height in rows before the text scrolls. No limit by default. */
  maxRows?: number;
  /** A character counter; shows `count / maxLength` when `maxLength` is set. */
  showCount?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Marks the label with an asterisk. Native has no form validation of its own. */
  required?: boolean;
  style?: Styleable<ViewStyle>;
  styles?: Partial<{
    root: Styleable<ViewStyle>;
    label: Styleable<TextStyle>;
    textarea: Styleable<TextStyle>;
    description: Styleable<TextStyle>;
    error: Styleable<TextStyle>;
    count: Styleable<TextStyle>;
  }>;
  localeText?: Partial<TextareaLocaleText>;
  /** The `TextInput`. */
  ref?: Ref<TextInputInstance>;
}

const PADDING_Y = 10;
const BORDER = 1;

const themed = createThemedStyles((t) => ({
  root: { gap: 6 },
  label: { color: t.fg, fontSize: t.fontSize - 1, fontWeight: "600" },
  required: { color: t.danger },
  textarea: {
    borderWidth: BORDER,
    borderRadius: t.radius,
    paddingHorizontal: 12,
    paddingVertical: PADDING_Y,
    color: t.fg,
    textAlignVertical: "top",
  },
  footer: { flexDirection: "row", gap: 12 },
  description: { flex: 1, color: t.muted, fontSize: t.fontSize - 2 },
  count: { marginLeft: "auto", color: t.muted, fontSize: t.fontSize - 2, fontVariant: ["tabular-nums"] },
  error: { color: t.danger, fontSize: t.fontSize - 2 },
}));

function apply<S>(value: Styleable<S> | undefined, state: TextareaStyleState): StyleProp<S> {
  return typeof value === "function"
    ? (value as (state: TextareaStyleState) => StyleProp<S>)(state)
    : (value as StyleProp<S>);
}

function plain(node: ReactNode): string | undefined {
  return typeof node === "string" || typeof node === "number" ? String(node) : undefined;
}

/**
 * A multi-line text field with label, hint, error, character counter and
 * auto-resize. Every other prop goes to the `TextInput`.
 */
export function Textarea(props: TextareaProps) {
  const {
    ref,
    value: valueProp,
    defaultValue,
    onChangeText,
    onValueChange,
    label,
    description,
    error,
    size = "md",
    rows,
    autoResize = false,
    minRows,
    maxRows,
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
    onContentSizeChange,
    "aria-label": ariaLabel,
    accessibilityHint,
    ...inputProps
  } = props;

  const id = useId();
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultTextareaText, ...localeText }), [localeText]);
  const inputRef = useRef<TextInputInstance>(null);
  useImperativeHandle(ref, () => inputRef.current as TextInputInstance, []);

  // Mirrors the text even when uncontrolled, for the counter.
  const [current, setCurrent] = useControllableState(valueProp, defaultValue ?? "");
  const [focused, setFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const fontSize = size === "sm" ? tokens.fontSize - 1 : size === "lg" ? tokens.fontSize + 1 : tokens.fontSize;
  const metrics = {
    lineHeight: Math.round(fontSize * 1.4),
    paddingBlock: PADDING_Y * 2,
    borderBlock: BORDER * 2,
  };
  const floor = Math.max(1, minRows ?? rows ?? 3);
  // Same maths as the web: `contentSize.height` stands in for `scrollHeight`
  // (content plus padding), and the result is the border-box height.
  const sized = autoResize
    ? fitHeight(contentHeight + metrics.paddingBlock, metrics, floor, maxRows)
    : { height: heightForRows(rows ?? floor, metrics), overflow: true };

  const change = (next: string) => {
    setCurrent(next);
    onChangeText?.(next);
    onValueChange?.(next);
  };

  const invalid = Boolean(error);
  const count = countCharacters(current);
  const st: TextareaStyleState = { focused, disabled, readOnly, invalid, size };
  const hint = [plain(error), plain(description), accessibilityHint].filter(Boolean).join(". ");

  return (
    <View style={[s.root, { opacity: disabled ? 0.55 : 1 }, apply(slots?.root, st), apply(style, st)]}>
      {label ? (
        <Pressable accessible={false} onPress={() => inputRef.current?.focus()}>
          <Text nativeID={`${id}-label`} style={[s.label, apply(slots?.label, st)]}>
            {label}
            {required && <Text style={s.required}> *</Text>}
          </Text>
        </Pressable>
      ) : null}

      <TextInput
        {...inputProps}
        ref={inputRef}
        multiline
        value={current}
        onChangeText={change}
        editable={!disabled && !readOnly}
        maxLength={maxLength}
        scrollEnabled={sized.overflow}
        placeholderTextColor={tokens.muted}
        selectionColor={tokens.accent}
        aria-label={ariaLabel ?? plain(label)}
        aria-labelledby={label && !plain(label) ? `${id}-label` : undefined}
        aria-disabled={disabled || undefined}
        accessibilityHint={hint || undefined}
        onContentSizeChange={(event) => {
          setContentHeight(event.nativeEvent.contentSize.height);
          onContentSizeChange?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          s.textarea,
          {
            fontSize,
            lineHeight: metrics.lineHeight,
            height: sized.height,
            borderColor: invalid ? tokens.danger : focused ? tokens.focus : tokens.borderControl,
            backgroundColor: readOnly ? tokens.readonlyBg : tokens.inputBg,
            outlineColor: alpha(invalid ? tokens.danger : tokens.focus, 0.3),
            outlineWidth: focused ? 3 : 0,
            outlineStyle: "solid",
          },
          apply(slots?.textarea, st),
        ]}
      />

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
