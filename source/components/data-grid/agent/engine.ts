/*
 * The grid agent: contract in, validated command out, state changed.
 *
 *   live DataGrid → runtime contract → validated command → executor → new GridState
 *
 * There is no model anywhere in that line, and that is deliberate. Everything
 * this file provides works with a form, a keyboard shortcut or a saved
 * bookmark as the caller: saved views, shareable URLs, an audit trail, and
 * undo across every operation the grid has. A model, when one is added, plugs
 * into the front — it produces the intent, and the five validation layers
 * treat it exactly as they treat any other untrusted input.
 *
 * Caveat worth knowing: undo restores state through `GridApi.setState`, which
 * can only write the keys the grid actually owns. If the host controls
 * `sorting` or `filters` through the `state` prop, it owns undoing them too.
 */

import {
  checkSchema,
  createSnapshotHistory,
  type ConfirmRequest,
  type JsonSchema,
  type RegisteredExecutor,
  type SnapshotEntry,
  type ValidationIssue,
  type ValidationLayer,
} from "../../shared/core/agent";
import type { GridApi } from "../core/grid";
import type { FilterOperator, FilterValue, GridOptions, GridState } from "../core/types";
import {
  buildGridContract,
  type GridAgentPolicy,
  type GridColumnSemantics,
  type GridRuntimeContract,
} from "./contract";
import { createDataset, type GridDataset } from "./dataset";
import {
  buildIntentSchema,
  buildResponseSchema,
  type GeneratedIntentSchema,
  type GridResponse,
} from "./intent";
import { createGridExecutors } from "./executors";
import { GRID_OPERATIONS, type GridOperationDefinition, type GridOperationName } from "./operations";
import { validateBatch, validateIntent, type GridCommand, type GridExplanation } from "./validate";

export interface GridView {
  /** View format, not the contract version. */
  v: 1;
  instanceId: string;
  label?: string;
  state: GridState;
}

export type GridExecution =
  | { status: "done"; commands: GridCommand[]; warnings: ValidationIssue[]; state: GridState }
  | {
      status: "needs-confirmation";
      commands: GridCommand[];
      warnings: ValidationIssue[];
      confirm: ConfirmRequest;
    }
  | {
      status: "rejected";
      reason: string;
      code: string;
      layer: ValidationLayer;
      suggestion?: string;
      issues: ValidationIssue[];
    }
  /* The producer asked a question instead of answering. Nothing runs. */
  | { status: "clarify"; question: string; options?: string[] }
  /* The producer refused. Nothing runs, and that is a correct outcome. */
  | { status: "declined"; reason: string };

export interface GridAgentOptions<T> {
  api: GridApi<T>;
  /** The very object handed to `<DataGrid>`: data, columns and feature flags. */
  options: GridOptions<T>;
  /** Stable across renders. Defaults to a hash of the column ids. */
  instanceId?: string;
  /** What a machine cannot read off a column definition. */
  semantics?: Readonly<Record<string, GridColumnSemantics>>;
  policy?: GridAgentPolicy;
  /** BCP 47 locale for the explanations. */
  locale?: string;
  /** Column summaries and derived enum values in the contract. Default true. */
  stats?: boolean;
  maxEnumValues?: number;
  /** Undo depth. Default 50. */
  historyLimit?: number;
  /** Reference date for relative phrases such as "last month". */
  now?: () => Date;
  /** Replace the default `GridApi`-backed executors. */
  executors?: Map<GridOperationName, RegisteredExecutor<GridRuntimeContract>>;
}

