import { getLlmsTxt } from "@/app/(main)/_lib/markdown";

// https://llmstxt.org — an index of the docs for language models.
export const dynamic = "force-static";

export async function GET() {
  return new Response(await getLlmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
