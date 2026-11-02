import { useState } from "react";
import { Radio, RadioGroup } from "../../source/components/radio-group";
import { Section } from "./layout";

export function RadioGroupDemo() {
  const [plan, setPlan] = useState<string | null>("pro");
  return (
    <>
      <Section title="RadioGroup · options">
        <RadioGroup
          label="Billing cycle"
          description="You can change this later."
          defaultValue="monthly"
          clearable
          options={["Monthly", "Quarterly", "Yearly"].map((label) => ({ value: label.toLowerCase(), label }))}
        />
      </Section>

      <Section title="RadioGroup · cards">
        <RadioGroup
          label="Plan"
          variant="card"
          value={plan}
          onValueChange={setPlan}
          options={[
            { value: "free", label: "Free", description: "Up to 3 projects" },
            { value: "pro", label: "Pro", description: "₹499 / month, unlimited projects" },
            { value: "team", label: "Team", description: "Contact sales", disabled: true },
          ]}
        />
      </Section>

      <Section title="RadioGroup · horizontal, error, children">
        <RadioGroup label="Delivery" orientation="horizontal" required error="Choose a delivery option.">
          <Radio value="pickup" label="Pickup" />
          <Radio value="courier" label="Courier" />
          <Radio value="post" label="Post" disabled />
        </RadioGroup>
        <RadioGroup label="Sizes" orientation="horizontal" defaultValue="md">
          <Radio value="sm" size="sm" label="Small" />
          <Radio value="md" label="Medium" />
          <Radio value="lg" size="lg" label="Large" />
        </RadioGroup>
      </Section>
    </>
  );
}
