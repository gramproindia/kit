import { NextResponse } from "next/server";
import { GRID_OPERATIONS } from "@/components/data-grid";
import { buildPrompt } from "./prompt";

/*
 * The docs site's own model endpoint, for the "Asking in Words" demo.
 *
 * It exists to show the shape a real application should use: the API key lives
 * on the server and never reaches the bundle, and the browser sends what the
 * person typed plus the grid's live contract. Putting a model key in client
 * JavaScript publishes it to every visitor, which is why the library itself
 * ships no key handling and no provider.
 *
 * With no key configured this answers `available: false`, the demo renders the
 * grid without the ask box, and the page explains how to set one up. That is
 * also what a reader's own fork will do until they add a key.
 */

export const runtime = "nodejs";

/** Gemini through its OpenAI-compatible endpoint, as the benchmark used. */
const BASE = "https://generativelanguage.googleapis.com/v1beta/openai";
const MODEL = process.env.GBS_ASK_MODEL ?? "gemini-3.5-flash-lite";

const key = () => process.env.GOOGLE_API_KEY ?? null;

export async function GET() {
  return NextResponse.json({ available: key() !== null, model: MODEL });
}

export async function POST(request: Request) {
  const apiKey = key();
  if (!apiKey) {
    return NextResponse.json(
      { error: "This deployment has no GOOGLE_API_KEY, so the demo is read-only." },
      { status: 503 },
    );
  }

  let body: { utterance?: unknown; contract?: unknown; responseSchema?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const { utterance, contract, responseSchema } = body;
  if (typeof utterance !== "string" || !contract) {
    return NextResponse.json(
      { error: "Expected { utterance, contract, responseSchema }." },
      { status: 400 },
    );
  }
  // A grid command is a sentence; anything longer is not this demo's traffic.
  if (utterance.length > 400) {
    return NextResponse.json({ error: "That is longer than a grid command." }, { status: 400 });
  }

  const { system, user } = buildPrompt({
    contract,
    responseSchema,
    operations: GRID_OPERATIONS,
    utterance,
  });

  try {
    const upstream = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 4096,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        // An object, not a schema: Gemini rejects the generated schema in strict
        // mode (31 `oneOf` branches), and the prompt carries it anyway.
        response_format: { type: "json_object" },
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json({ error: `${MODEL}: ${text.slice(0, 300)}` }, { status: 502 });
    }

    const payload = JSON.parse(text) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
    };
    const choice = payload.choices?.[0];
    if (choice?.finish_reason === "length") {
      return NextResponse.json({ error: "The model ran out of tokens." }, { status: 502 });
    }

    // The raw string goes back untouched. Parsing and validation belong to the
    // browser, which holds the contract this answer is held to.
    return NextResponse.json({ content: choice?.message?.content ?? "" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
