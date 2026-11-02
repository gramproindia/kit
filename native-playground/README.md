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

## What's inside

| Tab | Shows |
|---|---|
| Home | AppBar (large → small on scroll), SearchBar, Menu, SegmentedControl, Card + Stat, Skeleton, Progress, Alert, Tabs, List/ListItem, Avatar, Badge, Fab (collapses on scroll). Tap an invoice for Breadcrumb, Popover, Tooltip, Accordion, Dialog, Toast, BottomSheet. |
| New invoice | Input, Select, MultiSelect, DatePicker, DateRangePicker, DateTimePicker, NumberInput (INR), RadioGroup, Switch, CheckboxGroup, Textarea, FileUploader, Dialog, Toast, inline validation. |
| Components | Every demo in `demos/`, grouped and searchable (the same files the docs preview). |
| Settings | Colour scheme, presets, radius, text size, live preview, a scoped theme (nested KitProvider), the full **Theme editor** (every token per scheme, export `gbs.theme.ts`), and Diagnostics (Hermes Intl checks). |

Navigation is a ~200-line stack per tab in `src/navigation/` (no navigation
library), so the app dogfoods Kit's AppBar and BottomNavigation.

## Layout

```
App.tsx               providers, tab bar, root Toaster/DialogHost
src/navigation/       per-tab stacks, Android back
src/screens/          Home, Invoice, Create, Components (+ Demo), Settings, ThemeEditor, Diagnostics
src/theme/            presets (from the web playground), token metadata, settings context
src/data/             sample invoices
src/ui/               Screen wrapper, glyph icons, root-host control
demos/                one file per component; also rendered by the docs site
spikes/intl/          Phase 0 Intl-on-Hermes checks
```
