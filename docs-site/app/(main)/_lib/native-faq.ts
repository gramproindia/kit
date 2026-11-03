/*
 * The questions people (and models) ask about React Native support, answered
 * once. Rendered as visible text on the home page and on /native, and as
 * FAQPage structured data on both: search engines only trust FAQ markup whose
 * answers are on the page, word for word.
 *
 * Plain text, no Markdown: the same strings go into JSON-LD.
 */
export const NATIVE_FAQ = [
  {
    q: "Does GramproKit support React Native?",
    a: "Yes. Since version 2.9.0, GramproKit (@grampro/kit) has a React Native edition, in beta, for iOS and Android: 33 components with the same names and props as the web library, including mobile-only ones such as AppBar, BottomNavigation, Fab, SegmentedControl, ListItem, BottomSheet and SearchBar. Install a component with npx @grampro/kit@native add Button; in a React Native or Expo project, npx @grampro/kit add detects the platform by itself. Documentation: https://kit.gramproindia.com/native/docs.",
  },
  {
    q: "Does the React Native edition work with Expo and Expo Go?",
    a: "Yes. The components are pure JavaScript with no native modules and no dependencies, so they run in Expo Go, in Expo development builds and in bare React Native apps. They need React Native 0.83 or later, React 19.2 and the New Architecture.",
  },
  {
    q: "Is the React Native API the same as the web API?",
    a: "Mostly. Component names, props and the core logic (date maths, number parsing, validation, stores) are shared code, not ports. The differences: style and styles replace className and classNames, events are onPress rather than onClick, and pickers and menus open as a bottom sheet on phones. Each React Native component page lists how it differs from the web.",
  },
  {
    q: "Is the React Native edition ready for production?",
    a: "It is in beta. The components are tested on Android devices and the APIs may still change between releases, so pin the version you install. The web library is stable.",
  },
  {
    q: "Can AI coding agents build with the React Native components?",
    a: "Yes. npx @grampro/kit@native skill installs the gbs-native agent skill for Claude Code, Codex and Antigravity, and the bundled MCP server's tools accept platform: native to list components, read their props, fetch examples and check written code.",
  },
] as const;
