/*
 * The loop: an intent arrives, the validator rules on it, and only then does
 * an executor run.
 *
 * There is nothing here but that order, which is the whole point. Every route
 * into a field — a model's proposal, a WebMCP tool call, a test — goes through
 * this function, so there is one place where "is this allowed" is decided and
 * no second path that skips it.
 */

import { fieldOperations, validateFieldIntent } from "./field";
import type { FieldCommand, FieldContract, FieldIntent } from "./field";
import type { ExecutorRegistry, ValidationIssue } from "./types";

export interface FieldExecution {
  readonly ok: boolean;
  /** What was applied, once the validator agreed to it. */
  readonly command?: FieldCommand;
  /** Coercions applied and plausibility notes. Never a reason for refusal. */
  readonly warnings: readonly ValidationIssue[];
  /** Present when refused: the reason, in the words the person should see. */
  readonly reason?: string;
  readonly code?: string;
  readonly layer?: ValidationIssue["layer"];
  readonly suggestion?: string;
  /** Whatever the executor returned, for a caller that wants it. */
  readonly result?: unknown;
}

export interface FieldAgentOptions {
  readonly contract: FieldContract;
  readonly executors: ExecutorRegistry<FieldContract>;
}

export interface FieldAgent {
  /** What this instance can do, with `setValue` narrowed to its type. */
  readonly operations: ReturnType<typeof fieldOperations>;
  readonly contract: FieldContract;
  /** Validate and, if it passes, perform. */
  run(intent: FieldIntent, options?: { dryRun?: boolean; signal?: AbortSignal }): Promise<FieldExecution>;
  /** Validate only. Useful for a confirmation prompt before anything happens. */
  check(intent: FieldIntent): FieldExecution;
}

export function createFieldAgent({ contract, executors }: FieldAgentOptions): FieldAgent {
  const check = (intent: FieldIntent): FieldExecution => {
    const verdict = validateFieldIntent(intent, contract);
    if (!verdict.ok) {
      return {
        ok: false,
        warnings: [],
        reason: verdict.reason,
        code: verdict.code,
        layer: verdict.layer,
        ...(verdict.suggestion ? { suggestion: verdict.suggestion } : {}),
      };
    }
    return { ok: true, command: verdict.command, warnings: verdict.warnings };
  };

  return {
    contract,
    operations: fieldOperations(contract),
    check,
    async run(intent, options = {}) {
      const verdict = check(intent);
      if (!verdict.ok) return verdict;

      const executor = executors.get(verdict.command!.action);
      if (!executor) {
        return {
          ok: false,
          warnings: verdict.warnings,
          reason: `${contract.component} declares "${verdict.command!.action}" but nothing performs it.`,
          code: "no-executor",
          layer: "reference",
        };
      }

      try {
        const result = await executor.execute(verdict.command as never, {
          contract,
          dryRun: options.dryRun ?? false,
          ...(options.signal ? { signal: options.signal } : {}),
        });
        return { ...verdict, result };
      } catch (error) {
        // An executor throwing is a failure to *reach* the field, which is a
        // different thing from the field refusing — and is reported as such,
        // so "it is disabled" never reads as "your wording was wrong".
        return {
          ok: false,
          warnings: verdict.warnings,
          reason: error instanceof Error ? error.message : String(error),
          code: "execution-failed",
          layer: "policy",
        };
      }
    },
  };
}
