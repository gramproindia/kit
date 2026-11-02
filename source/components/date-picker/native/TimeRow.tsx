import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { createThemedStyles, useKitTheme } from "../../shared/native/KitProvider";
import { ChevronGlyph } from "../../shared/native/glyphs";
import type { HourCycle, TimeOfDay } from "../core/time";
import type { DatePickerLocaleText } from "../core/types";

const themed = createThemedStyles((t) => ({
  root: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 6 },
  label: { fontSize: t.fontSize - 1, color: t.muted, marginEnd: 4 },
  segment: { alignItems: "center", borderRadius: t.radius, borderWidth: 1, borderColor: t.borderControl, backgroundColor: t.inputBg },
  stepper: { width: 52, height: 30, alignItems: "center", justifyContent: "center" },
  value: { fontSize: t.fontSize + 4, fontWeight: "600", color: t.fg, fontVariant: ["tabular-nums"], minWidth: 36, textAlign: "center" },
  colon: { fontSize: t.fontSize + 4, fontWeight: "600", color: t.muted },
  periods: { borderRadius: t.radius, borderWidth: 1, borderColor: t.borderControl, overflow: "hidden" },
  period: { minHeight: 40, minWidth: 56, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" },
  periodText: { fontSize: t.fontSize - 1, fontWeight: "600" },
}));

interface SegmentProps {
  label: string;
  value: number;
  shown: string;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange(value: number): void;
}

/** One part of the time: tap the arrows, or swipe up/down with a screen reader (adjustable). */
function Segment({ label, value, shown, min, max, step, disabled, onChange }: SegmentProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  const span = max - min + 1;
  const wrap = (n: number) => ((((n - min) % span) + span) % span) + min;
  const up = () => onChange(wrap(value + step));
  const down = () => onChange(wrap(value - step));
  return (
    <View
      style={[s.segment, disabled && { opacity: 0.5 }]}
      accessible
      role="spinbutton"
      accessibilityLabel={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={shown}
      aria-disabled={disabled || undefined}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => {
        if (disabled) return;
        if (event.nativeEvent.actionName === "increment") up();
        if (event.nativeEvent.actionName === "decrement") down();
      }}
    >
      <Pressable disabled={disabled} onPress={up} style={({ pressed }) => [s.stepper, pressed && { backgroundColor: tokens.hover }]} hitSlop={4}>
        <ChevronGlyph size={14} color={tokens.muted} direction="up" />
      </Pressable>
      <Text style={s.value}>{shown}</Text>
      <Pressable disabled={disabled} onPress={down} style={({ pressed }) => [s.stepper, pressed && { backgroundColor: tokens.hover }]} hitSlop={4}>
        <ChevronGlyph size={14} color={tokens.muted} direction="down" />
      </Pressable>
    </View>
  );
}

interface TimeRowProps {
  time: TimeOfDay;
  onChange(time: TimeOfDay): void;
  hourCycle: HourCycle;
  showSeconds: boolean;
  minuteStep: number;
  periods: [string, string];
  locale?: string;
  disabled: boolean;
  text: DatePickerLocaleText;
}

/**
 * DateTimePicker's time row: hours, minutes, optional seconds and an AM/PM
 * switch on a 12-hour clock. Hours are stored 0–23 and shown 12, 1…11 when the
 * clock is 12-hour, the same rule as the web's TimeFields.
 */
export function TimeRow({ time, onChange, hourCycle, showSeconds, minuteStep, periods, locale, disabled, text }: TimeRowProps) {
  const { tokens } = useKitTheme();
  const s = themed(tokens);
  // The locale's digits: ٠٩ in Arabic.
  const two = useMemo(
    () => new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }),
    [locale],
  );
  const pm = time.hours >= 12;
  const shownHour = hourCycle === 12 ? time.hours % 12 || 12 : time.hours;
  const setHour = (hour: number) =>
    onChange({ ...time, hours: hourCycle === 12 ? (hour % 12) + (pm ? 12 : 0) : hour });

  return (
    <View style={s.root} role="group" aria-label={text.time}>
      <Segment
        label={text.hours}
        value={shownHour}
        shown={two.format(shownHour)}
        min={hourCycle === 12 ? 1 : 0}
        max={hourCycle === 12 ? 12 : 23}
        step={1}
        disabled={disabled}
        onChange={setHour}
      />
      <Text style={s.colon}>:</Text>
      <Segment
        label={text.minutes}
        value={time.minutes}
        shown={two.format(time.minutes)}
        min={0}
        max={59}
        step={minuteStep}
        disabled={disabled}
        onChange={(minutes) => onChange({ ...time, minutes })}
      />
      {showSeconds && (
        <>
          <Text style={s.colon}>:</Text>
          <Segment
            label={text.seconds}
            value={time.seconds}
            shown={two.format(time.seconds)}
            min={0}
            max={59}
            step={1}
            disabled={disabled}
            onChange={(seconds) => onChange({ ...time, seconds })}
          />
        </>
      )}
      {hourCycle === 12 && (
        <View style={s.periods} role="radiogroup" aria-label={text.dayPeriod}>
          {periods.map((name, index) => {
            const active = (index === 1) === pm;
            return (
              <Pressable
                key={name}
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onPress={() => {
                  if (!active) onChange({ ...time, hours: (time.hours + 12) % 24 });
                }}
                style={[s.period, { backgroundColor: active ? tokens.accent : "transparent" }]}
              >
                <Text style={[s.periodText, { color: active ? tokens.accentFg : tokens.fg }]}>{name}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
