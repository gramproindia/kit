# Fab and SpeedDial

> **Beta**: mobile-only (React Native). The API may change between prereleases on the `native` npm tag.

The floating action button: the screen's main action, floating over the content. With a `label` it is an extended FAB; toggle `extended` (say, while a list scrolls down) to collapse it to the icon. `SpeedDial` opens a short list of related actions above it, over a dimmed screen.

| Prop | Type | Default | |
|---|---|---|---|
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 40, 56, 96dp. |
| `variant` | `"primary" \| "secondary" \| "surface"` | `"primary"` | |
| `icon` | `ReactNode` | | |
| `label` | `string` | | Makes an extended FAB. |
| `extended` | `boolean` | `true` | Collapses the label, animated. |
| `loading`, `disabled` | `boolean` | `false` | |
| `placement` | `"bottom-end" \| "bottom-center" \| "bottom-start" \| "none"` | `"bottom-end"` | Floats over its parent; follows RTL. `none` leaves layout to you. |
| `offset` | `number` | `0` | Extra bottom distance, e.g. a BottomNavigation's 64dp. |
| `safeArea` | `boolean` | `true` | Adds `KitProvider`'s insets when placed. |
| `aria-label` | `string` | `label` | Required for an icon-only FAB. |
| `style`, `styles` | | | Slots: `root`, `label`, `icon`. |

`SpeedDial` takes `actions: { key, label, icon?, onPress?, disabled? }[]`, `icon`, a required `aria-label`, `variant`, `placement`, `offset`, `safeArea`, and `open`/`onOpenChange`. Android back, a tap outside, or the ✕ closes it.

```tsx
<Fab icon={<PlusIcon />} label="New invoice" extended={!scrolledDown} offset={64} onPress={create} />
```
