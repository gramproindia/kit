"use client";

import { useState } from "react";
import { Select, type ComboboxOption } from "@/components/combobox";

const COUNTRIES: ComboboxOption[] = [
  { value: "in", label: "India", group: "Asia", keywords: ["bharat"] },
  { value: "jp", label: "Japan", group: "Asia", description: "Tokyo" },
  { value: "kr", label: "South Korea", group: "Asia" },
  { value: "sg", label: "Singapore", group: "Asia" },
  { value: "de", label: "Germany", group: "Europe", description: "Berlin" },
  { value: "fr", label: "France", group: "Europe", description: "Paris" },
  { value: "es", label: "Spain", group: "Europe" },
  { value: "uk", label: "United Kingdom", group: "Europe", description: "London" },
  { value: "us", label: "United States", group: "Americas" },
  { value: "ca", label: "Canada", group: "Americas" },
  { value: "br", label: "Brazil", group: "Americas" },
  { value: "mx", label: "Mexico", group: "Americas", disabled: true },
];

const INITIAL_TEAMS: ComboboxOption[] = [
  { value: "design", label: "Design" },
  { value: "platform", label: "Platform" },
  { value: "support", label: "Support" },
];

/** Live example used in the Select documentation. */
export function SelectWrapper() {
  const [country, setCountry] = useState<string | null>("de");
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [team, setTeam] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 380 }}>
      <Select
        label="Country"
        options={COUNTRIES}
        value={country}
        onChange={setCountry}
        placeholder="Choose a country"
        clearable
        required
        error={country === null ? "Pick the billing country." : undefined}
        description="Grouped options with search. Try “bharat” to find India."
      />

      {/* allowCreate: type a name that is not in the list, then choose "Create …". */}
      <Select
        label="Team"
        options={teams}
        value={team}
        onChange={setTeam}
        placeholder="Choose or create a team"
        clearable
        allowCreate
        onCreate={(label) => {
          const option = { value: label.toLowerCase().replace(/\s+/g, "-"), label };
          setTeams((current) => [...current, option]);
          setTeam(option.value);
        }}
        description="Type a name that is not listed to create it."
      />

      <code style={{ fontSize: 12, opacity: 0.7 }}>
        country: {JSON.stringify(country)} · team: {JSON.stringify(team)}
      </code>
    </div>
  );
}

export default SelectWrapper;
