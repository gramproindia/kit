"use client";

import { useRef, useState } from "react";
import { Select, MultiSelect, type ComboboxHandle } from "@/components/combobox";
import { COUNTRIES, DEPARTMENT_OPTIONS, CITY_OPTIONS } from "./_combobox-data";

/*
 * What an option can carry, and what the list does with it: groups,
 * descriptions, a disabled option, extra search keywords, and a 10,000-option
 * list that virtualizes without being told to.
 */
export default function SelectOptionsWrapper() {
  const [country, setCountry] = useState<string | null>("de");
  const [departments, setDepartments] = useState<string[]>(["Engineering", "Design"]);
  const [city, setCity] = useState<string | null>(null);
  const plain = useRef<ComboboxHandle<string>>(null);

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Country"
        options={COUNTRIES}
        value={country}
        onChange={setCountry}
        placeholder="Choose a country"
        description={
          country ? `Value: ${country}` : "Grouped, with keyword search — try “bharat”"
        }
      />

      <MultiSelect
        label="Departments"
        options={DEPARTMENT_OPTIONS}
        value={departments}
        onChange={setDepartments}
        max={4}
        placeholder="Pick up to four"
        description="Tags, select all, and a maximum of four"
      />

      <Select
        label="City"
        options={CITY_OPTIONS}
        value={city}
        onChange={setCity}
        placeholder="Search 10,000 cities"
        size="sm"
        description="Ten thousand options; the list virtualizes itself"
      />

      <div className="flex flex-wrap items-end gap-2">
        <Select
          className="max-w-56"
          label="No search box"
          ref={plain}
          options={COUNTRIES}
          searchable={false}
          value={country}
          onChange={setCountry}
          placeholder="Short lists do not need one"
        />
        <button
          type="button"
          className="rounded-md border border-(--v2-border) px-3 py-1.5 text-sm"
          onClick={() => plain.current?.open()}
        >
          Open it with the ref
        </button>
      </div>
    </div>
  );
}
