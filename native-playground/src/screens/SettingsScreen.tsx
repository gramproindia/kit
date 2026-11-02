import { Text, View } from "react-native";
import { Alert } from "../../../source/components/alert";
import { Button } from "../../../source/components/button";
import { Card, CardBody, CardHeader } from "../../../source/components/card";
import { NumberInput } from "../../../source/components/number-input";
import { Switch } from "../../../source/components/switch";
import { toast } from "../../../source/components/toaster";
import { KitProvider, useKitTheme } from "../../../source/components/shared/native";
import { ListItem, ListSection } from "../../../source/native/list-item";
import { SegmentedControl } from "../../../source/native/segmented-control";
import app from "../../app.json";
import { useNav } from "../navigation/Navigator";
import { useAppSettings } from "../theme/AppSettings";
import { presetById } from "../theme/presets";
import { PresetSwatches, SchemeControl, ThemePreview } from "../theme/ThemeControls";
import { Muted, Screen } from "../ui/kit";

const RADII = [0, 4, 8, 12, 16];

export function SettingsScreen() {
  const { tokens } = useKitTheme();
  const nav = useNav();
  const settings = useAppSettings();
  const teal = presetById("teal");

  return (
    <Screen title="Settings" subtitle="Appearance and about">
      <ListSection header="Appearance" footer="Same tokens and presets as the web docs' theme playground.">
        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ gap: 8 }}>
            <Text style={{ color: tokens.fg, fontWeight: "600", fontSize: tokens.fontSize }}>Colour scheme</Text>
            <SchemeControl />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={{ color: tokens.fg, fontWeight: "600", fontSize: tokens.fontSize }}>Palette</Text>
            <PresetSwatches />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={{ color: tokens.fg, fontWeight: "600", fontSize: tokens.fontSize }}>Corner radius</Text>
            <SegmentedControl
              aria-label="Corner radius"
              size="sm"
              value={RADII.includes(tokens.radius) ? String(tokens.radius) : undefined}
              onValueChange={(v) => settings.setToken(settings.resolved, "radius", Number(v))}
              options={RADII.map((r) => ({ value: String(r), label: `${r}` }))}
            />
          </View>
          <NumberInput
            label="Text size"
            description="Base size in dp; everything scales from it."
            min={13}
            max={19}
            step={1}
            decimals={0}
            value={tokens.fontSize}
            onValueChange={(v) => v && settings.setToken(settings.resolved, "fontSize", v)}
          />
        </View>
        <ListItem title="Theme editor" description="Edit every token, export gbs.theme.ts" chevron onPress={() => nav.push("theme")} />
        <ListItem title="Reset appearance" destructive onPress={() => settings.setPreset("default")} />
      </ListSection>

      <ThemePreview />

      <View style={{ gap: 8 }}>
        <Text style={{ color: tokens.fg, fontWeight: "700", fontSize: tokens.fontSize + 2 }}>Scoped theme</Text>
        <Muted>
          A second KitProvider themes only what it wraps, like setting --gbs-* on one section on the web. This card
          always uses the Teal palette.
        </Muted>
        <KitProvider theme={{ light: teal.light, dark: teal.dark }} colorScheme={settings.resolved}>
          <Card>
            <CardHeader title="Admin area" description="Teal, square-ish corners" />
            <CardBody>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button size="sm" onPress={() => toast("Saved")}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline">
                    Cancel
                  </Button>
                </View>
                <Switch label="Audit log" defaultChecked />
              </View>
            </CardBody>
          </Card>
        </KitProvider>
      </View>

      <ListSection header="About">
        <ListItem title="App" value={`${app.expo.name} ${app.expo.version}`} />
        <ListItem title="Kit" value="React Native · beta" />
        <ListItem title="Diagnostics" description="Hermes Intl checks (Phase 0, S1)" chevron onPress={() => nav.push("diagnostics")} />
        <ListItem title="Components" description="Browse every demo" chevron onPress={() => nav.setTab("components")} />
      </ListSection>

      <Alert
        size="sm"
        variant="warning"
        title="Beta"
        description="React Native support is in beta. APIs may change or break between prereleases (npm tag native)."
      />
    </Screen>
  );
}
