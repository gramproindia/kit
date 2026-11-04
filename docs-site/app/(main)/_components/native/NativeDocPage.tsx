import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Globe, TriangleAlert } from "lucide-react";
import { getNativeDocs, getNativeNav, nativeConfig, readNativeSource, NATIVE_BASE } from "../../_lib/native-docs";
import { compileSource } from "../../_lib/render";
import { markdownHref } from "../../_lib/markdown";
import { BRAND, articleGraph } from "../../_lib/seo";
import { v2Config } from "../../_lib/config";
import { JsonLd } from "../JsonLd";
import { webTwinOf } from "../../_lib/native-components";
import { TableOfContents } from "../TableOfContents";
import { PageActions } from "../PageActions";
import { NativeSidebarNav } from "./NativeSidebarNav";
import { SidebarScroll } from "../SidebarScroll";

const pageTitle = (title: string) => `${title} | ${v2Config.name}`;

/** Say "React Native" in every description, for searches that do. */
const nativeDescription = (description: string, component: boolean) =>
  /react native/i.test(description)
    ? description
    : `${description} ${component ? "A React Native component for iOS and Android" : "React Native (iOS and Android)"}, from ${v2Config.name} (beta).`;

/** Metadata for one /native/docs page. */
export async function nativeMetadata(slug: string): Promise<Metadata> {
  const doc = (await getNativeDocs()).find((d) => d.slug === slug);
  if (!doc) return {};
  const component = doc.kind === "component";
  const title = pageTitle(component ? `${doc.title} for React Native (iOS & Android)` : `${doc.title} · React Native`);
  const description = nativeDescription(doc.description, component);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: doc.href, types: { "text/markdown": markdownHref(doc) } },
    openGraph: {
      title,
      description,
      type: "article",
      url: doc.href,
      locale: "en",
      siteName: `${v2Config.name} Docs`,
      images: [{ url: BRAND.ogImage, width: 1200, height: 630, alt: nativeConfig.name }],
    },
  };
}

/** The beta notice on every native page. */
export function NativeBetaBanner() {
  return (
    <div
      role="note"
      className="mb-8 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <p className="m-0">
        <strong>Beta.</strong> React Native support is in beta. APIs may change or break between prereleases (npm tag{" "}
        <code>{nativeConfig.npmTag}</code>).
      </p>
    </div>
  );
}

/**
 * One /native/docs page: the component docs' layout (sidebar, article,
 * contents rail, previous/next) with the native section's own navigation.
 */
export async function NativeDocPage({ slug }: { slug: string }) {
  const [docs, nav, source] = await Promise.all([getNativeDocs(), getNativeNav(), readNativeSource(slug)]);
  const index = docs.findIndex((d) => d.slug === slug);
  if (index === -1 || !source) notFound();

  const doc = docs[index];
  const prev = docs[index - 1];
  const next = docs[index + 1];
  const { content, toc } = await compileSource(source);
  const web = webTwinOf(slug);

  return (
    <div className="v2-container md:grid md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-10 xl:grid-cols-[13.5rem_minmax(0,1fr)_13rem] xl:gap-12">
      <JsonLd
        data={articleGraph({
          title: `${doc.title} for React Native`,
          description: doc.description,
          href: doc.href,
          locale: "en",
          related: web ?? undefined,
        })}
      />
      {/* Hoisted into <head> by React 19: the same component on the web. */}
      {web && <link rel="alternate" href={web} title={`${doc.title} for React (web)`} />}
      <aside className="hidden md:block">
        <SidebarScroll section="native">
          <NativeSidebarNav nav={nav} />
        </SidebarScroll>
      </aside>

      <main id="v2-main" className="min-w-0 pt-8 pb-20 md:pt-10" lang="en">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px] text-(--v2-faint)">
            <Link href={NATIVE_BASE} className="hover:text-(--v2-fg)">
              React Native
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span>{doc.group}</span>
            {slug !== "index" && (
              <>
                <ChevronRight className="size-3.5" aria-hidden />
                <span className="text-(--v2-fg)" aria-current="page">
                  {doc.title}
                </span>
              </>
            )}
          </nav>
          <PageActions title={doc.title} markdownPath={markdownHref(doc)} />
        </div>

        <header className="mb-8 border-b border-(--v2-border) pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="v2-badge">React Native</span>
            <span className="v2-badge">Beta</span>
            {doc.group === "Mobile" && <span className="v2-badge">Mobile only</span>}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{doc.title}</h1>
          {doc.description && (
            <p className="mt-3 max-w-2xl text-base text-pretty text-(--v2-muted) sm:text-lg">{doc.description}</p>
          )}
          {web && (
            <p className="mt-4 text-sm">
              <Link href={web} className="inline-flex items-center gap-1.5 font-medium text-(--v2-accent)">
                <Globe className="size-4" aria-hidden />
                {doc.title} for React on the web
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </p>
          )}
        </header>

        <NativeBetaBanner />

        {toc.length > 0 && (
          <details className="v2-toc-mobile xl:hidden">
            <summary>On this page</summary>
            <TableOfContents items={toc} title="On this page" />
          </details>
        )}

        <article className="v2-prose">{content}</article>

        <nav aria-label="Pagination" className="mt-16 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link href={prev.href} className="v2-pager">
              <span className="flex items-center gap-1 text-xs text-(--v2-faint)">
                <ArrowLeft className="size-3.5" aria-hidden /> Previous
              </span>
              <span className="font-medium">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={next.href} className="v2-pager sm:col-start-2 sm:text-right">
              <span className="flex items-center gap-1 text-xs text-(--v2-faint) sm:justify-end">
                Next <ArrowRight className="size-3.5" aria-hidden />
              </span>
              <span className="font-medium">{next.title}</span>
            </Link>
          )}
        </nav>
      </main>

      <aside className="hidden xl:block">
        <div className="v2-toc-rail">{toc.length > 0 && <TableOfContents items={toc} title="On this page" />}</div>
      </aside>
    </div>
  );
}
