# Navigation and screen layout (mobile-only components)

These seven components exist only on native. They live in `source/native/`
upstream and install like any other component.

Kit does not replace a router. Use Expo Router (or React Navigation) for
screens and history, turn its built-in header off, and put Kit's components
**inside** the screens. Kit's BottomNavigation can stand in as the router's tab
bar (below).

## AppBar

`component-lib/app-bar` — `AppBar`, `AppBarAction`.

| Prop | Notes |
| --- | --- |
| `variant` | `small` (default), `center`, `medium`, `large` (big title under the toolbar). |
| `title`, `subtitle` | Text or nodes. |
| `onBack` | Draws a back chevron with the localized "Back" label. Or pass `leading` yourself. |
| `actions` | Nodes on the right, usually `AppBarAction`s. Children are added after them. |
| `elevated` | Raised surface and shadow. |
| `scrolled` | Raised surface and a divider: set it from the screen's scroll offset. |
| `safeArea` | Pads the top for the status bar from `KitProvider insets`. Default true. |
| `style`, `styles` | Slots: `root`, `bar`, `title`, `subtitle`, `actions`. |

`AppBarAction` is a 44dp round icon button. **`aria-label` is required.**

Large titles do not collapse on scroll; switch `variant` from the scroll offset
if you want that.

## BottomNavigation

`component-lib/bottom-navigation`. Material 3 navigation bar.

| Prop | Notes |
| --- | --- |
| `items` | `{ key, label, icon?, badge?, disabled? }[]`. `icon` is a node, or `({ active, color }) => node`. `badge`: a number (99+ past 99) or `true` for a dot. |
| `value` / `defaultValue` / `onValueChange(key)` | Selected key. |
| `onReselect(key)` | Tapping the active item again: scroll to top, refresh. |
| `labelVisibility` | `always` (default), `active`, `never`. |
| `safeArea` | Pads the bottom for the home indicator. Default true. |
| `styles` | `root`, `item`, `indicator`, `label`, `badge`. |

Badges are read as part of the item's name ("Invoices, 3 new").

## Fab and SpeedDial

`component-lib/fab` — `Fab`, `SpeedDial`.

Fab: `icon`, `label` (makes it an extended pill), `extended` (animate
label in and out, e.g. collapse while scrolling down), `size` `sm` | `md` |
`lg` (40/56/96dp), `variant` `primary` | `secondary` | `surface`, `loading`,
`disabled`, `onPress`. `placement` `bottom-end` (default) | `bottom-center` |
`bottom-start` | `none` positions it absolutely in its parent, clear of the
safe area; `offset` lifts it further, e.g. above a BottomNavigation drawn in
the same screen. Icon-only needs `aria-label`.

SpeedDial: `icon`, `aria-label` (required), `actions`
(`{ key, label, icon?, onPress?, disabled? }[]`), `open` /
`onOpenChange`, plus Fab's `variant`, `placement`, `offset`, `safeArea`. It
dims the screen, fans out labelled actions, and Android back closes it.

Put either as the **last child of the screen's root View** so it draws above the
content.

## List, ListSection, ListItem

`component-lib/list-item`.

- `ListItem`: `title` (required), `description` (`numberOfLines`, default 2),
  `leading` (icon or Avatar), `trailing` (any node: Switch, Badge, time), or
  `value` (settings-style trailing text) with `chevron`, `onPress`,
  `onLongPress`, `destructive`, `disabled`. Min height 44dp, 56 with a
  description. Give it `aria-label` when `title` is not text.
- `List`: `variant` `plain` (full-width rows) | `inset` (rounded group, iOS
  settings), `divided` (default true; dividers start after `leading`).
- `ListSection`: a `List` with `header` and `footer` text.

For long lists, render `ListItem`s from a `FlatList` (Kit does not virtualize
`List`).

## SegmentedControl

`component-lib/segmented-control`. `options` `{ value, label, icon?, disabled?,
"aria-label"? }[]`; single (`value: string`) or `multiple` (`value: string[]`);
`onValueChange`. Single selection slides a thumb (iOS look); multiple
selection uses the Material 3 check look.

## SearchBar

`component-lib/search-bar`. `value` / `defaultValue` / `onValueChange` (each
keystroke), `onSearch` (debounced by `debounce` ms, and immediately with `""`
when cleared), `onSubmit` (return key), `showCancel` + `onCancel` (iOS
"Cancel" while focused; text from `localeText.cancel`), `loading`,
`placeholder`, `autoFocus`, `disabled`.

## BottomSheet

See `overlays.md`.

## A screen

```tsx
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { AppBar, AppBarAction } from "component-lib/app-bar";
import { Fab } from "component-lib/fab";
import { List, ListItem } from "component-lib/list-item";
import { SearchBar } from "component-lib/search-bar";
import { SegmentedControl } from "component-lib/segmented-control";
import { Avatar } from "component-lib/avatar";
import { Badge } from "component-lib/badge";

export function InvoicesScreen() {
  const [scrolled, setScrolled] = useState(false);
  const [period, setPeriod] = useState("month");
  const [query, setQuery] = useState("");

  return (
    <View style={{ flex: 1 }}>
      <AppBar
        variant="large"
        title="Invoices"
        scrolled={scrolled}
        actions={
          <AppBarAction aria-label="Filter" onPress={() => router.push("/filters")}>
            <Text>⚲</Text>
          </AppBarAction>
        }
      />
      <ScrollView
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}
      >
        <SearchBar placeholder="Search invoices" value={query} onValueChange={setQuery} debounce={250} onSearch={load} />
        <SegmentedControl
          value={period}
          onValueChange={setPeriod}
          options={[
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
            { value: "quarter", label: "Quarter" },
          ]}
        />
        <List>
          <ListItem
            leading={<Avatar name="Anand Remanan" size="sm" />}
            title="INV-2041"
            description="Anand Remanan · due in 4 days"
            trailing={<Badge variant="warning">Unpaid</Badge>}
            onPress={() => router.push("/invoices/2041")}
          />
          <ListItem title="INV-2040" description="Gita Hari" value="₹5,000" chevron onPress={() => router.push("/invoices/2040")} />
        </List>
      </ScrollView>
      <Fab icon={<Text>＋</Text>} label="New invoice" placement="bottom-end" onPress={() => router.push("/invoices/new")} />
    </View>
  );
}

async function load(_query: string) {}
```

