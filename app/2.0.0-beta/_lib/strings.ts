import type { Locale } from "./i18n";

/*
 * Interface text for the 2.0.0 docs, per locale. Plain data, so both server and
 * client components can import it. Page content itself lives in the MDX files.
 *
 * Adding a locale: copy the `en` block, translate the values, keep the keys.
 * Product names (GramproKit, React, Figma, ChatGPT, Claude, Markdown) and code
 * (--gbs-*, npx …) stay as they are.
 */

const en = {
  // Header
  components: "Components",
  legacyDocs: "1.x Docs",
  reportBug: "Report a bug",
  searchDocs: "Search docs…",
  searchAria: "Search documentation",
  searchPlaceholder: "Search components and sections…",
  noResultsFor: "No results for “{query}”",
  loading: "Loading…",
  openNavigation: "Open navigation",
  closeNavigation: "Close navigation",
  toggleTheme: "Toggle dark mode",
  language: "Language",
  skipToContent: "Skip to content",
  githubRepository: "GitHub repository",

  // Sidebar
  documentation: "Documentation",
  gettingStarted: "Getting started",
  overview: "Overview",
  resources: "Resources",
  legacyDocsLong: "1.x documentation",

  // Sidebar group labels, keyed by the `group` in the MDX frontmatter
  groups: {
    General: "General",
    Data: "Data",
    Inputs: "Inputs",
    Navigation: "Navigation",
    Overlays: "Overlays",
    Feedback: "Feedback",
  } as Record<string, string>,

  // Doc page
  onThisPage: "On this page",
  previous: "Previous",
  next: "Next",
  betaBadge: "Beta · Experimental",
  reactBadge: "React 19",
  noPeerDepsBadge: "No peer dependencies",
  /** {bugTracker} is replaced with a link labelled `bugTrackerLink`. */
  betaWarning:
    "Beta components are subject to change and may break your code. Use them at your own risk, and share feedback through the {bugTracker}.",
  bugTrackerLink: "bug tracker",
  untranslated: "This page has not been translated yet, so the English version is shown below.",

  // Page actions
  copyPage: "Copy page",
  copied: "Copied",
  copyPageDescription: "Copy as Markdown for LLMs",
  viewMarkdown: "View as Markdown",
  viewMarkdownDescription: "Plain text version of this page",
  openInChatGpt: "Open in ChatGPT",
  openInClaude: "Open in Claude",
  askAboutPage: "Ask questions about this page",
  morePageActions: "More page actions",
  pageActions: "Page actions",

  // Landing page
  announce: "{count} components rebuilt for {version}",
  heroTitle: "Headless components,",
  heroTitleAccent: "rebuilt from the ground up.",
  heroBody:
    "GramproKit 2.0 is a new generation of copy-in React 19 components — no peer dependencies, full keyboard support, and theming with plain CSS variables.",
  browseComponents: "Browse components",
  figmaDesign: "Figma design",
  view1xDocs: "View 1.x docs",
  availableInBeta: "Available in the beta",
  moreComing: "More components move to 2.0 as they are rebuilt. Until then, the 1.x docs stay available.",
  readDocs: "Read docs",
  highlights: [
    {
      title: "You own the code",
      body: "Each block is copied into your project with one command. There are no peer dependencies other than React.",
    },
    {
      title: "One shared theme",
      body: "Set the --gbs-* CSS variables on :root and every component follows, with per-component overrides when you need them.",
    },
    {
      title: "Keyboard first",
      body: "Every component documents its keyboard rules, and pickers render in the browser's top layer so they are never clipped.",
    },
  ],
  migration: "Migration",
  comingFrom1x: "Coming from 1.x?",
  migrationBody:
    "The 2.0 components are new implementations, not drop-in upgrades. Each page ends with a table that maps the previous API to the new one.",
  betaLabel: "Beta:",
  betaCallout: "these components are experimental and may change in ways that break your code.",
  highlightsLabel: "Highlights",

  // Generated Markdown (.md pages, llms.txt)
  mdNote: "Note",
  mdInteractiveDemo: "Interactive demo:",
  mdOpenLiveExample: "open the live example",
  mdBetaLine: "Beta (experimental; APIs may change)",
  mdSource: "Source",

  // Theming playground
  playground: "Playground",
  pgTitle: "Theming playground",
  pgIntro:
    "Change the shared --gbs-* variables and watch every component follow. Nothing is saved: copy the CSS when you like what you see, and paste it into your own :root.",
  pgReadGuide: "Read the theming guide",
  pgPresets: "Presets",
  pgPresetNames: {
    default: "Default",
    violet: "Violet",
    teal: "Teal",
    rose: "Rose",
    square: "Mono",
    custom: "Custom",
  } as Record<string, string>,
  pgScheme: "Color scheme",
  pgSchemeDark: "Preview in dark",
  pgSchemeLight: "Preview in light",
  pgSchemeHint: "Colors you set are stored as a light-dark() pair, so each scheme keeps its own value.",
  pgGroups: {
    surfaces: "Surfaces and text",
    shape: "Borders and shape",
    accent: "Accent and status",
    rows: "Grid rows",
  } as Record<string, string>,
  pgOptions: "Theme options",
  pgReset: "Reset",
  pgResetAll: "Reset everything",
  pgCopyCss: "Copy CSS",
  pgYourCss: "Your CSS",
  pgJumpTo: "Jump to a component",
  pgDocs: "Docs",
};

