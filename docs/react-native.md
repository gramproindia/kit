# GramproKit Native: plan for a React Native edition

Status: **approved plan, nothing implemented.** Decisions settled 2026-11-02
(section 5). Written 2026-11-02, against React Native
0.88.1 and Expo SDK 58. Claims are marked *established* (with a source) or
*proposed* (our design choice). Version numbers were checked against npm on
2026-11-02.

## TL;DR

- **One library, two renderers.** Every component already splits framework-free
  `core/` from DOM `react/`. Add a `native/` folder next to `react/` and keep a
  single `core/`. The CLI copies `core/ + native/` instead of
  `core/ + react/ + styles.css` when it finds `react-native` in the project.
- **The same rules carry over.** Components are copied in, not installed. There
  are no third-party runtime imports, every component has a passport, and
  components never import each other. Pure JS with no native modules means it
  runs in Expo Go, dev builds and bare RN alike.
- **Styling uses `StyleSheet` plus a JS token object**, the native mirror of
  `--gbs-*`. A `styles={{slot}}` prop mirrors `classNames`, and `className` is
  passed through so NativeWind and Uniwind users are not locked out.
- **Overlays get a small Kit-owned portal host** and reuse the existing pure
  `placePopover` maths. On phones, pickers and menus open as bottom sheets.
- **The agent runtime ports almost as-is.** WebMCP has no mobile equivalent today,
  so the native `AgentSurface` exposes the same `describe` / `operate` contract to
  in-app assistants first. OS agent hooks (App Intents, AppFunctions) are a later
  research item.
- **Target: New Architecture only, RN ≥ 0.83 (React 19.2), Expo SDK ≥ 56
  recommended.**

## 1. Where React Native is in late 2026 (established)

| Area | State | Source |
|---|---|---|
| Core | 0.88.1 latest. A minor roughly every 2 months; 0.86–0.88 had no user-facing breaking changes. | reactnative.dev/blog |
| Architecture | New Architecture only since 0.82; legacy code removed in 0.84. Hermes V1 default since 0.84. | RN 0.84 post |
| React | 0.88 ships React 19.3 (`use`, `<Activity>`, `useEffectEvent`). React Compiler 1.0 is stable. | RN / React blogs |
| Web alignment | DOM Node APIs on refs (0.82), W3C EventTarget dispatch (0.88), `role` / `aria-*` props, CSS `boxShadow`, `filter`, gradients, `outline`, `display: contents`. | RN 0.88 post, docs |
| Framework | Expo is the officially recommended framework. SDK 58 (RN 0.88). `@expo/ui` (SwiftUI / Compose) stable since SDK 56. | reactnative.dev, expo.dev/changelog |
| Governance | React Foundation (Linux Foundation); repos moved to the `react` GitHub org in 0.86. | React Conf 2025 recap |
| Removed / deprecated | `StyleSheet.absoluteFillObject` removed (0.85), `InteractionManager` removed (0.87), `InputAccessoryView` deprecated (0.88), core `SafeAreaView` deprecated (0.81). | RN release posts |

**The ecosystem Kit would compete in:**

| Library | Distribution | Styling |
|---|---|---|
| react-native-reusables | shadcn CLI and `registry-item.json` | NativeWind / Uniwind |
| gluestack-ui v5 | copy-in CLI | NativeWind v5 / Uniwind |
| HeroUI Native 1.0 | npm package | Uniwind |
| Tamagui 3 | npm package | own compiler |
| Paper 6 alpha | npm package | MD3 |

A registry, MCP, `llms.txt` and agent skills are now standard. Kit already ships
all four, and none of these libraries has anything like the passport or the
validated agent runtime. **That is the gap Kit fills on mobile** (proposed).

**Unconfirmed:** Static Hermes status, any official RN 1.0 date, and whether
`@gorhom/bottom-sheet` supports Reanimated 4 and Gesture Handler 3. None of the
decisions below depend on them.

## 2. What carries over from the web Kit

### Unchanged: the logic in `core/` and shared logic

- All `*/core/*`: stores, date and calendar maths, number parsing and formatting,
  combobox filtering, tab and menu navigation, modal dismiss rules, toast and
  dialog stores, file validation.
- The DataGrid engine and its whole agent pipeline (contract, intent, validate,
  coerce, operations).
