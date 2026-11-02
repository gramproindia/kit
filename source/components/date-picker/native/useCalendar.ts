import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  addMonths,
  buildMonths,
  clampDate,
  compareDay,
  daysInMonth,
  isDayDisabled,
  isInRange,
  isSameDay,
  normalizeRange,
  resolveWeekStart,
  startOfDay,
  startOfMonth,
  yearPage,
} from "../core/calendar";
import { DEFAULT_DATE_FORMAT, formatDate, formatMonthYear, monthNames, weekdayNames } from "../core/format";
import { getToday, subscribeToToday } from "../core/today";
import type { CalendarMonth, CalendarView, DateRange } from "../core/types";

/** The native date-picker's style state for one day: the stand-in for the web's `data-*`. */
export interface DayState {
  selected: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  inRange: boolean;
}

/** How a chosen date is written in the field: `Intl` options or your own function. */
export type DateFormat =
  | Intl.DateTimeFormatOptions
  | ((date: Date, locale: string | undefined) => string);

export function formatWith(date: Date, format: DateFormat | undefined, locale: string | undefined): string {
  if (typeof format === "function") return format(date, locale);
  return formatDate(date, locale, format ?? DEFAULT_DATE_FORMAT);
}

export interface UseCalendarParams {
  range: boolean;
  /** What the calendar shows as chosen (a draft for DateTimePicker). */
  selection: DateRange;
  /** A day was tapped. `complete` is false on a range's first tap. */
  onPick(next: DateRange, complete: boolean): void;
  min: Date | null;
  max: Date | null;
  isDateDisabled?(date: Date): boolean;
  locale?: string;
  weekStartsOn?: number;
  numberOfMonths: number;
  fixedWeeks: boolean;
}

/**
 * The calendar's state for the native pickers: the visible month, the
 * month/year views and a half-picked range. The same core functions as the
 * web's `useDatePicker` (buildMonth, resolveWeekStart, the shared `today`
 * store); what it leaves out is the DOM half: typed input, keyboard grid
 * movement and the popover.
 */
export function useCalendar(params: UseCalendarParams) {
  const {
    range,
    selection,
    onPick,
    min,
    max,
    isDateDisabled,
    locale,
    weekStartsOn,
    numberOfMonths,
    fixedWeeks,
  } = params;

  // No server render on native, so the client value is used for both.
  const today = useSyncExternalStore(subscribeToToday, getToday, getToday);
  const limits = useMemo(() => ({ min, max, isDateDisabled }), [min, max, isDateDisabled]);
  const weekStart = useMemo(() => resolveWeekStart(locale, weekStartsOn), [locale, weekStartsOn]);

  const [viewDate, setViewDate] = useState(() =>
    startOfMonth(clampDate(selection.start ?? today ?? startOfDay(new Date()), min, max)),
  );
  const [view, setView] = useState<CalendarView>("days");
  const [yearCursor, setYearCursor] = useState<number | null>(null);
  const [pendingStart, setPendingStart] = useState<Date | null>(null);

  const months: CalendarMonth[] = useMemo(
    () => buildMonths(viewDate, numberOfMonths, { weekStartsOn: weekStart, fixedWeeks, today, ...limits }),
    [viewDate, numberOfMonths, weekStart, fixedWeeks, today, limits],
  );
  const weekdays = useMemo(() => weekdayNames(locale, weekStart), [locale, weekStart]);
  const monthLabels = useMemo(() => monthNames(locale, "short"), [locale]);
  const years = useMemo(() => yearPage(yearCursor ?? viewDate.getFullYear()), [yearCursor, viewDate]);

  /** Back to the chosen day (or today), on the day grid; called when the panel opens. */
  const reset = useCallback(
    (start: Date | null) => {
      setViewDate(startOfMonth(clampDate(start ?? today ?? startOfDay(new Date()), min, max)));
      setView("days");
      setYearCursor(null);
      setPendingStart(null);
    },
    [today, min, max],
  );

  const selectDate = useCallback(
    (date: Date) => {
      if (isDayDisabled(date, limits)) return;
      if (!range) {
        onPick({ start: date, end: null }, true);
        return;
      }
      if (pendingStart === null) {
        setPendingStart(date);
        onPick({ start: date, end: null }, false);
        return;
      }
      setPendingStart(null);
      onPick(normalizeRange({ start: pendingStart, end: date }), true);
    },
    [limits, range, pendingStart, onPick],
  );

  const goToMonth = useCallback((delta: number) => setViewDate((current) => addMonths(current, delta)), []);
  const goToToday = useCallback(() => {
    setViewDate(startOfMonth(clampDate(today ?? startOfDay(new Date()), min, max)));
    setView("days");
  }, [today, min, max]);

  const canGoPrev = !min || compareDay(startOfMonth(viewDate), startOfMonth(min)) > 0;
  const canGoNext =
    !max || compareDay(addMonths(startOfMonth(viewDate), numberOfMonths - 1), startOfMonth(max)) < 0;

  /** The header arrows: a month, a year, or a page of years, by view. */
  const step = useCallback(
    (direction: 1 | -1) => {
      if (view === "days") goToMonth(direction);
      else if (view === "months") setViewDate((current) => addMonths(current, direction * 12));
      else setYearCursor((years[0] ?? viewDate.getFullYear()) + direction * 12);
    },
    [view, goToMonth, years, viewDate],
  );

  const selectMonth = useCallback((month: number) => {
    setViewDate((current) => new Date(current.getFullYear(), month, 1));
    setView("days");
  }, []);

  const selectYear = useCallback((year: number) => {
    setViewDate((current) => new Date(year, current.getMonth(), 1));
    setYearCursor(null);
    setView("months");
  }, []);

  const isMonthDisabled = useCallback(
    (month: number) => {
      const year = viewDate.getFullYear();
      const last = new Date(year, month, daysInMonth(year, month));
      const first = new Date(year, month, 1);
      return (min !== null && compareDay(last, min) < 0) || (max !== null && compareDay(first, max) > 0);
    },
    [viewDate, min, max],
  );

  const isYearDisabled = useCallback(
    (year: number) => (min !== null && year < min.getFullYear()) || (max !== null && year > max.getFullYear()),
    [min, max],
  );

  const getDayState = useCallback(
    (date: Date): DayState => {
      const start = pendingStart ?? selection.start;
      const end = pendingStart ? null : selection.end;
      return {
        selected: isSameDay(date, start) || isSameDay(date, end),
        rangeStart: range && isSameDay(date, start) && end !== null,
        rangeEnd: range && isSameDay(date, end) && start !== null,
        inRange: range && isInRange(date, start, end),
      };
    },
    [range, pendingStart, selection],
  );

  const title =
    view === "days"
      ? months.length === 1
        ? formatMonthYear(months[0].year, months[0].month, locale)
        : `${formatMonthYear(months[0].year, months[0].month, locale)} – ${formatMonthYear(
            months[months.length - 1].year,
            months[months.length - 1].month,
            locale,
          )}`
      : view === "months"
        ? String(months[0].year)
        : `${years[0]} – ${years[years.length - 1]}`;

  return {
    view,
    setView,
    months,
    weekdays,
    monthLabels,
    years,
    title,
    pendingStart,
    selectDate,
    step,
    goToToday,
    canGoPrev,
    canGoNext,
    selectMonth,
    selectYear,
    isMonthDisabled,
    isYearDisabled,
    getDayState,
    reset,
    monthLabel: (month: CalendarMonth) => formatMonthYear(month.year, month.month, locale),
  };
}

export type CalendarEngine = ReturnType<typeof useCalendar>;
