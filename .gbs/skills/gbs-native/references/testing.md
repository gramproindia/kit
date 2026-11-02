# Testing screens built with Kit (native)

## Unit and component tests: React Native Testing Library 14

RNTL 14 (React 19, RN 0.78+) is **async**: `render`, `fireEvent` and `act`
return promises and must be awaited. Jest with `jest-expo` (or
`@react-native/jest-preset`) is the standard runner.

Query by what a person perceives, which Kit sets for you: role and name.

```tsx
import { render, screen, fireEvent } from "@testing-library/react-native";
import { KitProvider } from "component-lib/shared/native";

test("sends the invoice after confirming", async () => {
  await render(
    <KitProvider>
      <NewInvoiceForm />
    </KitProvider>,
  );

  await fireEvent.changeText(screen.getByLabelText("Customer"), "Anand Remanan");
  await fireEvent.press(screen.getByRole("checkbox", { name: "I checked the GST number" }));
  await fireEvent.press(screen.getByRole("button", { name: "Send" }));

  expect(screen.getByRole("alert")).toBeTruthy(); // the amount error
});
```

- Wrap in `KitProvider` (theme and overlay host). Mount `Toaster` /
  `DialogHost` in the test tree when the code under test calls `toast()` or
  `dialog.confirm()`.
- Kit's pure logic (formatting, parsing, calendars, filtering) lives in each
  component's `core/` and can be tested without rendering.
- Animations use React Native's `Animated`; use Jest fake timers for
  timing-based behaviour (tooltip delay, debounced search).

## End-to-end: Maestro

Maestro drives a real device or emulator from YAML. Kit's roles and labels make
flows readable:

```yaml
appId: com.example.app
---
- launchApp
- tapOn: "New invoice"
- tapOn: "Customer"
- inputText: "Anand Remanan"
- tapOn: "State"
- tapOn: "Kerala"          # the Select's sheet
- tapOn: "Send"
- tapOn: "Send invoice"    # dialog.confirm's confirm button
- assertVisible: "Invoice sent"
```

Maestro's CLI runs natively on Windows, macOS and Linux (Java 17+) and drives
Android devices over USB through `adb`. iOS needs the simulator on macOS (a CI
runner works).

## On a device

- **Expo Go** runs Kit as-is (no native modules). `npx expo start`, scan the
  QR code; over USB on Android, `adb reverse tcp:8081 tcp:8081` and open
  `exp://127.0.0.1:8081`.
- Check each screen in light and dark, with the largest font size, with
  TalkBack / VoiceOver, and with Reduce Motion on.
- **iOS without a Mac**: Expo Go on an iPhone over Wi-Fi for development and
  manual checks; automated iOS tests on a macOS CI runner (free for public
  repositories); EAS Build for installable iOS builds.

## Checklist for a new screen

- Every field has a `label`; every icon-only control has an `aria-label`.
- Back (Android) closes overlays and leaves the screen as expected.
- Content clears the notch and home indicator (`KitProvider insets`).
- The keyboard does not cover the focused field (`keyboardShouldPersistTaps`,
  `automaticallyAdjustKeyboardInsets` on iOS scroll views).
- Pickers and menus work as sheets on a phone and popovers on a tablet.
