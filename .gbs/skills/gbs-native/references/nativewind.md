# NativeWind and Uniwind with Kit (beta)

Kit's native components take `style` / `styles={{ slot }}`, not `className`.
In an app that uses Tailwind, adapt them in the app, never in Kit's folder.
The full guide: https://kit.gramproindia.com/native/docs/nativewind

These findings come from a spike on Expo SDK 58 with NativeWind 4.2.7 and
Uniwind 1.13.1. Nothing has been run on a phone: confirm key screens on a
device. NativeWind 5 is untested.

## NativeWind 4

- **Always exclude Kit's folder from NativeWind's JSX runtime.** NativeWind's
  runtime swaps `Pressable` (and every registered component) for an interop
  that drops `Pressable` style functions on iOS and Android. Kit uses them, so
  a Kit Button renders unstyled. Tested on NativeWind's native runtime.
  `nativewind/babel` adds its own JSX transform, so invert the Babel config:
  React's runtime by default, NativeWind's presets in an override that
  excludes Kit's folder. Use a function pattern, because Metro loads the
  config without a filename:

  ```js
  module.exports = function (api) {
    api.cache(true);
    return {
      presets: ["babel-preset-expo"],
      overrides: [{
        exclude: (filename) => !!filename && /[\\/]components[\\/]kit[\\/]/.test(filename),
        presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
      }],
    };
  };
  ```

- **Register Kit components in app code** with
  `cssInterop(Button, { className: "style" })`, re-exported as
  `Button as ComponentType<ButtonProps & { className?: string }>`.
- **On iOS/Android, `className` overrides Kit's values,** fill, padding and
  radius included (tested). NativeWind's native rem is 14 (`px-8` = 28).
- **On the web, Kit's computed values win:** fill, border colour, height,
  horizontal padding, label colour. Radius, margin, letter-spacing and a
  Card's background and padding do apply (measured).
- With TypeScript 6, add `declare module "*.css";` next to
  `/// <reference types="nativewind/types" />`.

## Uniwind

- **No Babel changes and no workaround for Kit:** Uniwind's `Pressable` calls
  function styles itself (source).
- **Register with `withUniwind(Button)`.** If you pass mapping options, also
  add `style: { fromClassName: "className" }`; options turn off the automatic
  `className` mapping (source).
- **On iOS/Android, `className` should override Kit's values** (source, not
  run). On the web, Kit's values win, radius included; margin, Card padding
  and letter-spacing apply (measured).

## Both

- **Slots need a flat prop.** Wrap the component with a `labelStyle` prop
  that feeds `styles.label`, and map `labelClassName` to it. NativeWind's
  dotted target `"styles.label"` does not work (tested). The adapter works on
  native (tested, NativeWind) and on the web (measured).
- **Never combine `className` with a function `style`** on one Kit
  component: the function is dropped (tested on NativeWind, source on
  Uniwind).
- **One palette.** Point Tailwind colours at CSS variables and fill them from
  `useKitTheme().tokens`: NativeWind with `vars()` in a View, Uniwind with
  `<ScopedVariables>` over `@theme` colours (`--color-kit-accent`). Verified
  in light and dark.
- **Keep the schemes in step.** If `KitProvider colorScheme` is forced, set
  the Tailwind tool's scheme to match, so `dark:` agrees with Kit.
