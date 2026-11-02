import { useRef, type ComponentRef, type ReactNode } from "react";
import { Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { Anchored, usePresentation } from "../../shared/native/Anchored";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { CloseGlyph } from "../../shared/native/glyphs";
import { renderText } from "../../shared/native/primitives";
import { Sheet } from "../../shared/native/Sheet";
import { alpha } from "../../shared/native/theme";
import type { DatePickerSize } from "../core/types";

/** Style slots: the web's `classNames` keys, as native styles. */
export interface DatePickerStyles {
  root?: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
  control?: StyleProp<ViewStyle>;
  input?: StyleProp<TextStyle>;
  popover?: StyleProp<ViewStyle>;
  calendar?: StyleProp<ViewStyle>;
  day?: StyleProp<ViewStyle>;
  dayText?: StyleProp<TextStyle>;
  footer?: StyleProp<ViewStyle>;
}

const HEIGHT: Record<DatePickerSize, number> = { sm: 36, md: 44, lg: 52 };

const themed = createThemedStyles((t) => ({
  root: { gap: 6 },
  label: { fontSize: t.fontSize - 1, fontWeight: "600", color: t.fg },
  required: { color: t.danger },
  control: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: t.radius,
    backgroundColor: t.inputBg,
  },
  value: { flex: 1, fontSize: t.fontSize, color: t.fg },
  placeholder: { color: t.muted },
  clear: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  description: { fontSize: t.fontSize - 2, color: t.muted },
  error: { fontSize: t.fontSize - 2, color: t.danger },
}));

/** A calendar icon drawn with Views: a box with a heavier top edge and two rings. */
function CalendarGlyph({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18, justifyContent: "flex-end" }} aria-hidden>
      <View style={{ height: 15, borderWidth: 1.5, borderTopWidth: 4, borderColor: color, borderRadius: 3 }} />
      <View style={{ position: "absolute", top: 0, left: 4, width: 2, height: 5, borderRadius: 1, backgroundColor: color }} />
      <View style={{ position: "absolute", top: 0, right: 4, width: 2, height: 5, borderRadius: 1, backgroundColor: color }} />
    </View>
  );
}

interface FieldProps {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  size: DatePickerSize;
  /** The chosen value, formatted; empty shows the placeholder. */
  display: string;
  placeholder: string;
  clearable: boolean;
  clearLabel: string;
  openLabel: string;
  calendarLabel: string;
  open: boolean;
  onOpen(): void;
  onDismiss(): void;
  onClear(): void;
  presentation?: "auto" | "sheet" | "popover";
  style?: StyleProp<ViewStyle>;
  styles?: DatePickerStyles;
  /** The calendar panel. */
  children: ReactNode;
}

/**
 * The part every picker shares: label, a field that opens the calendar,
 * the clear button, description and error, and the panel itself, as a sheet
 * on a phone and anchored to the field on a tablet.
 */
export function Field(props: FieldProps) {
  const {
    label,
    description,
    error,
    required,
    disabled,
    readOnly,
    size,
    display,
    placeholder,
    clearable,
    clearLabel,
    openLabel,
    calendarLabel,
    open,
    onOpen,
    onDismiss,
    onClear,
    presentation,
    style,
    styles: slots,
    children,
  } = props;
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const mode = usePresentation(presentation);
  const controlRef = useRef<ComponentRef<typeof View>>(null);
  const invalid = Boolean(error);
  const hasValue = display !== "";
  const labelText = typeof label === "string" ? label : undefined;

  return (
    <View style={[s.root, slots?.root, style]}>
      {label !== undefined && (
        <Text style={[s.label, slots?.label]}>
          {label}
          {required && <Text style={s.required}> *</Text>}
        </Text>
      )}
      <View ref={controlRef} collapsable={false}>
        <Pressable
          role="button"
          accessibilityLabel={[labelText, hasValue ? display : placeholder].filter(Boolean).join(", ")}
          accessibilityHint={openLabel}
          aria-expanded={open}
          aria-disabled={disabled || readOnly || undefined}
          aria-invalid={invalid || undefined}
          disabled={disabled || readOnly}
          onPress={onOpen}
          style={({ pressed }) => [
            s.control,
            {
              minHeight: Math.max(HEIGHT[size], size === "sm" ? 0 : tokens.touchTarget),
              borderColor: invalid ? tokens.danger : open ? tokens.focus : tokens.borderControl,
              backgroundColor: readOnly ? tokens.readonlyBg : pressed ? alpha(tokens.fg, 0.03) : tokens.inputBg,
              opacity: disabled ? 0.5 : 1,
            },
            open && { outlineWidth: 3, outlineColor: alpha(invalid ? tokens.danger : tokens.focus, 0.25) },
            slots?.control,
          ]}
        >
          <Text style={[s.value, !hasValue && s.placeholder, slots?.input]} numberOfLines={1}>
            {hasValue ? display : placeholder}
          </Text>
          {clearable && hasValue && !disabled && !readOnly && (
            <Pressable role="button" accessibilityLabel={clearLabel} onPress={onClear} hitSlop={6} style={s.clear}>
              <CloseGlyph size={12} color={tokens.muted} />
            </Pressable>
          )}
          <CalendarGlyph color={tokens.muted} />
        </Pressable>
      </View>
      {description !== undefined && renderText(description, s.description)}
      {invalid && (
        <View role="alert" aria-live="polite">
          {renderText(error, s.error)}
        </View>
      )}

      {mode === "sheet" ? (
        <Sheet open={open} onDismiss={onDismiss} title={labelText ?? calendarLabel} style={slots?.popover}>
          {children}
        </Sheet>
      ) : (
        <Anchored
          open={open}
          onDismiss={onDismiss}
          anchorRef={controlRef}
          align="start"
          style={[{ width: 340 }, slots?.popover]}
        >
          {children}
        </Anchored>
      )}
    </View>
  );
}
