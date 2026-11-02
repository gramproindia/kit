import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "../../source/components/button";
import { Popover } from "../../source/components/popover";
import { useKitTheme } from "../../source/components/shared/native";
import { Row, Section } from "./layout";

export function PopoverDemo() {
  const { tokens } = useKitTheme();
  const [reason, setReason] = useState("—");
  return (
    <>
      <Section title="Popover · anchored">
        <Row>
          <Popover
            trigger={<Button variant="outline">Help</Button>}
            title="What is GST?"
            description="Goods and Services Tax, charged on most sales in India."
            onOpenChange={(open, why) => setReason(open ? "opened" : (why ?? "?"))}
          >
            Your invoices show it per line, at the rate set on each product.
          </Popover>
          <Popover trigger={<Button variant="outline">Filters</Button>} aria-label="Filters" side="bottom" align="end">
            {({ close }) => (
              <View style={{ gap: 10 }}>
                <Text style={{ color: tokens.fg }}>Only unpaid invoices</Text>
                <Button size="sm" onPress={close}>
                  Apply
                </Button>
              </View>
            )}
          </Popover>
        </Row>
        <Text style={{ color: tokens.muted }}>Last close reason: {reason}</Text>
      </Section>

      <Section title="Popover · as a sheet">
        <Popover
          presentation="sheet"
          trigger={<Button variant="secondary">Share settings</Button>}
          title="Share settings"
          description="People with the link can view this invoice."
        >
          The link expires in 7 days. Revoke it any time from Settings.
        </Popover>
      </Section>
    </>
  );
}