- `shared/core/*`: `cx`, text, field ids, `placePopover`, the agent schema,
  validator, numbers, history and surface registry.
- `shared/react/useControllableState`, which is DOM-free.
- The `useSyncExternalStore` wiring for stores.

### Small fixes needed

- **DataGrid `core/grid.ts` and `core/types.ts`** touch the DOM. Move
  `attachViewport`, `querySelector` focus and clipboard behind an injected
  adapter.
- Some `core/types.ts` files import `ReactNode` from `react`. That is fine on
  native too.
- `toast` and `dialog` guard on `typeof document`; replace that with a
  host-mounted check.
- `webmcp.ts` and the DOM half of `field-executors.ts` stay web-only.

### Rewritten per component (`native/`)

- Views and styles.
- Overlays: there is no Popover API or `<dialog>`.
- Portals: there is no `createPortal`.
- Button's `useFormStatus`: there are no `<form>` elements on native.
- Upload transport and file types.
- Grid export download.
- Keyboard-first accessibility (arrow-key grids, spin buttons) becomes
  screen-reader-first: `accessibilityActions` (increment/decrement) and
  `role` + `aria-*`.

Rough estimate (proposed): **about 55–65% of the lines in a typical component
are reusable unchanged.** Logic-heavy components (DatePicker, Combobox,
DataGrid) are above that; display components (Badge, Card) are below it.

## 3. Architecture (proposed)

### 3.1 Repository layout: same repo, same package

```
source/components/button/
  core/            ← shared, unchanged
  react/           ← web views (existing)
  native/          ← NEW: RN views, tokens usage, icons (react-native-svg-free)
  styles.css       ← web only
  index.ts         ← web barrel (existing)
  index.native.ts  ← NEW: native barrel
  passport.json    ← gains a platform section (see 3.6)
source/components/shared/
  core/ react/     ← existing
  native/          ← NEW: theme, KitProvider + PortalHost, Anchored, Sheet, a11y helpers
```

**Why one package rather than `@grampro/kit-native`:**
- There is one `core/` to fix bugs in.
- One passport toolchain, one version, and one `doctor`.
- `add DateTimePicker` resolves the same way on both platforms.

The boundary test gets two more rules:
- `native/` never imports `react-dom`, and `react/` never imports
  `react-native`.
- `core/` imports neither.

### 3.2 CLI

- **`add` detects the target.** It picks native when `react-native` or `expo`
  is in `package.json`, and web otherwise. `--platform native|web` overrides
  the detection.
- **Native installs copy `core/ + native/ + index.native.ts` and the passports.**
  They skip `styles.css` and the `gbs.css` barrel.
- **Instead of `gbs.css`, the first native install writes a theme file**,
  `<dest>/gbs.theme.ts`. Like `gbs.css` today, this file also marks where Kit
  was installed.
- **The install manifest, downgrade protection and edited-file detection work
  unchanged.** They are file-based, not platform-based.
- **Default destination:** `src/component-lib/` or `component-lib/`, as today.
  Expo Router projects keep `app/` for routes, so Kit must never be installed
  there.
- **`doctor` and `passport --check` work unchanged once the platform field
  exists.**

### 3.3 Styling and theming

**Tokens.** `shared/native/theme.ts` exports `lightTokens` / `darkTokens` with the same
names as the CSS tokens (`bg`, `fg`, `border`, `accent`, `accentFg`, `danger`,
`radius`, `fontSize`, …). The Figma plugin's 53 variables already map one-to-one.

**Provider.** `<KitProvider theme? colorScheme?>` follows `useColorScheme()` by
default, and the user's `gbs.theme.ts` overrides tokens. This replaces the CSS
cascade.

**Component API**, mirroring the web:

| Web | Native |
|---|---|
| `className` (root) | `style` (root) + `className` passed through for NativeWind / Uniwind |
| `classNames={{slot}}` | `styles={{slot}}` |
| `data-state="open"` etc. | a `state` object passed to `style` / `styles` callbacks, like `Pressable` |
| `theme` prop | `colorScheme` prop |

**Why not NativeWind or Uniwind as the base:**
- NativeWind v5 is still a release candidate.
- Uniwind's fast tier is paid and needs a dev build.
- Kit's web edition deliberately dropped Tailwind for plain CSS.

