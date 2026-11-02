# Grampro Kit — Figma design system generator

A private Figma plugin that builds the Grampro Kit design system into any Figma
file, straight from the tokens and components in `component-lib`. Run it once in
an empty file, publish that file as a library, and the design team gets the same
colors, sizes, type and components the React code uses.

## What it creates

| Page | Contents |
| --- | --- |
| **Foundations** | Color swatches in Light and Dark mode, type ramp, radius, control heights, spacing. |
| **Components · Actions & navigation** | Button, Icon button, Spinner, Checkbox (+ CheckboxGroup example), Tab (+ tab list examples), Breadcrumb item and separator (+ trail examples). |
| **Components · Forms** | Input, OTP cell (+ code example), Textarea, Select trigger and option (+ open Select example), Date field and Day cell (+ calendar example). |
| **Components · Choice & quantity** | Switch (+ settings list), Radio and Radio card (+ group and plan examples), NumberInput (+ the same amount in three locales). |
| **Components · Overlays & data** | Modal (dialog and drawers), Dialog, Toast (+ stack), Upload drop zone and file row (+ uploader example), Grid header cell, cell and selection cell (+ full grid example). |
| **Components · Menus & surfaces** | Menu item (+ panel example), Popover, Tooltip, Card (+ interactive and focused examples), Stat (+ tile row), Skeleton (+ loading card), Empty state. |
| **Components · Status & identity** | Alert, Badge and Tag (+ filter row), Avatar (+ group with overflow), Progress (+ rings), Accordion item (+ a group with one open). |

Plus, in the file's local assets:

- **Variables** — `Grampro Kit · Color` (35 colors, Light and Dark modes) and
  `Grampro Kit · Size` (18: radius, control heights, spacing). Each variable's
  description names its CSS counterpart (e.g. `--gbs-accent`), and scopes keep
  text colors to text and border colors to strokes. The components resolve every
  value through the shared `--gbs-*` palette, so setting those four or five
  variables on `:root` in code is the same act as switching a variable mode here.
- **Text styles** — 13 under `Grampro Kit/Body`, `Label`, `Title` and `Numeric`.
- **38 component sets** with variant properties (`Variant`, `Size`, `State`, …),
  text properties (`Label`, `Title`, …) and on/off toggles for optional parts
  (icons, descriptions, counters, badges). Every fill, stroke and radius is bound
  to a variable, so switching a frame to Dark mode restyles it completely.

## Run it (designers)

**[Install it from the Figma Community](https://www.figma.com/community/plugin/1692828324805361551)**
— once the listing clears review, which Figma is currently quoting at a
few weeks. Until then the steps below are the way to run it, and they are
short: the build is committed, so there is nothing to compile.

The rest of this file is for running it from source, which is how it is
developed and how you try a change before publishing one. For that you
need the **Figma desktop app**; development plugins cannot be imported in
the browser.

1. Create a new Figma design file, e.g. "Grampro Kit".
2. **Plugins → Development → Import plugin from manifest…** and choose
   `figma-plugin/manifest.json` from this repository.
3. **Plugins → Development → Grampro Kit — Design System Generator.**
   It takes a minute and closes with a summary.
4. Publish it: **Assets panel → Libraries (book icon) → Publish.** Other files
   then enable the library and use the components and variables.

## Exporting for an agent

**Grampro Kit → Export all screens for an agent** walks every page and
exports each top-level frame, with one set of theme values read across the
whole design. **Export selection for an agent** does the same for what you
have selected — one frame for one screen, several for several.

The panel offers two things:

- **Copy JSON** puts the minified export on the clipboard. Indentation is
  most of a pretty-printed tree and none of its meaning, so what is copied
  is about a third the size of what is shown.
- **Save .json** writes it to a file. Prefer this for anything but a small
  frame: a chat input caps at around fifty thousand characters, and a
  pasted export sits in the conversation twice where a file appears only
  in the answer. Pass the path to `figma_frame` as `designFile`, or split
  it into a folder with `npx @grampro/kit design ./design.json`.

Dark mode: select a frame, then in the right panel under **Appearance** set the
`Grampro Kit · Color` mode to **Dark**.

> Two variable modes (Light and Dark) need a paid Figma plan. On the Starter
> plan the plugin creates Light only and says so in its summary.

## Mobile design system — iOS & Android (BETA)

**Plugins → Development → Grampro Kit → Generate mobile design system (iOS &
Android) — beta** builds the GramproKit React Native components in the same
file (or a new one). It is a separate command, so the web pages are untouched.

> **BETA.** The React Native kit is in prerelease on the npm `native` tag, and
> both the components and this design set may change or break between
> prereleases.

| Page | Contents |
| --- | --- |
| **Mobile · Foundations** | The mobile-only colour tokens in Light and Dark, the iOS (SF Pro), Android (Roboto) and Kit type ramps, touch targets and the 34 / 44 / 52 control heights, mobile radii, and the safe areas of an iPhone 16 and a Pixel 9. |
| **Mobile · Components** | 25 sets prefixed `Mobile/`: AppBar, BottomNavigation, SegmentedControl, Tabs, Button, Fab, SpeedDial, Field (Input / Select / Date), SearchBar, Switch, Checkbox, Radio, BottomSheet, Dialog, Toast, Menu, ListItem (+ iOS settings and Android inbox examples), Card, Stat, Badge, Avatar, Alert, Progress, Spinner, Skeleton. |
| **Mobile · Screens** | The GramproKit Demo app on iPhone 16 (393 × 852) and Pixel 9 (412 × 915), each in Light and Dark: Home dashboard, New invoice, Settings · Theme, a bottom sheet open, a dialog open. Built from instances, so editing a component updates every screen. |

- **Platform property** only where iOS and Android differ: AppBar (iOS
  navigation bar small / large title; Android M3 small / center / medium /
  large), BottomNavigation (tab bar; M3 navigation bar with the pill),
  SegmentedControl (sliding thumb; M3 segmented buttons), SearchBar, Switch,
  BottomSheet, Dialog (iOS alert; M3 dialog), Toast (iOS banner; M3 snackbar),
  Menu (context menu / action sheet; M3 menu / sheet), ListItem, Fab (M3 FAB;
  an iOS "floating button" for apps that use one on both — iOS has no FAB).
  Everything else is one look on both, as Kit renders it.
- **Theme by variable mode, not duplicates.** Mobile shares every colour
  variable with the web kit and adds `surface/raised` and `surface/grouped`;
  the size collection gains `mobile/*` (touch target, control heights, font
  size, safe areas) and `radius/sheet`, `radius/dialog-ios`,
  `radius/dialog-android`. Text styles go under `Grampro Kit Mobile/`.
- **Fonts.** iOS styles use SF Pro and Android styles Roboto. SF Pro is not on
  Windows or in the browser: there the iOS styles fall back to Inter and the
  closing message says so. Install SF Pro and run the command again to update
  the styles in place.
- Mirrors `source/components/shared/native/theme.ts` and the components in
  `source/components/*/native` and `source/native/*`.

## Running it again

When the code's tokens or components change, update `src/tokens.ts` (and the
generators if a component changed), rebuild, and run the plugin in the same
file:

