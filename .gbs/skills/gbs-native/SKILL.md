---
name: gbs-native
description: Builds React Native UI with the GramproKit native edition (@grampro/kit@native, beta). Use when adding or changing screens in a React Native or Expo app that has a component-lib/ folder with shared/native/.
autoAttach: ["app/**/*.tsx", "src/**/*.tsx", "components/**/*.tsx", "screens/**/*.tsx"]
---

# GBS components for React Native (beta)

**Beta.** The native edition ships on the npm tag `native`. APIs may change or
break between prereleases. If something here disagrees with the installed
source, the source is right: read `component-lib/<folder>/native/*.tsx`.

## If the MCP server is connected

The `grampro` MCP server answers from the component source. Pass
`platform: "native"`:

- **`get_component <Name>`** (platform native) before writing a component. Do not
  write a prop you have not read there or in the source.
- **`validate_usage`** on the JSX before reporting back.

Without the server, this file and `references/` are what you have.

## Install before you import

Not an npm dependency. The CLI **copies source into the repo**:

```bash
npx @grampro/kit@native add Button Input Select AppBar
```

In a project whose `package.json` has `react-native` or `expo`, the native
edition is chosen automatically (`--platform native` forces it). It writes
`component-lib/<folder>/` (or `src/component-lib/`), `component-lib/shared/`,
and once, `component-lib/gbs.theme.ts`. A component the project edited is never
overwritten: if `add` says it kept one, tell the user; **never retry with
`--force`**. Import the folder:

```ts
import { Button } from "component-lib/button";
import { AppBar } from "component-lib/app-bar";
```

Folders: lowercased name, except `date-picker`, `file-uploader`,
`number-input`, `radio-group`, and the mobile-only `app-bar`,
`bottom-navigation`, `bottom-sheet`, `list-item`, `search-bar`,
`segmented-control`. Select and MultiSelect live in `combobox`; SpeedDial in
`fab`; Stat in `card`; OtpInput in `input`.

## The root, once

```tsx
<SafeAreaProvider>
  <KitProvider theme={theme} insets={useSafeAreaInsets()}>
    {app}
    <Toaster />
    <DialogHost />
  </KitProvider>
</SafeAreaProvider>
```

`KitProvider` (from `component-lib/shared/native`) supplies the theme, follows
the device's light/dark setting, and hosts toasts and tooltips. `insets` come
from `react-native-safe-area-context`, which Kit does not depend on. Without
`<Toaster />` and `<DialogHost />`, `toast()` and `dialog.confirm()` do nothing.
Tooltip needs `KitProvider`. See `references/install.md`.

## Rules most often missed

1. **`onPress`, never `onClick`.** Button's `onPress` may return a promise;
   the button shows its spinner until it settles.
2. **Change handlers are named per component**, as on the web:
   `onValueChange`: Input, OtpInput, Textarea, NumberInput, CheckboxGroup,
   RadioGroup, Tabs, Accordion, SegmentedControl, BottomNavigation, SearchBar,
   MenuRadioGroup. `onCheckedChange`: Checkbox, Radio, Switch,
   MenuCheckboxItem. `onChange`: Select, MultiSelect, DatePicker,
   DateRangePicker, DateTimePicker, FileUploader. `onOpenChange`: Modal,
   Popover, Menu, BottomSheet, SpeedDial.
3. **Style with `style` and `styles={{ slot }}`**, never `className` or
   `classNames`. Many slots also accept a function of state
   (`({ pressed }) => …`), the native stand-in for `data-*`. Theme globally
   through `KitProvider theme`, never by restyling every instance.
4. **Never hand-roll label, hint or error markup.** Fields take `label`,
   `description` and `error`. `error` marks the field invalid and is announced.
5. **Pickers and menus choose their own presentation**: a bottom sheet on a
   phone, a popover anchored to the field on a tablet (600dp and wider).
   Override with `presentation="sheet" | "popover" | "auto"`.
6. **FileUploader needs a `pick()` you supply** (expo-document-picker,
   expo-image-picker, anything). Kit takes no picker dependency.
7. **No keyboard navigation, no hover.** Tooltip opens on long-press. Do not
   add keyboard handlers expecting web behaviour.
8. **Screen-level pieces go in the screen**: AppBar at the top, Fab and
   SpeedDial last in the screen's root View, BottomNavigation as the tab bar.
   They pad for safe areas themselves (`safeArea` prop, default true).
9. **Expo Go compatible.** Kit has no native modules. Do not add one to make a
   component work; ask the user first.
10. **Compound families throw outside their parent**: Tab/TabList/TabPanel
    need Tabs, AccordionItem needs Accordion, MenuItem needs Menu, ListItem
    belongs in List or ListSection.

## Inventory

