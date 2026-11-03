# GramproKit Demo (React Native, beta)

A sample invoicing app, "Grampro Books", built only from GramproKit's React
Native components. It renders Kit straight from `../source`, so it doubles as
the test bed for the native edition.

**Beta:** Kit's React Native APIs may change or break between prereleases
(npm tag `native`).

## Run it

```sh
npm install
npx expo start          # scan the QR code with Expo Go (Android or iPhone)
```

Over USB on Android: `adb reverse tcp:8081 tcp:8081`, then open
`exp://127.0.0.1:8081` in Expo Go.

Deep links: the scheme is `gramprokit`, so `gramprokit://invoice/INV-2041`
opens an invoice and `gramprokit://settings/theme` opens the theme editor. In
Expo Go, put the path after the dev server's address instead, for example
`exp://127.0.0.1:8081/--/invoice/INV-2041`.

## Build an APK

```sh
npm run apk             # prebuild + gradlew assembleRelease (arm64-v8a)
# → android/app/build/outputs/apk/release/app-release.apk
```

Needs JDK 17+ and the Android SDK (`ANDROID_HOME`). The release build is
signed with the debug keystore: fine for a demo, not for the Play Store.

**Windows:** the C++ build fails with "Filename longer than 260 characters" from
this repo's deep path (ninja in SDK CMake 3.22 ignores long paths, and `subst`
doesn't help because autolinking resolves real paths). Build from a short copy,
e.g. `D:\g\source` + `D:\g\p` (this folder), and add to the generated
`android/app/build.gradle`:

```groovy
android.externalNativeBuild.cmake.buildStagingDirectory = file('D:/c')
```

Note: `expo prebuild` rewrites the `android`/`ios` scripts in package.json to
`expo run:*`; restore them to `expo start --*` for the Expo Go workflow.

**Rebuilding after a change to `../source` only:** Gradle does not watch
Kit's source, so it marks the JS bundle step UP-TO-DATE and repacks the old
bundle into a "successful" build. Force the bundle step:

```sh
cd android
./gradlew :app:createBundleReleaseJsAndAssets --rerun assembleRelease -PreactNativeArchitectures=arm64-v8a
```

## What's inside

| Tab | Shows |
|---|---|
| Home | AppBar (large → small on scroll), SearchBar, Menu, SegmentedControl, Card + Stat, Skeleton, Progress, Alert, Tabs, List/ListItem, Avatar, Badge, Fab (collapses on scroll). Tap an invoice for Breadcrumb, Popover, Tooltip, Accordion, Dialog, Toast, BottomSheet. |
| New invoice | Input, Select, MultiSelect, DatePicker, DateRangePicker, DateTimePicker, NumberInput (INR), RadioGroup, Switch, CheckboxGroup, Textarea, FileUploader, Dialog, Toast, inline validation. |
| Components | Every demo in `demos/`, grouped and searchable (the same files the docs preview). |
| Settings | Colour scheme, presets, radius, text size, live preview, a scoped theme (nested KitProvider), the full **Theme editor** (every token per scheme, export `gbs.theme.ts`), and Diagnostics (Hermes Intl checks). |

Navigation is Expo Router (SDK 58). It shows both ways to do tabs with Kit:

- **Kit tab bar.** This is the app's own tabs. Expo Router's `Tabs` is drawn
  with Kit's BottomNavigation (`src/app/(tabs)/_layout.tsx`). Each tab has its
  own stack, and pressing the current tab again returns to its first screen.
  The router's header is off and every screen draws Kit's AppBar
  (`src/ui/kit.tsx` `Screen`).
- **Native tabs.** Open Components → Native tabs. Expo Router's native tabs
  (`src/app/native-tabs/`) use the platform's own tab bar, with Kit inside the
  screens. Back returns to the catalogue.

## Layout

```
src/app/_layout.tsx                 providers, Kit icons, root Toaster/DialogHost, root Stack
src/app/(tabs)/_layout.tsx          Expo Router Tabs with Kit's BottomNavigation as the tab bar
src/app/(tabs)/(home)/              /             and /invoice/[id]
src/app/(tabs)/create.tsx           /create
src/app/(tabs)/components/          /components   and /components/demo/[id]
src/app/(tabs)/settings/            /settings,    /settings/theme, /settings/diagnostics
src/app/native-tabs/                /native-tabs/inbox, /native-tabs/profile (native tab bar)
src/screens/          the screens the route files render: Home, Invoice, Create, Components (+ Demo), Settings, ThemeEditor, Diagnostics
src/theme/            presets (from the web playground), token metadata, settings context
src/data/             sample invoices
src/ui/               Screen wrapper (Kit AppBar, back from the router), Ionicons Icon, root-host control
demos/                one file per component; also rendered by the docs site
spikes/intl/          Phase 0 Intl-on-Hermes checks
```
