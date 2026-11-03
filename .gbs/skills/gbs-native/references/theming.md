# Theming on native

## One theme, every component

The web's `--gbs-*` CSS variables become a token object, `KitTokens`, with the
same names in camelCase. Pass overrides to `KitProvider theme` once, at the
root. The project's own theme lives in `component-lib/gbs.theme.ts`.

```tsx
import type { KitTheme } from "component-lib/shared/native";

// gbs.theme.ts — one set for both schemes, or per scheme.
export const theme: KitTheme = {
  light: { accent: "#7c3aed", accentSoft: "#f3e8ff", accentStrong: "#6d28d9", focus: "#7c3aed", radius: 10 },
  dark: { accent: "#c4b5fd", accentSoft: "#2e1065", accentStrong: "#ddd6fe", focus: "#c4b5fd", radius: 10 },
};
```

A flat object (`{ accent: "#7c3aed", radius: 10 }`) applies to both schemes.
Give colours for both schemes, or dark mode keeps the light value.

Write colours as `#rrggbb`. Components mix them for pressed and tinted states;
other formats work but are not mixed.

## Tokens

Defaults are light / dark.

| Token | Web variable | Default | Used for |
| --- | --- | --- | --- |
| `bg` | `--gbs-bg` | `#ffffff` / `#0b0b0e` | Component background. |
| `fg` | `--gbs-fg` | `#18181b` / `#f4f4f5` | Body text. |
| `muted` | `--gbs-muted` | `#71717a` / `#a1a1aa` | Hints, counters, secondary text. |
| `border` | `--gbs-border` | `#e4e4e7` / `#27272a` | Outer borders. |
| `borderControl` | `--gbs-border-control` | `#a1a1aa` / `#52525b` | Checkbox, radio and field outlines. |
| `borderSubtle` | `--gbs-border-subtle` | `#f0f0f2` / `#1c1c20` | Separators. |
| `hover` | `--gbs-hover` | `#f4f4f5` / `#1f1f23` | Pressed fill of quiet buttons and rows. |
| `subtle` | `--gbs-subtle` | `#f4f4f5` / `#1c1c20` | Quiet fills (secondary button). |
| `inputBg` | `--gbs-input-bg` | `#ffffff` / `#121216` | Inside of a field. |
| `readonlyBg` | `--gbs-readonly-bg` | `#fafafa` / `#0e0e12` | Read-only field. |
| `accent` | `--gbs-accent` | `#2563eb` / `#60a5fa` | Selected, checked, active. |
| `accentFg` | `--gbs-accent-fg` | `#ffffff` / `#0b1220` | Text on accent. |
| `accentSoft` | `--gbs-accent-soft` | `#eff6ff` / `#172554` | Tinted backgrounds. |
| `accentStrong` | `--gbs-accent-strong` | `#1d4ed8` / `#bfdbfe` | Pressed accent. |
| `danger`, `dangerFg` | `--gbs-danger`, `-fg` | `#dc2626` / `#f87171` | Errors, destructive actions. |
| `success` | `--gbs-success` | `#15803d` / `#4ade80` | Success. |
| `warning` | `--gbs-warning` | `#b45309` / `#fbbf24` | Warnings. |
| `info` | `--gbs-info` | `#2563eb` / `#60a5fa` | Informational. |
| `focus` | `--gbs-focus` | `#2563eb` / `#60a5fa` | Focus outline of fields. |
| `skeleton` | `--gbs-skeleton` | `#ececee` / `#232329` | Skeleton blocks. |
| `backdrop` | `--gbs-backdrop` | `rgba(9,9,11,0.5)` / `rgba(0,0,0,0.6)` | Behind modals and sheets. |
| `raised` | (native only) | `#ffffff` / `#18181c` | Sheets, menus, elevated cards. Lighter than `bg` in dark mode, where shadows do not show. |
| `shadow` | `--gbs-shadow` | CSS `box-shadow` string | Raised surfaces. |
| `tooltipBg`, `tooltipFg` | `--gbs-tooltip-*` | dark / light pair | Tooltips. |
| `radius` | `--gbs-radius` | `8` (dp) | Corner radius. |
| `fontSize` | `--gbs-font-size` | `15` (dp) | Body text. Larger than the web's 13px. |
| `touchTarget` | (native only) | `44` (dp) | Smallest tappable height. Material uses 48. |

The grid-only web variables (`--gbs-row-*`, `--gbs-header-*`, `--gbs-cell-px`)
have no native token: DataGrid is not on native.

## Light and dark

`KitProvider` follows the device setting. Force one with
`colorScheme="light" | "dark"`; `"system"` is the default. An app-level
switch is just state passed to that prop.

## Presets

The web docs' presets work as themes. Violet is above; teal, for example:

```tsx
const teal: KitTheme = {
  light: { accent: "#0f766e", accentSoft: "#ecfdf5", accentStrong: "#115e59", focus: "#0f766e", radius: 4 },
  dark: { accent: "#5eead4", accentSoft: "#042f2e", accentStrong: "#99f6e4", focus: "#5eead4", radius: 4 },
};
```