export interface GridAgent<T> {
  /** What this instance can do, right now. Recomputed when state changes. */
  contract(): GridRuntimeContract;
  /** The generated JSON Schema for one intent on this instance. */
  schema(): JsonSchema;
  /**
   * The schema a producer of intents is held to: a command, a question, or a
   * refusal. This is the one to hand a constrained decoder.
   */
  responseSchema(): JsonSchema;
  /**
   * Validate a whole response envelope. Clarifying and declining are checked
   * against the schema like anything else, so a `clarify` with no question is
   * malformed output rather than a clarification.
   */
  respond(response: unknown): GridExecution;
  /** The static operation definitions this instance offers. */
  operations(): GridOperationDefinition[];
  /** Validate without changing anything. */
  validate(intent: unknown): GridExecution;
  /** Alias for `validate`, for callers showing a confirmation step. */
  preview(intent: unknown): GridExecution;
  execute(intent: unknown, options?: { confirm?: boolean }): Promise<GridExecution>;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  /** Oldest first. Suitable as an audit trail. */
  history(): readonly SnapshotEntry<GridState>[];
  clearHistory(): void;
  saveView(label?: string): GridView;
  applyView(view: GridView): boolean;
  /**
   * Hand the agent this render's props when `data`, `columns` or flags change.
   * Pass `extras` to replace semantics, policy and locale too; a key left out
   * of `extras` is cleared, as an omitted prop would be.
   */
  update(
    options: GridOptions<T>,
    extras?: {
      semantics?: Readonly<Record<string, GridColumnSemantics>> | undefined;
      policy?: GridAgentPolicy | undefined;
      locale?: string | undefined;
    },
  ): void;
  dataset(): GridDataset<T>;
}

// --------------------------------------------------------------- view coding

const toBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (text: string): string => {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/** A saved view as one URL-safe string. */
export const encodeGridView = (view: GridView): string => toBase64Url(JSON.stringify(view));

const FILTER_OPERATORS = new Set<string>([
  "contains", "notContains", "equals", "notEquals", "startsWith", "endsWith",
  "gt", "gte", "lt", "lte", "between", "before", "after", "in", "isEmpty", "isNotEmpty",
] satisfies FilterOperator[]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isFilterValue = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  typeof value === "string" ||
  typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value)) ||
  (Array.isArray(value) &&
    value.every((entry) => typeof entry === "string" || (typeof entry === "number" && Number.isFinite(entry))));

/** A record of `check`-passing values, copied as own properties only. */
function recordOf<V>(value: unknown, check: (entry: unknown) => entry is V): Record<string, V> | undefined {
  if (!isRecord(value)) return undefined;
  const out: Record<string, V> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!check(entry)) return undefined;
    Object.defineProperty(out, key, { value: entry, writable: true, enumerable: true, configurable: true });
  }
  return out;
}

const isBoolean = (entry: unknown): entry is boolean => typeof entry === "boolean";
const isSize = (entry: unknown): entry is number =>
  typeof entry === "number" && Number.isFinite(entry) && entry >= 0;
