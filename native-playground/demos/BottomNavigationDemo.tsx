import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { BottomNavigation, type BottomNavigationItem } from "../../source/native/bottom-navigation";
import { useKitTheme } from "../../source/components/shared/native";
import { Section } from "./layout";
import { FakeRows, MiniScreen, TextIcon } from "./mobileFrame";

const icon = (glyph: string) => ({ color }: { color: string }) => <TextIcon glyph={glyph} color={color} />;

const ITEMS: BottomNavigationItem[] = [
  { key: "home", label: "Home", icon: icon("⌂") },
  { key: "invoices", label: "Invoices", icon: icon("▤"), badge: 3 },
  { key: "payments", label: "Payments", icon: icon("₹"), badge: 128 },
  { key: "profile", label: "Profile", icon: icon("◉"), badge: true },
];

export function BottomNavigationDemo() {
  const { tokens } = useKitTheme();
  const [tab, setTab] = useState("invoices");
  const [reselects, setReselects] = useState(0);
  return (
    <>
      <Section title="BottomNavigation · badges, reselect">
        <MiniScreen>
          <View style={{ flex: 1 }}>
            <View style={{ padding: 16 }}>
              <Text style={{ color: tokens.fg, fontSize: 20, fontWeight: "700" }}>
                {ITEMS.find((i) => i.key === tab)?.label}
              </Text>
              <Text style={{ color: tokens.muted }}>Tap the active tab again: reselected {reselects}×</Text>
            </View>
            <ScrollView nestedScrollEnabled>
              <FakeRows count={6} />
            </ScrollView>
          </View>
          <BottomNavigation
            safeArea={false}
            items={ITEMS}
            value={tab}
            onValueChange={setTab}
            onReselect={() => setReselects((n) => n + 1)}
          />
        </MiniScreen>
      </Section>

      <Section title="BottomNavigation · label only when active, disabled item">
        <MiniScreen height={64}>
          <BottomNavigation
            safeArea={false}
            labelVisibility="active"
            items={[...ITEMS.slice(0, 3), { key: "admin", label: "Admin", icon: icon("⚙"), disabled: true }]}
          />
        </MiniScreen>
      </Section>
    </>
  );
}
