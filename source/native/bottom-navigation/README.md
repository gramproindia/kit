# BottomNavigation

> **Beta**: mobile-only (React Native). The API may change between prereleases on the `native` npm tag.

The bar of top-level destinations at the bottom of an app, Material 3 style: an icon in a pill that lights up for the active item, labels, and badges.

| Prop | Type | Default | |
|---|---|---|---|
| `items` | `{ key, label, icon?, badge?, disabled? }[]` | | `icon` is an element or `({ active, color }) => element`. `badge`: a number (99+ past 99) or `true` for a dot. |
| `value` / `defaultValue` | `string` | first item | The active key. |
| `onValueChange` | `(key) => void` | | |
| `onReselect` | `(key) => void` | | The active item tapped again: scroll to top, refresh. |
| `labelVisibility` | `"always" \| "active" \| "never"` | `"always"` | |
| `safeArea` | `boolean` | `true` | Pads the bottom by `KitProvider`'s `insets.bottom`. |
| `style`, `styles` | | | Slots: `root`, `item`, `indicator`, `label`, `badge`. |
| `localeText` | `Partial<{ badgeCount, badgeDot }>` | | Spoken badge text; `{count}` is replaced. |

Items are `role="tab"` with `aria-selected`; the badge is spoken with the label ("Invoices, 3 new").

```tsx
<BottomNavigation
  value={tab}
  onValueChange={setTab}
  items={[
    { key: "home", label: "Home", icon: ({ color }) => <HomeIcon color={color} /> },
    { key: "inbox", label: "Inbox", icon: ({ color }) => <InboxIcon color={color} />, badge: 3 },
  ]}
/>
```