const isIndex = (value: unknown, min: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min;

/**
 * Keeps the state keys of an untrusted view whose shape is right and drops the
 * rest. A saved view comes from a URL or storage, so `{ "filters": 5 }` must
 * not reach the grid, where it would throw.
 */
export function sanitizeGridState(input: unknown): Partial<GridState> {
  if (!isRecord(input)) return {};
  const out: Partial<GridState> = {};
  const { sorting, filters, globalFilter, pagination, rowSelection } = input;
  const { columnOrder, columnVisibility, columnSizing, columnPinning, density } = input;

  if (
    Array.isArray(sorting) &&
    sorting.every((s) => isRecord(s) && typeof s.columnId === "string" && typeof s.desc === "boolean")
  ) {
    out.sorting = sorting.map((s: Record<string, unknown>) => ({ columnId: s.columnId as string, desc: s.desc as boolean }));
  }
  if (
    Array.isArray(filters) &&
    filters.every(
      (f) =>
        isRecord(f) &&
        typeof f.columnId === "string" &&
        typeof f.operator === "string" &&
        FILTER_OPERATORS.has(f.operator) &&
        isFilterValue(f.value) &&
        isFilterValue(f.value2),
    )
  ) {
    out.filters = filters.map((f: Record<string, unknown>) => ({
      columnId: f.columnId as string,
      operator: f.operator as FilterOperator,
      ...(f.value !== undefined ? { value: f.value as FilterValue } : {}),
      ...(f.value2 !== undefined ? { value2: f.value2 as FilterValue } : {}),
    }));
  }
  if (typeof globalFilter === "string") out.globalFilter = globalFilter;
  if (isRecord(pagination) && isIndex(pagination.pageIndex, 0) && isIndex(pagination.pageSize, 1)) {
    out.pagination = { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize };
  }
  const selection = recordOf(rowSelection, isBoolean);
  if (selection) out.rowSelection = selection;
  if (isStringList(columnOrder)) out.columnOrder = columnOrder;
  const visibility = recordOf(columnVisibility, isBoolean);
  if (visibility) out.columnVisibility = visibility;
  const sizing = recordOf(columnSizing, isSize);
  if (sizing) out.columnSizing = sizing;
  if (isRecord(columnPinning) && isStringList(columnPinning.left) && isStringList(columnPinning.right)) {
    out.columnPinning = { left: columnPinning.left, right: columnPinning.right };
  }
  if (density === "compact" || density === "standard" || density === "comfortable") out.density = density;
  return out;
}

/**
 * Reads a string from `encodeGridView`, or null when it is not one. Only the
 * envelope is checked here; `applyView` drops any malformed state key.
 */
export function decodeGridView(text: string): GridView | null {
  try {
    const parsed = JSON.parse(fromBase64Url(text)) as GridView;
    return isRecord(parsed) && parsed.v === 1 && isRecord(parsed.state) ? parsed : null;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------- agent

export function createGridAgent<T>(input: GridAgentOptions<T>): GridAgent<T> {
  let options = input.options;
  // Mutable: the host may tighten the policy or change semantics after mount.
  let { semantics, policy = {}, locale } = input;
  const { api, stats, maxEnumValues, instanceId } = input;
  const now = input.now ?? (() => new Date());

  const history = createSnapshotHistory<GridState>({
    read: () => api.getState(),
    write: (snapshot) => api.setState(() => snapshot),
    limit: input.historyLimit ?? 50,
  });

  const executors = input.executors ?? createGridExecutors(api, history);

  let datasetCache: { key: unknown[]; value: GridDataset<T> } | null = null;
  const dataset = (): GridDataset<T> => {
    const key = [options.data, options.columns, options.getRowId, options.mode, options.rowCount, locale];
    if (!datasetCache || datasetCache.key.some((part, i) => part !== key[i])) {
      datasetCache = { key, value: createDataset(options, locale) };
    }
    return datasetCache.value;
  };

  let contractCache: { key: unknown[]; value: GridRuntimeContract } | null = null;
  const contract = (): GridRuntimeContract => {
    const state = api.getState();
    const key = [options, state, history.canUndo(), history.canRedo(), dataset(), policy, semantics];
    if (!contractCache || contractCache.key.some((part, i) => part !== key[i])) {
      contractCache = {
        key,
        value: buildGridContract({
          options,
          dataset: dataset(),
          state,
          ...(instanceId ? { instanceId } : {}),
          ...(semantics ? { semantics } : {}),
          policy,
          ...(stats !== undefined ? { stats } : {}),
          ...(maxEnumValues !== undefined ? { maxEnumValues } : {}),
          canUndo: history.canUndo(),
          canRedo: history.canRedo(),
        }),
      };
    }
    return contractCache.value;
  };

  let schemaCache: { key: GridRuntimeContract; value: GeneratedIntentSchema } | null = null;
  const generated = (): GeneratedIntentSchema => {
    const current = contract();
    if (!schemaCache || schemaCache.key !== current) {
      schemaCache = { key: current, value: buildIntentSchema(current) };
    }
    return schemaCache.value;
  };

  const asList = (intent: unknown): unknown[] => (Array.isArray(intent) ? intent : [intent]);

  /**
   * Validate a full response envelope: a command, a question, or a refusal.
   *
   * Clarifying is not a way around the validator: `{ result: "clarify" }` with
   * no question comes back rejected, because a label is not a question.
   *
   * A command's *intents* are deliberately not checked against the response
   * schema here. They go to `check`, which triages the column first and can
   * therefore say "Email cannot be filtered" where the schema could only say
   * "matched no branch" — same verdict, but one of them tells you what to do.
   * The full response schema remains what a constrained decoder is given.
   */
  function respond(response: unknown): GridExecution {
    // A bare list of intents is the batch form that `validate` already takes.
    if (Array.isArray(response)) return check(response);

    if (response === null || typeof response !== "object") {
      return {
        status: "rejected",
        reason: "A response must be a JSON object, or a list of intents.",
        code: "not-an-object",
        layer: "schema",
        issues: [],
      };
    }

    const envelope = response as Record<string, unknown>;
    // No envelope at all: treat it as a bare intent, which is what the direct
    // callers of `validate` send.
    if (envelope.result === undefined) return check(response);

    const branch = (buildResponseSchema(contract()).oneOf ?? []).find(
      (entry) => entry.properties?.result?.const === envelope.result,
    );
    if (!branch) {
      /*
       * `String()` on an object gives "[object Object]", which tells a reader
       * nothing. A nested envelope — `{ result: { clarify: "..." } }` — is a
       * real and recoverable mistake, so name it.
       */
      const value = envelope.result;
      const shape =
        typeof value === "string"
          ? `"${value}"`
          : Array.isArray(value)
            ? "a list"
            : value === null
              ? "null"
              : typeof value === "object"
                ? "an object"
                : `a ${typeof value}`;
      // Only an object can plausibly be a mis-nested envelope; a list cannot.
      const key =
        value !== null && typeof value === "object" && !Array.isArray(value)
          ? Object.keys(value)[0]
          : undefined;
      const nested =
        key && ["command", "clarify", "declined"].includes(key)
          ? ` Did you mean { "result": "${key}", ... }?`
          : "";
      return {
        status: "rejected",
        reason:
          `"result" must be the string "command", "clarify" or "declined"; got ${shape}.${nested}`,
        code: "unknown-result",
        layer: "schema",
        issues: [],
      };
    }

    // For a command, the schema's job here is the envelope only; `check` owns
    // the intents and gives better reasons than a union miss would.
    const shape =
      envelope.result === "command"
        ? { ...branch, properties: { ...branch.properties, intents: { type: "array" as const, minItems: 1 } } }
        : branch;

    const problems = checkSchema(response, shape);
    if (problems.length > 0) {
      const first = problems[0];
      return {
        status: "rejected",
        reason: `${first.path || "response"}: ${first.message}`,
        code: first.code,
        layer: "schema",
        issues: problems.map((p) => ({
          layer: "schema" as const,
          code: p.code,
          message: `${p.path || "response"}: ${p.message}`,
          ...(p.path ? { path: p.path } : {}),
        })),
      };
    }

    const valid = response as GridResponse;
    if (valid.result === "clarify") {
      return {
        status: "clarify",
        question: valid.question,
        ...(valid.options ? { options: valid.options } : {}),
      };
    }
    if (valid.result === "declined") return { status: "declined", reason: valid.reason };
    return check(valid.intents);
  }

  function check(intent: unknown): GridExecution {
    const list = asList(intent);
    const current = contract();
    const context = {
      contract: current,
      schema: generated(),
      dataset: dataset(),
      state: api.getState(),
      policy,
      ...(locale ? { locale } : {}),
      now: now(),
    };

    const result =
      list.length === 1
        ? mapSingle(validateIntent(list[0], context))
        : validateBatch(list, context);

    if (!result.ok) {
      return {
        status: "rejected",
        reason: result.reason,
        code: result.code,
        layer: result.layer,
        ...(result.suggestion ? { suggestion: result.suggestion } : {}),
        issues: result.issues,
      };
    }

    const history2 = result.command.filter(
      (command) => command.operation === "undo" || command.operation === "redo",
    );
    if (history2.length > 0 && result.command.length > 1) {
      return {
        status: "rejected",
        reason: "Undo and redo cannot be combined with other operations in one batch.",
        code: "history-in-batch",
        layer: "schema",
        issues: [],
      };
    }

    return result.confirm
      ? {
          status: "needs-confirmation",
          commands: result.command,
          warnings: result.warnings,
          confirm: result.confirm,
        }
      : { status: "done", commands: result.command, warnings: result.warnings, state: api.getState() };
  }

  async function execute(intent: unknown, runOptions: { confirm?: boolean } = {}): Promise<GridExecution> {
    const checked = respond(intent);
    if (checked.status === "rejected" || checked.status === "clarify" || checked.status === "declined") {
      return checked;
    }
    if (checked.status === "needs-confirmation" && runOptions.confirm !== true) return checked;

    const commands = checked.commands;
    const current = contract();
    const context = { contract: current, dryRun: false };

    const run = async () => {
      for (const command of commands) {
        const executor = executors.get(command.operation);
        if (!executor) {
          throw new Error(`[DataGrid] No executor registered for "${command.operation}".`);
        }
        await executor.execute(command.intent as never, context);
      }
    };

    const historyOnly =
      commands.length === 1 && (commands[0].operation === "undo" || commands[0].operation === "redo");

    if (historyOnly) {
      // Runs outside `record`, because it *is* the history moving.
      await run();
    } else {
      const label = commands.map((command) => command.explain.summary).join("; ");
      await history.record(label, run);
    }

    return {
      status: "done",
      commands,
      warnings: checked.status === "needs-confirmation" ? checked.warnings : checked.warnings,
      state: api.getState(),
    };
  }

  return {
    contract,
    schema: () => generated().schema,
    responseSchema: () => buildResponseSchema(contract()),
    respond,
    operations: () => contract().operations.map((name) => GRID_OPERATIONS[name]),
    validate: check,
    preview: check,
    execute,
    undo: () => history.undo(),
    redo: () => history.redo(),
    canUndo: () => history.canUndo(),
    canRedo: () => history.canRedo(),
    history: () => history.entries(),
    clearHistory: () => history.clear(),

    saveView: (label) => ({
      v: 1,
      instanceId: contract().instanceId,
      ...(label ? { label } : {}),
      state: api.getState(),
    }),

    applyView(view) {
      if (!isRecord(view) || view.v !== 1) return false;
      // Views arrive from URLs and storage: keep only well-formed keys and
      // merge them over the current state, so a partial view is still valid.
      const state = sanitizeGridState(view.state);
      if (Object.keys(state).length === 0) return false;
      const label = typeof view.label === "string" && view.label ? `Apply view "${view.label}"` : "Apply saved view";
      history.record(label, () => {
        api.setState((prev) => ({ ...prev, ...state }));
      });
      return true;
    },

    update(next, extras) {
      options = next;
      if (extras) {
        semantics = extras.semantics;
        policy = extras.policy ?? {};
        locale = extras.locale;
      }
    },

    dataset,
  };
}

/** One result and a list of results differ only in shape; keep the rest shared. */
function mapSingle(
  result: ReturnType<typeof validateIntent>,
): | { ok: true; command: GridCommand[]; warnings: ValidationIssue[]; confirm: ConfirmRequest | null }
  | Extract<ReturnType<typeof validateIntent>, { ok: false }> {
  return result.ok
    ? { ok: true, command: [result.command], warnings: result.warnings, confirm: result.confirm }
    : result;
}

export type { GridCommand, GridExplanation };
