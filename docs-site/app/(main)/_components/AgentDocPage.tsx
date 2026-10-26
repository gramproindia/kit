import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Download } from "lucide-react";
import { agentConfig, getAgentDocs, getAgentNav, readAgentSource } from "../_lib/agent-docs";
import { compileSource } from "../_lib/render";
import { markdownHref } from "../_lib/markdown";
import { BRAND, articleGraph } from "../_lib/seo";
import { v2Config } from "../_lib/config";
import { JsonLd } from "./JsonLd";
import { TableOfContents } from "./TableOfContents";
import { PageActions } from "./PageActions";
import { AgentSidebarNav } from "./AgentSidebarNav";
import { GitHubIcon } from "./GitHubIcon";

const pageTitle = (title: string) => (title === agentConfig.name ? title : `${title} | ${agentConfig.name}`);

/** Metadata for one SE Agent page. Titles name the agent, not the component library. */
export async function agentMetadata(slug: string): Promise<Metadata> {
  const doc = (await getAgentDocs()).find((d) => d.slug === slug);
  if (!doc) return {};
  const title = pageTitle(doc.title);
  return {
    title: { absolute: title },
    description: doc.description,
    alternates: { canonical: doc.href, types: { "text/markdown": markdownHref(doc) } },
    openGraph: {
      title,
      description: doc.description,
      type: "article",
      url: doc.href,
      locale: "en",
      siteName: `${v2Config.name} Docs`,
      images: [{ url: BRAND.ogImage, width: 1200, height: 630, alt: agentConfig.name }],
    },
  };
}

/**
 * One SE Agent page: the component docs' layout (sidebar, article, contents
 * rail, previous/next) with the agent's own navigation and header.
 */
export async function AgentDocPage({ slug }: { slug: string }) {
  const [docs, nav, source] = await Promise.all([getAgentDocs(), getAgentNav(), readAgentSource(slug)]);
  const index = docs.findIndex((d) => d.slug === slug);
  if (index === -1 || !source) notFound();

  const doc = docs[index];
  const prev = docs[index - 1];
  const next = docs[index + 1];
  const { content, toc } = await compileSource(source);

  return (
    <div className="v2-container md:grid md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-10 xl:grid-cols-[13.5rem_minmax(0,1fr)_13rem] xl:gap-12">
      <JsonLd data={articleGraph({ title: doc.title, description: doc.description, href: doc.href, locale: "en" })} />
      <aside className="hidden md:block">
        <div className="v2-sidebar">
          <AgentSidebarNav nav={nav} />
        </div>
      </aside>

      <main id="v2-main" className="min-w-0 pt-8 pb-20 md:pt-10" lang="en">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px] text-(--v2-faint)">
            <Link href={docs[0].href} className="hover:text-(--v2-fg)">
              {agentConfig.name}
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

        <header className="mb-10 border-b border-(--v2-border) pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="v2-badge">VS Code extension</span>
            <span className="v2-badge">Runs on local models</span>
            <span className="v2-badge">MIT</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{doc.title}</h1>
          {doc.description && (
            <p className="mt-3 max-w-2xl text-base text-pretty text-(--v2-muted) sm:text-lg">{doc.description}</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-(--v2-muted)">
            <a href={agentConfig.repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-(--v2-fg)">
              <GitHubIcon className="size-3.5" />
              gramproindia/agent
            </a>
            <a href={agentConfig.pdf} download className="inline-flex items-center gap-1.5 hover:text-(--v2-fg)">
              <Download className="size-3.5" aria-hidden />
              Plain-English guide (PDF)
            </a>
            <a href={`${agentConfig.repo}/issues`} target="_blank" rel="noopener noreferrer" className="hover:text-(--v2-fg)">
              Report an issue
            </a>
          </div>
        </header>

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
