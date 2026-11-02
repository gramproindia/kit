import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Copy,
  Layers,
  MoonStar,
  PackageOpen,
  Smartphone,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { CommandTabs } from "../_components/CommandTabs";
import { PhoneFrame } from "../_components/native/PhoneFrame";
import { getNativeDocs, nativeConfig, NATIVE_BASE, NATIVE_DOCS, NATIVE_GROUPS } from "../_lib/native-docs";
import { BRAND } from "../_lib/seo";

const TITLE = "GramproKit for React Native (beta)";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: nativeConfig.description,
  alternates: { canonical: NATIVE_BASE },
  openGraph: {
    title: TITLE,
    description: nativeConfig.description,
    url: NATIVE_BASE,
    type: "website",
    images: [{ url: BRAND.ogImage, width: 1200, height: 630, alt: nativeConfig.name }],
  },
};

const highlights: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Copy,
    title: "Same API as the web Kit",
    body: "Same component names, same props, same core logic: date maths, number parsing, stores and validation are shared code, not ports.",
  },
  {
    icon: Smartphone,
    title: "Expo Go friendly",
    body: "Pure JavaScript with no native modules: runs in Expo Go, development builds and bare React Native. Try it on an iPhone without a Mac.",
  },
  {
    icon: PackageOpen,
    title: "Zero dependencies",
    body: "Copy-in source you own. No gesture, animation, SVG or styling library: core Animated, PanResponder and StyleSheet.",
  },
  {
    icon: Bot,
    title: "Agent-ready",
    body: "Component passports, an agent skill for Claude Code, Codex and Antigravity, and the same agent contracts as the web.",
  },
  {
    icon: MoonStar,
    title: "Light and dark",
    body: "The --gbs-* tokens as a theme object. Follows the device setting, with a raised surface so dark mode keeps its depth.",
  },
  {
    icon: Layers,
    title: "Mobile patterns",
    body: "AppBar, BottomNavigation, Fab and SpeedDial, SegmentedControl, ListItem, BottomSheet and SearchBar, built for touch.",
  },
];

const SHOWCASE = [
  { demo: "AppBarDemo", caption: "AppBar" },
  { demo: "InputDemo", caption: "Forms" },
  { demo: "ListItemDemo", caption: "Lists" },
];

export default async function NativeHome() {
  const docs = await getNativeDocs();
  const components = docs.filter((d) => d.kind === "component");
  const groups = NATIVE_GROUPS.filter((g) => components.some((c) => c.group === g));

  return (
    <main id="v2-main">
      <section className="v2-hero">
        <div className="v2-container relative py-20 text-center sm:py-24">
          <Link href={NATIVE_DOCS} className="v2-announce">
            <span className="v2-badge">Beta</span>
            <span>
              {components.length} components for iOS and Android, on the <code>native</code> npm tag
            </span>
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            GramproKit for <span className="v2-gradient-text">React Native</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-pretty text-(--v2-muted) sm:text-lg">
            The components you use on the web, drawn natively for iOS and Android, with the same props. Plus the
            mobile patterns a web library never needed. Copy-in source, zero dependencies, works in Expo Go.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={NATIVE_DOCS} className="v2-btn" data-variant="primary">
              Get started
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href={`${NATIVE_DOCS}/app-bar`} className="v2-btn">
              Browse components
            </Link>
            <Link href="/" className="v2-btn">
              GramproKit for the web
            </Link>
          </div>

          <div className="mx-auto mt-10 max-w-md text-left">
            <CommandTabs npm={nativeConfig.install} pnpm={nativeConfig.installPnpm} />
          </div>

          <p className="mx-auto mt-6 flex max-w-xl items-start justify-center gap-2 text-left text-sm text-(--v2-muted)">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <span>
              React Native support is in beta. APIs may change or break between prereleases (npm tag{" "}
              <code>{nativeConfig.npmTag}</code>).
            </span>
          </p>
        </div>
      </section>

      <section className="v2-container py-16 sm:py-20" aria-labelledby="showcase-heading">
        <div className="mb-10 text-center">
          <p className="v2-eyebrow">Live</p>
          <h2 id="showcase-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            The real components, running in your browser
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-(--v2-muted)">
            These phones run the native source through react-native-web. Tap, type and open sheets. A real device
            feels better still: run the playground app in Expo Go.
          </p>
        </div>
        <div className="flex flex-wrap items-start justify-center gap-10">
          {SHOWCASE.map(({ demo, caption }, i) => (
            <div key={demo} className={i > 0 ? "hidden lg:block" : undefined}>
              <PhoneFrame demo={demo} height={700} />
              <p className="mt-1 text-center text-sm font-medium">{caption}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-(--v2-border) bg-(--v2-surface)" aria-label="Highlights">
        <div className="v2-container grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="size-5 text-(--v2-accent)" aria-hidden />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-(--v2-muted)">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="v2-container py-16 sm:py-20" aria-labelledby="native-components-heading">
        <div className="mb-8">
          <p className="v2-eyebrow">Components</p>
          <h2 id="native-components-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything in the native edition
          </h2>
        </div>
        <div className="space-y-10">
          {groups.map((group) => (
            <div key={group}>
              <h3 className="mb-4 text-sm font-semibold text-(--v2-muted)">
                {group === "Mobile" ? "Mobile only" : group}
              </h3>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {components
                  .filter((c) => c.group === group)
                  .map((c) => (
                    <li key={c.slug}>
                      <Link href={c.href} className="v2-card group">
                        <h4 className="font-semibold">{c.title}</h4>
                        <p className="mt-1.5 text-sm text-(--v2-muted)">{c.description}</p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--v2-accent)">
                          Read the docs
                          <ArrowRight
                            className="size-3.5 transition-transform group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-(--v2-border)" aria-labelledby="native-cta-heading">
        <div className="v2-container py-16 text-center">
          <h2 id="native-cta-heading" className="text-2xl font-semibold tracking-tight">
            Start with one component
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-(--v2-muted)">
            Add Button to an Expo app, wrap the app in KitProvider, and the rest follows the web docs you know.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href={NATIVE_DOCS} className="v2-btn" data-variant="primary">
              Read the getting-started guide
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
