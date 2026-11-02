import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { DialogHost } from "../source/components/dialog";
import { KitProvider } from "../source/components/shared/native";
import { Toaster } from "../source/components/toaster";
import { BottomNavigation, type BottomNavigationItem } from "../source/native/bottom-navigation";
import { InvoicesProvider, useInvoices } from "./src/data/invoices";
import { Navigator, type TabKey } from "./src/navigation/Navigator";
import { ComponentsScreen, DemoScreen } from "./src/screens/ComponentsScreen";
import { CreateScreen } from "./src/screens/CreateScreen";
import { DiagnosticsScreen } from "./src/screens/DiagnosticsScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { InvoiceScreen } from "./src/screens/InvoiceScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { ThemeEditorScreen } from "./src/screens/ThemeEditorScreen";
import { AppSettingsProvider, useAppSettings } from "./src/theme/AppSettings";
import { HostsProvider, Icon, useRootHostsSuppressed } from "./src/ui/kit";

/*
 * GramproKit Demo: a sample invoicing app built only from Kit's React Native
 * components (beta). Each tab's first screen is named after the tab; the rest
 * are pushed.
 */
const SCREENS = {
  home: HomeScreen,
  create: CreateScreen,
  components: ComponentsScreen,
  settings: SettingsScreen,
  invoice: InvoiceScreen,
  demo: DemoScreen,
  theme: ThemeEditorScreen,
  diagnostics: DiagnosticsScreen,
};

const icon = (glyph: string) => ({ color }: { color: string }) => <Icon glyph={glyph} color={color} size={22} />;

function TabBar({ tab, setTab }: { tab: TabKey; setTab(tab: TabKey): void }) {
  const { invoices } = useInvoices();
  const overdue = invoices.filter((i) => i.status === "overdue").length;
  const items: BottomNavigationItem[] = [
    { key: "home", label: "Home", icon: icon("⌂"), badge: overdue || undefined },
    { key: "create", label: "New invoice", icon: icon("＋") },
    { key: "components", label: "Components", icon: icon("▦") },
    { key: "settings", label: "Settings", icon: icon("⚙") },
  ];
  return <BottomNavigation items={items} value={tab} onValueChange={(v) => setTab(v as TabKey)} />;
}

/** Toaster and DialogHost, once, unless a catalog demo is showing its own. */
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

function ThemedApp() {
  const settings = useAppSettings();
  // Kit reads no safe-area library itself; the app hands it the insets.
  const insets = useSafeAreaInsets();
  return (
    <KitProvider theme={settings.theme} colorScheme={settings.resolved} insets={insets}>
      <HostsProvider>
        <InvoicesProvider>
          <Navigator screens={SCREENS} renderTabBar={(tab, setTab) => <TabBar tab={tab} setTab={setTab} />} />
          <RootHosts />
        </InvoicesProvider>
      </HostsProvider>
      <StatusBar style={settings.resolved === "dark" ? "light" : "dark"} />
    </KitProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppSettingsProvider>
        <ThemedApp />
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
}