`StyleSheet` has no dependencies, works in Expo Go, and core RN now covers
shadows, gradients and outlines. Utility-class users still get `className`
passthrough.

### 3.4 Overlays and positioning

**Portal host.** `shared/native/KitProvider` includes a small, zero-dependency
`PortalHost`. It renders registered children last, inside a root `View`. The
user mounts `<KitProvider>` once at the app root, the same rule as
`<Toaster/>` / `<DialogHost/>` today. Toaster and DialogHost render through it
automatically.

**Anchored overlays.** `shared/native/Anchored`:
- Measures the trigger with `measureInWindow`.
- Reads the window size and safe-area insets.
- Calls the **existing** `placePopover`.

Popover, Menu, Tooltip and Combobox use it on tablets. The placement maths is
already tested.

**Sheets on phones.** `shared/native/Sheet` is a bottom sheet built on core
`Modal`, `Animated` (native driver) and `PanResponder`, with no gesture or
animation libraries. Pickers and menus switch between an anchored popover and a
sheet based on window width, so the choice is responsive, not per-platform.

**Modal and Dialog** use core `Modal` (`statusBarTranslucent`, plus
`navigationBarTranslucent` for Android edge-to-edge). `modal/core/dismiss.ts`
supplies the dismiss rules. Android back closes the topmost overlay.

**Keyboard.** Fields scroll themselves into view with a small
`KeyboardAvoiding` helper built on core `Keyboard` events. If that falls short
(spike S3), add `react-native-keyboard-controller` as an optional peer
dependency, which is what RN itself now recommends.

**Safe area.** Core `SafeAreaView` is deprecated. The provider accepts insets
from `react-native-safe-area-context` when present, and falls back to zero.

### 3.5 Component mapping

| Wave | Component | Native form |
|---|---|---|
| 1 | Button, Badge/Tag, Avatar, Card/Stat, Alert, Spinner, Progress (+Circular), Skeleton/Empty | Direct ports. Button gets `loading` instead of `useFormStatus`. |
| 1 | Switch, Checkbox (+Group), RadioGroup, Input (+OtpInput), Textarea | Direct ports with `role` / `aria-checked` / `aria-disabled`. OtpInput uses `textContentType="oneTimeCode"` / `autoComplete="sms-otp"`. |
| 2 | Modal, Dialog (+`dialog.confirm()`), Toaster (+`toast()`) | Core `Modal`, the portal host, and existing stores. Toasts swipe to dismiss and respect safe area. |
| 2 | Popover, Menu, Tooltip | `Anchored` on tablets, `Sheet` or an action list on phones. **Tooltip becomes a long-press hint**, because hover does not exist. |
| 3 | Tabs, Accordion, NumberInput | Tabs become a scrollable tab bar or segmented control. NumberInput uses `accessibilityActions` increment and decrement plus the existing `Intl` parse and format. |
| 3 | Combobox (Select / MultiSelect) | A searchable list in a `Sheet`, virtualised with `FlatList`. Reuses `useCombobox`'s filtering. |
| 3 | DatePicker (+Range, +DateTime) | A Kit calendar in a `Sheet` built on `core/calendar.ts`, so it looks the same on iOS, Android and web. An opt-in `native` mode hands off to the OS picker through an injected adapter (`@expo/ui` or the community datetimepicker). |
| 3 | FileUploader | `useFileUploader` with an **injected `pick()` adapter** (expo-document-picker / image-picker / anything) and a `fetch` transport. Kit takes no dependency on any picker. |
| 4 | DataGrid (+AskGrid) | Engine unchanged. View is a frozen-header `FlatList` with a horizontally scrolling body, plus a **card-list mode** for narrow screens. Export goes through an injected `share(file)` adapter instead of Blob download. |
| — | Breadcrumb | **Not ported.** Navigation is the router's job on mobile. |
| New | Sheet, ActionSheet, SegmentedControl, ListItem | Mobile-only patterns, built in waves 2–3 as by-products of the shared primitives. |

### 3.6 Passport

The passport stays additive. `passportVersion` changes only by a minor version.

```jsonc
"platforms": {
  "web":    { "exports": [...], "inherits": [{ "from": "HTMLAttributes<HTMLDivElement>", ... }], "states": ["data-state"] },
  "native": { "exports": [...], "inherits": [{ "from": "ViewProps", ... }],                    "states": ["state.open"] }
}
```

