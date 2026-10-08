"use client";

import { useState } from "react";
import { Checkbox, CheckboxGroup } from "@/components/checkbox";
import { CHANNELS } from "./_controls-fixtures";

export default function CheckboxGroupsWrapper() {
  const [agreed, setAgreed] = useState(false);
  const [channels, setChannels] = useState<string[]>(["email"]);

  return (
    <div className="flex flex-col gap-5">
      <Checkbox
        label="I agree to the terms"
        description="Required to create an account."
        checked={agreed}
        onCheckedChange={setAgreed}
        required
        error={agreed ? undefined : "Please accept the terms to continue."}
      />
      <CheckboxGroup
        label="Notify me by"
        options={CHANNELS}
        value={channels}
        onValueChange={setChannels}
        selectAll
        description={`Selected: ${channels.join(", ") || "none"}`}
      />
      <CheckboxGroup
        label="Size"
        orientation="horizontal"
        defaultValue={["md"]}
        size="sm"
      >
        <Checkbox value="sm" label="Small" />
        <Checkbox value="md" label="Medium" />
        <Checkbox value="lg" label="Large" />
      </CheckboxGroup>
    </div>
  );
}