**Mobile-only** — AppBar (+AppBarAction): top bar, small/center/medium/large.
BottomNavigation: Material 3 tab bar with badges. Fab: floating action button,
extended with a label. SpeedDial: Fab that fans out actions. SegmentedControl:
iOS/Material segmented buttons, single or multiple. List, ListSection, ListItem:
plain or inset (settings-style) rows. BottomSheet: sheet with trigger, footer,
drag to dismiss. SearchBar: debounced search field with Cancel.

**Forms** — Input (+OtpInput, SMS autofill), Textarea (counter, autoResize),
NumberInput (locale and currency aware, steppers), Checkbox + CheckboxGroup
(select all, indeterminate), Radio + RadioGroup (`card` variant), Switch (async
`onCheckedChange` reverts on failure), Select and MultiSelect (`options`,
searchable, grouped, create), DatePicker, DateRangePicker, DateTimePicker
(Kit-drawn calendar, locale week start), FileUploader (`pick`, upload with
progress and retry).

**Actions** — Button: variants primary/secondary/outline/ghost/danger/link,
sizes, `leading`/`trailing`/`icon`, `loading`, `fullWidth`.

**Overlays** — Modal (center, top, left/right drawer, `bottom` sheet, full);
`dialog.alert/confirm/prompt` + DialogHost; `toast()` + Toaster; Popover
(`trigger`); Menu (`trigger`) with MenuItem, MenuCheckboxItem, MenuRadioGroup,
MenuRadioItem, MenuGroup, MenuSeparator, MenuSub; Tooltip (`content`,
long-press).

**Display and feedback** — Card/CardHeader/CardBody/CardFooter, Stat; Alert;
Badge and Tag; Avatar and AvatarGroup; Tabs/TabList/Tab/TabPanel; Accordion +
AccordionItem; Breadcrumb (`items`, `onNavigate`); Progress and
CircularProgress (`value={null}` is indeterminate); Spinner; Skeleton and
Empty.

**Not on native yet** — DataGrid. Use a FlatList of `ListItem`s.

## Example

```tsx
import { useState } from "react";
import { View } from "react-native";
import { AppBar } from "component-lib/app-bar";
import { Button } from "component-lib/button";
import { Input } from "component-lib/input";
import { Select } from "component-lib/combobox";
import { Modal } from "component-lib/modal";
import { toast } from "component-lib/toaster";

const ROLES = [{ value: "admin", label: "Admin" }, { value: "dev", label: "Dev" }];

export function TeamScreen() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const invalid = !!email && !email.includes("@");

  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Team" />
      <View style={{ padding: 16 }}>
        <Button fullWidth onPress={() => setOpen(true)}>Invite</Button>
      </View>
      <Modal open={open} onOpenChange={setOpen} title="Invite a teammate" placement="bottom"
        footer={({ close }) => (
          <Button fullWidth disabled={!email || invalid} onPress={async () => {
            await invite({ email, role });
            toast.success("Invitation sent");
            close();
          }}>Send</Button>
        )}>
        <Input label="Email" type="email" value={email} onValueChange={setEmail}
          required error={invalid ? "Enter a valid email" : undefined} />
        <Select label="Role" options={ROLES} value={role} onChange={(value) => setRole(value)} />
      </Modal>
    </View>
  );
}

async function invite(_: { email: string; role: string | null }) {}
```

## Don't

- Raw `TextInput`, `Switch` from react-native, hand-built sheets, menus or tab
  bars when a Kit component exists.
- `onClick`, `className`, `classNames`, `htmlFor`, `<label>`, `<form>`; there is
  no form posting on native, so submit from a Button's `onPress`.
- Deep imports (`.../button/native/Button`); import the folder.
- Editing `component-lib/shared/`; the CLI replaces it on update.
- A Tooltip as an accessible name; icon-only buttons and AppBarAction need
  `aria-label`.
- Wrapping the app in a second `KitProvider` for the whole tree. Nest one only
  to theme a section (see `references/theming.md`).
- Firing a toast from inside an open Modal or Dialog and expecting it on top:
  it appears once the overlay closes (known limit).

## Details (in `references/`)

- `install.md`: CLI, folders, root setup, Expo Router layout.
- `theming.md`: tokens, light/dark, presets, scoped themes, your own views.
- `navigation-and-layout.md`: AppBar, BottomNavigation, Fab, SpeedDial,
  ListItem, SegmentedControl, SearchBar, with Expo Router.
- `forms.md`: every field's native props and a full form.
- `overlays.md`: Modal, dialog, toast, BottomSheet, Menu, Popover, Tooltip.
- `display-and-feedback.md`: Button, Card, Stat, Alert, Badge, Avatar, Tabs,
  Accordion, Breadcrumb, Progress, Spinner, Skeleton.
- `accessibility.md`: what is supplied, what you add.
- `web-vs-native.md`: prop mapping from the web components.
- `testing.md`: RNTL, Maestro, devices, iOS without a Mac.
