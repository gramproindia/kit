import { serialiseJsonLd } from "../_lib/seo";

/*
 * Structured data, as the Next.js guide recommends: a plain <script>, not
 * next/script — it is data for crawlers, not code to execute.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Escaped in serialiseJsonLd; the content is built from our own config
      // and frontmatter, never from a request.
      dangerouslySetInnerHTML={{ __html: serialiseJsonLd(data) }}
    />
  );
}
