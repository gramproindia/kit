# Installing the native edition (beta)

## The distribution model

Same as the web edition: `@grampro/kit` is a CLI that **copies TypeScript
source into the project**. Nothing is imported from `node_modules` at runtime
and the copied files are the project's to edit. The native edition is released
on the npm tag `native` while it is in beta; APIs may change between
prereleases.

Requirements: React Native 0.83 or newer (React 19.2), the New Architecture
(the only one since RN 0.82), Hermes. Kit has **no native modules and no
runtime dependencies**, so it works in Expo Go, development builds and bare
React Native alike.

## Commands

```bash
npx @grampro/kit@native add Button                 # one component
npx @grampro/kit@native add Button Input AppBar    # several (spaces or commas)
npx @grampro/kit@native add SpeedDial              # by any exported name: installs fab
npx @grampro/kit@native add                        # interactive picker, in a terminal
npx @grampro/kit@native -l                         # list, with each component's platforms
npx @grampro/kit@native doctor                     # what changed locally and upstream
npx @grampro/kit@native skill                      # install the agent skill
```

| Flag | Meaning |
| --- | --- |
| `--platform native` / `web` | Force a platform. Default: native when `package.json` has `react-native` or `expo`. |
| `--dest <dir>` | Install folder. Default: an existing install, else `src/component-lib/` when `src/` exists, else `component-lib/`. |
| `--force` | Replace edited files, or switch a folder between platforms. Never pass it on the user's behalf. |

An agent always names the components; the picker needs a real terminal.

What a native install writes:

- `component-lib/<folder>/`: `core/`, `native/`, `hooks/` when the component
  has one, `index.ts` (the native entry), README and passports. No `react/`,
  no `styles.css`.
- `component-lib/shared/`: `core/`, `native/` and the one DOM-free web hook
  (`react/useControllableState`). Never edit it; the CLI replaces it on update.
- `component-lib/gbs.theme.ts`, once. The native stand-in for `gbs.css`: the
  project's theme. Never overwritten.

A folder holds one platform. A web app and a native app in one repo need two
`--dest` folders.

Edited components are kept, as on the web: `add` prints which files changed
and exits 1. Stop and tell the user; show them `doctor <Component>`.

## Root setup

`KitProvider` goes around the whole app, once. `Toaster` and `DialogHost` go
inside it, once.

```tsx
// app/_layout.tsx (Expo Router)
import type { ReactNode } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { KitProvider } from "component-lib/shared/native";
import { theme } from "component-lib/gbs.theme";
import { Toaster } from "component-lib/toaster";
import { DialogHost } from "component-lib/dialog";

function Kit({ children }: { children: ReactNode }) {
  // Kit reads no safe-area library itself; the app hands it the insets.
  const insets = useSafeAreaInsets();
  return (
    <KitProvider theme={theme} insets={insets}>
      {children}
      <Toaster />
      <DialogHost />
    </KitProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Kit>
        <Stack screenOptions={{ headerShown: false }} />
      </Kit>
    </SafeAreaProvider>
  );
}
```

- `insets` is optional. Without `react-native-safe-area-context` drop the prop;
  sheets, toasts and app bars then assume zero insets.
- `KitProvider` props: `theme` (see `theming.md`), `colorScheme`
  (`"system"` default, `"light"`, `"dark"`), `insets`.
- Components render without a provider, with the default palette and the
  device scheme. Toaster and Tooltip need it (they draw into its overlay host).
- In a bare React Native app the same tree goes in `App.tsx`, around your
  navigator.

## Path alias

The examples import `component-lib/<folder>`. Either add a path alias
(`tsconfig.json` `paths` plus Metro's `resolver` or `babel-plugin-module-resolver`,
or Expo's built-in tsconfig paths) or use relative imports. Do not deep-import
`.../native/Button`.

## Folders

Lowercased component name, except: `date-picker`, `file-uploader`,
`number-input`, `radio-group`, `app-bar`, `bottom-navigation`, `bottom-sheet`,
`list-item`, `search-bar`, `segmented-control`. Families share a folder:
Select/MultiSelect → `combobox`, OtpInput → `input`, Stat → `card`,
SpeedDial → `fab`, Tag → `badge`, Empty → `skeleton`, CircularProgress →
`progress`, List/ListSection → `list-item`, DateRangePicker/DateTimePicker →
`date-picker`.

## Not available on native

DataGrid (it is web-only for now; `add DataGrid` in a native project says so).
Breadcrumb exists but is rarely right on a phone: navigation is the router's
job.
