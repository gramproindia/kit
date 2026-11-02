import { useCallback, useImperativeHandle, useMemo, type Ref } from "react";
import { useControllableState } from "../../shared/react/useControllableState";
import { toDate } from "../core/calendar";
import { inputPlaceholder } from "../core/format";
import { defaultDatePickerText } from "../core/locale";
import type { DateInput, DateRange } from "../core/types";
import { CalendarView } from "./CalendarView";
import { Field } from "./Field";
import type { DatePickerHandle, DatePickerSharedProps } from "./props";
import { formatWith, useCalendar } from "./useCalendar";
import { useOpen } from "./useOpen";

export interface DatePickerProps extends DatePickerSharedProps {
  value?: DateInput | null;
  defaultValue?: DateInput | null;
  /** The chosen day as a `Date` at local midnight, or `null` once cleared. */
  onChange?(date: Date | null): void;
  /** Close the calendar after choosing a date. Default true. */
  closeOnSelect?: boolean;
  ref?: Ref<DatePickerHandle<Date | null>>;
}

/** A single date field that opens a calendar: a sheet on a phone, a panel on a tablet. */
export function DatePicker(props: DatePickerProps) {
  const {
    ref,
    value,
    defaultValue,
    onChange,
    closeOnSelect = true,
    min,
    max,
    isDateDisabled,
    locale,
    weekStartsOn,
    format,
    numberOfMonths = 1,
    showWeekNumbers = false,
    showToday = true,
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

  const text = useMemo(() => ({ ...defaultDatePickerText, ...localeText }), [localeText]);
  const minDate = useMemo(() => toDate(min), [min]);
  const maxDate = useMemo(() => toDate(max), [max]);
  const controlled = useMemo(() => (value === undefined ? undefined : toDate(value)), [value]);
  const [selected, setSelected] = useControllableState<Date | null>(controlled, () => toDate(defaultValue));
  const [open, setOpen] = useOpen(onOpenChange);
  const editable = !disabled && !readOnly;

  const commit = useCallback(
    (date: Date | null) => {
      setSelected(date);
      onChange?.(date);
    },
    [setSelected, onChange],
  );

  const selection = useMemo<DateRange>(() => ({ start: selected, end: null }), [selected]);
  const calendar = useCalendar({
    range: false,
    selection,
    onPick: (next) => {
      if (!editable) return;
      commit(next.start);
      if (closeOnSelect) setOpen(false);
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
    calendar.reset(selected);
    setOpen(true);
  }, [disabled, calendar, selected, setOpen]);

  const clear = useCallback(() => {
    if (editable) commit(null);
  }, [editable, commit]);

  useImperativeHandle(
    ref,
    () => ({
      open: show,
      close: () => setOpen(false),
      toggle: () => (open ? setOpen(false) : show()),
      focus: show,
      clear,
      setValue: (next) => {
        if (editable) commit(toDate(next as DateInput));
      },
      getValue: () => selected,
    }),
    [show, setOpen, open, clear, editable, commit, selected],
  );

  return (
    <Field
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      size={size}
      display={selected ? formatWith(selected, format, locale) : ""}
      placeholder={placeholder ?? inputPlaceholder(locale)}
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
      <CalendarView
        calendar={calendar}
        text={text}
        locale={locale}
        showToday={showToday}
        showWeekNumbers={showWeekNumbers}
        onClear={clearable && selected && editable ? clear : undefined}
        styles={styles}
      />
    </Field>
  );
}
