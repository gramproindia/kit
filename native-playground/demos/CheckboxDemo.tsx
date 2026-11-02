import { useState } from "react";
import { Checkbox, CheckboxGroup } from "../../source/components/checkbox";
import { Section } from "./layout";

export function CheckboxDemo() {
  const [terms, setTerms] = useState(false);
  const [channels, setChannels] = useState<string[]>(["sms"]);
  return (
    <>
      <Section title="Checkbox · states">
        <Checkbox label="Unchecked" />
        <Checkbox label="Checked" defaultChecked />
        <Checkbox label="Indeterminate" checked="indeterminate" />
        <Checkbox label="Disabled" disabled />
        <Checkbox label="Disabled and checked" disabled defaultChecked />
        <Checkbox
          label="I accept the terms"
          description="You can withdraw at any time."
          required
          checked={terms}
          onCheckedChange={setTerms}
          error={terms ? undefined : "Accept the terms to continue."}
        />
        <Checkbox size="sm" label="Small" defaultChecked />
        <Checkbox size="lg" label="Large" defaultChecked />
      </Section>

      <Section title="CheckboxGroup · select all">
        <CheckboxGroup
          label="Notify me by"
          description="Pick one or more."
          selectAll
          value={channels}
          onValueChange={setChannels}
          options={[
            { value: "sms", label: "SMS" },
            { value: "email", label: "Email" },
            { value: "whatsapp", label: "WhatsApp", description: "Business account only" },
            { value: "post", label: "Post", disabled: true },
          ]}
        />
      </Section>

      <Section title="CheckboxGroup · horizontal, error">
        <CheckboxGroup label="Days" orientation="horizontal" required error="Choose at least one day.">
          <Checkbox value="mon" label="Mon" />
          <Checkbox value="tue" label="Tue" />
          <Checkbox value="wed" label="Wed" />
        </CheckboxGroup>
      </Section>
    </>
  );
}