A pushed screen with back:

```tsx
<AppBar title="INV-2041" subtitle="Anand Remanan" onBack={() => router.back()} />
```

Settings, grouped:

```tsx
<ListSection header="Account" footer="Signed in as anand@example.com" variant="inset">
  <ListItem title="Profile" chevron onPress={() => router.push("/profile")} />
  <ListItem title="Currency" value="INR (₹)" chevron onPress={() => router.push("/currency")} />
  <ListItem title="Push notifications" trailing={<Switch aria-label="Push notifications" checked={push} onCheckedChange={setPush} />} />
  <ListItem title="Sign out" destructive onPress={signOut} />
</ListSection>
```

## Expo Router (SDK 58)

Verified against the Kit repo's demo app, `native-playground` (Expo SDK 58,
expo-router 58.0.x):
- `src/app/_layout.tsx`: the root layout.
- `src/app/(tabs)/_layout.tsx`: Kit's tab bar.
- `src/app/(tabs)/<tab>/_layout.tsx`: a stack for each tab.
- `src/app/native-tabs/`: native tabs. Two ways to do tabs; pick one per tab group, never both.

**Root layout: mount Kit once, turn the router's header off.**

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { DialogHost } from "component-lib/dialog";
import { KitProvider } from "component-lib/shared/native";
import { Toaster } from "component-lib/toaster";

function Root() {
  const insets = useSafeAreaInsets();
  return (
    <KitProvider insets={insets}>
      <Stack screenOptions={{ headerShown: false }} />
      <Toaster />
      <DialogHost />
    </KitProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}
```

Screens render Kit's `AppBar` as their header; on pushed screens pass
`onBack={() => router.back()}`.

### 1. Kit's BottomNavigation as the `Tabs` tab bar

In SDK 58 a custom `tabBar` receives `{ state, descriptors, emitter,
navigateToTab, insets }`. There is **no `navigation` object**:
`navigation.navigate(...)` from older React Navigation examples does not
type-check. Copy what the default tab bar does: emit `tabPress` (a nested
Stack pops to its first screen when its tab is pressed again), then call
`navigateToTab(route.key)`. Keep titles, icons and badges as ordinary
`Tabs.Screen` options and map them onto Kit's items.

```tsx
// app/(tabs)/_layout.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { BottomNavigation, type BottomNavigationItem } from "component-lib/bottom-navigation";

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

function KitTabBar({ state, descriptors, emitter, navigateToTab }: TabBarProps) {
  const items: BottomNavigationItem[] = state.routes.map((route) => {
    const { options } = descriptors[route.key];
    const badge = options.tabBarBadge;
    return {
      key: route.name,
      label: typeof options.title === "string" ? options.title : route.name,
      icon: options.tabBarIcon
        ? ({ active, color }) => options.tabBarIcon!({ focused: active, color, size: 24 })
        : undefined,
      badge: typeof badge === "number" ? badge : badge !== undefined ? true : undefined,
    };
  });

  const press = (name: string) => {
    const index = state.routes.findIndex((r) => r.name === name);
    if (index === -1) return;
    const route = state.routes[index];
    const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (index !== state.index && !event.defaultPrevented) navigateToTab(route.key);
  };

  return (
    <BottomNavigation
      items={items}
      value={state.routes[state.index].name}
      onValueChange={press}
      onReselect={press}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <KitTabBar {...props} />}>
      <Tabs.Screen
        name="invoices"
        options={{
          title: "Invoices",
          tabBarBadge: 2,
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
```

- `tabBarIcon`'s `color` is typed `ColorValue`; icon packs want a string, hence
  `color as string`. Kit passes its token colour (a string).
- A nested stack in a tab (`app/(tabs)/invoices/_layout.tsx` with
  `<Stack screenOptions={{ headerShown: false }} />`) keeps the tab bar visible
  on pushed screens.
- A `Fab` placed in a tab screen needs no `offset`: the tab bar sits below the
  screen, not over it.

### 2. Expo Router native tabs

`expo-router/native-tabs` (stable in SDK 58; `expo-router/unstable-native-tabs`
in SDK 54–57) uses the platform's own tab bar. It is native UI, so it cannot
be Kit's BottomNavigation; put Kit components inside the screens instead.

```tsx
// app/(tabs)/_layout.tsx
import { NativeTabs } from "expo-router/native-tabs";

export default function TabLayout() {
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
```

- Icons are SF Symbols (iOS) and Material Symbols (Android); `md` icons need
  `npx expo install expo-symbols`.
- On iOS content can run under the tab bar; give scroll views
  `contentInsetAdjustmentBehavior="automatic"`.

**Trade-off.** Kit's tab bar looks the same on iOS, Android and web and follows
Kit's tokens (badges, active pill, dark mode). Native tabs feel most native but
differ per platform and are styled through the router, not Kit.

### Icons

Kit ships no icon set; every icon slot takes any React node.
`@expo/vector-icons` works in every Expo app and in Expo Go.
