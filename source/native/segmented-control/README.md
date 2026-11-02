# SegmentedControl

> **Beta, React Native only.** The API may change between `native` prereleases.

A short row of choices: a view switch, a filter, a unit. One choice with a sliding thumb (iOS), or several with `multiple` (Material 3 segmented buttons with checks). For more than about five options, use Tabs or a Select.

| Prop | Type | Default |
| --- | --- | --- |
| `options` | `{ value, label, icon?, disabled? }[]` | required |
| `value` / `defaultValue` | `string` (or `string[]` with `multiple`) | first option / `[]` |
| `onValueChange` | `(value) => void` | |
| `multiple` | `boolean` | `false` |
| `indicator` | `"thumb" \| "check"` | `"thumb"` (`multiple` always uses `check`) |
| `size` | `"sm" \| "md"` | `"md"` |
| `fullWidth` | `boolean` | `true` |
| `disabled`, `aria-label`, `style`, `styles` | | |

```tsx
<SegmentedControl
  aria-label="Period"
  options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }]}
  defaultValue="week"
  onValueChange={setPeriod}
/>
```

Screen readers hear a radio group (or a group of checkboxes with `multiple`). The thumb respects Reduce Motion.
