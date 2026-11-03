import { memo, useMemo, useRef, type ReactNode } from "react";
import {
  I18nManager,
  PanResponder,
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { ChevronGlyph } from "../../shared/native/glyphs";
import { alpha, type KitTokens } from "../../shared/native/theme";
import { formatDate } from "../core/format";
import type { CalendarDay, DatePickerLocaleText } from "../core/types";
import type { CalendarEngine, DayState } from "./useCalendar";

export interface CalendarStyles {
  calendar?: StyleProp<ViewStyle>;
  day?: StyleProp<ViewStyle>;
  dayText?: StyleProp<TextStyle>;
  footer?: StyleProp<ViewStyle>;
}

interface CalendarViewProps {
  calendar: CalendarEngine;
  text: DatePickerLocaleText;
  locale?: string;
  showToday: boolean;
  showWeekNumbers: boolean;
  /** Footer "Clear", shown only when there is something to clear. */
  onClear?(): void;
  styles?: CalendarStyles;
  /** Below the grid: DateTimePicker's time row. */
  children?: ReactNode;
  /** After the footer: DateTimePicker's Done. */
  actions?: ReactNode;
}

const FULL_DATE: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
const DAY_NUMBER: Intl.DateTimeFormatOptions = { day: "numeric" };
const CELL = 44;

const themed = createThemedStyles((t) => ({
  root: { paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: t.touchTarget },
  step: { width: t.touchTarget, height: t.touchTarget, alignItems: "center", justifyContent: "center", borderRadius: t.radius },
  title: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, minHeight: t.touchTarget, borderRadius: t.radius },
  titleText: { fontSize: t.fontSize + 1, fontWeight: "600", color: t.fg },
  caption: { fontSize: t.fontSize, fontWeight: "600", color: t.fg, paddingVertical: 6, textAlign: "center" },
  row: { flexDirection: "row" },
  weekday: { flex: 1, alignItems: "center", paddingVertical: 4 },
  weekdayText: { fontSize: t.fontSize - 3, color: t.muted, fontWeight: "500" },
  weekNumber: { width: 28, alignItems: "center", justifyContent: "center" },
  weekNumberText: { fontSize: t.fontSize - 4, color: t.muted },
  cell: { flex: 1, height: CELL, alignItems: "center", justifyContent: "center" },
  band: { position: "absolute", top: 3, bottom: 3, left: 0, right: 0, backgroundColor: t.accentSoft },
  day: { width: CELL - 4, height: CELL - 4, borderRadius: (CELL - 4) / 2, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "transparent" },
  dayText: { fontSize: t.fontSize, color: t.fg },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8, paddingVertical: 4 },
  tile: { width: "31%", minHeight: t.touchTarget, borderRadius: t.radius, alignItems: "center", justifyContent: "center" },
  tileText: { fontSize: t.fontSize, color: t.fg },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4, minHeight: t.touchTarget },
  link: { paddingHorizontal: 8, minHeight: t.touchTarget, justifyContent: "center" },
  linkText: { fontSize: t.fontSize, color: t.accent, fontWeight: "600" },
}));

