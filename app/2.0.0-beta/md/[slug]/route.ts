import { getDocs } from "../../_lib/docs";
import { getDocMarkdown } from "../../_lib/markdown";

// Served at /2.0.0-beta/<slug>.md through a rewrite in next.config.ts.
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getDocs()).map((doc) => ({ slug: doc.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const markdown = await getDocMarkdown((await params).slug);
  if (!markdown) return new Response("Not found", { status: 404 });
  return new Response(markdown, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
