import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Accordion, AccordionItem } from "../../../source/components/accordion";
import { Badge } from "../../../source/components/badge";
import { Button } from "../../../source/components/button";
import { NumberInput } from "../../../source/components/number-input";
import { toast } from "../../../source/components/toaster";
import { useKitTheme, type KitTokens } from "../../../source/components/shared/native";
import { BottomSheet } from "../../../source/native/bottom-sheet";
import { themeSource, useAppSettings } from "../theme/AppSettings";
import { PresetSwatches, SchemeControl, ThemePreview } from "../theme/ThemeControls";
import { HEX, QUICK_COLORS, TOKEN_GROUPS, type TokenMeta } from "../theme/tokens";
import { BarAction, Muted, Screen } from "../ui/kit";

/** One colour token: swatch, hex field, and a row of quick colours. */
function ColorRow({ meta, value, onChange }: { meta: TokenMeta; value: string; onChange(v: string): void }) {
  const { tokens } = useKitTheme();
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  useEffect(() => setText(value), [value]);
  const valid = HEX.test(text);
  return (
    <View style={{ gap: 8, paddingVertical: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable
          role="button"
          aria-label={`${meta.key} colour, ${value}. Show quick colours`}
          aria-expanded={open}
          onPress={() => setOpen((o) => !o)}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: value, borderWidth: 1, borderColor: tokens.borderControl }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: tokens.fg, fontWeight: "600", fontSize: tokens.fontSize }}>{meta.key}</Text>
          <Text style={{ color: tokens.muted, fontSize: tokens.fontSize - 3 }} numberOfLines={1}>
            {meta.web ? `--${meta.web} · ` : ""}
            {meta.use}
          </Text>
        </View>
        <TextInput
          value={text}
          onChangeText={(next) => {
            setText(next);
            if (HEX.test(next)) onChange(next.toLowerCase());
          }}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={7}
          aria-label={`${meta.key} hex`}
          style={{
            width: 96,
            height: 40,
            paddingHorizontal: 10,
            borderRadius: tokens.radius,
            borderWidth: 1,
            borderColor: valid ? tokens.borderControl : tokens.danger,
            color: tokens.fg,
            backgroundColor: tokens.inputBg,
            fontSize: tokens.fontSize - 1,
            fontFamily: "monospace",
          }}
        />
      </View>
      {open && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingStart: 48 }}>
          {QUICK_COLORS.map((c) => (
            <Pressable
              key={c}
              role="button"
              aria-label={c}
              onPress={() => onChange(c)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: c,
                borderWidth: c === value ? 3 : 1,
                borderColor: c === value ? tokens.fg : tokens.border,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/** A free-text token (shadow, backdrop), applied when you leave the field. */
function RawRow({ meta, value, onChange }: { meta: TokenMeta; value: string; onChange(v: string): void }) {
  const { tokens } = useKitTheme();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <View style={{ gap: 6, paddingVertical: 6 }}>
      <Text style={{ color: tokens.fg, fontWeight: "600", fontSize: tokens.fontSize }}>{meta.key}</Text>
      <Muted>{`--${meta.web} · ${meta.use}`}</Muted>
      <TextInput
        value={text}
        onChangeText={setText}
        onEndEditing={() => text.trim() && onChange(text.trim())}
        autoCapitalize="none"
        autoCorrect={false}
        aria-label={meta.key}
        style={{
          minHeight: 40,
          paddingHorizontal: 10,
          borderRadius: tokens.radius,
          borderWidth: 1,
          borderColor: tokens.borderControl,
          color: tokens.fg,
          backgroundColor: tokens.inputBg,
          fontSize: tokens.fontSize - 2,
          fontFamily: "monospace",
        }}
      />
    </View>
  );
}

export function ThemeEditorScreen() {
  const { tokens } = useKitTheme();
  const settings = useAppSettings();
  const [exportOpen, setExportOpen] = useState(false);
  const source = useMemo(() => themeSource(settings.theme), [settings.theme]);
  const edited = Object.keys(settings.overrides.light).length + Object.keys(settings.overrides.dark).length;

  const set = <K extends keyof KitTokens>(key: K, value: KitTokens[K]) => settings.setToken(settings.resolved, key, value);

  return (
    <Screen
      title="Theme"
      subtitle={`Editing ${settings.resolved} · ${edited} change${edited === 1 ? "" : "s"}`}
      actions={[
        <BarAction key="reset" glyph="↺" label="Reset to preset" onPress={() => settings.reset()} />,
        <BarAction key="export" glyph="⤴" label="Export gbs.theme.ts" onPress={() => setExportOpen(true)} />,
      ]}
    >
      <Muted>
        Like the web playground: pick a preset, then edit any token. Colours are kept per scheme (switch Light/Dark to
        edit the other); sizes apply to both. Every change is live across the app.
      </Muted>
      <SchemeControl withSystem={false} />
      <PresetSwatches />
      <ThemePreview title="Live preview" />

      <Accordion variant="contained" multiple defaultValue={["accent"]}>
        {TOKEN_GROUPS.map((group) => (
          <AccordionItem key={group.id} value={group.id} title={group.title} meta={<Badge>{group.tokens.length}</Badge>}>
            <View style={{ gap: 4 }}>
              {group.tokens.map((meta) => {
                const value = tokens[meta.key];
                if (meta.kind === "color") {
                  return <ColorRow key={meta.key} meta={meta} value={String(value)} onChange={(v) => set(meta.key, v as never)} />;
                }
                if (meta.kind === "length") {
                  return (
                    <NumberInput
                      key={meta.key}
                      label={meta.key}
                      description={`${meta.web ? `--${meta.web} · ` : ""}${meta.use}`}
                      min={meta.min}
                      max={meta.max}
                      step={meta.step}
                      decimals={0}
                      value={Number(value)}
                      onValueChange={(v) => v !== null && set(meta.key, v as never)}
                    />
                  );
                }
                return <RawRow key={meta.key} meta={meta} value={String(value)} onChange={(v) => set(meta.key, v as never)} />;
              })}
            </View>
          </AccordionItem>
        ))}
      </Accordion>
      <Muted>
        Web-only variables (header-bg/fg, grid row colours, cell padding, pin shadow) are left out: no native component
        uses them yet.
      </Muted>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button variant="outline" onPress={() => settings.reset()}>
          Reset
        </Button>
        <View style={{ flex: 1 }}>
          <Button fullWidth onPress={() => setExportOpen(true)}>
            Export gbs.theme.ts
          </Button>
        </View>
      </View>

      <BottomSheet
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="gbs.theme.ts"
        description="Only tokens that differ from Kit's defaults. Pass it to <KitProvider theme={theme}>."
        footer={
          <Button
            fullWidth
            onPress={async () => {
              await Clipboard.setStringAsync(source);
              toast.success("Copied gbs.theme.ts");
              setExportOpen(false);
            }}
          >
            Copy
          </Button>
        }
      >
        <ScrollView horizontal style={{ borderRadius: tokens.radius, backgroundColor: tokens.subtle }}>
          <Text selectable style={{ padding: 12, color: tokens.fg, fontFamily: "monospace", fontSize: 12, lineHeight: 18 }}>
            {source}
          </Text>
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}
