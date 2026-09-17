import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, FlaskConical } from "lucide-react";
import { getDocs } from "../../_lib/docs";
import { renderDoc } from "../../_lib/render";
import { V2_BASE, v2Config } from "../../_lib/config";
import { TableOfContents } from "../../_components/TableOfContents";
import { PageActions } from "../../_components/PageActions";
import { markdownHref } from "../../_lib/markdown";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getDocs()).map((doc) => ({ slug: doc.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = (await getDocs()).find((d) => d.slug === slug);
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: doc.href, types: { "text/markdown": markdownHref(doc) } },
    openGraph: {
      title: `${doc.title} | ${v2Config.name} ${v2Config.version}`,
      description: doc.description,
      type: "article",
      url: doc.href,
    },
  };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const docs = await getDocs();
  const index = docs.findIndex((d) => d.slug === slug);
  const rendered = index === -1 ? null : await renderDoc(slug);
  if (!rendered) notFound();

  const doc = docs[index];
  const prev = docs[index - 1];
  const next = docs[index + 1];
  const { content, toc } = rendered;

  return (
    <>
      <main id="v2-main" className="min-w-0 pt-8 pb-20 md:pt-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px] text-(--v2-faint)">
          <Link href={V2_BASE} className="hover:text-(--v2-fg)">
            2.0.0 Beta
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span>{doc.group}</span>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="text-(--v2-fg)" aria-current="page">
            {doc.title}
          </span>
        </nav>
        <PageActions title={doc.title} markdownPath={markdownHref(doc)} />
        </div>

        <header className="mb-10 border-b border-(--v2-border) pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="v2-badge" data-tone="beta">
              <FlaskConical className="size-3.5" aria-hidden />
              Beta · Experimental
            </span>
            <span className="v2-badge">React 19</span>
            <span className="v2-badge">No peer dependencies</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{doc.title}</h1>
          {doc.description && (
            <p className="mt-3 max-w-2xl text-base text-pretty text-(--v2-muted) sm:text-lg">{doc.description}</p>
          )}
          <p className="mt-5 text-sm text-(--v2-muted)">
            Beta components are subject to change and may break your code. Use them at your own risk, and share
            feedback through the <Link href={v2Config.bugReportHref}>bug tracker</Link>.
          </p>
        </header>

        {toc.length > 0 && (
          <details className="v2-toc-mobile xl:hidden">
            <summary>On this page</summary>
            <TableOfContents items={toc} />
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
            <Link href={V2_BASE} className="v2-pager">
              <span className="flex items-center gap-1 text-xs text-(--v2-faint)">
                <ArrowLeft className="size-3.5" aria-hidden /> Previous
              </span>
              <span className="font-medium">Overview</span>
            </Link>
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
        <div className="v2-toc-rail">
          {toc.length > 0 && <TableOfContents items={toc} />}
        </div>
      </aside>
    </>
  );
}
