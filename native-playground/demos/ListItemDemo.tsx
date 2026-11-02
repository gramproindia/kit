import { useState } from "react";
import { Text, View } from "react-native";
import { Avatar } from "../../source/components/avatar";
import { Badge } from "../../source/components/badge";
import { useKitTheme } from "../../source/components/shared/native";
import { Switch } from "../../source/components/switch";
import { List, ListItem, ListSection } from "../../source/native/list-item";
import { Section } from "./layout";

/** A coloured rounded square with a letter: a settings-style icon without SVG. */
function Tile({ color, letter }: { color: string; letter: string }) {
  return (
    <View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>{letter}</Text>
    </View>
  );
}

export function ListItemDemo() {
  const { tokens } = useKitTheme();
  const [push, setPush] = useState(true);
  const [taps, setTaps] = useState(0);
  return (
    <>
      <Section title="ListSection · inset (settings)">
        <ListSection header="Account" footer={`Opened ${taps} time${taps === 1 ? "" : "s"}. Rows with a chevron open a screen.`}>
          <ListItem leading={<Tile color="#2563eb" letter="L" />} title="Language" value="English" chevron onPress={() => setTaps((n) => n + 1)} />
          <ListItem
            leading={<Tile color="#15803d" letter="N" />}
            title="Push notifications"
            trailing={<Switch aria-label="Push notifications" checked={push} onCheckedChange={setPush} />}
          />
          <ListItem leading={<Tile color="#b45309" letter="₹" />} title="Currency" value="INR (₹)" chevron onPress={() => setTaps((n) => n + 1)} />
          <ListItem title="Sign out" destructive onPress={() => setTaps((n) => n + 1)} />
        </ListSection>
      </Section>
      <Section title="List · plain (inbox)">
        <List style={{ marginHorizontal: -16 }}>
          <ListItem
            leading={<Avatar name="Anand Remanan" size="md" />}
            title="Anand Remanan"
            description="Invoice INV-2041 is ready for review. The totals changed after the GST update."
            trailing={<Badge variant="accent">New</Badge>}
            onPress={() => setTaps((n) => n + 1)}
          />
          <ListItem
            leading={<Avatar name="Gita Hari" size="md" />}
            title="Gita Hari"
            description="Shared the Q3 ledger with you."
            value="09:41"
            onPress={() => setTaps((n) => n + 1)}
          />
          <ListItem leading={<Avatar name="Old Account" size="md" />} title="Old account" description="Archived" disabled />
        </List>
        <Text style={{ color: tokens.muted, fontSize: tokens.fontSize - 2 }}>Long descriptions stop at two lines.</Text>
      </Section>
    </>
  );
}