- The extractor builds a second TypeScript program over the `native/` files
  against `@types/react-native` (RN ships its own types).
- `identity`, `operations`, `intentDomains`, `purpose` and `examples` stay
  shared. That is the point: an agent learns a component once.
- `passport.local.json` overlays still work.

### 3.7 Agent runtime on mobile

**What ports unchanged:** the schema, the five-layer validator, coercion
(including "1 lakh"), snapshot history and undo, and the surface registry.

**Executors.** On native they are state-driven, through the
`controlled-component-adapter` pattern, rather than DOM-driven. There is no
`setNativeValue`.

**`<AgentSurface>` on native.** It registers with `GramproAIProvider` and
exposes the same `describe` / `operate` contract. In-app assistants (chat,
voice) operate fields and grids with the same guarantee as on web: the producer
proposes, the validator authorizes, the executor mutates.

**OS-level agents (later research).** iOS App Intents and Android AppFunctions
are the closest mobile equivalents to WebMCP. Both need native code, so this
would ship as a separate, optional Expo config plugin. It is never part of the
copy-in core.

### 3.8 Testing

| Layer | Web today | Native |
|---|---|---|
| Core logic | Vitest in node | **The same tests, unchanged.** Run once, covering both platforms. |
| Views | Playwright + axe | Jest + React Native Testing Library 14 (async API) in `native-playground/`. Vitest-for-RN is still beta, so do not bet on it. |
| E2E and accessibility | Playwright e2e | Maestro flows on iOS simulator and Android emulator in CI. Accessibility assertions use roles, labels and actions. |
| Boundaries | `boundaries.test.ts` | The same test with the new platform rules. |

**`native-playground/`** is a new private Expo app with Expo Router, next to
`playground/`. It renders the same example names as the docs, so one example id
means the same demo on both platforms.

**It must stay Expo Go compatible.** No custom native modules, and it pins the
SDK that the store build of Expo Go supports (Expo Go runs one SDK at a time).
On 2026-11-02 the Expo versions API listed Expo Go 58.0.5 (Android) and 58.0.7
(iOS), so the playground uses **SDK 58** (RN 0.88.1, React 19.3.0). This is what
makes iOS testing possible without a Mac (3.10).

### 3.10 Testing on iOS without a Mac

The team has Android and iOS phones and Windows machines, but no Mac. Kit
native is pure JavaScript, so building iOS apps locally is never needed. The
approach has three layers.

| Need | How | Cost |
|---|---|---|
| **Daily development on a real iPhone** | Run Metro on Windows (`npx expo start`), then open `native-playground` in **Expo Go** on the iPhone by scanning the QR code. Use `--tunnel` if the phone and PC are on different networks. Changes hot-reload. | Free. Expo Go now needs an Expo account login (since 2026-09-03). |
| **VoiceOver and real-device checks** | The same Expo Go session. VoiceOver, Dynamic Type, Reduce Motion, dark mode, keyboard and safe-area checks are all done by hand on the phone, using a per-wave checklist in `native-playground/CHECKLIST.md`. | Free. |
| **Automated iOS tests** (Maestro on the iOS simulator) | **GitHub Actions `macos-latest` runner**: build a simulator dev build in CI (`expo prebuild` + `xcodebuild`, no signing needed for the simulator) and run the Maestro flows. Runs **nightly and on release tags** because simulator runs are slow; Android Maestro (Linux emulator) and RNTL run on every push. | **Free**: `gramproindia/kit` is public and open source, and GitHub Actions minutes, macOS included, are free for public repos. |
| **Fallback for CI** | **EAS Workflows**: EAS builds the iOS simulator app in the cloud and runs Maestro there, with the test-insights dashboard (2026-06-24). | EAS free tier has a monthly build quota; paid beyond it. |
| **Later: installable iOS builds** (TestFlight, sharing with clients) | EAS Build in the cloud. Builds iOS from Windows with no Mac. | Needs an Apple Developer account (USD 99/yr). Not needed for library work. |

**Real devices over USB.**

