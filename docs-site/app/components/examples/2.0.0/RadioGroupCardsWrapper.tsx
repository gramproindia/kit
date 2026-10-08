"use client";

import { RadioGroup } from "@/components/radio-group";
import { card } from "./_form-controls-fixtures";

export default function RadioGroupCardsWrapper() {
  return (
    <RadioGroup
      label="Plan"
      name="plan"
      variant="card"
      defaultValue="team"
      options={[
        {
          value: "starter",
          label: "Starter",
          description: "Up to 3 projects",
        },
        {
          value: "team",
          label: "Team",
          description: "Unlimited projects and members",
        },
        {
          value: "enterprise",
          label: "Enterprise",
          description: "Talk to us",
          disabled: true,
        },
      ]}
    />
  );
}
