"use client";

import { useState } from "react";
import { Switch } from "@/components/switch";
import { wait } from "./_form-controls-fixtures";

export default function SwitchVariantsWrapper() {
  const [digest, setDigest] = useState(true);
  const [failing, setFailing] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Switch label="Email notifications" defaultChecked />
      <Switch
        label="Two-factor authentication"
        description="Ask for a code from your authenticator app."
        checked={digest}
        onCheckedChange={async (next) => {
          await wait(900);
          setDigest(next);
        }}
      />
      <Switch
        label="Sync with the billing system"
        description="This one rejects, so watch it return to where it was."
        checked={failing}
        onCheckedChange={async () => {
          await wait(900);
          setFailing(false);
          throw new Error("nope");
        }}
      />
      <Switch
        label="Weekly digest"
        labelPosition="start"
        defaultChecked
        size="sm"
      />
      <Switch label="Read-only, on" checked readOnly />
      <Switch label="Disabled" disabled />
    </div>
  );
}
