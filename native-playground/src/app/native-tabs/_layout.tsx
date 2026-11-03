import { NativeTabs } from "expo-router/native-tabs";

/*
 * For comparison with the app's own tabs: Expo Router native tabs (SDK 58,
 * `expo-router/native-tabs`). The tab bar is the platform's own (UITabBar on
 * iOS, the Material navigation bar on Android), so it cannot be Kit's
 * BottomNavigation; Kit components go inside the screens instead. Icons: SF
 * Symbols on iOS, Material Symbols on Android (`md` needs expo-symbols).
 *
 * Reached from Components → "Native tabs"; back returns there.
 */
export default function NativeTabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="inbox">
        <NativeTabs.Trigger.Label>Inbox</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="tray.fill" md="inbox" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
