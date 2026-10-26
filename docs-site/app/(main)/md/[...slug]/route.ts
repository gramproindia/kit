import { getDocs } from "../../_lib/docs";
import { getAgentDocs } from "../../_lib/agent-docs";
import { getAgentMarkdown, getDocMarkdown } from "../../_lib/markdown";
import { DEFAULT_LOCALE, isLocale, LOCALE_CODES, type Locale } from "../../_lib/i18n";

// Served at /<slug>.md, /<locale>/<slug>.md and /se-agent[/<slug>].md
// through a rewrite in next.config.ts.
export const dynamic = "force-static";
export const dynamicParams = false;

const AGENT = "se-agent";

export async function generateStaticParams() {
  const docs = await getDocs(DEFAULT_LOCALE);
  const agentDocs = await getAgentDocs();
  return [
    ...LOCALE_CODES.flatMap((locale) =>
      docs.map((doc) => ({ slug: locale === DEFAULT_LOCALE ? [doc.slug] : [locale, doc.slug] })),
    ),
    ...agentDocs.map((doc) => ({ slug: doc.slug === "index" ? [AGENT] : [AGENT, doc.slug] })),
  ];
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const [first, ...rest] = (await params).slug;

  let markdown: string | null;
  if (first === AGENT) {
    markdown = await getAgentMarkdown(rest[0] ?? "index");
  } else {
    const locale: Locale = first && isLocale(first) && first !== DEFAULT_LOCALE ? first : DEFAULT_LOCALE;
    const slug = locale === DEFAULT_LOCALE ? first : rest[0];
    markdown = slug ? await getDocMarkdown(slug, locale) : null;
  }

  if (!markdown) return new Response("Not found", { status: 404 });
  return new Response(markdown, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
