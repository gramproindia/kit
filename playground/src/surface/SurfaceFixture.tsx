"use client";

import { useState } from "react";
import { AgentSurface, useAgentSurface } from "@/components/shared";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import { Checkbox } from "@/components/checkbox";
import { Switch } from "@/components/switch";
import { NumberInput } from "@/components/number-input";
import { RadioGroup } from "@/components/radio-group";
import { MultiSelect, Select } from "@/components/combobox";
import { DatePicker, DateRangePicker, DateTimePicker, toISODateTime } from "@/components/date-picker";
import { DataGrid } from "@/components/data-grid";
import fixture from "../../../eval/grid/v0/fixture.json";

/*
 * Every operable component, inside one <AgentSurface>, each controlled by this
 * page's own state. The e2e test drives them through the `operate_page` tool
 * and then reads `#state`: a write counts only if it reached the
 * application's handler, not merely the DOM.
 */

type Row = Record<string, string | number | boolean>;

const TEAMS = [
  { value: 1, label: "Engineering" },
  { value: 2, label: "Sales" },
  { value: 3, label: "Legal", disabled: true },
];
const TAGS = ["urgent", "billing", "bug", "feature"].map((tag) => ({ value: tag, label: tag }));

function ManifestCount() {
  const surface = useAgentSurface();
  return <output id="has-surface">{surface ? "yes" : "no"}</output>;
}

export function SurfaceFixture() {
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(false);
  const [alerts, setAlerts] = useState(false);
  const [seats, setSeats] = useState<number | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [team, setTeam] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [due, setDue] = useState<Date | null>(null);
  const [trip, setTrip] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [call, setCall] = useState<Date | null>(null);

  const day = (date: Date | null) =>
    date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : null;

  const state = {
    name,
    secret,
    notes,
    terms,
    alerts,
    seats,
    plan,
    team,
    tags,
    due: day(due),
    trip: { start: day(trip.start), end: day(trip.end) },
    call: call ? toISODateTime(call) : null,
  };

  return (
    <AgentSurface>
      <main style={{ display: "grid", gap: 16, padding: 24, maxWidth: 960 }}>
        <ManifestCount />
        <Input label="Name" value={name} onValueChange={setName} maxLength={40} />
        <Input label="Password" type="password" value={secret} onValueChange={setSecret} />
        <Textarea label="Notes" value={notes} onValueChange={setNotes} />
        <Checkbox label="Accept terms" checked={terms} onCheckedChange={setTerms} />
        <Switch label="Email alerts" checked={alerts} onCheckedChange={(next) => setAlerts(next)} />
        {/* German: "1.500" is fifteen hundred. A number written as text would be misread. */}
        <NumberInput label="Seats" value={seats} onValueChange={setSeats} min={1} max={2000} locale="de-DE" />
        <RadioGroup label="Plan" value={plan} onValueChange={setPlan} options={["Free", "Pro", "Enterprise"]} />
        <Select<number> label="Team" value={team} onChange={(next) => setTeam(next)} options={TEAMS} />
        <MultiSelect label="Tags" value={tags} onChange={(next) => setTags(next)} options={TAGS} max={2} />
        <DatePicker label="Due date" value={due} onChange={setDue} min="2026-01-01" max="2026-12-31" />
        <DateRangePicker label="Trip" value={trip} onChange={(range) => setTrip(range)} />
        <DateTimePicker
          label="Call"
          value={call}
          onChange={setCall}
          min="2026-06-01T09:00"
          max="2026-06-30T17:30"
          hourCycle={24}
        />
        <DataGrid<Row>
          aria-label="Customers"
          data={fixture.rows as Row[]}
          columns={fixture.columns as never}
          getRowId={(row) => String(row.id)}
          height={320}
        />
        <pre id="state">{JSON.stringify(state)}</pre>
      </main>
    </AgentSurface>
  );
}
