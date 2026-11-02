# BottomSheet

> **Beta, React Native only.** The API may change between `native` prereleases.

A panel that slides up from the bottom: secondary actions, a short form, details for a tapped item. Drag the handle down, tap outside, or press Android back to close it. Built on Kit's shared `Sheet`, so it clears the home indicator (pass `insets` to `KitProvider`) and stays above the keyboard.

| Prop | Type | Default |
| --- | --- | --- |
| `open` / `defaultOpen` / `onOpenChange` | | uncontrolled, closed |
| `trigger` | element taking `onPress` | |
| `title`, `description` | `ReactNode` | |
| `footer` | node, or `(close) => node` | |
| `children` | node, or `(close) => node` | |
| `dismissible` | `boolean` | `true` |
| `maxHeight` | fraction of the screen | `0.9` |
| `scrollable` | `boolean` | `true` |
| `onClosed`, `style`, `styles` (`body`, `footer`) | | |

```tsx
<BottomSheet
  trigger={<Button variant="outline">Share</Button>}
  title="Share invoice"
  footer={(close) => <Button onPress={close}>Done</Button>}
>
  <ListItem title="Copy link" onPress={copy} />
</BottomSheet>
```

`BottomSheetClose` wraps a button so pressing it closes the sheet; `useBottomSheetClose()` gives custom content the same `close`.
