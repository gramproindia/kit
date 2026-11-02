# Web components vs native components

The same component names, the same core logic (formatting, parsing, calendars,
filtering, stores), mostly the same props. What changes:

## Prop mapping

| Web | Native | Notes |
| --- | --- | --- |
| `className` | `style` | Root only. `className` is passed through for NativeWind/Uniwind; Kit ignores it. |
| `classNames={{ slot }}` | `styles={{ slot }}` | Many slots also accept `(state) => style`. |
| `data-state`, `data-variant`… selectors | the `state` argument of `style` / `styles` functions | e.g. `({ pressed, busy }) => …` |
| `--gbs-*` on `:root` | `KitProvider theme` | camelCase tokens, see `theming.md`. |
| `onClick` | `onPress` | Button, Card, Fab, ListItem, menu triggers. |
| `href` (Card, Breadcrumb) | `onPress` / `onNavigate` | Navigate with your router. |
| `render` (Button as a link) | — | Wrap navigation in `onPress`. |
| `name`, `form`, `type="submit"`, `pattern` | — | No form posting; submit from `onPress`. |
| `onChange` (DOM event) on Input/Textarea | `onValueChange(text)` (and `onChangeText`) | Same handler name as the web's value callback. |
| `aria-describedby` | `description` → accessibility hint | Automatic. |
| `theme="dark"` / `.dark` | `KitProvider colorScheme="dark"` | Default follows the device. |
| `<Toaster />`, `<DialogHost />` at the root | the same, inside `KitProvider` | |

Change handler names are the same on both platforms (see SKILL.md rule 2).

## Behaviours that differ

- **Pickers, Menu**: a bottom sheet on a phone, a popover on a tablet
  (`presentation` prop). The web always uses a popover.
- **DatePicker family**: tap-only (no typed dates); one month shown by default
  (range picker included); DateTimePicker commits on Done; day numbers use the
  locale's digits. Week start comes from the locale on every runtime.
- **Select/MultiSelect**: no keyboard navigation or type-ahead; MultiSelect's
  sheet has a Done button.
- **Tooltip**: long-press instead of hover; needs `KitProvider`.
- **Modal**: `placement="bottom"` is a draggable sheet. Android back reports
  `escape`.
- **Popover/Menu close reason**: back and tap-outside both report `outside`.
- **Toaster**: default position `top-center`; swipe to dismiss; renders under
  open RN Modals.
- **FileUploader**: needs `pick()`; files are `{ uri, name, size, type }`; one
  request per file, no chunking.
- **Switch**: larger sizes for touch; async `onCheckedChange` reverts on
  failure (same as web).
- **NumberInput**: − / + side by side; `largeStep` unused (no Page Up/Down).
- **Tabs**: tab list scrolls; `activation` ignored.
- **Spinner**: explicit `color` (no `currentColor`).
- **Agent surface** (`AgentSurface`, WebMCP, `useFieldAgent`): web only for now.

## Only on native

AppBar, BottomNavigation, Fab, SpeedDial, SegmentedControl, List / ListSection
/ ListItem, BottomSheet, SearchBar. Tokens `raised` and `touchTarget`.

## Only on the web

DataGrid (and AskGrid), the agent surface, `gbs.css` and CSS layers.
