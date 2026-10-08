"use client";

import { useMemo, useState } from "react";
import { Select, MultiSelect } from "@/components/combobox";
import { COUNTRIES, DEPARTMENT_OPTIONS } from "./_combobox-data";

/*
 * Inside a form. Values post as hidden inputs, so `FormData` picks them up
 * with no adapter — submit with nothing chosen to see the error state.
 */
export default function SelectFormWrapper() {
  const [submitted, setSubmitted] = useState<Record<string, string[]> | null>(null);
  const [country, setCountry] = useState<string | null>(null);

  const error = useMemo(
    () => (submitted && !country ? "Please choose a country" : undefined),
    [submitted, country],
  );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted({
          country: data.getAll("country").map(String),
          departments: data.getAll("departments").map(String),
        });
      }}
    >
      <Select
        name="country"
        label="Country"
        required
        options={COUNTRIES}
        value={country}
        onChange={setCountry}
        error={error}
        placeholder="Required"
      />
      <MultiSelect
        name="departments"
        label="Departments"
        options={DEPARTMENT_OPTIONS}
        defaultValue={["Sales"]}
        size="lg"
        description="Uncontrolled, with a default"
      />
      <Select label="Disabled" options={COUNTRIES} disabled placeholder="Not available" />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-(--v2-fg) px-3 py-1.5 text-sm text-(--v2-bg)"
        >
          Submit
        </button>
        {submitted && (
          <code className="text-xs text-(--v2-muted)">{JSON.stringify(submitted)}</code>
        )}
      </div>
    </form>
  );
}