## Theming one section

Nest a `KitProvider` around that part of the tree. Unlike CSS inheritance, the
inner theme starts from Kit's defaults again, so give it every token it
changes, not only the difference from the outer theme.

```tsx
export function AdminArea({ children }: { children: ReactNode }) {
  return <KitProvider theme={teal}>{children}</KitProvider>;
}
```

## One component, one instance

Pass `style` (root) or `styles={{ slot }}`. Many slots take a function of the
component's state, the native stand-in for the web's `data-*` selectors:

```tsx
<Button styles={{ root: ({ pressed }) => ({ opacity: pressed ? 0.8 : 1 }) }}>Upgrade</Button>
```

`className` is passed through for NativeWind or Uniwind users; Kit itself does
not use it.

## Your own views

Read the same tokens so custom screens match:

```tsx
import { createThemedStyles, useKitTheme } from "component-lib/shared/native";

const styles = createThemedStyles((t) => ({
  panel: { backgroundColor: t.raised, borderColor: t.border, borderWidth: 1, borderRadius: t.radius, padding: 16 },
  title: { color: t.fg, fontSize: t.fontSize + 2, fontWeight: "700" },
  hint: { color: t.muted, fontSize: t.fontSize - 2 },
}));

export function Panel() {
  const { tokens, scheme } = useKitTheme();
  const s = styles(tokens);
  return (
    <View style={s.panel}>
      <Text style={s.title}>Plan</Text>
      <Text style={s.hint}>{scheme === "dark" ? "Dark" : "Light"} scheme</Text>
    </View>
  );
}
```

`createThemedStyles` caches one StyleSheet per token object. `mix(a, b, amount)`
and `alpha(color, opacity)` from the same module derive tints.

## Icons

Kit ships no icon set. Its small built-in marks (chevrons, the clear and close
×, checkmarks, the search magnifier, and so on) are drawn with views, so no icon
or SVG library is needed. To make them match the icon pack the rest of your app
uses, pass `icons` to `KitProvider`. Each entry receives the size and colour Kit
wants and returns any element; marks you leave out keep Kit's drawing.

```tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { KitProvider, type KitIcons } from "@/component-lib/shared/native";

// Outside any component, so KitProvider gets the same object every render.
const CHEVRON = { up: "chevron-up", down: "chevron-down", left: "chevron-back", right: "chevron-forward" } as const;

const icons: Partial<KitIcons> = {
  chevron: ({ size, color, direction = "down" }) => <Ionicons name={CHEVRON[direction]} size={size} color={color} />,
  close: ({ size, color }) => <Ionicons name="close" size={size} color={color} />,
  check: ({ size, color }) => <Ionicons name="checkmark" size={size} color={color} />,
  search: ({ size, color }) => <Ionicons name="search" size={size} color={color} />,
};

<KitProvider theme={theme} insets={insets} icons={icons}>
```

Any pack works the same way. With lucide-react-native (which needs
react-native-svg; Expo Go includes it):

```tsx
import { Check, ChevronDown, X } from "lucide-react-native";

const icons: Partial<KitIcons> = {
  close: ({ size, color }) => <X size={size} color={color} />,
  check: ({ size, color }) => <Check size={size} color={color} />,
  chevron: ({ size, color, direction = "down" }) => (
    <ChevronDown size={size} color={color} style={{ transform: [{ rotate: { down: "0deg", up: "180deg", left: "90deg", right: "-90deg" }[direction] }] }} />
  ),
};
```

The keys:

| Key | Used by |
| --- | --- |
| `chevron` | Accordion, Select and date fields, calendar month paging, Menu submenus, ListItem, Breadcrumb, AppBar back. Receives `direction`. |
| `close` | Clear buttons (Input, NumberInput, Select, date fields, SearchBar), Tag remove, Alert dismiss, Modal close, toast dismiss, SpeedDial close, FileUploader remove. |
| `check` | Selected rows in Menu and Select, SegmentedControl in check mode, and the success marks in Dialog and toasts. |
| `search` | SearchBar. |
| `eye`, `eyeOff` | Input's password reveal button, hidden and shown. |
| `calendar` | DatePicker, DateRangePicker and DateTimePicker fields. |
| `plus`, `minus` | NumberInput steppers. |
| `upload`, `pause`, `play`, `retry` | FileUploader. |

Each icon is placed in a fixed, centred box of the requested size and hidden
from screen readers; the control around it carries the label. A nested
`KitProvider` adds to the outer one's icons, so a section can change one mark.

Not overridable, because they are part of the control rather than an icon: the
checkbox tick and radio dot, the Switch thumb, spinners and progress rings, the
intent marks in Alert, the warning and info marks in Dialog and toasts, and
FileUploader's error mark and file-type labels.

Icons you pass to components yourself (Button `icon`/`leading`/`trailing`, Fab
`icon`, BottomNavigation `icon`, AppBar actions, ListItem `leading`) take any
element already and need none of this.
