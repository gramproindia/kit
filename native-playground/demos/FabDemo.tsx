import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Fab, SpeedDial } from "../../source/native/fab";
import { BottomNavigation } from "../../source/native/bottom-navigation";
import { useKitTheme } from "../../source/components/shared/native";
import { Row, Section } from "./layout";
import { FakeRows, MiniScreen, TextIcon } from "./mobileFrame";

export function FabDemo() {
  const { tokens } = useKitTheme();
  const [extended, setExtended] = useState(true);
  const [last, setLast] = useState("—");
  const plus = (color: string, size = 22) => <TextIcon glyph="+" color={color} size={size} />;
  return (
    <>
      <Section title="Fab · sizes and variants">
        <Row>
          <Fab placement="none" size="sm" icon={plus(tokens.accentFg, 18)} aria-label="Add" />
          <Fab placement="none" icon={plus(tokens.accentFg)} aria-label="Add" />
          <Fab placement="none" size="lg" icon={plus(tokens.accentFg, 34)} aria-label="Add" />
          <Fab placement="none" variant="secondary" icon={plus(tokens.accentStrong)} aria-label="Add" />
          <Fab placement="none" variant="surface" icon={plus(tokens.accent)} aria-label="Add" />
        </Row>
        <Row>
          <Fab placement="none" icon={plus(tokens.accentFg)} label="New invoice" />
          <Fab placement="none" loading icon={plus(tokens.accentFg)} aria-label="Saving" />
          <Fab placement="none" disabled icon={plus(tokens.accentFg)} aria-label="Add" />
        </Row>
      </Section>

      <Section title="Fab · extended, collapses while scrolling down">
        <MiniScreen>
          <ScrollView
            nestedScrollEnabled
            scrollEventThrottle={16}
            onScroll={(e) => setExtended(e.nativeEvent.contentOffset.y < 24)}
          >
            <FakeRows count={12} />
          </ScrollView>
          <Fab safeArea={false} icon={plus(tokens.accentFg)} label="New invoice" extended={extended} />
        </MiniScreen>
      </Section>

      <Section title="SpeedDial · above a BottomNavigation">
        <MiniScreen>
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ color: tokens.muted }}>Last action: {last}</Text>
          </View>
          <SpeedDial
            safeArea={false}
            offset={64}
            aria-label="Create"
            icon={plus(tokens.accentFg)}
            actions={[
              { key: "invoice", label: "Invoice", icon: <TextIcon glyph="▤" color={tokens.accentStrong} />, onPress: () => setLast("Invoice") },
              { key: "payment", label: "Payment", icon: <TextIcon glyph="₹" color={tokens.accentStrong} />, onPress: () => setLast("Payment") },
              { key: "customer", label: "Customer", icon: <TextIcon glyph="◉" color={tokens.accentStrong} />, onPress: () => setLast("Customer") },
            ]}
          />
          <BottomNavigation
            safeArea={false}
            items={[
              { key: "home", label: "Home", icon: ({ color }) => <TextIcon glyph="⌂" color={color} /> },
              { key: "invoices", label: "Invoices", icon: ({ color }) => <TextIcon glyph="▤" color={color} /> },
              { key: "profile", label: "Profile", icon: ({ color }) => <TextIcon glyph="◉" color={color} /> },
            ]}
          />
        </MiniScreen>
      </Section>
    </>
  );
}
