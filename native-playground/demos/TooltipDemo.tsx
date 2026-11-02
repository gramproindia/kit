import { Text } from "react-native";
import { Button } from "../../source/components/button";
import { useKitTheme } from "../../source/components/shared/native";
import { Tooltip } from "../../source/components/tooltip";
import { Row, Section } from "./layout";

function Glyph({ children }: { children: string }) {
  const { tokens } = useKitTheme();
  return <Text style={{ fontSize: 16, color: tokens.fg, fontWeight: "700" }}>{children}</Text>;
}

export function TooltipDemo() {
  const { tokens } = useKitTheme();
  return (
    <Section title="Tooltip · long-press">
      <Text style={{ color: tokens.muted }}>Press and hold a button.</Text>
      <Row>
        <Tooltip content="Archive">
          <Button variant="outline" icon={<Glyph>⌂</Glyph>} aria-label="Archive" />
        </Tooltip>
        <Tooltip content="Duplicate this invoice" side="bottom">
          <Button variant="outline" icon={<Glyph>⧉</Glyph>} aria-label="Duplicate" />
        </Tooltip>
        <Tooltip content="Starts on the right" side="right">
          <Button variant="outline">Right</Button>
        </Tooltip>
        <Tooltip content="Never shown" disabled>
          <Button variant="ghost">Disabled tooltip</Button>
        </Tooltip>
      </Row>
    </Section>
  );
}