- **Android: full USB testing from Windows.**
  - Plug in the phone with USB debugging on; `adb devices` lists it.
  - `npx expo start` → press `a` opens the playground in Expo Go on the phone.
  - `npx expo run:android` builds and installs a dev build locally; Android
    builds need only the Android SDK, no Mac.
  - Maestro flows can run against the plugged-in phone, the same flows CI runs
    on the emulator, so device-only bugs are reproducible. `maestro test`
    picks up a USB-connected device through adb.
  - **Maestro runs natively on Windows, with no WSL or Docker** (established,
    docs.maestro.dev/getting-started/installing-maestro/windows):
    1. Download `maestro.zip` from the GitHub releases.
    2. Extract it to e.g. `D:\maestro`.
    3. Add `D:\maestro\bin` to PATH.
    4. Run `maestro --help` to check.
  - Requirements: Java 17+ with `JAVA_HOME` set, and `adb` on PATH. Maestro's
    docs discourage the WSL route; the native zip is the recommended path.
  - Checked on the dev machine on 2026-11-02: Java 21 (`JAVA_HOME=D:\Java\jdk-21`)
    and adb 37.0.0 (`D:\platform-tools-latest-windows\platform-tools`) are
    present. Only Maestro itself is missing.
  - Android builds still need no WSL or Docker: Expo Go needs none, and
    `expo run:android` needs the Android SDK plus JDK 17+.
- **iOS: USB does not help without a Mac.** Installing builds on an iPhone,
  attaching a debugger and driving automation (XCUITest, Maestro on a physical
  iPhone) all need Xcode, which only runs on macOS.
  - The iPhone is used through Expo Go over Wi-Fi, or `--tunnel`, for
    development and manual VoiceOver checks.
  - Automated iOS coverage comes from the simulator on the macOS CI runner.
  - If an iPhone-hardware-only bug appears (rare for pure-JS code), a cloud
    device farm with free open-source plans, or a borrowed Mac, covers it.

**Device matrix.** For manual passes on each wave, use whatever the team has:
- the Android phone, ideally a mid-range one, for performance;
- the iPhone;
- one small-screen emulator and one tablet emulator, for the phone/tablet
  overlay switch.

What this cannot cover: debugging a crash that only happens inside Xcode. Kit
ships no native code, so that should not come up. If it does, borrow a Mac or
rent one by the hour (a cloud Mac service) rather than buying one.

**Rule that follows from this:** a Kit native component must never need a native
module to run, because then Expo Go on the iPhone can no longer test it. This
makes decision 3 (zero dependencies) a testing requirement, not just a
preference.

### 3.9 Docs and AI surfaces

**Docs site: a separate native section** (decided 2026-11-02). It stays in the
same Next app (`docs-site/`), with its own homepage and docs tree:

| URL | What |
|---|---|
| `kit.gramproindia.com/` | Existing web homepage. Gains a "Kit for React Native" button linking to `/native`. |
| `kit.gramproindia.com/native` | Native homepage with its own hero, install command (`npx @grampro/kit@native add`), and phone-frame demos. |
| `kit.gramproindia.com/native/docs/...` | Native component docs, from MDX in `docs-site/app/content/native/`. They are separate pages, not a toggle on the web pages, because props, styling (`styles` vs `classNames`) and setup (`KitProvider`) differ. |

- `.md` page variants work under `/native` as they do today.
- `llms.txt` lists both trees.
- Shared concepts (passport, agent runtime) link back to the web docs rather
  than being copied.

**Live preview in the docs** (proposed). There are three layers, cheapest and
most interactive first:

1. **Live in the page, through react-native-web.** The docs site aliases
   `react-native` → `react-native-web` for the native docs pages only. It then
   renders the **real `native/` component code**, the same files users copy,
   inside a phone-sized frame. Demos are interactive and instant like the web
   docs, with no device or service needed. `scripts/generate-demos.mjs` builds
   them from the same example files `native-playground` uses.
   - Caveat: this is a browser approximation. Shadows, fonts, haptics, the
     keyboard and the OS sheet feel are not exact. Each preview is labelled
     "web preview".
   - **This sets a rule for the components: use only RN APIs that
     react-native-web supports.** Kit already uses only core primitives (`View`,
     `Text`, `Pressable`, `TextInput`, `Modal`, `FlatList`, `Animated`,
     `PanResponder`, `measureInWindow`), so this mostly holds. A test checks
     every native file's `react-native` imports against an allowlist.