export type Strings = typeof en;

const ml: Strings = {
  // Header
  components: "കമ്പോണന്റുകൾ",
  legacyDocs: "1.x ഡോക്യുമെന്റേഷൻ",
  reportBug: "ബഗ് അറിയിക്കുക",
  searchDocs: "തിരയുക…",
  searchAria: "ഡോക്യുമെന്റേഷനിൽ തിരയുക",
  searchPlaceholder: "കമ്പോണന്റുകളും വിഭാഗങ്ങളും തിരയുക…",
  noResultsFor: "“{query}” എന്നതിന് ഫലങ്ങളൊന്നുമില്ല",
  loading: "ലോഡ് ചെയ്യുന്നു…",
  openNavigation: "നാവിഗേഷൻ തുറക്കുക",
  closeNavigation: "നാവിഗേഷൻ അടയ്ക്കുക",
  toggleTheme: "ഡാർക്ക് മോഡ് മാറ്റുക",
  language: "ഭാഷ",
  skipToContent: "ഉള്ളടക്കത്തിലേക്ക് പോകുക",
  githubRepository: "GitHub റിപ്പോസിറ്ററി",

  // Sidebar
  documentation: "ഡോക്യുമെന്റേഷൻ",
  gettingStarted: "തുടങ്ങാം",
  overview: "അവലോകനം",
  resources: "മറ്റു വിഭവങ്ങൾ",
  legacyDocsLong: "1.x ഡോക്യുമെന്റേഷൻ",

  groups: {
    General: "പൊതുവായവ",
    Data: "ഡാറ്റ",
    Inputs: "ഇൻപുട്ടുകൾ",
    Navigation: "നാവിഗേഷൻ",
    Overlays: "ഓവർലേകൾ",
    Feedback: "ഫീഡ്‌ബാക്ക്",
  },

  // Doc page
  onThisPage: "ഈ പേജിൽ",
  previous: "മുമ്പത്തേത്",
  next: "അടുത്തത്",
  betaBadge: "ബീറ്റ · പരീക്ഷണാത്മകം",
  reactBadge: "React 19",
  noPeerDepsBadge: "പിയർ ഡിപൻഡൻസികളില്ല",
  betaWarning:
    "ബീറ്റ കമ്പോണന്റുകൾ മാറാൻ സാധ്യതയുണ്ട്; അവ നിങ്ങളുടെ കോഡ് തകരാറിലാക്കിയേക്കാം. സ്വന്തം ഉത്തരവാദിത്തത്തിൽ ഉപയോഗിക്കുക, {bugTracker} വഴി അഭിപ്രായം അറിയിക്കുക.",
  bugTrackerLink: "ബഗ് ട്രാക്കർ",
  untranslated: "ഈ പേജ് ഇതുവരെ വിവർത്തനം ചെയ്തിട്ടില്ല, അതിനാൽ ഇംഗ്ലീഷ് പതിപ്പാണ് താഴെ കാണിക്കുന്നത്.",

  // Page actions
  copyPage: "പേജ് പകർത്തുക",
  copied: "പകർത്തി",
  copyPageDescription: "LLM-കൾക്കായി Markdown ആയി പകർത്തുക",
  viewMarkdown: "Markdown ആയി കാണുക",
  viewMarkdownDescription: "ഈ പേജിന്റെ പ്ലെയിൻ ടെക്സ്റ്റ് പതിപ്പ്",
  openInChatGpt: "ChatGPT-യിൽ തുറക്കുക",
  openInClaude: "Claude-ൽ തുറക്കുക",
  askAboutPage: "ഈ പേജിനെക്കുറിച്ച് ചോദിക്കുക",
  morePageActions: "കൂടുതൽ പേജ് പ്രവർത്തനങ്ങൾ",
  pageActions: "പേജ് പ്രവർത്തനങ്ങൾ",

  // Landing page
  announce: "{version}-നായി പുനർനിർമിച്ച {count} കമ്പോണന്റുകൾ",
  heroTitle: "ഹെഡ്‌ലെസ് കമ്പോണന്റുകൾ,",
  heroTitleAccent: "അടിമുടി പുനർനിർമിച്ചത്.",
  heroBody:
    "React 19-നായി പുതുതായി എഴുതിയ കോപ്പി-ഇൻ കമ്പോണന്റുകളാണ് GramproKit 2.0 — പിയർ ഡിപൻഡൻസികളില്ല, പൂർണമായ കീബോർഡ് പിന്തുണ, സാധാരണ CSS വേരിയബിളുകൾ വഴിയുള്ള തീമിങ്.",
  browseComponents: "കമ്പോണന്റുകൾ കാണുക",
  figmaDesign: "Figma ഡിസൈൻ",
  view1xDocs: "1.x ഡോക്യുമെന്റേഷൻ കാണുക",
  availableInBeta: "ബീറ്റയിൽ ലഭ്യമായവ",
  moreComing:
    "പുനർനിർമിക്കുന്ന മുറയ്ക്ക് കൂടുതൽ കമ്പോണന്റുകൾ 2.0-ലേക്ക് എത്തും. അതുവരെ 1.x ഡോക്യുമെന്റേഷൻ ലഭ്യമായിരിക്കും.",
  readDocs: "ഡോക്യുമെന്റേഷൻ വായിക്കുക",
  highlights: [
    {
      title: "കോഡ് നിങ്ങളുടേത്",
      body: "ഓരോ ബ്ലോക്കും ഒരൊറ്റ കമാൻഡിൽ നിങ്ങളുടെ പ്രോജക്ടിലേക്ക് പകർത്തുന്നു. React അല്ലാതെ മറ്റ് പിയർ ഡിപൻഡൻസികളില്ല.",
    },
    {
      title: "എല്ലാത്തിനും ഒരേ തീം",
      body: ":root-ൽ --gbs-* CSS വേരിയബിളുകൾ നൽകിയാൽ എല്ലാ കമ്പോണന്റുകളും അത് പിന്തുടരും; വേണമെങ്കിൽ ഓരോ കമ്പോണന്റിനും വെവ്വേറെ മാറ്റാം.",
    },
    {
      title: "കീബോർഡിന് മുൻഗണന",
      body: "ഓരോ കമ്പോണന്റിന്റെയും കീബോർഡ് നിയമങ്ങൾ ഡോക്യുമെന്റ് ചെയ്തിട്ടുണ്ട്. പിക്കറുകൾ ബ്രൗസറിന്റെ ടോപ് ലെയറിൽ വരുന്നതിനാൽ അവ ഒരിക്കലും മുറിഞ്ഞുപോകില്ല.",
    },
  ],
  migration: "മൈഗ്രേഷൻ",
  comingFrom1x: "1.x-ൽ നിന്ന് വരുകയാണോ?",
  migrationBody:
    "2.0 കമ്പോണന്റുകൾ പുതുതായി എഴുതിയവയാണ്, നേരിട്ട് പകരം വയ്ക്കാവുന്ന അപ്ഗ്രേഡുകളല്ല. ഓരോ പേജിന്റെയും അവസാനം പഴയ API-യും പുതിയതും തമ്മിൽ ബന്ധിപ്പിക്കുന്ന പട്ടികയുണ്ട്.",
  betaLabel: "ബീറ്റ:",
  betaCallout: "ഈ കമ്പോണന്റുകൾ പരീക്ഷണാത്മകമാണ്; നിങ്ങളുടെ കോഡ് തകരാറിലാക്കുന്ന വിധത്തിൽ അവ മാറിയേക്കാം.",
  highlightsLabel: "പ്രധാന സവിശേഷതകൾ",

  // Generated Markdown (.md pages, llms.txt)
  mdNote: "ശ്രദ്ധിക്കുക",
  mdInteractiveDemo: "ഇന്ററാക്ടീവ് ഡെമോ:",
  mdOpenLiveExample: "തത്സമയ ഉദാഹരണം കാണുക",
  mdBetaLine: "ബീറ്റ (പരീക്ഷണാത്മകം; API-കൾ മാറാം)",
  mdSource: "ഉറവിടം",

  // Theming playground
  playground: "പ്ലേഗ്രൗണ്ട്",
  pgTitle: "തീമിങ് പ്ലേഗ്രൗണ്ട്",
  pgIntro:
    "പൊതുവായ --gbs-* വേരിയബിളുകൾ മാറ്റി എല്ലാ കമ്പോണന്റുകളിലും അത് പ്രതിഫലിക്കുന്നത് കാണുക. ഇവിടെ ഒന്നും സേവ് ചെയ്യുന്നില്ല; ഇഷ്ടപ്പെട്ടാൽ CSS പകർത്തി നിങ്ങളുടെ :root-ൽ ചേർക്കുക.",
  pgReadGuide: "തീമിങ് ഗൈഡ് വായിക്കുക",
  pgPresets: "പ്രീസെറ്റുകൾ",
  pgPresetNames: {
    default: "ഡിഫോൾട്ട്",
    violet: "വയലറ്റ്",
    teal: "ടീൽ",
    rose: "റോസ്",
    square: "മോണോ",
    custom: "ഇഷ്ടാനുസൃതം",
  },
  pgScheme: "കളർ സ്കീം",
  pgSchemeDark: "ഡാർക്കിൽ കാണുക",
  pgSchemeLight: "ലൈറ്റിൽ കാണുക",
  pgSchemeHint: "നിങ്ങൾ നൽകുന്ന നിറങ്ങൾ light-dark() ജോഡിയായി സൂക്ഷിക്കുന്നു, അതിനാൽ ഓരോ സ്കീമിനും അതിന്റേതായ നിറം ഉണ്ടാകും.",
  pgGroups: {
    surfaces: "പ്രതലങ്ങളും ടെക്സ്റ്റും",
    shape: "ബോർഡറും ആകൃതിയും",
    accent: "ആക്സന്റും സ്റ്റാറ്റസും",
    rows: "ഗ്രിഡ് വരികൾ",
  },
  pgOptions: "തീം ഓപ്ഷനുകൾ",
  pgReset: "പുനഃക്രമീകരിക്കുക",
  pgResetAll: "എല്ലാം പുനഃക്രമീകരിക്കുക",
  pgCopyCss: "CSS പകർത്തുക",
  pgYourCss: "നിങ്ങളുടെ CSS",
  pgJumpTo: "ഒരു കമ്പോണന്റിലേക്ക് പോകുക",
  pgDocs: "ഡോക്യുമെന്റേഷൻ",
};

const dictionaries: Record<Locale, Strings> = { en, ml };

export function t(locale: Locale): Strings {
  return dictionaries[locale] ?? en;
}

/** Fills {name} placeholders: format(s.announce, { count: 20, version: "2.0.0-beta" }) */
export function format(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}

/** Splits a template on one {name} placeholder, for text with a link in the middle. */
export function splitAround(template: string, key: string): [string, string] {
  const [before = "", after = ""] = template.split(`{${key}}`);
  return [before, after];
}

export function groupLabel(locale: Locale, group: string) {
  return t(locale).groups[group] ?? group;
}
