import { getLlmsFullTxt } from "@/app/(main)/_lib/markdown";

// All 2.0.0 beta docs as one Markdown file, for pasting into an LLM.
export const dynamic = "force-static";

export async function GET() {
  return new Response(await getLlmsFullTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
