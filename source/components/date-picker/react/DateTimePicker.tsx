"use client";

import {
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from "react";
import { describeField } from "../../shared/core/field";
import { isDayDisabled, startOfDay, toISODate } from "../core/calendar";
import {
  clampDateTime,
  dateTimePlaceholder,
  dayPeriodNames,
  formatDateTime,
  hourCycleOf,
  parseDateTime,
  parseTime,
  timeOf,
  toDateTime,
  toISODateTime,
  withTime,
  type HourCycle,
  type TimeOfDay,
} from "../core/time";
import type { DateInput, DateRange } from "../core/types";
import { CalendarPanel } from "./CalendarPanel";
import { CalendarIcon, XIcon } from "./icons";
import { defaultDatePickerText } from "./locale";
import { DatePickerPopover } from "./Popover";
import { cx, type DatePickerHandle, type DatePickerSharedProps } from "./props";
import { useDateSurface } from "./surface";
import { TimeFields } from "./TimeFields";
import { useDatePicker } from "./useDatePicker";

export interface DateTimePickerProps extends Omit<DatePickerSharedProps, "min" | "max" | "name"> {
  value?: DateInput | null;
  defaultValue?: DateInput | null;
  /**
   * The chosen moment as a `Date` in local time, or `null` once cleared.
   * Accepts an ISO `yyyy-mm-ddTHH:mm` string, a `Date` or a timestamp in
   * `value`, but always hands back a `Date`.
   */
  onChange?(date: Date | null): void;
  /**
   * Earliest selectable moment. Earlier days cannot be picked, and on the
   * day itself an earlier time is moved up to it.
   */
  min?: DateInput | null;
  /** Latest selectable moment, applied the same way as `min`. */
  max?: DateInput | null;
  /** 12 shows an AM/PM switch; 24 does not. Defaults to the locale's clock. */
  hourCycle?: HourCycle;
  /** A seconds field as well. Default false. */
  showSeconds?: boolean;
  /** How far the minutes move per arrow press. Default 1; 5 or 15 suit scheduling. */
  minuteStep?: number;
  /** The time used when a day is picked before any time is set, `HH:mm`. Default `00:00`. */
  defaultTime?: string;
  /** Show the "Now" button beside the time. Default true. */
  showNow?: boolean;
  /** Close after a day is picked. Default false: the time usually comes next. */
  closeOnSelect?: boolean;
  /** Posts the value as `yyyy-mm-ddTHH:mm` — the shape a native datetime-local input posts. */
  name?: string;
  ref?: Ref<DatePickerHandle<Date | null>>;
}

/** A date and a time of day in one field: a calendar, a time row, and typed entry. */
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
    closeOnSelect = false,
    isDateDisabled,
    locale,
    weekStartsOn,
    format,
    numberOfMonths = 1,
    showWeekNumbers = false,
    showToday = true,
    allowInput = true,
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
    name,
    id: idProp,
    className,
    classNames,
    style,
    localeText,
    onOpenChange,
  } = props;

  const reactId = useId();
  const id = idProp ?? reactId;
  const inputId = `${id}-input`;
  const popoverId = `${id}-popover`;
  const text = useMemo(() => ({ ...defaultDatePickerText, ...localeText }), [localeText]);
  const hourCycle = useMemo(() => hourCycleProp ?? hourCycleOf(locale), [hourCycleProp, locale]);
  const periods = useMemo(() => dayPeriodNames(locale), [locale]);

  const controlRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Bounds are moments; the calendar only needs their days.
  const minMoment = useMemo(() => toDateTime(min), [min]);
  const maxMoment = useMemo(() => toDateTime(max), [max]);
  const minDay = useMemo(() => (minMoment ? startOfDay(minMoment) : null), [minMoment]);
  const maxDay = useMemo(() => (maxMoment ? startOfDay(maxMoment) : null), [maxMoment]);

  const controlled = value !== undefined;
  const [own, setOwn] = useState<Date | null>(() => toDateTime(defaultValue));
  const current = useMemo(() => (controlled ? toDateTime(value) : own), [controlled, value, own]);

  // The time shown before any day is picked; a value's own time after.
  const [pendingTime, setPendingTime] = useState<TimeOfDay>(
    () => parseTime(defaultTime) ?? { hours: 0, minutes: 0, seconds: 0 },
  );
  const time = current ? timeOf(current) : pendingTime;
  const timeRef = useRef(time);
  timeRef.current = time;

  const [draft, setDraft] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  /** The one way a value changes: clamped to the bounds, then reported. */
  const commit = useCallback(
    (next: Date | null, { clamp = true } = {}) => {
      const settled = next && clamp ? clampDateTime(next, minMoment, maxMoment) : next;
      if (!controlled) setOwn(settled);
      if (settled) setPendingTime(timeOf(settled));
      setInputError(null);
      onChange?.(settled);
    },
    [controlled, minMoment, maxMoment, onChange],
  );

  const dayKey = current ? toISODate(current) : null;
  const selection = useMemo<DateRange>(
    () => ({ start: current ? startOfDay(current) : null, end: null }),
    // The calendar cares about the day; a new time on the same day is not a new selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey],
  );

  const picker = useDatePicker({
    range: false,
    value: selection,
    defaultValue: selection,
    // A day picked on the calendar keeps the time already chosen.
    onSelectionChange: (next) => commit(next.start ? withTime(next.start, timeRef.current) : null),
    min: minDay,
    max: maxDay,
    isDateDisabled,
    locale,
    weekStartsOn,
    numberOfMonths,
    fixedWeeks,
    disabled,
    readOnly,
    closeOnSelect,
    format: typeof format === "function" ? format : undefined,
    text,
    controlRef,
    triggerRef,
    onOpenChange,
  });

  const editable = !disabled && !readOnly;

  const display = useCallback(
    (date: Date) =>
      typeof format === "function"
        ? format(date, locale)
        : formatDateTime(date, locale, { hourCycle, seconds: showSeconds, dateFormat: format }),
    [format, locale, hourCycle, showSeconds],
  );

  const setTime = (next: TimeOfDay) => {
    if (!editable) return;
    if (current) commit(withTime(current, next));
    else setPendingTime(next);
  };

  const setNow = () => {
    if (!editable) return;
    const now = new Date();
    if (!showSeconds) now.setSeconds(0, 0);
    timeRef.current = timeOf(now);
    // Through the engine, so the calendar moves to today as well.
    picker.applyRange({ start: startOfDay(now), end: null }, true);
  };

  // One handle, for the ref and for an <AgentSurface>.
  const handle = useMemo<DatePickerHandle<Date | null>>(
    () => ({
      open: () => picker.setOpen(true),
      close: () => picker.setOpen(false),
      toggle: () => picker.setOpen(!picker.open),
      focus: () => inputRef.current?.focus({ preventScroll: true }),
      clear: picker.clear,
      // Like DatePicker's: a host or an agent setting a value is not a person
      // picking one, so the bounds are the validator's to enforce, not this.
      setValue: (next) => {
        if (!editable) return;
        commit(toDateTime(next as DateInput | null), { clamp: false });
      },
      getValue: () => current,
    }),
    [picker, editable, commit, current],
  );
  useImperativeHandle(ref, () => handle, [handle]);
  useDateSurface({
    component: "DateTimePicker",
    label,
    name,
    required,
    disabled,
    readOnly,
    min: minMoment,
    max: maxMoment,
    isDateDisabled,
    handle,
  });

  /* ---------------------------------------------------------- typed entry */

  const outOfBounds = (date: Date) =>
    isDayDisabled(startOfDay(date), { min: minDay, max: maxDay, isDateDisabled }) ||
    (minMoment !== null && date < minMoment) ||
    (maxMoment !== null && date > maxMoment);

  const read = (raw: string) => {
    const parsed = parseDateTime(raw, locale, current ?? new Date());
    return parsed ? withTime(parsed.date, parsed.time ?? timeRef.current) : null;
  };

  const onInputChange = (raw: string) => {
    if (!editable) return;
    setDraft(raw);
    setInputError(null);
    // Committed as soon as it reads as a whole, allowed moment.
    const next = read(raw);
    if (next && !outOfBounds(next)) commit(next);
  };

  const onInputBlur = () => {
    if (draft === null) return;
    setDraft(null);
    const trimmed = draft.trim();
    if (!trimmed) {
      commit(null);
      return;
    }
    const next = read(trimmed);
    if (!next) setInputError(text.invalidDate);
    else if (outOfBounds(next)) setInputError(text.outOfRange);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || (event.key === "Enter" && !picker.open)) {
      event.preventDefault();
      picker.setOpen(true);
    } else if (event.key === "Escape" && picker.open) {
      picker.setOpen(false);
    }
  };

  const message = error ?? inputError;
  const invalid = Boolean(message);
  const describedBy = describeField(id, { description, error: message });

  return (
    <div
      className={cx("dp-root", classNames?.root, className)}
      style={style}
      data-size={size}
      data-state={picker.open ? "open" : "closed"}
      data-invalid={invalid ? "" : undefined}
      data-variant="datetime"
    >
      {label && (
        <label
          htmlFor={inputId}
          className={cx("dp-label", classNames?.label)}
          data-required={required || undefined}
        >
          {label}
        </label>
      )}

      <div
        ref={controlRef}
        className={cx("dp-control", classNames?.control)}
        data-disabled={disabled || undefined}
        data-invalid={invalid ? "" : undefined}
      >
        <input
          ref={inputRef}
          id={inputId}
          className={cx("dp-input", classNames?.input)}
          value={draft ?? (current ? display(current) : "")}
          placeholder={placeholder ?? dateTimePlaceholder(locale, hourCycle, showSeconds)}
          disabled={disabled}
          readOnly={readOnly || !allowInput}
          required={required}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => onInputChange(event.target.value)}
          onBlur={onInputBlur}
          onKeyDown={onInputKeyDown}
          onClick={allowInput ? undefined : () => !disabled && picker.setOpen(true)}
        />

        <span className="dp-actions">
          {clearable && current && !disabled && !readOnly && (
            <button
              type="button"
              tabIndex={-1}
              className="dp-icon-button"
              aria-label={text.clear}
              onClick={picker.clear}
            >
              <XIcon width={14} height={14} />
            </button>
          )}
          <button
            ref={triggerRef}
            type="button"
            className="dp-icon-button dp-trigger"
            aria-label={text.openCalendar}
            aria-haspopup="dialog"
            aria-expanded={picker.open}
            aria-controls={picker.open ? popoverId : undefined}
            disabled={disabled}
            onPointerDown={picker.onTriggerPointerDown}
            onClick={picker.onTriggerClick}
          >
            <CalendarIcon />
          </button>
        </span>
      </div>

      {name && (
        <input type="hidden" name={name} value={current ? toISODateTime(current, showSeconds) : ""} />
      )}
      {description && (
        <span id={`${id}-description`} className="dp-description">
          {description}
        </span>
      )}
      {message && (
        <span id={`${id}-error`} className="dp-error" role="alert">
          {message}
        </span>
      )}

      {picker.anchor && (
        <DatePickerPopover
          anchor={picker.anchor}
          onClose={picker.onPopoverClose}
          label={text.calendarLabel}
          id={popoverId}
          autoFocus={picker.gridFocus}
          className={classNames?.popover}
        >
          <CalendarPanel
            picker={picker}
            text={text}
            locale={locale}
            showWeekNumbers={showWeekNumbers}
            showToday={showToday}
            clearable={clearable}
            hasValue={current !== null}
            classNames={classNames}
          >
            <TimeFields
              time={time}
              onChange={setTime}
              hourCycle={hourCycle}
              showSeconds={showSeconds}
              minuteStep={Math.max(1, Math.floor(minuteStep))}
              periods={periods}
              text={text}
              disabled={!editable}
              onDone={picker.closeAndFocusTrigger}
              onNow={showNow ? setNow : undefined}
            />
          </CalendarPanel>
        </DatePickerPopover>
      )}

      <span className="dp-sr-only" role="status">
        {current ? text.selectedDate(display(current)) : ""}
      </span>
    </div>
  );
}
