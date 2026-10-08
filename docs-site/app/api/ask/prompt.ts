import { createRequire } from "node:module";

/*
 * The prompt the evaluation harness uses — loaded, not copied.
 *
 * This used to be a vendored duplicate, back when the docs lived in their own
 * repository. In one repo the harness is right there, so the demo asks with
 * exactly the prompt the 231-case corpus was measured with, and cannot drift
 * from it. That is the whole reason the two repos were merged.
 *
 * `prompt.cjs` is CommonJS and lives outside the app, so it is required
 * rather than imported: this route is `runtime = "nodejs"`, and the file is
 * plain JavaScript with no dependencies of its own. The specifier has to be a
 * literal — a computed path is a `<dynamic>` import the bundler cannot trace.
 */

const require_ = createRequire(import.meta.url);

interface PromptInput {
  contract: unknown;
  responseSchema: unknown;
  operations: unknown;
  utterance: string;
  version?: "v1" | "v2";
}

interface Prompt {
  system: string;
  user: string;
  promptVersion: string;
}

// app/api/ask -> app/api -> app -> docs-site -> the repo root.
const { buildPrompt: build } = require_("../../../../tools/eval/grid/prompt.cjs") as {
  buildPrompt: (input: PromptInput) => Prompt;
};

/**
 * Builds the system and user messages for one request.
 *
 * v1 carries the response schema in the prompt itself and runs unconstrained,
 * which is the configuration the corpus was scored on for this model — Gemini
 * rejects the generated schema as a strict `response_format`, so constraining
 * it here would be both broken and unmeasured.
 */
export function buildPrompt(input: Omit<PromptInput, "version">): Prompt {
  return build({ ...input, version: "v1" });
}
