"use client";

import { useState, type KeyboardEvent } from "react";
import type { HourCycle, TimeOfDay } from "../core/time";
import type { DatePickerLocaleText } from "../core/types";

/*
 * The time row under DateTimePicker's calendar.
 *
 * Each part is its own spin button — the ARIA pattern for a number with a
 * range — so a screen reader announces "Hours, 2, spin button" and the arrow
 * keys step it, the way the native time input behaves. Typing works too, and
 * is read on Enter or when focus leaves, so a half-typed "1" on the way to
 * "12" is never committed as 1.
 */

interface SegmentProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onCommit(value: number): void;
  onEnter(): void;
}

function Segment({ label, value, min, max, step, disabled, onCommit, onEnter }: SegmentProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value).padStart(2, "0");

  const span = max - min + 1;
  const wrap = (n: number) => ((((n - min) % span) + span) % span) + min;

  const commitDraft = () => {
    if (draft === null) return;
    setDraft(null);
    const typed = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(typed)) return;
    onCommit(Math.min(max, Math.max(min, Math.round(typed))));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const moves: Record<string, () => number> = {
      ArrowUp: () => wrap(value + step),
      ArrowDown: () => wrap(value - step),
      PageUp: () => wrap(value + step * 5),
      PageDown: () => wrap(value - step * 5),
      Home: () => min,
      End: () => max,
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      setDraft(null);
      onCommit(move());
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      commitDraft();
      onEnter();
    }
  };

  return (
    <input
      className="dp-time-segment"
      type="text"
      inputMode="numeric"
      role="spinbutton"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={String(value).padStart(2, "0")}
      maxLength={2}
      autoComplete="off"
      spellCheck={false}
      disabled={disabled}
      value={shown}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 2))}
      onBlur={commitDraft}
      onKeyDown={onKeyDown}
    />
  );
}

export interface TimeFieldsProps {
  time: TimeOfDay;
  onChange(time: TimeOfDay): void;
  hourCycle: HourCycle;
  showSeconds: boolean;
  minuteStep: number;
  /** The locale's own AM and PM. */
  periods: [string, string];
  text: DatePickerLocaleText;
  disabled: boolean;
  /** Enter in any part: done choosing. */
  onDone(): void;
  /** Sets the current date and time; absent hides the button. */
  onNow?(): void;
}

export function TimeFields({
  time,
  onChange,
  hourCycle,
  showSeconds,
  minuteStep,
  periods,
  text,
  disabled,
  onDone,
  onNow,
}: TimeFieldsProps) {
  const pm = time.hours >= 12;
  // On a 12-hour clock the hour reads 12, 1 … 11; it is stored as 0 … 23.
  const shownHour = hourCycle === 12 ? time.hours % 12 || 12 : time.hours;
  const setHour = (hour: number) =>
    onChange({ ...time, hours: hourCycle === 12 ? (hour % 12) + (pm ? 12 : 0) : hour });
  const togglePeriod = () => onChange({ ...time, hours: (time.hours + 12) % 24 });

  return (
    <div className="dp-time" role="group" aria-label={text.time}>
      <span className="dp-time-label" aria-hidden="true">
        {text.time}
      </span>
      <div className="dp-time-fields">
        <Segment
          label={text.hours}
          value={shownHour}
          min={hourCycle === 12 ? 1 : 0}
          max={hourCycle === 12 ? 12 : 23}
          step={1}
          disabled={disabled}
          onCommit={setHour}
          onEnter={onDone}
        />
        <span className="dp-time-colon" aria-hidden="true">
          :
        </span>
        <Segment
          label={text.minutes}
          value={time.minutes}
          min={0}
          max={59}
          step={minuteStep}
          disabled={disabled}
          onCommit={(minutes) => onChange({ ...time, minutes })}
          onEnter={onDone}
        />
        {showSeconds && (
          <>
            <span className="dp-time-colon" aria-hidden="true">
              :
            </span>
            <Segment
              label={text.seconds}
              value={time.seconds}
              min={0}
              max={59}
              step={1}
              disabled={disabled}
              onCommit={(seconds) => onChange({ ...time, seconds })}
              onEnter={onDone}
            />
          </>
        )}
        {hourCycle === 12 && (
          <button
            type="button"
            className="dp-time-period"
            aria-label={`${text.dayPeriod}: ${pm ? periods[1] : periods[0]}`}
            disabled={disabled}
            onClick={togglePeriod}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                togglePeriod();
              }
            }}
          >
            {pm ? periods[1] : periods[0]}
          </button>
        )}
      </div>
      {onNow && (
        <button type="button" className="dp-link-button dp-time-now" disabled={disabled} onClick={onNow}>
          {text.now}
        </button>
      )}
    </div>
  );
}
