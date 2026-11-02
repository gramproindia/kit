# Display and feedback on native

Props mirror the web components. Differences are listed per component.

## Button

`component-lib/button`. `variant` `primary` (default) | `secondary` |
`outline` | `ghost` | `danger` | `link`; `size` `sm` | `md` | `lg` (34/44/52dp;
small keeps a 44dp touch area through `hitSlop`); `leading`, `trailing`,
`icon` (icon-only: give `aria-label`); `loading` + `loadingText`; `fullWidth`;
`disabled`; `onPress` (return a promise to show the spinner until it settles).
Strings are wrapped in `Text` for you; pass elements for icons. Slots:
`root`, `content`, `label`, `spinner`, `icon`, each a style or
`({ pressed, busy, disabled, variant, size }) => style`.

There is no `render` prop and no `type="submit"`: there are no forms.

## Card and Stat

`component-lib/card`. `Card`: `variant` `outlined` | `elevated` | `plain`,
`padding` `none` | `sm` | `md` | `lg`, `onPress` (the whole card becomes one
button; replaces the web's `href`). `CardHeader` (`title`, `description`,
`actions`), `CardBody`, `CardFooter` share the card's padding.

`Stat`: `label`, `value`, `trend` (`{ direction: "up" | "down" | "flat",
label, invert?, description? }`), `help`, `icon`, `loading`.

## Alert

`component-lib/alert`. `variant` `info` | `success` | `warning` | `danger` |
`neutral`, `size`, `title`, `description` or children, `icon` (`false`
hides it), `actions`, `onDismiss` (shows a close button).

## Badge and Tag

`component-lib/badge`. `Badge`: `variant` `neutral` | `accent` | `success` |
`warning` | `danger` | `info`, `appearance` `soft` | `solid` | `outline`,
`size`, `count` + `max` (99+), `dot`, `icon`. `Tag`: same look plus
`onRemove` (draws a remove button).

## Avatar and AvatarGroup

`component-lib/avatar`. `name` (initials and a stable colour from it; works
for any script and for emoji), `src`, `initials`, `size`, `shape`, `status`
(`online` etc., spoken with the name). `AvatarGroup` `max` shows "+n".

## Tabs

`component-lib/tabs`. `Tabs` (`value` / `onValueChange`, `variant` `line` |
`pills` | `enclosed`, `size`, `keepMounted`) > `TabList` > `Tab` (`value`,
`icon`, `badge`) and `TabPanel` (`value`). The tab list scrolls sideways and
keeps the selected tab in view. `activation` is accepted but a tap always
selects.

## Accordion

`component-lib/accordion`. `Accordion` (`value: string[]` / `onValueChange`,
`multiple`, `collapsible`, `variant` `separated` | `contained` | `plain`,
`iconPosition`) > `AccordionItem` (`value`, `title`, `description`, `meta`,
`icon`, `disabled`). Or pass `items`.

## Breadcrumb

`component-lib/breadcrumb`. `items` (`{ label, href?, onClick? }[]`),
`onNavigate(item, index)` for items with `href` (there are no links on
native), `maxItems` collapsing. A horizontal row that scrolls to the end.
Prefer the router's back button on phones.

## Progress, Spinner, Skeleton, Empty

- `Progress` (`component-lib/progress`): `value` (null = indeterminate),
  `max`, `label`, `showValue`, `valueText`, `variant` `accent` | `success` |
  `warning` | `danger`, `size`. `CircularProgress`: same plus `size` in dp and
  `thickness`.
- `Spinner` (`component-lib/spinner`): `size` `xs`…`xl` or dp, `variant`
  `ring` | `dots`, `color` (native has no `currentColor`; default accent),
  `label`, `delay` / `minDuration` (no flash for fast loads), and children with
  `loading` to overlay content. `useDelayedLoading` is the same timing as a
  hook.
- `Skeleton` (`component-lib/skeleton`): `variant` `text` | `circle` |
  `rect`, `lines`, `width` / `height` (dp or percent), `radius`, `animation`
  `pulse` | `wave` | `none`. Respects Reduce Motion.
- `Empty`: `title`, `description`, `icon`, `actions`.

## Example

```tsx
<View style={{ flexDirection: "row", gap: 12 }}>
  <Card style={{ flex: 1 }}>
    <Stat label="Collected" value="₹12.4L" trend={{ direction: "up", label: "12.4%", description: "vs last month" }} loading={loading} />
  </Card>
  <Card style={{ flex: 1 }}>
    <Stat label="Overdue" value="7" trend={{ direction: "down", label: "2", invert: true }} />
  </Card>
</View>

<Alert variant="warning" title="3 invoices overdue" description="Send reminders before the 30th." actions={<Button size="sm">Remind</Button>} />

<Card variant="elevated">
  <CardHeader title="INV-2041" description="Anand Remanan" actions={<Badge variant="warning">Unpaid</Badge>} />
  <CardBody>Due 22 Nov 2026 · ₹6,250</CardBody>
  <CardFooter>
    <Button size="sm" onPress={markPaid}>Mark paid</Button>
  </CardFooter>
</Card>

<Tabs value={tab} onValueChange={setTab}>
  <TabList>
    <Tab value="unpaid" badge={<Badge size="sm" count={3} />}>Unpaid</Tab>
    <Tab value="paid">Paid</Tab>
  </TabList>
  <TabPanel value="unpaid"><UnpaidList /></TabPanel>
  <TabPanel value="paid"><PaidList /></TabPanel>
</Tabs>

<Progress label="Collection target" value={62} showValue />
{loading ? <Skeleton lines={3} /> : <Empty title="No invoices yet" description="Create one to get started." />}
```
