import { useState } from "react";
import { View } from "react-native";
import { useKitTheme } from "../../source/components/shared/native";
import { Switch } from "../../source/components/switch";
import { Section } from "./layout";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function SwitchDemo() {
  const { tokens } = useKitTheme();
  const [wifi, setWifi] = useState(true);
  const [failNext, setFailNext] = useState(true);

  return (
    <>
      <Section title="Switch · sizes">
        <Switch size="sm" label="Small" defaultChecked />
        <Switch size="md" label="Medium" />
        <Switch size="lg" label="Large" defaultChecked />
      </Section>

      <Section title="Switch · states">
        <Switch label="Controlled Wi-Fi" checked={wifi} onCheckedChange={setWifi} description={wifi ? "Connected" : "Off"} />
        <Switch label="Disabled" disabled defaultChecked />
        <Switch label="Read only" readOnly defaultChecked />
        <Switch label="Accept terms" required error="You need to accept the terms to continue." />
        <Switch label="Loading from outside" loading defaultChecked />
      </Section>

      <Section title="Switch · async save">
        <Switch
          label="Email me receipts"
          description="Saves for 1.2 s, then succeeds."
          onCheckedChange={() => wait(1200)}
        />
        <Switch
          label="Flaky setting"
          description={failNext ? "Next save fails and the switch goes back." : "Next save succeeds."}
          onCheckedChange={async () => {
            await wait(1200);
            const fail = failNext;
            setFailNext((f) => !f);
            if (fail) throw new Error("Network error");
          }}
        />
      </Section>

      <Section title="Switch · settings row (label at start)">
        <View style={{ borderWidth: 1, borderColor: tokens.border, borderRadius: tokens.radius, paddingHorizontal: 12 }}>
          <Switch labelPosition="start" label="Notifications" description="Push alerts for new payments" defaultChecked />
          <Switch labelPosition="start" label="Dark statements" />
        </View>
      </Section>
    </>
  );
}
