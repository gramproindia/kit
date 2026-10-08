"use client";

import { useState } from "react";
import { MultiSelect, type ComboboxOption } from "@/components/combobox";

/*
 * Letting people add options that do not exist yet. Type something not in the
 * list — "design" — and the menu offers to create it.
 */
export default function SelectCreatableWrapper() {
  const [tags, setTags] = useState<ComboboxOption[]>([
    { value: "urgent", label: "urgent" },
    { value: "backend", label: "backend" },
  ]);
  const [selected, setSelected] = useState<string[]>(["urgent"]);

  return (
    <MultiSelect
      label="Tags"
      options={tags}
      value={selected}
      onChange={setSelected}
      allowCreate
      onCreate={(label) => {
        // The component does not invent the option; you decide what it becomes
        // and whether it is selected.
        const option = { value: label.toLowerCase(), label };
        setTags((previous) => [...previous, option]);
        setSelected((previous) => [...previous, option.value]);
      }}
      placeholder="Add tags"
      description="Type a value that is not listed, then pick “Create …”"
    />
  );
}
