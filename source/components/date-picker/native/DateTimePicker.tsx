import { useCallback, useImperativeHandle, useMemo, useState, type Ref } from "react";
import { Pressable, Text } from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { useControllableState } from "../../shared/react/useControllableState";
import { startOfDay } from "../core/calendar";
import { defaultDatePickerText } from "../core/locale";
import {
  clampDateTime,
  dateTimePlaceholder,
  dayPeriodNames,
  formatDateTime,
  hourCycleOf,
  parseTime,
  timeOf,
  toDateTime,
  withTime,
  type HourCycle,
  type TimeOfDay,
} from "../core/time";
import type { DateInput, DateRange } from "../core/types";
import { CalendarView } from "./CalendarView";
import { Field } from "./Field";
import type { DatePickerHandle, DatePickerSharedProps } from "./props";
import { TimeRow } from "./TimeRow";
import { useCalendar } from "./useCalendar";
import { useOpen } from "./useOpen";

export interface DateTimePickerProps extends DatePickerSharedProps {
  value?: DateInput | null;
  defaultValue?: DateInput | null;
  /** The chosen moment as a local `Date`, or `null` once cleared. Fires on Done. */
  onChange?(date: Date | null): void;
  /** Earliest moment: earlier days cannot be picked, an earlier time on that day is moved up. */
  min?: DateInput | null;
  /** Latest moment, applied the same way. */
  max?: DateInput | null;
  /** 12 shows an AM/PM switch. Defaults to the locale's clock. */
  hourCycle?: HourCycle;
  /** A seconds part as well. Default false. */
  showSeconds?: boolean;
  /** How far the minutes move per step. Default 1. */
  minuteStep?: number;
  /** Time used when a day is picked before any time is set, `HH:mm`. Default `00:00`. */
  defaultTime?: string;
  /** "Now" in the footer. Default true. */
  showNow?: boolean;
  ref?: Ref<DatePickerHandle<Date | null>>;
}

const themed = createThemedStyles((t) => ({
  done: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: t.radius,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.accent,
  },
  doneText: { color: t.accentFg, fontWeight: "600", fontSize: t.fontSize },
  now: { minHeight: 40, paddingHorizontal: 8, justifyContent: "center" },
  nowText: { color: t.accent, fontWeight: "600", fontSize: t.fontSize },
}));

/**
 * A date and a time of day in one field. Changes in the panel are a draft:
 * Done commits them, dismissing the sheet throws them away, which is how a
 * phone's own date-time pickers behave. Values are wall-clock local time.
 */
export function DateTimePicker(props: DateTimePickerProps) {
  const {
    ref,
    value,
    defaultValue,
    onChange,
    min,
    max,
    hourCycle: hourCycleProp,
    showSeconds = false,
    minuteStep = 1,
    defaultTime = "00:00",
    showNow = true,
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

  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const text = useMemo(() => ({ ...defaultDatePickerText, ...localeText }), [localeText]);
  const hourCycle = useMemo(() => hourCycleProp ?? hourCycleOf(locale), [hourCycleProp, locale]);
  const periods = useMemo(() => dayPeriodNames(locale), [locale]);
  const minMoment = useMemo(() => toDateTime(min), [min]);
  const maxMoment = useMemo(() => toDateTime(max), [max]);
  const minDay = useMemo(() => (minMoment ? startOfDay(minMoment) : null), [minMoment]);
  const maxDay = useMemo(() => (maxMoment ? startOfDay(maxMoment) : null), [maxMoment]);
  const fallbackTime = useMemo<TimeOfDay>(
    () => parseTime(defaultTime) ?? { hours: 0, minutes: 0, seconds: 0 },
    [defaultTime],
  );

  const controlled = useMemo(() => (value === undefined ? undefined : toDateTime(value)), [value]);
  const [current, setCurrent] = useControllableState<Date | null>(controlled, () => toDateTime(defaultValue));
  const [open, setOpen] = useOpen(onOpenChange);
  const editable = !disabled && !readOnly;

  // The panel's draft: a day (maybe none yet) and a time.
  const [draftDay, setDraftDay] = useState<Date | null>(null);
  const [draftTime, setDraftTime] = useState<TimeOfDay>(fallbackTime);

  const commit = useCallback(
    (next: Date | null, clamp = true) => {
      const settled = next && clamp ? clampDateTime(next, minMoment, maxMoment) : next;
      setCurrent(settled);
      onChange?.(settled);
    },
    [minMoment, maxMoment, setCurrent, onChange],
  );

  const selection = useMemo<DateRange>(() => ({ start: draftDay, end: null }), [draftDay]);
  const calendar = useCalendar({
    range: false,
    selection,
    onPick: (next) => {
      if (editable) setDraftDay(next.start);
    },
    min: minDay,
    max: maxDay,
    isDateDisabled,
    locale,
    weekStartsOn,
    numberOfMonths,
    fixedWeeks,
  });

  const show = useCallback(() => {
    if (disabled) return;
    setDraftDay(current ? startOfDay(current) : null);
    setDraftTime(current ? timeOf(current) : fallbackTime);
    calendar.reset(current);
    setOpen(true);
  }, [disabled, current, fallbackTime, calendar, setOpen]);

  const done = () => {
    if (editable && draftDay) commit(withTime(draftDay, draftTime));
    setOpen(false);
  };

  const now = () => {
    const moment = new Date();
    if (!showSeconds) moment.setSeconds(0, 0);
    setDraftDay(startOfDay(moment));
    setDraftTime(timeOf(moment));
    calendar.reset(moment);
  };

  const clear = useCallback(() => {
    if (!editable) return;
    commit(null, false);
    setOpen(false);
  }, [editable, commit, setOpen]);

  useImperativeHandle(
    ref,
    () => ({
      open: show,
      close: () => setOpen(false),
      toggle: () => (open ? setOpen(false) : show()),
      focus: show,
      clear,
      // A host setting a value is not a person picking one: bounds are not applied, as on the web.
      setValue: (next) => {
        if (editable) commit(toDateTime(next as DateInput | null), false);
      },
      getValue: () => current,
    }),
    [show, setOpen, open, clear, editable, commit, current],
  );

  const display = current
    ? typeof format === "function"
      ? format(current, locale)
      : formatDateTime(current, locale, { hourCycle, seconds: showSeconds, dateFormat: format })
    : "";

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
      placeholder={placeholder ?? dateTimePlaceholder(locale, hourCycle, showSeconds)}
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
        onClear={clearable && current && editable ? clear : undefined}
        styles={styles}
        actions={
          <>
            {showNow && (
              <Pressable role="button" onPress={now} style={s.now}>
                <Text style={s.nowText}>{text.now}</Text>
              </Pressable>
            )}
            <Pressable
              role="button"
              aria-disabled={!draftDay || undefined}
              disabled={!draftDay}
              onPress={done}
              style={({ pressed }) => [s.done, { opacity: !draftDay ? 0.4 : pressed ? 0.85 : 1 }]}
            >
              <Text style={s.doneText}>{text.done}</Text>
            </Pressable>
          </>
        }
      >
        <TimeRow
          time={draftTime}
          onChange={setDraftTime}
          hourCycle={hourCycle}
          showSeconds={showSeconds}
          minuteStep={minuteStep}
          periods={periods}
          locale={locale}
          disabled={!editable}
          text={text}
        />
      </CalendarView>
    </Field>
  );
}
