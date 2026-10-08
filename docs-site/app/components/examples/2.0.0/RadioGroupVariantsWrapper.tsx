"use client";

import { useState } from "react";
import { RadioGroup, Radio } from "@/components/radio-group";

export default function RadioGroupVariantsWrapper() {
  const [frequency, setFrequency] = useState<string | null>("Weekly");

  return (
    <div className="flex flex-col gap-4">
      <RadioGroup
        label="Send the report"
        name="frequency"
        options={["Daily", "Weekly", "Monthly"]}
        value={frequency}
        onValueChange={setFrequency}
        clearable
      />
      <RadioGroup
        label="Delivery"
        name="delivery"
        orientation="horizontal"
        defaultValue="standard"
      >
        <Radio value="standard" label="Standard" />
        <Radio value="express" label="Express" />
        <Radio value="courier" label="Courier" disabled />
      </RadioGroup>
    </div>
  );
}
