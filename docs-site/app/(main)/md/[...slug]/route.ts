import { getDocs } from "../../_lib/docs";
import { getAgentDocs } from "../../_lib/agent-docs";
import { getNativeDocs } from "../../_lib/native-docs";
import { getAgentMarkdown, getDocMarkdown, getNativeMarkdown } from "../../_lib/markdown";
import { DEFAULT_LOCALE, isLocale, LOCALE_CODES, type Locale } from "../../_lib/i18n";

// Served at /<slug>.md, /<locale>/<slug>.md, /se-agent[/<slug>].md and
// /native/docs[/<slug>].md through a rewrite in next.config.ts.
export const dynamic = "force-static";
export const dynamicParams = false;

const AGENT = "se-agent";
const NATIVE = "native";

export async function generateStaticParams() {
  const docs = await getDocs(DEFAULT_LOCALE);
  const agentDocs = await getAgentDocs();
  const nativeDocs = await getNativeDocs();
  return [
    ...LOCALE_CODES.flatMap((locale) =>
      docs.map((doc) => ({ slug: locale === DEFAULT_LOCALE ? [doc.slug] : [locale, doc.slug] })),
    ),
    ...agentDocs.map((doc) => ({ slug: doc.slug === "index" ? [AGENT] : [AGENT, doc.slug] })),
    ...nativeDocs.map((doc) => ({ slug: doc.slug === "index" ? [NATIVE, "docs"] : [NATIVE, "docs", doc.slug] })),
  ];
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const [first, ...rest] = (await params).slug;

  let markdown: string | null;
  if (first === AGENT) {
    markdown = await getAgentMarkdown(rest[0] ?? "index");
  } else if (first === NATIVE && rest[0] === "docs") {
    markdown = await getNativeMarkdown(rest[1] ?? "index");
  } else {
    const locale: Locale = first && isLocale(first) && first !== DEFAULT_LOCALE ? first : DEFAULT_LOCALE;
    const slug = locale === DEFAULT_LOCALE ? first : rest[0];
    markdown = slug ? await getDocMarkdown(slug, locale) : null;
  }

  if (!markdown) return new Response("Not found", { status: 404 });
  return new Response(markdown, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
