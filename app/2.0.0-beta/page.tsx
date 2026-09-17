import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronsUpDown,
  Keyboard,
  Palette,
  Package,
  Sparkles,
  Table2,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { getDocs, getHeadings } from "./_lib/docs";
import { V2_BASE, v2Config } from "./_lib/config";
import { CopyButton } from "./_components/CopyButton";

export const metadata: Metadata = {
  title: { absolute: `${v2Config.name} ${v2Config.version} Docs` },
  alternates: { canonical: V2_BASE },
};

const icons: Record<string, LucideIcon> = {
  datagrid: Table2,
  combobox: ChevronsUpDown,
  datepicker: CalendarDays,
  fileuploader: Upload,
  toaster: Bell,
};

const highlights = [
  {
    icon: Package,
    title: "You own the code",
    body: "Each block is copied into your project with one command. There are no peer dependencies other than React.",
  },
  {
    icon: Palette,
    title: "One shared theme",
    body: "Set the --dg-* CSS variables on :root and every component follows. Without them, each falls back to the same palette.",
  },
  {
    icon: Keyboard,
    title: "Keyboard first",
    body: "Every component documents its keyboard rules, and pickers render in the browser's top layer so they are never clipped.",
  },
];

export default async function Overview() {
  const docs = await getDocs();
  const migrations = await Promise.all(
    docs.map(async (doc) => {
      const heading = (await getHeadings(doc.slug)).find((h) => h.title.startsWith("Migrating"));
      return heading ? { doc, href: `${doc.href}#${heading.id}`, title: heading.title } : null;
    }),
  );
  const firstDoc = docs[0];

  return (
    <main id="v2-main">
      <section className="v2-hero">
        <div className="v2-container relative py-20 text-center sm:py-28">
          <Link href={firstDoc?.href ?? V2_BASE} className="v2-announce">
            <Sparkles className="size-3.5 text-(--v2-accent)" aria-hidden />
            <span>
              {docs.length} components rebuilt for {v2Config.version}
            </span>
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Headless components, <span className="v2-gradient-text">rebuilt from the ground up.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-pretty text-(--v2-muted) sm:text-lg">
            GramproKit 2.0 is a new generation of copy-in React 19 components — no peer dependencies, full keyboard
            support, and theming with plain CSS variables.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {firstDoc && (
              <Link href={firstDoc.href} className="v2-btn" data-variant="primary">
                Browse components
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
            <Link href={v2Config.legacyDocsHref} className="v2-btn">
              View 1.x docs
            </Link>
          </div>

          <div className="v2-code v2-install mx-auto mt-10 max-w-md text-left">
            <div className="v2-code-bar">
              <span>terminal</span>
              <CopyButton />
            </div>
            <pre>
              <code>
                <span className="text-(--v2-faint)">$ </span>npx gbs-add-block@latest -a DataGrid -beta
              </code>
            </pre>
          </div>
        </div>
      </section>

      <section className="v2-container py-16 sm:py-20" aria-labelledby="components-heading">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="v2-eyebrow">Components</p>
            <h2 id="components-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Available in the beta
            </h2>
          </div>
          <p className="max-w-md text-sm text-(--v2-muted)">
            More components move to 2.0 as they are rebuilt. Until then, the 1.x docs stay available.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => {
            const Icon = icons[doc.slug] ?? Package;
            return (
              <li key={doc.slug}>
                <Link href={doc.href} className="v2-card group">
                  <div className="flex items-center justify-between">
                    <span className="v2-card-icon">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="v2-badge">{doc.group}</span>
                  </div>
                  <h3 className="mt-5 font-semibold">{doc.title}</h3>
                  <p className="mt-1.5 text-sm text-(--v2-muted)">{doc.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-(--v2-accent)">
                    Read docs
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-y border-(--v2-border) bg-(--v2-surface)" aria-label="Highlights">
        <div className="v2-container grid gap-10 py-16 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="size-5 text-(--v2-accent)" aria-hidden />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-(--v2-muted)">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="v2-container py-16 sm:py-20" aria-labelledby="migrate-heading">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <p className="v2-eyebrow">Migration</p>
            <h2 id="migrate-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Coming from 1.x?
            </h2>
            <p className="mt-4 text-(--v2-muted)">
              The 2.0 components are new implementations, not drop-in upgrades. Each page ends with a table that maps
              the previous API to the new one.
            </p>
            <div className="v2-callout mt-6" data-type="warning">
              <p className="v2-callout-body">
                <strong>Beta:</strong> these components are experimental and may change in ways that break your code.
              </p>
            </div>
          </div>

          <ul className="divide-y divide-(--v2-border) overflow-hidden rounded-xl border border-(--v2-border)">
            {migrations.map(
              (m) =>
                m && (
                  <li key={m.href}>
                    <Link href={m.href} className="v2-row group">
                      <span className="min-w-0">
                        <span className="block font-medium">{m.doc.title}</span>
                        <span className="block truncate text-sm text-(--v2-muted)">{m.title}</span>
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0 text-(--v2-faint) transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ),
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}
