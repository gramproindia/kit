import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Languages } from "lucide-react";
import { getDocs, getNav } from "../_lib/docs";
import { renderDoc } from "../_lib/render";
import { markdownHref } from "../_lib/markdown";
import { v2Config } from "../_lib/config";
import {
  DEFAULT_LOCALE,
  docHref,
  homeHref,
  isLocale,
  sectionHref,
  LOCALE_CODES,
  localeInfo,
  type Locale,
} from "../_lib/i18n";
import { splitAround, t } from "../_lib/strings";
import { TableOfContents } from "../_components/TableOfContents";
import { PageActions } from "../_components/PageActions";
import { SidebarNav } from "../_components/SidebarNav";
import { Overview } from "../_components/Overview";
import { Playground } from "../_components/playground/Playground";

/** Pages that are not docs: no sidebar entry, reachable from the header. */
const PLAYGROUND = "playground";

export const dynamicParams = false;

/** "/2.0.0-beta/button" -> en + button; "/2.0.0-beta/ml/button" -> ml + button. */
function resolve(segments: string[]): { locale: Locale; slug: string | null } {
  const [first, ...rest] = segments;
  if (first && isLocale(first) && first !== DEFAULT_LOCALE) {
    return { locale: first, slug: rest[0] ?? null };
  }
  return { locale: DEFAULT_LOCALE, slug: first ?? null };
}

export async function generateStaticParams() {
  const docs = await getDocs(DEFAULT_LOCALE);
  const params: { slug: string[] }[] = [];
  for (const locale of LOCALE_CODES) {
    // Each non-default locale also gets its own landing page, e.g. /2.0.0-beta/ml.
    if (locale !== DEFAULT_LOCALE) params.push({ slug: [locale] });
    params.push({ slug: locale === DEFAULT_LOCALE ? [PLAYGROUND] : [locale, PLAYGROUND] });
    for (const doc of docs) {
      params.push({ slug: locale === DEFAULT_LOCALE ? [doc.slug] : [locale, doc.slug] });
    }
  }
  return params;
}

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = resolve((await params).slug);
  const languages = Object.fromEntries(
    LOCALE_CODES.map((code) => [code, slug ? sectionHref(slug, code) : homeHref(code)]),
  );

  if (!slug) {
    return {
      title: { absolute: `${v2Config.name} ${v2Config.version} Docs` },
      alternates: { canonical: homeHref(locale), languages },
    };
  }

  if (slug === PLAYGROUND) {
    const s = t(locale);
    return {
      title: s.pgTitle,
      description: s.pgIntro,
      alternates: { canonical: sectionHref(PLAYGROUND, locale), languages },
    };
  }

  const doc = (await getDocs(locale)).find((d) => d.slug === slug);
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical: doc.href,
      languages,
      types: { "text/markdown": markdownHref(doc) },
    },
    openGraph: {
      title: `${doc.title} | ${v2Config.name} ${v2Config.version}`,
      description: doc.description,
      type: "article",
      url: doc.href,
      locale: localeInfo(locale).htmlLang,
    },
  };
}

export default async function DocPage({ params }: Props) {
  const { locale, slug } = resolve((await params).slug);
  if (!slug) return <Overview locale={locale} />;
  if (slug === PLAYGROUND) return <Playground locale={locale} />;

  const s = t(locale);
  const nav = await getNav(locale);
  // Previous/next follow the sidebar: grouped, then by `order` inside a group.
  // Walking the flat `order` list instead would jump between groups, because
  // new pages are numbered in the order they are written, not by group.
  // Sub-pages live under their parent in the sidebar, so flatten through them:
  // a chapter is a real page, and previous/next should walk into it rather than
  // skipping the chapters to the next component.
  const docs = nav.flatMap((group) =>
    group.items.flatMap((item) => [item, ...item.children]),
  );
  const index = docs.findIndex((d) => d.slug === slug);
  const rendered = index === -1 ? null : await renderDoc(slug, locale);
  if (!rendered) notFound();

  const doc = docs[index];
  const prev = docs[index - 1];
  const next = docs[index + 1];
  const { content, toc, translated } = rendered;
  const [feedbackBefore, feedbackAfter] = splitAround(s.feedbackNote, "bugTracker");
  const lang = localeInfo(locale).htmlLang;

  return (
    <div className="v2-container md:grid md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-10 xl:grid-cols-[13.5rem_minmax(0,1fr)_13rem] xl:gap-12">
      <aside className="hidden md:block" lang={lang}>
        <div className="v2-sidebar">
          <SidebarNav nav={nav} locale={locale} />
        </div>
      </aside>

      <main id="v2-main" className="min-w-0 pt-8 pb-20 md:pt-10" lang={lang}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px] text-(--v2-faint)">
            <Link href={homeHref(locale)} className="hover:text-(--v2-fg)">
              {v2Config.version}
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span>{s.groups[doc.group] ?? doc.group}</span>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-(--v2-fg)" aria-current="page">
              {doc.title}
            </span>
          </nav>
          <PageActions title={doc.title} markdownPath={markdownHref(doc)} locale={locale} />
        </div>

        <header className="mb-10 border-b border-(--v2-border) pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="v2-badge">{s.reactBadge}</span>
            <span className="v2-badge">{s.noPeerDepsBadge}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{doc.title}</h1>
          {doc.description && (
            <p className="mt-3 max-w-2xl text-base text-pretty text-(--v2-muted) sm:text-lg">{doc.description}</p>
          )}
          <p className="mt-5 text-sm text-(--v2-muted)">
            {feedbackBefore}
            <Link href={v2Config.bugReportHref}>{s.bugTrackerLink}</Link>
            {feedbackAfter}
          </p>
        </header>

        {!translated && (
          <div className="v2-callout mb-8" data-type="info">
            <Languages className="v2-callout-icon" aria-hidden />
            <div className="v2-callout-body">{s.untranslated}</div>
          </div>
        )}

        {toc.length > 0 && (
          <details className="v2-toc-mobile xl:hidden">
            <summary>{s.onThisPage}</summary>
            <TableOfContents items={toc} title={s.onThisPage} />
          </details>
        )}

        {/* Untranslated pages fall back to the English body. */}
        <article className="v2-prose" lang={translated ? lang : "en"}>
          {content}
        </article>

        <nav aria-label="Pagination" className="mt-16 grid gap-3 sm:grid-cols-2">
          <Link href={prev ? prev.href : homeHref(locale)} className="v2-pager">
            <span className="flex items-center gap-1 text-xs text-(--v2-faint)">
              <ArrowLeft className="size-3.5" aria-hidden /> {s.previous}
            </span>
            <span className="font-medium">{prev ? prev.title : s.overview}</span>
          </Link>
          {next && (
            <Link href={next.href} className="v2-pager sm:col-start-2 sm:text-right">
              <span className="flex items-center gap-1 text-xs text-(--v2-faint) sm:justify-end">
                {s.next} <ArrowRight className="size-3.5" aria-hidden />
              </span>
              <span className="font-medium">{next.title}</span>
            </Link>
          )}
        </nav>
      </main>

      <aside className="hidden xl:block" lang={lang}>
        <div className="v2-toc-rail">{toc.length > 0 && <TableOfContents items={toc} title={s.onThisPage} />}</div>
      </aside>
    </div>
  );
}
