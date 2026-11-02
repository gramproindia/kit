import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { KitProvider, useKitTheme, type ColorScheme } from "../source/components/shared/native";
import { Gallery } from "./demos/Gallery";
import { IntlSpike } from "./spikes/intl/IntlSpike";

type Screen = "components" | "intl";
type Scheme = ColorScheme | "system";

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress(): void }) {
  const { tokens } = useKitTheme();
  return (
    <Pressable
      role="tab"
      aria-selected={active}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: tokens.border, backgroundColor: active ? tokens.accent : "transparent" },
      ]}
    >
      <Text style={{ color: active ? tokens.accentFg : tokens.fg, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

function Shell({
  screen,
  setScreen,
  scheme,
  setScheme,
}: {
  screen: Screen;
  setScreen(s: Screen): void;
  scheme: Scheme;
  setScheme(s: Scheme): void;
}) {
  const { tokens, scheme: resolved } = useKitTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: tokens.bg, paddingTop: insets.top + 8 }]}>
      <View style={[styles.bar, { borderColor: tokens.border }]}>
        <Text style={[styles.brand, { color: tokens.fg }]}>GramproKit Native</Text>
        <View style={styles.chips}>
          <Chip label="Components" active={screen === "components"} onPress={() => setScreen("components")} />
          <Chip label="Intl test" active={screen === "intl"} onPress={() => setScreen("intl")} />
          <View style={styles.spacer} />
          {(["system", "light", "dark"] as const).map((s) => (
            <Chip key={s} label={s} active={scheme === s} onPress={() => setScheme(s)} />
          ))}
        </View>
      </View>
      {screen === "components" ? <Gallery /> : <IntlSpike />}
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
    </View>
  );
}

function Root() {
  const [screen, setScreen] = useState<Screen>("components");
  const [scheme, setScheme] = useState<Scheme>("system");
  // Kit reads no safe-area library itself; the app hands it the insets.
  const insets = useSafeAreaInsets();
  return (
    <KitProvider colorScheme={scheme} insets={insets}>
      <Shell screen={screen} setScreen={setScreen} scheme={scheme} setScheme={setScheme} />
    </KitProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: { paddingHorizontal: 16, paddingBottom: 10, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  brand: { fontSize: 20, fontWeight: "800" },
  chips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  spacer: { flex: 1 },
});
