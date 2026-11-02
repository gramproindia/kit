import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "../../source/components/button";
import { Card, CardBody, CardFooter, CardHeader, Stat, trendDirection } from "../../source/components/card";
import { useKitTheme } from "../../source/components/shared/native";
import { Row, Section } from "./layout";

export function CardDemo() {
  const { tokens } = useKitTheme();
  const [presses, setPresses] = useState(0);
  return (
    <>
      <Section title="Card · variants">
        {(["outlined", "elevated", "plain"] as const).map((variant) => (
          <Card key={variant} variant={variant}>
            <CardHeader
              title={`${variant[0].toUpperCase()}${variant.slice(1)} card`}
              description="Header, body and footer share the card's padding."
              actions={<Button size="sm" variant="ghost">Edit</Button>}
            />
            <CardBody>The body is where the content goes.</CardBody>
            <CardFooter>
              <Button size="sm" variant="outline">Cancel</Button>
              <Button size="sm">Save</Button>
            </CardFooter>
          </Card>
        ))}
      </Section>

      <Section title="Card · padding and press">
        <Row>
          {(["none", "sm", "md", "lg"] as const).map((padding) => (
            <Card key={padding} padding={padding}>
              <CardBody>{padding}</CardBody>
            </Card>
          ))}
        </Row>
        <Card onPress={() => setPresses((n) => n + 1)} aria-label="Open invoice">
          <CardHeader title="Pressable card" description={`Pressed ${presses}×`} />
          <CardBody>The whole card is one target.</CardBody>
        </Card>
      </Section>

      <Section title="Stat">
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Card style={{ flex: 1 }}>
            <CardBody>
              <Stat
                label="Revenue"
                value="₹12.4L"
                trend={{ direction: trendDirection(12.4), label: "12.4%", description: "vs last month" }}
              />
            </CardBody>
          </Card>
          <Card style={{ flex: 1 }}>
            <CardBody>
              <Stat
                label="Churn"
                value="3.1%"
                icon={<Text style={{ color: tokens.muted }}>◔</Text>}
                trend={{ direction: "up", label: "0.4%", invert: true }}
                help="Lower is better"
              />
            </CardBody>
          </Card>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Card style={{ flex: 1 }}>
            <CardBody>
              <Stat label="Orders" value="1,204" trend={{ direction: "flat", label: "0%" }} />
            </CardBody>
          </Card>
          <Card style={{ flex: 1 }}>
            <CardBody>
              <Stat label="Loading" value="—" loading />
            </CardBody>
          </Card>
        </View>
      </Section>
    </>
  );
}