2. **Real screenshots per platform.** Maestro flows already step through each
   demo, so they also `takeScreenshot` on the Android emulator and iOS
   simulator in CI. The docs show iOS and Android tabs under each live preview,
   regenerated on every release, so they never go stale.
3. **"Open on your phone" QR code.** Publish `native-playground` with EAS Update
   (free tier) on each release. Each component page shows a QR code that opens
   that demo in Expo Go on a real iPhone or Android, via a deep link to the demo
   id.

Expo Snack embeds were considered and rejected as the main path. Kit is copied
source, not an npm runtime package, so every Snack would need all of a
component's files pushed into it. The web preview in Snack also runs on
react-native-web anyway, so layer 1 gives the same result without a third-party
iframe.

**`llms.txt`, the skill, and MCP.**
- `llms.txt` / `llms-full.txt` gain native sections.
- The `gbs-components` skill gets a `references/native.md`. Its rules: mount
  `<KitProvider>` once, use `styles` not `classNames`, inject the picker and
  share adapters.
- MCP `get_component` / `get_example` take a `platform` argument.

**shadcn compatibility (optional, later).** Also publish a shadcn-format
registry, as react-native-reusables does, so `npx shadcn add` and the shadcn MCP
work too. Kit's own CLI stays the primary installer, because it is the one that
protects user edits.

## 4. Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Spikes** (1–2 wks) | S1 Hermes `Intl` coverage (`formatToParts`, `hourCycle`, `Intl.Locale`, `NumberFormat` parts) on iOS and Android. S2 portal host plus `Anchored` with `placePopover`. S3 keyboard avoidance without dependencies. S4 `Sheet` on core `Animated` / `PanResponder`, smooth at 60fps on a mid-range Android. S5 passport extractor over `native/`. | Written results. Any spike that fails becomes a named optional peer dependency or a polyfill decision. |
| **1. Foundation** | `shared/native` (theme, `KitProvider`, `PortalHost`). CLI platform detection and native copy. Passport `platforms`. Boundary rules. `native-playground` with Jest and RNTL. DataGrid core DOM adapter extracted on the web side, with no behaviour change. | `add Button` works in a fresh Expo app and a bare RN app. Web test suite unchanged and green. |
| **2. Wave 1** | 13 display and form components | RNTL tests, Maestro smoke tests, VoiceOver and TalkBack manual pass, passports green. |
| **3. Wave 2** | Overlays: Modal, Dialog, Toaster, Popover, Menu, Tooltip, Sheet, ActionSheet | Android back, safe area, rotation and keyboard covered by Maestro. |
| **4. Wave 3** | Tabs, Accordion, NumberInput, Combobox, DatePicker, FileUploader, SegmentedControl, ListItem | Field agent executors on native; `AgentSurface` `describe` / `operate` working in the playground. |
| **5. DataGrid** | Native grid view, card mode, export through the share adapter, AskGrid | Grid eval corpus passes unchanged against the native executors. |
| **6. Release** | Docs switch, skill and MCP updates, `llms.txt`, optional shadcn registry | Previews publish as prereleases of the same package under the npm dist-tag **`native`** (e.g. `2.9.0-native.0`, installed with `npx @grampro/kit@native add Button`). `latest` stays untouched, so web users see nothing. Promote to a normal 2.x minor on `latest` after one preview cycle with no native breaking changes. |
| Later | App Intents / AppFunctions config plugin, `@expo/ui` native-picker adapters, tvOS / Vega | — |

## 4a. Phase 0 results

### S1 · Intl on Hermes: done, 2026-11-02

**Method.** `native-playground/spikes/intl/` runs Kit's **real core functions**
(date-picker, number-input, shared text, avatar) on 10 locales: en-US, en-IN,
en-GB, ml-IN, hi-IN, ta-IN, ar-EG, de-DE, fr-FR and ja-JP. It runs them on Node
(V8, ICU 76.1, the baseline) and on a phone, then compares.

**Device.** Android 16 phone, Expo Go 58.0.5, RN 0.88.1, Hermes V1, over USB
with `adb reverse`.

**Before fixes: 159 of 177 match.**