- **Variables and text styles are updated in place**, so everything bound to
  them — in this file and in files using the published library — picks up the
  new values.
- **Pages are rebuilt.** Previous pages are renamed `… (previous <date>)` rather
  than deleted. Components on the new pages are new components, so for a library
  that's already in use, prefer updating tokens only, or change the affected
  components by hand, to avoid replacing instances in other files.

## Develop

```bash
cd figma-plugin
npm install
npm run build    # compiles src/*.ts to dist/code.js (committed, so designers don't need Node)
npm run smoke    # runs both generators (web, then mobile) and the export against a mock Figma API
```

| File | Purpose |
| --- | --- |
| `src/tokens.ts` | Colors (light/dark), sizes and type — mirror of the CSS variables. |
| `src/lib.ts` | Variables and styles, frame/text/icon builders, variant sets and properties. |
| `src/foundations.ts` | The Foundations page. |
| `src/actions.ts` | Button, Icon button, Spinner, Checkbox, Tabs, Breadcrumb. |
| `src/forms.ts` | Input, OTP, Textarea, Select, DatePicker. |
| `src/controls.ts` | Switch, Radio, RadioGroup, NumberInput. |
| `src/display.ts` | Alert, Badge, Tag, Avatar, Progress, Accordion. |
| `src/overlays.ts` | Modal, Dialog, Toast, FileUploader, DataGrid. |
| `src/surfaces.ts` | Menu, Popover, Tooltip, Card, Stat, Skeleton, Empty state. |
| `src/mobile-tokens.ts` | Mobile-only variables and the iOS / Android / Kit text styles (BETA). |
| `src/mobile-components.ts` | The `Mobile/` component sets, with iOS and Android variants (BETA). |
| `src/mobile-screens.ts` | Mobile · Foundations and Mobile · Screens (BETA). |
| `src/main.ts` | Pages and orchestration; the `generate-mobile` command. |

## Limits

- **Font:** Inter stands in for the components' `system-ui` font stack, so text
  metrics differ slightly from the browser.
- **Close, not exact:** components match the CSS in color, size, radius, spacing
  and states, but they aren't pixel-identical, and CSS-only details are
  approximated: `color-mix()` hovers, the sliding tab indicator, animations, and
  the skeleton's pulse and wave (Figma shows their resting state).
- **Icons:** simple stroke icons drawn from the same shapes as the code. Swap in
  your icon library's components if you have one.
- **Not verified in the Figma app:** the plugin was type-checked against Figma's
  official plugin typings and smoke-tested against a mock API. Check the first
  run in Figma before publishing the library.
