import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Signpost } from "lucide-react";
import { getDocsStructure } from "@/lib/docs";
import { getDocs } from "../../_lib/docs";
import { DEFAULT_LOCALE, docHref, homeHref } from "../../_lib/i18n";

/*
 * The 1.x docs used to live at /docs/<slug>. Rather than redirecting silently,
 * these old links land on a signpost: people arriving from an old bookmark,
 * blog post or search result can see what happened and choose the current page
 * or the archived 1.x one.
 */

export const dynamicParams = true;

/** 1.x slugs whose 2.0 equivalent has a different name. */
const RENAMED: Record<string, string> = {
  select: "combobox",
  multiselect: "combobox",
  dialogbox: "dialog",
  materialinput: "input",
  contextmenu: "menu",
  darkmode: "theming",
  doctheme: "theming",
  uploader: "fileuploader",
};

export const metadata: Metadata = {
  title: "This page has moved",
  robots: { index: false, follow: true },
};

export async function generateStaticParams() {
  const { categories, uncategorized } = await getDocsStructure();
  return [...categories.flatMap((c) => c.items), ...uncategorized].map((doc) => ({ slug: doc.slug }));
}

export default async function MovedDocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const legacy = [
    ...(await getDocsStructure()).categories.flatMap((c) => c.items),
    ...(await getDocsStructure()).uncategorized,
  ].find((doc) => doc.slug === slug);

  const currentSlug = RENAMED[slug] ?? slug;
  const current = (await getDocs(DEFAULT_LOCALE)).find((doc) => doc.slug === currentSlug);

  return (
    <main id="v2-main" className="v2-container py-20">
      <div className="mx-auto max-w-xl text-center">
        <span className="v2-card-icon mx-auto">
          <Signpost className="size-5" aria-hidden />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance">This page has moved</h1>
        <p className="mt-3 text-pretty text-(--v2-muted)">
          GramproKit 2.0 is now the current documentation and lives here, at the root of the site. The 1.x docs you
          followed a link to are still available, under <code>/1.x.x-legacy</code>.
        </p>

        <div className="mt-8 grid gap-3 text-left">
          {current && (
            <Link href={docHref(current.slug, DEFAULT_LOCALE)} className="v2-pager">
              <span className="flex items-center gap-1 text-xs text-(--v2-faint)">
                <BookOpen className="size-3.5" aria-hidden /> Current documentation (2.0)
              </span>
              <span className="flex items-center justify-between gap-3 font-medium">
                {current.title}
                <ArrowRight className="size-4 shrink-0 text-(--v2-faint)" aria-hidden />
              </span>
              {current.description && (
                <span className="mt-1 text-sm text-(--v2-muted)">{current.description}</span>
              )}
            </Link>
          )}

          {legacy && (
            <Link href={legacy.href} className="v2-pager">
              <span className="text-xs text-(--v2-faint)">Archived 1.x page</span>
              <span className="flex items-center justify-between gap-3 font-medium">
                {legacy.title}
                <ArrowRight className="size-4 shrink-0 text-(--v2-faint)" aria-hidden />
              </span>
            </Link>
          )}

          {!current && !legacy && (
            <Link href={homeHref(DEFAULT_LOCALE)} className="v2-pager">
              <span className="text-xs text-(--v2-faint)">Documentation</span>
              <span className="flex items-center justify-between gap-3 font-medium">
                Browse all components
                <ArrowRight className="size-4 shrink-0 text-(--v2-faint)" aria-hidden />
              </span>
            </Link>
          )}
        </div>

        <p className="mt-6 text-sm text-(--v2-muted)">
          <Link href={homeHref(DEFAULT_LOCALE)}>All 2.0 components</Link>
          {" · "}
          <Link href="/1.x.x-legacy/docs/getting-started">1.x documentation</Link>
        </p>
      </div>
    </main>
  );
}
