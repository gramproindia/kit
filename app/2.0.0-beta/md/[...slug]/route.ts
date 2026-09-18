import { getDocs } from "../../_lib/docs";
import { getDocMarkdown } from "../../_lib/markdown";
import { DEFAULT_LOCALE, isLocale, LOCALE_CODES, type Locale } from "../../_lib/i18n";

// Served at /2.0.0-beta/<slug>.md and /2.0.0-beta/<locale>/<slug>.md
// through a rewrite in next.config.ts.
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const docs = await getDocs(DEFAULT_LOCALE);
  return LOCALE_CODES.flatMap((locale) =>
    docs.map((doc) => ({ slug: locale === DEFAULT_LOCALE ? [doc.slug] : [locale, doc.slug] })),
  );
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const [first, ...rest] = (await params).slug;
  const locale: Locale = first && isLocale(first) && first !== DEFAULT_LOCALE ? first : DEFAULT_LOCALE;
  const slug = locale === DEFAULT_LOCALE ? first : rest[0];

  const markdown = slug ? await getDocMarkdown(slug, locale) : null;
  if (!markdown) return new Response("Not found", { status: 404 });
  return new Response(markdown, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
