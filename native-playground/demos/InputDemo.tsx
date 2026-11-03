import { useState } from "react";
import { Text } from "react-native";
import { Input, OtpInput } from "../../source/components/input";
import { useKitTheme } from "../../source/components/shared/native";
import { Section } from "./layout";

export function InputDemo() {
  const { tokens } = useKitTheme();
  const [code, setCode] = useState("");
  const [done, setDone] = useState<string | null>(null);
  return (
    <>
      <Section title="Input · basics">
        <Input label="Full name" placeholder="Anand Remanan" clearable defaultValue="Anand" />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          description="We never share it."
          required
        />
        <Input label="Password" type="password" placeholder="At least 8 characters" />
        <Input
          label="Website"
          type="url"
          leading="https://"
          placeholder="gramproindia.com"
        />
        <Input label="Weight" type="number" trailing="kg" defaultValue="72.5" />
      </Section>

      <Section title="Input · states">
        <Input label="Bio" showCount maxLength={20} defaultValue="Builds 👨‍👩‍👧 UI kits" />
        <Input label="PAN" defaultValue="ABCDE1234" error="PAN has 10 characters." />
        <Input label="Read only" readOnly defaultValue="INV-2026-0042" />
        <Input label="Disabled" disabled defaultValue="Can't touch this" />
        <Input size="sm" placeholder="Small" />
        <Input size="lg" placeholder="Large" />
      </Section>

      <Section title="OtpInput">
        <OtpInput
          label="Verification code"
          description="Sent to +91 98xxx xx210. Paste the whole SMS to fill it."
          value={code}
          onValueChange={setCode}
          onComplete={setDone}
        />
        {done ? <Text style={{ color: tokens.success }}>Completed: {done}</Text> : null}
        <OtpInput label="Grouped, masked" length={6} groups={[3, 3]} mask defaultValue="123" />
        <OtpInput label="Alphanumeric" length={4} mode="alphanumeric" uppercase error="Code expired." />
      </Section>
    </>
  );
}