- **Present on Hermes:** `DateTimeFormat` and `NumberFormat`, both with
  `formatToParts`, `resolvedOptions().hourCycle` and `Collator`. Malayalam,
  Hindi, Tamil and Arabic locale data is there, including Arabic-Indic digits.
- **Missing on Hermes:** `Intl.Locale`, `Intl.Segmenter`, `Intl.PluralRules`
  and `Intl.RelativeTimeFormat`. Kit uses only the first two.
- **Bug: week start.** It fell back to Monday for every locale, so en-IN,
  en-US, ja-JP, ml-IN, hi-IN and ta-IN were wrong (should be Sunday), and so
  was ar-EG (should be Saturday). Firefox has the same gap (no `getWeekInfo`).
- **Bug: character count.** `"👨‍👩‍👧 é 👍🏽"` counted 11 instead of 5, which
  breaks Input and Textarea counters and Avatar initials for emoji.
- **Cosmetic:** Hermes writes U+202F (narrow no-break space) before AM/PM. It
  still parses, because `\s` covers it.

**Fixes, in the shared core, so web benefits too:**

- `date-picker/core/week.ts`, `weekStartFromTag()`: a CLDR 46 first-day table
  plus likely-region defaults for bare languages, and `-u-fw-` support.
  `resolveWeekStart` uses it when `Intl.Locale` has no week info. A test checks
  all 676 two-letter regions and 50 languages against Node's `Intl.Locale`.
- `shared/core/text.ts`, `graphemes()`: a regex approximation of extended
  grapheme clusters (ZWJ emoji, flags, tag sequences, keycaps, combining marks,
  Indic virama conjuncts per GB9c) used when `Intl.Segmenter` is missing.
  `countCharacters` and Avatar `initials` use it. A test checks 18 hard
  strings against Node's Segmenter. **`shared` is bumped to 1.6.0** (additive).

**After fixes: 177 of 187 match.** The other 10 are the 5 missing-feature
probes and the 5 U+202F display strings. Every Kit behaviour matches Node.

**Found on the way, a web bug that also happens in Node:**
`parseDateTime` cannot read back its own 12-hour output for ar-EG
(`٢٢‏/١١‏/٢٠٢٤، ٩:٠٥ م`: Arabic-Indic digits, `م`) or ja-JP
(`2024/11/22 午後9:05`: period before the time). Logged for a separate fix.

**Still to do:** run the same screen on the iPhone through Expo Go over Wi-Fi.
iOS Hermes implements `Intl` on top of Foundation rather than ICU, so the
results can differ.

## 5. Decisions (settled 2026-11-02)

1. **One package, no new npm package.** `@grampro/kit` gains `native/` folders.
   Previews ship under the npm dist-tag `native` (phase 6).
2. **`StyleSheet` + tokens with `className` passthrough.** NativeWind / Uniwind
   are not the base.
3. **Zero required dependencies.** No Reanimated or Gesture Handler. This keeps
   Expo Go, bare RN and Mac-free iOS testing working (3.10). If spike S4 shows
   sheets need them, revisit as *optional* peers only.
4. **Kit-drawn date picker by default**, with OS pickers as an opt-in adapter.
5. **Minimum versions:** RN ≥ 0.83, React ≥ 19.2, New Architecture only.

6. **Testing:** real Android and iOS phones for manual checks; Android also over
   USB with Maestro. iOS automation runs on free GitHub macOS runners, because
   the repo is public (3.10).

## 6. Risks

- **Hermes `Intl` gaps** would break DatePicker and NumberInput formatting.
  Spike S1; the fallback is a documented polyfill.
- **Sheet gesture quality without Reanimated.** Spike S4; the fallback is
  decision 3.
- **DataGrid scope.** Grids on phones are a weak pattern. The card mode is what
  makes it usable, so budget for design work, not just porting.
- **Two renderers drift apart.** Mitigation: shared passport `operations`, the
  same example ids on both platforms, and the same core tests.
- **Maestro CI cost.** Simulators are slow. Run Maestro nightly and on release,
  and run RNTL on every push.
- **No Mac in the team.** Covered by Expo Go on a real iPhone plus macOS CI
  runners (3.10). The risk becomes real only if a component ever needs native
  code, which decision 3 rules out.
- **Expo Go lags new SDKs by weeks.** Pin `native-playground` to the SDK Expo Go
  supports, not the newest one.
