# AppBar

> **Beta**: mobile-only (React Native). The API may change between prereleases on the `native` npm tag.

The bar at the top of a screen: a title, an optional back or menu button, and actions. `medium` and `large` show a big title under the toolbar row (the Material 3 and iOS large-title pattern).

| Prop | Type | Default | |
|---|---|---|---|
| `variant` | `"small" \| "center" \| "medium" \| "large"` | `"small"` | `center` centres the title. |
| `title`, `subtitle` | `ReactNode` | | |
| `leading` | `ReactNode` | | Before the title. Overrides `onBack`. |
| `onBack` | `(e) => void` | | Renders a back button labelled from `localeText.back`. |
| `actions` / `children` | `ReactNode` | | Trailing buttons, usually `AppBarAction`. |
| `elevated` | `boolean` | `false` | Always raised. |
| `scrolled` | `boolean` | `false` | Raised with a divider while the content under it is scrolled. |
| `safeArea` | `boolean` | `true` | Pads the top by `KitProvider`'s `insets.top`. |
| `style`, `styles` | | | Slots: `root`, `bar`, `title`, `subtitle`, `actions`. |
| `localeText` | `Partial<{ back }>` | | |

`AppBarAction` is a 44dp round icon button; `aria-label` is required.

```tsx
<AppBar
  variant="large"
  title="Payments"
  scrolled={scrolled}
  onBack={() => router.back()}
  actions={<AppBarAction aria-label="Search" onPress={openSearch}><SearchIcon /></AppBarAction>}
/>
```
