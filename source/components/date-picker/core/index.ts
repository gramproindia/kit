// Framework-free date helpers: the same calendar building, parsing and
// formatting the components use, so a server (or a test) can reproduce them.
export {
  addDays,
  addMonths,
  buildMonth,
  buildMonths,
  clampDate,
  compareDay,
  daysInMonth,
  endOfMonth,
  getISOWeek,
  isDayDisabled,
  isInRange,
  isSameDay,
  isSameMonth,
  moveByKey,
  moveInGrid,
  normalizeRange,
  parseISODate,
  resolveWeekStart,
  startOfDay,
  startOfMonth,
  toDate,
  toISODate,
  yearPage,
} from "./calendar";
export type { BuildMonthOptions, MoveOptions } from "./calendar";
export {
  DEFAULT_DATE_FORMAT,
  fieldOrder,
  formatDate,
  formatMonthYear,
  inputPlaceholder,
  monthNames,
  parseDate,
  weekdayNames,
} from "./format";
export type { DateField, WeekdayName } from "./format";
export { getServerToday, getToday, subscribeToToday } from "./today";
export {
  clampDateTime,
  dateTimePlaceholder,
  dayPeriodNames,
  formatDateTime,
  hourCycleOf,
  parseDateTime,
  parseISODateTime,
  parseTime,
  timeFormatOptions,
  timeOf,
  toDateTime,
  toISODateTime,
  withTime,
} from "./time";
export type { HourCycle, TimeOfDay } from "./time";
export type * from "./types";
// The agent contract: what a model may ask this field to do.
export { datePickerContract, type DatePickerAgentProps } from "./agent";
