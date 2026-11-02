import { useState } from "react";
import { Text } from "react-native";
import { Button } from "../../source/components/button";
import { useKitTheme } from "../../source/components/shared/native";
import { Row, Section } from "./layout";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Glyph({ children }: { children: string }) {
  const { tokens } = useKitTheme();
  return <Text style={{ fontSize: 16, color: tokens.accentFg, fontWeight: "700" }}>{children}</Text>;
}

export function ButtonDemo() {
  const [saved, setSaved] = useState(0);
  return (
    <>
      <Section title="Button · variants">
        <Row>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </Row>
        <Row>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="link">Link</Button>
        </Row>
      </Section>

      <Section title="Button · sizes and icons">
        <Row>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row>
          <Button leading={<Glyph>+</Glyph>}>New invoice</Button>
          <Button icon={<Glyph>✓</Glyph>} aria-label="Confirm" />
          <Button disabled>Disabled</Button>
        </Row>
      </Section>

      <Section title="Button · loading">
        <Row>
          <Button loading>Saving</Button>
          <Button variant="secondary" loading loadingText="Uploading…">
            Upload
          </Button>
        </Row>
        <Button fullWidth onPress={() => wait(1500).then(() => setSaved((n) => n + 1))}>
          {`Async press · saved ${saved}×`}
        </Button>
      </Section>
    </>
  );
}
