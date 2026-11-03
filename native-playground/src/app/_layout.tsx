import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps } from "react";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { DialogHost } from "../../../source/components/dialog";
import { KitProvider, useKitTheme, type KitIcons } from "../../../source/components/shared/native";
import { Toaster } from "../../../source/components/toaster";
import { InvoicesProvider } from "../data/invoices";
import { AppSettingsProvider, useAppSettings } from "../theme/AppSettings";
import { HostsProvider, useRootHostsSuppressed } from "../ui/kit";

/*
 * GramproKit Demo: a sample invoicing app built only from Kit's React Native
 * components (beta), on Expo Router. Kit is mounted once, around the router:
 * the theme (with the Settings palette and token edits), safe-area insets,
 * Ionicons for Kit's built-in marks, and one Toaster and DialogHost.
 *
 * Routes (src/app):
 *   (tabs)/(home)        /                  Home, then /invoice/[id]
 *   (tabs)/create        /create            New invoice
 *   (tabs)/components    /components        Catalogue, then /components/demo/[id]
 *   (tabs)/settings      /settings          then /settings/theme, /settings/diagnostics
 *   native-tabs          /native-tabs/...   Expo Router native tabs, for comparison
 */

/*
 * Kit's built-in marks (chevrons, close, check, search…) from Ionicons instead
 * of Kit's drawings, so they match the app's other icons. Defined once, outside
 * any component, so KitProvider gets the same object every render.
 */
const CHEVRON = { up: "chevron-up", down: "chevron-down", left: "chevron-back", right: "chevron-forward" } as const;
const ionicon =
  (name: ComponentProps<typeof Ionicons>["name"]) =>
  ({ size, color }: { size: number; color: string }) => <Ionicons name={name} size={size} color={color} />;
const KIT_ICONS: Partial<KitIcons> = {
  chevron: ({ size, color, direction = "down" }) => <Ionicons name={CHEVRON[direction]} size={size} color={color} />,
  close: ionicon("close"),
  check: ionicon("checkmark"),
  search: ionicon("search"),
  eye: ionicon("eye-outline"),
  eyeOff: ionicon("eye-off-outline"),
  calendar: ionicon("calendar-outline"),
  plus: ionicon("add"),
  minus: ionicon("remove"),
  upload: ionicon("cloud-upload-outline"),
  pause: ionicon("pause"),
  play: ionicon("play"),
  retry: ionicon("refresh"),
};

/** Toaster and DialogHost, once, unless a catalogue demo is showing its own. */
function RootHosts() {
  const suppressed = useRootHostsSuppressed();
  if (suppressed) return null;
  return (
    <>
      <Toaster position="top-center" />
      <DialogHost />
    </>
  );
}

function Screens() {
  const { tokens } = useKitTheme();
  // The router's own headers are off everywhere: screens draw Kit's AppBar.
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.bg } }} />;
}

function ThemedApp() {
  const settings = useAppSettings();
  // Kit reads no safe-area library itself; the app hands it the insets.
  const insets = useSafeAreaInsets();
  return (
    <KitProvider theme={settings.theme} colorScheme={settings.resolved} insets={insets} icons={KIT_ICONS}>
      <HostsProvider>
        <InvoicesProvider>
          <Screens />
          <RootHosts />
        </InvoicesProvider>
      </HostsProvider>
      <StatusBar style={settings.resolved === "dark" ? "light" : "dark"} />
    </KitProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppSettingsProvider>
        <ThemedApp />
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
}
