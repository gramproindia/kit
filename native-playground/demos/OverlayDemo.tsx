import { useRef, useState, type ComponentRef } from "react";
import { Text, View } from "react-native";
import { Button } from "../../source/components/button";
import { Anchored, Sheet, useKitTheme } from "../../source/components/shared/native";
import { Row, Section } from "./layout";

/** The shared overlay primitives every overlay component is built on. */
export function OverlayDemo() {
  const { tokens } = useKitTheme();
  const [sheet, setSheet] = useState(false);
  const [popover, setPopover] = useState(false);
  const anchor = useRef<ComponentRef<typeof View>>(null);
  return (
    <Section title="Overlay primitives · Sheet, Anchored">
      <Row>
        <Button variant="outline" onPress={() => setSheet(true)}>
          Open sheet
        </Button>
        <View ref={anchor} collapsable={false}>
          <Button variant="outline" onPress={() => setPopover(true)}>
            Anchored popover
          </Button>
        </View>
      </Row>
      <Sheet open={sheet} onDismiss={() => setSheet(false)} title="Share invoice">
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ color: tokens.muted, fontSize: tokens.fontSize }}>
            Drag the handle down, tap outside, or press back to close.
          </Text>
          <Button fullWidth onPress={() => setSheet(false)}>
            Done
          </Button>
        </View>
      </Sheet>
      <Anchored open={popover} onDismiss={() => setPopover(false)} anchorRef={anchor}>
        <View style={{ padding: 14, width: 220, gap: 6 }}>
          <Text style={{ color: tokens.fg, fontWeight: "600" }}>Placed by placePopover</Text>
          <Text style={{ color: tokens.muted }}>The same maths as the web Popover.</Text>
        </View>
      </Anchored>
    </Section>
  );
}
