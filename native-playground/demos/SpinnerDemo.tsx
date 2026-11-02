import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "../../source/components/button";
import { useKitTheme } from "../../source/components/shared/native";
import { Spinner } from "../../source/components/spinner";
import { Row, Section } from "./layout";

export function SpinnerDemo() {
  const { tokens } = useKitTheme();
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Section title="Spinner · sizes">
        <Row>
          <Spinner size="xs" />
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <Spinner size="xl" />
          <Spinner size={56} color={tokens.success} />
        </Row>
      </Section>

      <Section title="Spinner · dots and labels">
        <Row>
          <Spinner variant="dots" size="lg" />
          <Spinner variant="dots" size="xl" color={tokens.danger} />
          <Spinner showLabel label="Fetching invoices…" />
          <Spinner variant="dots" showLabel />
        </Row>
      </Section>

      <Section title="Spinner · covering content (delay 150 ms, min 600 ms)">
        <Spinner loading={busy} delay={150} minDuration={600} style={{ borderRadius: tokens.radius }}>
          <View style={{ padding: 16, borderRadius: tokens.radius, borderWidth: 1, borderColor: tokens.border, gap: 10 }}>
            <Text style={{ color: tokens.fg, fontSize: tokens.fontSize, fontWeight: "600" }}>Monthly report</Text>
            <Text style={{ color: tokens.muted, fontSize: tokens.fontSize }}>
              While loading, this panel takes no touches and is hidden from screen readers.
            </Text>
            <Button variant="outline" size="sm" onPress={() => setBusy(true)}>
              Refresh
            </Button>
          </View>
        </Spinner>
        <Button variant="secondary" onPress={() => setBusy((b) => !b)}>
          {busy ? "Stop loading" : "Start loading"}
        </Button>
      </Section>
    </>
  );
}
