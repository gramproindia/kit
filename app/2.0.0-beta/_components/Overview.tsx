import Link from "next/link";
import {
  AlignLeft,
  AppWindow,
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronsUpDown,
  Keyboard,
  LoaderCircle,
  MessageSquare,
  Milestone,
  MousePointerClick,
  Palette,
  Package,
  PanelsTopLeft,
  Sparkles,
  SquareCheck,
  Table2,
  TextCursorInput,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { getDocs, getHeadings } from "../_lib/docs";
import { v2Config } from "../_lib/config";
import { homeHref, type Locale } from "../_lib/i18n";
import { format, t } from "../_lib/strings";
import { CopyButton } from "./CopyButton";
import { FigmaIcon } from "./FigmaIcon";

const icons: Record<string, LucideIcon> = {
  datagrid: Table2,
  combobox: ChevronsUpDown,
  datepicker: CalendarDays,
  fileuploader: Upload,
  toaster: Bell,
  input: TextCursorInput,
  textarea: AlignLeft,
  dialog: MessageSquare,
  modal: AppWindow,
  button: MousePointerClick,
  checkbox: SquareCheck,
  breadcrumb: Milestone,
  tabs: PanelsTopLeft,
  spinner: LoaderCircle,
};

const highlightIcons = [Package, Palette, Keyboard];

export async function Overview({ locale }: { locale: Locale }) {
  const s = t(locale);
  const docs = await getDocs(locale);
  const migrations = await Promise.all(
    docs.map(async (doc) => {
      const heading = (await getHeadings(doc.slug, locale)).find((h) => /^(Migrating|മൈഗ്രേറ്റ്)/.test(h.title));
      return heading ? { doc, href: `${doc.href}#${heading.id}`, title: heading.title } : null;
    }),
  );
  const firstDoc = docs[0];

  return (
    <main id="v2-main">
      <section className="v2-hero">
        <div className="v2-container relative py-20 text-center sm:py-28">
          <Link href={firstDoc?.href ?? homeHref(locale)} className="v2-announce">
            <Sparkles className="size-3.5 text-(--v2-accent)" aria-hidden />
            <span>{format(s.announce, { count: docs.length, version: v2Config.version })}</span>
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {s.heroTitle} <span className="v2-gradient-text">{s.heroTitleAccent}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-pretty text-(--v2-muted) sm:text-lg">{s.heroBody}</p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {firstDoc && (
              <Link href={firstDoc.href} className="v2-btn" data-variant="primary">
                {s.browseComponents}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
            <a href={v2Config.figma} target="_blank" rel="noopener noreferrer" className="v2-btn">
              <FigmaIcon className="h-4 w-auto" />
              {s.figmaDesign}
            </a>
            <Link href={v2Config.legacyDocsHref} className="v2-btn">
              {s.view1xDocs}
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
            <p className="v2-eyebrow">{s.components}</p>
            <h2 id="components-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {s.availableInBeta}
            </h2>
          </div>
          <p className="max-w-md text-sm text-(--v2-muted)">{s.moreComing}</p>
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
                    <span className="v2-badge">{s.groups[doc.group] ?? doc.group}</span>
                  </div>
                  <h3 className="mt-5 font-semibold">{doc.title}</h3>
                  <p className="mt-1.5 text-sm text-(--v2-muted)">{doc.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-(--v2-accent)">
                    {s.readDocs}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-y border-(--v2-border) bg-(--v2-surface)" aria-label={s.highlightsLabel}>
        <div className="v2-container grid gap-10 py-16 sm:grid-cols-3">
          {s.highlights.map(({ title, body }, index) => {
            const Icon = highlightIcons[index] ?? Package;
            return (
              <div key={title}>
                <Icon className="size-5 text-(--v2-accent)" aria-hidden />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-(--v2-muted)">{body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="v2-container py-16 sm:py-20" aria-labelledby="migrate-heading">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <p className="v2-eyebrow">{s.migration}</p>
            <h2 id="migrate-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {s.comingFrom1x}
            </h2>
            <p className="mt-4 text-(--v2-muted)">{s.migrationBody}</p>
            <div className="v2-callout mt-6" data-type="warning">
              <p className="v2-callout-body">
                <strong>{s.betaLabel}</strong> {s.betaCallout}
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
