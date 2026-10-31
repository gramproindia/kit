"use client";

import { useState } from "react";
import { addDays, DateTimePicker, toISODateTime } from "@/components/date-picker";
import { TODAY } from "./_date-picker-fixtures";

/** Today at a given hour, so the example's limits read as a working window. */
const todayAt = (hours: number, minutes = 0) => {
  const date = new Date(TODAY);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export default function DateTimePickerWrapper() {
  const [meeting, setMeeting] = useState<Date | null>(null);
  const [logged, setLogged] = useState<Date | null>(todayAt(14, 5));

  return (
    <div className="flex flex-col gap-4">
      <DateTimePicker
        label="Meeting"
        value={meeting}
        onChange={setMeeting}
        min={todayAt(9)}
        max={addDays(todayAt(17, 30), 14)}
        minuteStep={15}
        defaultTime="09:00"
        isDateDisabled={(day) => day.getDay() === 0 || day.getDay() === 6}
        description="Weekdays in the next two weeks. Arrows move the minutes in 15s."
      />
      <DateTimePicker
        label="Logged at (24-hour, with seconds)"
        value={logged}
        onChange={setLogged}
        hourCycle={24}
        showSeconds
        name="loggedAt"
      />
      <p className="text-xs text-zinc-500">
        Posts as <code>{logged ? toISODateTime(logged, true) : "(empty)"}</code>
      </p>
      <DateTimePicker label="Disabled" defaultValue={todayAt(10, 30)} disabled />
      <DateTimePicker label="Read-only" defaultValue={todayAt(10, 30)} readOnly />
    </div>
  );
}
