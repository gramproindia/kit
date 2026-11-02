import { Pressable, StyleSheet, Text, View } from "react-native";
import { Alert } from "../../../source/components/alert";
import { Badge } from "../../../source/components/badge";
import { Button } from "../../../source/components/button";
import { Card, CardBody, CardHeader } from "../../../source/components/card";
import { Checkbox } from "../../../source/components/checkbox";
import { Input } from "../../../source/components/input";
import { Switch } from "../../../source/components/switch";
import { CheckGlyph, useKitTheme } from "../../../source/components/shared/native";
import { SegmentedControl } from "../../../source/native/segmented-control";
import { useAppSettings, type SchemeSetting } from "./AppSettings";
import { PRESETS } from "./presets";

/** System / Light / Dark. */
export function SchemeControl({ withSystem = true }: { withSystem?: boolean }) {
  const { scheme, resolved, setScheme } = useAppSettings();
  const options = [
    ...(withSystem ? [{ value: "system", label: "System" }] : []),
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];
  return (
    <SegmentedControl
      aria-label="Colour scheme"
      value={withSystem ? scheme : resolved}
      onValueChange={(v) => setScheme(v as SchemeSetting)}
      options={options}
    />
  );
}

/** The web playground's preset row: one swatch per palette. */
export function PresetSwatches() {
  const { tokens } = useKitTheme();
  const { preset, setPreset } = useAppSettings();
  return (
    <View style={styles.swatches} role="radiogroup" aria-label="Palette">
      {PRESETS.map((p) => {
        const active = p.id === preset;
        return (
          <Pressable
            key={p.id}
            role="radio"
            aria-checked={active}
            aria-label={p.label}
            onPress={() => setPreset(p.id)}
            style={styles.swatchCell}
          >
            <View
              style={[
                styles.swatch,
                { backgroundColor: p.swatch, borderColor: active ? tokens.fg : tokens.border, borderWidth: active ? 2 : 1 },
              ]}
            >
              {active && <CheckGlyph size={18} color="#ffffff" stroke={2.5} />}
            </View>
            <Text style={{ color: active ? tokens.fg : tokens.muted, fontSize: tokens.fontSize - 3, fontWeight: active ? "700" : "500" }}>
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Components that read most tokens, to see a change land. */
export function ThemePreview({ title = "Preview" }: { title?: string }) {
  return (
    <Card>
      <CardHeader title={title} description="Every control here reads the tokens live." actions={<Badge variant="accent">Live</Badge>} />
      <CardBody>
        <View style={{ gap: 12 }}>
          <View style={styles.row}>
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">
              Secondary
            </Button>
            <Button size="sm" variant="outline">
              Outline
            </Button>
            <Button size="sm" variant="danger">
              Delete
            </Button>
          </View>
          <View style={styles.row}>
            <Badge variant="success">Paid</Badge>
            <Badge variant="warning">Unpaid</Badge>
            <Badge variant="danger" appearance="solid">
              Overdue
            </Badge>
            <Badge variant="info">Info</Badge>
          </View>
          <Input label="Customer" placeholder="Anand Remanan" clearable defaultValue="Gita Hari" />
          <Checkbox label="Send a copy to me" defaultChecked />
          <Switch label="Recurring" defaultChecked />
          <Alert size="sm" variant="info" description="Alerts, toasts and dialogs follow the same tokens." />
        </View>
      </CardBody>
    </Card>
  );
}

const styles = StyleSheet.create({
  swatches: { flexDirection: "row", justifyContent: "space-between" },
  swatchCell: { alignItems: "center", gap: 6, minWidth: 56 },
  swatch: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
