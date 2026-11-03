import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { BottomNavigation, type BottomNavigationItem } from "../../../../source/native/bottom-navigation";
import { useInvoices } from "../../data/invoices";
import { Icon } from "../../ui/kit";

/*
 * Expo Router's `Tabs`, with Kit's BottomNavigation drawn as the tab bar.
 * The router owns routes, history, Android back and deep links; Kit only
 * draws. Titles, icons and badges are ordinary `Tabs.Screen` options that the
 * tab bar maps onto Kit's items.
 */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

function KitTabBar({ state, descriptors, emitter, navigateToTab }: TabBarProps) {
  const items: BottomNavigationItem[] = state.routes.map((route) => {
    const { options } = descriptors[route.key];
    const badge = options.tabBarBadge;
    return {
      key: route.name,
      label: typeof options.title === "string" ? options.title : route.name,
      // Kit passes { active, color }; the router's tabBarIcon wants { focused, color, size }.
      icon: options.tabBarIcon
        ? ({ active, color }) => options.tabBarIcon!({ focused: active, color, size: 22 })
        : undefined,
      badge: typeof badge === "number" ? badge : badge !== undefined ? true : undefined,
    };
  });

  // What Expo Router's default tab bar does (SDK 58): emit tabPress, so a
  // tab's stack pops to its first screen when the tab is pressed again, then
  // switch tabs unless a listener prevented it.
  const press = (name: string) => {
    const index = state.routes.findIndex((r) => r.name === name);
    if (index === -1) return;
    const route = state.routes[index];
    const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (index !== state.index && !event.defaultPrevented) navigateToTab(route.key);
  };

  return (
    <BottomNavigation items={items} value={state.routes[state.index].name} onValueChange={press} onReselect={press} />
  );
}

const icon =
  (glyph: string) =>
  ({ color }: { color: unknown }) => <Icon glyph={glyph} color={color as string} size={22} />;

export default function TabsLayout() {
  const { invoices } = useInvoices();
  const overdue = invoices.filter((i) => i.status === "overdue").length;
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <KitTabBar {...props} />}>
      <Tabs.Screen name="(home)" options={{ title: "Home", tabBarIcon: icon("⌂"), tabBarBadge: overdue || undefined }} />
      <Tabs.Screen name="create" options={{ title: "New invoice", tabBarIcon: icon("＋") }} />
      <Tabs.Screen name="components" options={{ title: "Components", tabBarIcon: icon("▦") }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: icon("⚙") }} />
    </Tabs>
  );
}
