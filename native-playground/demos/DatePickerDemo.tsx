import { useState } from "react";
import { Text } from "react-native";
import { DatePicker, DateRangePicker, DateTimePicker, type DateRange } from "../../source/components/date-picker";
import { useKitTheme } from "../../source/components/shared/native";
import { Section } from "./layout";

const addDays = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};
const weekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

export function DatePickerDemo() {
  const { tokens } = useKitTheme();
  const [single, setSingle] = useState<Date | null>(null);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [moment, setMoment] = useState<Date | null>(null);
  const note = { color: tokens.muted, fontSize: tokens.fontSize - 2 };

  return (
    <>
      <Section title="DatePicker · locales">
        <DatePicker
          label="Invoice date (en-IN, week starts Sunday)"
          locale="en-IN"
          value={single}
          onChange={setSingle}
          description="Tap to open the calendar; swipe sideways to change month."
        />
        <Text style={note}>Value: {single ? single.toDateString() : "none"}</Text>
        <DatePicker label="تاريخ الفاتورة (ar-EG, Saturday start)" locale="ar-EG" defaultValue={new Date()} />
        <DatePicker label="Rechnungsdatum (de-DE, Monday start)" locale="de-DE" showWeekNumbers />
      </Section>

      <Section title="DatePicker · limits and errors">
        <DatePicker
          label="Delivery (next 30 days, weekdays only)"
          locale="en-IN"
          min={addDays(1)}
          max={addDays(30)}
          isDateDisabled={weekend}
        />
        <DatePicker label="Date of birth" required error="Enter your date of birth." locale="en-IN" />
        <DatePicker label="Locked" locale="en-IN" defaultValue={new Date()} readOnly />
        <DatePicker label="Disabled" locale="en-IN" disabled />
      </Section>

      <Section title="DateRangePicker">
        <DateRangePicker
          label="Stay"
          locale="en-IN"
          value={range}
          onChange={(next) => setRange(next)}
          min={addDays(0)}
          presets={[
            { label: "This weekend", range: { start: addDays(6 - new Date().getDay()), end: addDays(7 - new Date().getDay()) } },
            { label: "Next 7 days", range: { start: addDays(0), end: addDays(6) } },
            { label: "Next 30 days", range: { start: addDays(0), end: addDays(29) } },
          ]}
        />
        <Text style={note}>
          Range: {range.start?.toDateString() ?? "–"} → {range.end?.toDateString() ?? "–"}
        </Text>
      </Section>

      <Section title="DateTimePicker">
        <DateTimePicker
          label="Meeting (12-hour, 15-minute steps)"
          locale="en-IN"
          hourCycle={12}
          minuteStep={15}
          defaultTime="09:00"
          value={moment}
          onChange={setMoment}
        />
        <Text style={note}>Value: {moment ? moment.toString() : "none"}</Text>
        <DateTimePicker label="Abfahrt (24-hour, seconds)" locale="de-DE" showSeconds />
        <DateTimePicker label="موعد (ar-EG)" locale="ar-EG" />
      </Section>
    </>
  );
}
