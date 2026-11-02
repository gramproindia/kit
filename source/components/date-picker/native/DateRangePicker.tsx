import { useCallback, useImperativeHandle, useMemo, type Ref } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { useControllableState } from "../../shared/react/useControllableState";
import { normalizeRange, toDate } from "../core/calendar";
import { inputPlaceholder } from "../core/format";
import { defaultDatePickerText } from "../core/locale";
import type { DateInput, DateRange } from "../core/types";
import { CalendarView } from "./CalendarView";
import { Field } from "./Field";
import type { DatePickerHandle, DatePickerSharedProps } from "./props";
import { formatWith, useCalendar } from "./useCalendar";
import { useOpen } from "./useOpen";

/** A range as it comes in from props: each end may be a Date, an ISO string or a timestamp. */
export interface DateRangeInput {
  start: DateInput | null;
  end: DateInput | null;
}

/** A shortcut shown above the calendar ("Last 7 days"). */
export interface DatePreset {
  label: string;
  range: { start: DateInput | null; end: DateInput | null };
}

export interface DateRangePickerProps extends DatePickerSharedProps {
  value?: DateRangeInput | null;
  defaultValue?: DateRangeInput | null;
  /** `complete` is false on the first of the two taps. */
  onChange?(range: DateRange, complete: boolean): void;
  presets?: readonly DatePreset[];
  /** Close once both ends are chosen. Default true. */
  closeOnSelect?: boolean;
  ref?: Ref<DatePickerHandle<DateRange>>;
}

const EMPTY: DateRange = { start: null, end: null };
const toRange = (input: DateRangeInput | null | undefined): DateRange => ({
  start: toDate(input?.start),
  end: toDate(input?.end),
});

const themed = createThemedStyles((t) => ({
  presets: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 4 },
  preset: {
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: t.border,
  },
  presetText: { fontSize: t.fontSize - 1, color: t.fg },
}));

/** Two dates in one field: tap the start, then the end. */
export function DateRangePicker(props: DateRangePickerProps) {
  const {
    ref,
    value,
    defaultValue,
    onChange,
    presets,
    closeOnSelect = true,
    min,
    max,
    isDateDisabled,
    locale,
    weekStartsOn,
    format,
    numberOfMonths = 1,
    showWeekNumbers = false,
    showToday = false,
    fixedWeeks = true,
    label,
    description,
    error,
    placeholder,
    required = false,
    disabled = false,
    readOnly = false,
    clearable = true,
    size = "md",
    presentation,
    style,
    styles,
    localeText,
    onOpenChange,
  } = props;

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultDatePickerText, ...localeText }), [localeText]);
  const minDate = useMemo(() => toDate(min), [min]);
  const maxDate = useMemo(() => toDate(max), [max]);
  const controlled = useMemo(() => (value === undefined ? undefined : toRange(value)), [value]);
  const [selection, setSelection] = useControllableState<DateRange>(controlled, () =>
    defaultValue ? toRange(defaultValue) : EMPTY,
  );
  const [open, setOpen] = useOpen(onOpenChange);
  const editable = !disabled && !readOnly;

  const commit = useCallback(
    (next: DateRange, complete: boolean) => {
      setSelection(next);
      onChange?.(next, complete);
    },
    [setSelection, onChange],
  );

  const calendar = useCalendar({
    range: true,
    selection,
    onPick: (next, complete) => {
      if (!editable) return;
      commit(next, complete);
      if (complete && closeOnSelect) setOpen(false);
    },
    min: minDate,
    max: maxDate,
    isDateDisabled,
    locale,
    weekStartsOn,
    numberOfMonths,
    fixedWeeks,
  });

  const show = useCallback(() => {
    if (disabled) return;
    calendar.reset(selection.start);
    setOpen(true);
  }, [disabled, calendar, selection.start, setOpen]);

  const clear = useCallback(() => {
    if (editable) commit(EMPTY, true);
  }, [editable, commit]);

  const apply = useCallback(
    (next: DateRange) => {
      if (!editable) return;
      const settled = next.start && next.end ? normalizeRange(next) : next;
      calendar.reset(settled.start);
      commit(settled, true);
    },
    [editable, calendar, commit],
  );

  useImperativeHandle(
    ref,
    () => ({
      open: show,
      close: () => setOpen(false),
      toggle: () => (open ? setOpen(false) : show()),
      focus: show,
      clear,
      setValue: (next) => apply(typeof next === "string" || next === null ? EMPTY : toRange(next)),
      getValue: () => selection,
    }),
    [show, setOpen, open, clear, apply, selection],
  );

  const format1 = (date: Date | null) => (date ? formatWith(date, format, locale) : "");
  const display =
    selection.start || selection.end ? `${format1(selection.start)} – ${format1(selection.end)}` : "";
  const hint = inputPlaceholder(locale);

  return (
    <Field
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      size={size}
      display={display}
      placeholder={placeholder ?? `${hint} – ${hint}`}
      clearable={clearable}
      clearLabel={text.clear}
      openLabel={text.openCalendar}
      calendarLabel={text.calendarLabel}
      open={open}
      onOpen={show}
      onDismiss={() => setOpen(false)}
      onClear={clear}
      presentation={presentation}
      style={style}
      styles={styles}
    >
      {presets && presets.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} aria-label={text.presets}>
          <View style={s.presets}>
            {presets.map((preset) => (
              <Pressable
                key={preset.label}
                role="button"
                onPress={() => {
                  apply({ start: toDate(preset.range.start), end: toDate(preset.range.end) });
                  if (closeOnSelect) setOpen(false);
                }}
                style={({ pressed }) => [s.preset, pressed && { backgroundColor: tokens.hover }]}
              >
                <Text style={s.presetText}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
      <CalendarView
        calendar={calendar}
        text={text}
        locale={locale}
        showToday={showToday}
        showWeekNumbers={showWeekNumbers}
        onClear={clearable && (selection.start || selection.end) && editable ? clear : undefined}
        styles={styles}
      />
    </Field>
  );
}