/** The calendar body, inside a Sheet or an Anchored panel. */
export function CalendarView({
  calendar,
  text,
  locale,
  showToday,
  showWeekNumbers,
  onClear,
  styles: slots,
  children,
  actions,
}: CalendarViewProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const { view } = calendar;
  // Each day's spoken label and its number in the locale's digits (٢٢ in
  // Arabic, as the field shows), worked out once per month shown, not per render.
  const dayText = useMemo(() => {
    const map = new Map<string, { label: string; number: string }>();
    for (const month of calendar.months) {
      for (const week of month.weeks) {
        for (const day of week.days) {
          if (map.has(day.key)) continue;
          map.set(day.key, {
            label: formatDate(day.date, locale, FULL_DATE),
            number: formatDate(day.date, locale, DAY_NUMBER),
          });
        }
      }
    }
    return map;
  }, [calendar.months, locale]);
  const hideOutside = calendar.months.length > 1;
  const rtl = I18nManager.isRTL;

  const stepRef = useRef(calendar.step);
  stepRef.current = calendar.step;
  const viewRef = useRef(view);
  viewRef.current = view;
  // Swipe the grid sideways to change month; a vertical drag is left to the sheet.
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => {
          if (viewRef.current !== "days" || Math.abs(g.dx) < 48) return;
          const forward = g.dx < 0 !== rtl;
          stepRef.current(forward ? 1 : -1);
        },
      }),
    [rtl],
  );

  const prevLabel = view === "years" ? text.previousYears : text.previousMonth;
  const nextLabel = view === "years" ? text.nextYears : text.nextMonth;
  const nextView = view === "days" ? "months" : view === "months" ? "years" : "days";

  const renderDay = (day: CalendarDay) => {
    if (day.outside && hideOutside) return <View key={day.key} style={s.cell} />;
    const state = calendar.getDayState(day.date);
    const strings = dayText.get(day.key)!;
    return (
      <Day
        key={day.key}
        day={day}
        label={strings.label}
        number={strings.number}
        selected={state.selected}
        inRange={state.inRange}
        rangeStart={state.rangeStart}
        rangeEnd={state.rangeEnd}
        rtl={rtl}
        tokens={tokens}
        dayStyle={slots?.day}
        dayTextStyle={slots?.dayText}
        onSelect={calendar.selectDate}
      />
    );
  };

  return (
    <View style={[s.root, slots?.calendar]}>
      <View style={s.nav}>
        <Pressable
          role="button"
          accessibilityLabel={prevLabel}
          disabled={view === "days" && !calendar.canGoPrev}
          onPress={() => calendar.step(-1)}
          style={({ pressed }) => [s.step, pressed && { backgroundColor: tokens.hover }, view === "days" && !calendar.canGoPrev && { opacity: 0.3 }]}
        >
          <ChevronGlyph color={tokens.fg} direction={rtl ? "right" : "left"} />
        </Pressable>
        <Pressable
          role="button"
          accessibilityLabel={`${calendar.title}, ${text.chooseMonthYear}`}
          aria-expanded={view !== "days"}
          onPress={() => calendar.setView(nextView)}
          style={({ pressed }) => [s.title, pressed && { backgroundColor: tokens.hover }]}
        >
          <Text style={s.titleText}>{calendar.title}</Text>
          <ChevronGlyph size={12} color={tokens.muted} direction={view === "days" ? "down" : "up"} />
        </Pressable>
        <Pressable
          role="button"
          accessibilityLabel={nextLabel}
          disabled={view === "days" && !calendar.canGoNext}
          onPress={() => calendar.step(1)}
          style={({ pressed }) => [s.step, pressed && { backgroundColor: tokens.hover }, view === "days" && !calendar.canGoNext && { opacity: 0.3 }]}
        >
          <ChevronGlyph color={tokens.fg} direction={rtl ? "left" : "right"} />
        </Pressable>
      </View>

      {view === "days" && (
        <View {...swipe.panHandlers}>
          {calendar.months.map((month) => (
            <View key={`${month.year}-${month.month}`} role="grid" aria-label={calendar.monthLabel(month)}>
              {calendar.months.length > 1 && <Text style={s.caption}>{calendar.monthLabel(month)}</Text>}
              <View style={s.row}>
                {showWeekNumbers && (
                  <View style={s.weekNumber}>
                    <Text style={s.weekNumberText} accessibilityLabel={text.weekNumber}>
                      #
                    </Text>
                  </View>
                )}
                {calendar.weekdays.map((weekday) => (
                  <View key={weekday.long} style={s.weekday} accessibilityLabel={weekday.long}>
                    <Text style={s.weekdayText} aria-hidden numberOfLines={1}>
                      {weekday.short}
                    </Text>
                  </View>
                ))}
              </View>
              {month.weeks.map((week) => (
                <View key={week.days[0].key} style={s.row} role="row">
                  {showWeekNumbers && (
                    <View style={s.weekNumber}>
                      <Text style={s.weekNumberText}>{week.weekNumber}</Text>
                    </View>
                  )}
                  {week.days.map(renderDay)}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {view === "months" && (
        <View style={s.grid} role="list" aria-label={text.monthPanelLabel}>
          {calendar.monthLabels.map((label, month) => {
            const current = month === calendar.months[0].month;
            const off = calendar.isMonthDisabled(month);
            return (
              <Pressable
                key={label}
                role="button"
                aria-selected={current}
                aria-disabled={off}
                disabled={off}
                onPress={() => calendar.selectMonth(month)}
                style={({ pressed }) => [
                  s.tile,
                  { backgroundColor: current ? tokens.accent : pressed ? tokens.hover : alpha(tokens.fg, 0.04) },
                  off && { opacity: 0.35 },
                ]}
              >
                <Text style={[s.tileText, current && { color: tokens.accentFg, fontWeight: "700" }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {view === "years" && (
        <View style={s.grid} role="list" aria-label={text.yearPanelLabel}>
          {calendar.years.map((year) => {
            const current = year === calendar.months[0].year;
            const off = calendar.isYearDisabled(year);
            return (
              <Pressable
                key={year}
                role="button"
                aria-selected={current}
                aria-disabled={off}
                disabled={off}
                onPress={() => calendar.selectYear(year)}
                style={({ pressed }) => [
                  s.tile,
                  { backgroundColor: current ? tokens.accent : pressed ? tokens.hover : alpha(tokens.fg, 0.04) },
                  off && { opacity: 0.35 },
                ]}
              >
                <Text style={[s.tileText, current && { color: tokens.accentFg, fontWeight: "700" }]}>{year}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {view === "days" && children}

      {(showToday || onClear || actions) && (
        <View style={[s.footer, slots?.footer]}>
          <View style={s.row}>
            {showToday && (
              <Pressable role="button" onPress={calendar.goToToday} style={s.link}>
                <Text style={s.linkText}>{text.today}</Text>
              </Pressable>
            )}
            {onClear && (
              <Pressable role="button" onPress={onClear} style={s.link}>
                <Text style={s.linkText}>{text.clear}</Text>
              </Pressable>
            )}
          </View>
          {actions && <View style={[s.row, { alignItems: "center", gap: 4 }]}>{actions}</View>}
        </View>
      )}
    </View>
  );
}

interface DayProps extends DayState {
  day: CalendarDay;
  label: string;
  number: string;
  rtl: boolean;
  tokens: KitTokens;
  dayStyle?: StyleProp<ViewStyle>;
  dayTextStyle?: StyleProp<TextStyle>;
  onSelect(date: Date): void;
}

/** One day, memoised on plain flags so a tap re-renders the days it changed. */
const Day = memo(function Day({
  day,
  label,
  number,
  selected,
  inRange,
  rangeStart,
  rangeEnd,
  rtl,
  tokens,
  dayStyle,
  dayTextStyle,
  onSelect,
}: DayProps) {
  const s = themed(tokens);
  const fill = selected ? tokens.accent : "transparent";
  const ink = selected ? tokens.accentFg : day.outside ? tokens.muted : tokens.fg;
  // The band runs between the two ends: half a cell at each end, full between.
  const band = inRange || rangeStart || rangeEnd;
  const startSide = rtl ? "right" : "left";
  const endSide = rtl ? "left" : "right";
  return (
    <View style={s.cell}>
      {band && (
        <View
          style={[
            s.band,
            rangeStart && { [startSide]: "50%" },
            rangeEnd && { [endSide]: "50%" },
            rangeStart && rangeEnd && { opacity: 0 },
          ]}
        />
      )}
      <Pressable
        role="button"
        accessibilityLabel={label}
        aria-selected={selected}
        aria-disabled={day.disabled}
        disabled={day.disabled}
        onPress={() => onSelect(day.date)}
        style={({ pressed }) => [
          s.day,
          { backgroundColor: pressed && !selected ? tokens.hover : fill },
          day.today && !selected && { borderColor: tokens.accent },
          day.disabled && { opacity: 0.35 },
          dayStyle,
        ]}
      >
        <Text
          style={[
            s.dayText,
            { color: ink },
            (selected || day.today) && { fontWeight: "700" },
            day.disabled && { textDecorationLine: "line-through" },
            dayTextStyle,
          ]}
        >
          {number}
        </Text>
      </Pressable>
    </View>
  );
});
