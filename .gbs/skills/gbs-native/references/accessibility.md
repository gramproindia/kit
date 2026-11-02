# Accessibility on native

Kit components set React Native's web-aligned accessibility props (`role`,
`aria-*`) for you. VoiceOver (iOS) and TalkBack (Android) read them.

## What is supplied

- **Roles and states.** Buttons (`role="button"`, `aria-busy`,
  `aria-disabled`), checkboxes (`aria-checked`, including `"mixed"` for
  indeterminate), radios and radio groups, switches, tabs (`aria-selected`),
  accordion headers (`aria-expanded`), progress (`role="progressbar"` with
  value), number inputs (`spinbutton` with increment/decrement actions: swipe
  up or down), app bar (`toolbar`), bottom navigation (`tablist` / `tab`),
  menus and options (`aria-selected`), the combobox trigger
  (`aria-expanded`).
- **Names.** A field's accessible name is its `label`. `description` becomes
  the accessibility hint (native has no `aria-describedby`). `error` is
  rendered with `role="alert"` and announced.
- **Announcements.** Toasts announce: errors as alerts, the rest politely.
  `aria-live` works on Android only, so Kit also calls
  `AccessibilityInfo.announceForAccessibility` on iOS where it matters
  (toasts, uploads).
- **Modality.** Every overlay is a React Native `Modal`, which keeps VoiceOver
  and TalkBack inside it while open. Android back closes it.
- **Touch targets.** Everything tappable is at least `touchTarget` (44dp)
  high, small buttons included (`hitSlop`).
- **Motion.** Animations follow the device's Reduce Motion setting
  (`useReducedMotion` in `shared/native`): skeleton shimmer, switch thumb,
  sheet slides, progress.
- **Text.** Character counters count what a person sees (emoji, accented
  letters, Indic conjuncts), even on Hermes, which has no `Intl.Segmenter`.

## What you add

- `aria-label` on every icon-only control: `Button icon`, `AppBarAction`
  (required), `Fab` without a label, `SpeedDial` (required), a `Switch` used
  as a `ListItem` trailing control.
- A text `label` on every field. Never put the name in `placeholder` only.
- `aria-label` on `ListItem` when `title` is not plain text, and on
  `SegmentedControl` options whose `label` is an icon.
- Do not use a Tooltip as the only way to name or explain something: it needs
  a long-press, which screen-reader users may not find. Its text is also
  added as the trigger's hint.
- Keep custom views on the same tokens (`useKitTheme`) so contrast holds in
  dark mode.

## What does not exist on native

- Keyboard navigation (arrow keys in menus, grids, tab lists). Do not add
  `onKeyPress` handlers that imitate it.
- Hover. Anything shown on hover on the web is shown on press or long-press.
- `aria-describedby`, `aria-labelledby` across components on iOS, and
  `aria-live` on iOS (see above).
