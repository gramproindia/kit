"use client";

import { useState } from "react";
import { NumberInput } from "@/components/number-input";

export default function NumberInputVariantsWrapper() {
  const [qty, setQty] = useState<number | null>(1);

  return (
    <div className="flex flex-col gap-3">
      <NumberInput
        label="Quantity"
        min={1}
        max={99}
        value={qty}
        onValueChange={setQty}
      />
      <NumberInput
        label="Weight"
        description="Steps of 0.1 — press ↑ repeatedly and watch for 0.30000000000000004."
        step={0.1}
        decimals={1}
        defaultValue={0.1}
        trailing="kg"
      />
      <NumberInput
        label="Rounded to fives"
        description="snapToStep, counted from min."
        min={0}
        step={5}
        snapToStep
        defaultValue={10}
      />
      <NumberInput
        label="No stepper, clearable"
        stepper={false}
        clearable
        defaultValue={42}
      />
    </div>
  );
}
