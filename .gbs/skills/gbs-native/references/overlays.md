# Overlays on native

Every Kit overlay sits on React Native's `Modal`, so it draws above the whole
app (navigation included), **Android back closes it**, and screen readers stay
inside it while it is open. Sheets slide up from the bottom and can be dragged
down.

## Modal

`component-lib/modal`. `open` / `defaultOpen` / `onOpenChange(open, reason)`;
`title`, `description`, `children`, `footer` (a node, or `({ close }) => node`);
`placement` `center` (default) | `top` | `left` | `right` (drawers) | `bottom`
(a bottom sheet with a drag handle); `size` `sm` | `md` | `lg` | `xl` |
`full`; `closeButton`, `closeOnEscape` (Android back), `closeOnBackdrop`;
`onBeforeClose(reason)` (return false or a promise of false to keep it open).
`reason` is `escape` (back button), `backdrop`, `close-button` or `api`.

```tsx
<Modal
  open={open}
  onOpenChange={setOpen}
  title="Edit customer"
  placement="bottom"
  footer={({ close }) => (
    <Button
      fullWidth
      onPress={async () => {
        await save();
        toast.success("Saved");
        close();
      }}
    >
      Save
    </Button>
  )}
>
  <Text>Form fields go here.</Text>
</Modal>
```

## dialog + DialogHost

`component-lib/dialog`. Mount `<DialogHost />` once inside `KitProvider`, then
from anywhere:

```tsx
const ok = await dialog.confirm({
  title: "Delete INV-2041?",
  description: "This cannot be undone.",
  intent: "danger",
  confirmLabel: "Delete invoice",
});
```

- `dialog.alert(options)` → `Promise<void>`; `dialog.confirm(options)` →
  `Promise<boolean>`; `dialog.prompt(options)` → `Promise<string | null>`. Each
  also takes a plain title string.
- Options: `title`, `description`, `intent` (`default` | `info` | `success` |
  `warning` | `danger`), `icon`, `confirmLabel`, `cancelLabel`, `dismissible`,
  `size`, and `onConfirm` (async: the dialog waits, shows a spinner, and shows
  the error inline if it throws).
- Prompt adds `inputLabel`, `defaultValue`, `placeholder`, `inputType`
  (picks the keyboard), `required`, `validate(value)`.
- Without a DialogHost mounted, `confirm` resolves `false` straight away.

## toast + Toaster

`component-lib/toaster`. Mount `<Toaster />` once inside `KitProvider`
(`position` defaults to `top-center` on native; also `limit`, `duration`,
`closeButton`).

```tsx
toast("Invoice deleted", { action: { label: "Undo", onClick: () => restore() } });
toast.success("Saved");
toast.error("Upload failed", { description: "Check your connection." });
toast.promise(sync(), { loading: "Syncing…", success: "Up to date", error: "Sync failed" });
toast.dismiss(id);
```

Toasts swipe sideways to dismiss and pause while touched. Errors are announced
as alerts, the rest politely.

**Known limit:** toasts render below an open Modal, Dialog, Menu or sheet
(React Native draws `Modal` above everything). A toast fired inside one appears
when it closes. Show errors inside an open overlay with the field's `error` or
the dialog's own error instead.

## BottomSheet

`component-lib/bottom-sheet` (mobile-only). `open` / `defaultOpen` /
`onOpenChange`, or `trigger` (an element; Kit adds its `onPress`); `title`,
`description`, `children`, `footer` (sticky actions), `dismissible`,
`maxHeight` (fraction of the screen, default 0.9), `scrollable`, `onClosed`.

**`children` and `footer` functions receive `close` itself**, not an object
(Modal's receive `{ close }`). `<BottomSheetClose>` wraps an element so pressing
it closes the sheet; `useBottomSheetClose()` returns `close` inside custom
content.

```tsx
<BottomSheet
  title="Share invoice"
  trigger={<Button variant="outline">Share</Button>}
  footer={(close) => <Button fullWidth variant="secondary" onPress={close}>Done</Button>}
>
  <Text>Share targets go here.</Text>
</BottomSheet>
```

No snap points: the sheet fits its content up to `maxHeight`.

## Menu

`component-lib/menu`. `trigger` (any pressable element, e.g. a Button; Kit adds
`onPress` and a ref), `label` (spoken name, and the sheet's title),
`presentation` (default `auto`: an action sheet on a phone, a popover on a
tablet), `side`, `align`, `closeOnSelect`, `open` / `onOpenChange`.

Children: `MenuItem` (`onSelect`, `icon`, `shortcut`, `destructive`,
`disabled`), `MenuCheckboxItem` (`checked`, `onCheckedChange`),
`MenuRadioGroup` (`value`, `onValueChange`) + `MenuRadioItem` (`value`),
`MenuGroup` (`label`), `MenuSeparator`, `MenuSub` (`label`; on a phone it
replaces the list with a Back row, on a tablet it opens beside).

```tsx
<Menu label="Invoice actions" trigger={<Button variant="ghost">More</Button>}>
  <MenuItem onSelect={duplicate}>Duplicate</MenuItem>
  <MenuSub label="Export as">
    <MenuItem onSelect={exportPdf}>PDF</MenuItem>
    <MenuItem onSelect={exportCsv}>CSV</MenuItem>
  </MenuSub>
  <MenuSeparator />
  <MenuItem destructive onSelect={remove}>Delete</MenuItem>
</Menu>
```

## Popover

`component-lib/popover`. `trigger`, `title`, `description`, `children` (or
`({ close }) => node`), `presentation` (default `popover`; `sheet` and `auto`
also work), `side`, `align`, `gap`, `scrollable`, `open` / `onOpenChange`.
`reason` is `outside` for a tap outside and for Android back.

```tsx
<Popover title="GST" trigger={<Button variant="link">What is GST?</Button>}>
  <Text>Goods and Services Tax, charged on most supplies in India.</Text>
</Popover>
```

## Tooltip

`component-lib/tooltip`. There is no hover: the tooltip shows after a
**long-press** (`delay`, default 400 ms) and hides `duration` ms (default 1500)
after the finger lifts. Its text is also added to the trigger's accessibility
hint. Needs `KitProvider`. Never use a tooltip as the only name of an
icon button; give the button `aria-label`.

```tsx
<Tooltip content="Archive (keeps the record)">
  <Button icon={<Text>▣</Text>} aria-label="Archive" variant="ghost" />
</Tooltip>
```

A tooltip on a control inside an open Menu or Popover draws behind it (same
limit as toasts).
