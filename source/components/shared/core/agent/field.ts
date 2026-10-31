/*
 * What a field knows how to do, and whether it may be asked to do it.
 *
 * The DataGrid got a runtime of its own because a grid's operations are a
 * language: filter, sort, pin, paginate, export. A field has one verb. Writing
 * twenty lines of that verb eight times — once for Input, once for Textarea,
 * once for Switch — would be eight places for the same bug, so the verb lives
 * here and each component supplies only two things: a contract describing what
 * this instance will accept, and an executor that knows how to write it.
 *
 * Nothing here imports React or touches the DOM. A contract can be built and
 * an intent validated on a server, before anything is sent to a browser, which
 * is the same property the grid's runtime has and for the same reason: the
 * validator is the security boundary, and a boundary that only exists in the
 * browser is not one.
 *
 * The five layers are the grid's five layers, in the same order, because they
 * are not grid-specific:
 *
 *   schema         is it the right shape
 *   reference      does what it names exist
 *   coercion       can what they wrote be read as the type this field holds
 *   policy         is this field accepting writes at all
 *   plausibility   is the result suspicious enough to mention
 */

import { checkSchema } from "./schema";
import { fail, ok } from "./types";
import type {
  JsonSchema,
  OperationDefinition,
  ValidationIssue,
  ValidationResult,
} from "./types";

// ------------------------------------------------------------------- kinds

/**
 * What a field holds. This decides how `setValue` reads its input and which
 * policy checks apply, and it is the only switch in this file — everything
 * else is shared across every kind.
 */
export type FieldKind =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "dateTime"
  | "dateRange"
  | "choice"
  | "multiChoice";

export interface FieldOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * What one field instance will accept, right now.
 *
 * Built per render from the component's own props, so a field that has just
 * become `readOnly` stops accepting writes without anything else being told.
 */
export interface FieldContract {
  /** The component's name, for messages a person will read. */
  readonly component: string;
  readonly kind: FieldKind;
  /** The field's accessible name, used in confirmations and refusals. */
  readonly label?: string;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly required?: boolean;
  /** Operations this instance exposes. A field with no disclosure omits open/close. */
  readonly operations: readonly FieldOperationName[];

  /** text: the cap the field enforces. */
  readonly maxLength?: number;
  /** text: a pattern the value must match, as a RegExp source. */
  readonly pattern?: string;

  /**
   * number, date, dateTime, dateRange: inclusive bounds. Dates are ISO
   * yyyy-mm-dd; date-times are local ISO yyyy-mm-ddTHH:mm, seconds optional.
   */
  readonly min?: number | string;
  readonly max?: number | string;
  /** number: the increment the field snaps to. */
  readonly step?: number;

  /** choice, multiChoice: what may be picked. */
  readonly options?: readonly FieldOption[];
  /** multiChoice: the most that may be selected at once. */
  readonly maxSelected?: number;
}

// -------------------------------------------------------------- operations

export type FieldOperationName = "setValue" | "clear" | "focus" | "open" | "close";

/**
 * The input schema for `setValue`, narrowed to the kind of field being
 * described. A constrained decoder given this cannot even express selecting an
 * option that is not in the list.
 */
export function setValueSchema(contract: FieldContract): JsonSchema {
  const { kind, options } = contract;

  if (kind === "boolean") {
    return {
      type: "object",
      required: ["value"],
      additionalProperties: false,
      properties: { value: { type: "boolean" } },
    };
  }

  if (kind === "number") {
    const value: JsonSchema = { type: "number" };
    if (typeof contract.min === "number") (value as { minimum?: number }).minimum = contract.min;
    if (typeof contract.max === "number") (value as { maximum?: number }).maximum = contract.max;
    return {
      type: "object",
      required: ["value"],
      additionalProperties: false,
      properties: { value },
    };
  }

  if (kind === "date") {
    return {
      type: "object",
      required: ["value"],
      additionalProperties: false,
      properties: {
        value: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "ISO yyyy-mm-dd" },
      },
    };
  }

  if (kind === "dateTime") {
    return {
      type: "object",
      required: ["value"],
      additionalProperties: false,
      properties: {
        value: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(:\\d{2})?$",
          description: "Local date and time, ISO yyyy-mm-ddTHH:mm (seconds optional), no time zone",
        },
      },
    };
  }

  if (kind === "dateRange") {
    const day: JsonSchema = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" };
    return {
      type: "object",
      required: ["value"],
      additionalProperties: false,
      properties: {
        value: {
          type: "object",
          required: ["start", "end"],
          additionalProperties: false,
          properties: { start: day, end: day },
        },
      },
    };
  }

  if (kind === "choice" || kind === "multiChoice") {
    const enumerated = options?.map((option) => option.value);
    const one: JsonSchema = enumerated?.length ? { type: "string", enum: enumerated } : { type: "string" };
    return {
      type: "object",
      required: ["value"],
      additionalProperties: false,
      properties: {
        value:
          kind === "choice"
            ? one
            : { type: "array", items: one, ...(contract.maxSelected ? { maxItems: contract.maxSelected } : {}) },
      },
    };
  }

  // text
  const value: JsonSchema = { type: "string" };
  if (contract.maxLength) (value as { maxLength?: number }).maxLength = contract.maxLength;
  if (contract.pattern) (value as { pattern?: string }).pattern = contract.pattern;
  return { type: "object", required: ["value"], additionalProperties: false, properties: { value } };
}

/**
 * The static operation set. `setValue` carries no schema here because its
 * shape depends on the instance; `fieldOperations` fills it in.
 */
const BASE: Record<FieldOperationName, OperationDefinition> = {
  setValue: {
    name: "setValue",
    summary: "Write a value into the field, as though a person had entered it.",
    effects: ["replaces the field's current value", "fires the host's change handler"],
    reversible: true,
  },
  clear: {
    name: "clear",
    summary: "Empty the field.",
    effects: ["discards the field's current value", "fires the host's change handler"],
    reversible: true,
  },
  focus: {
    name: "focus",
    summary: "Move keyboard focus to the field.",
    effects: ["moves focus"],
    reversible: false,
  },
  open: {
    name: "open",
    summary: "Open the field's calendar or option list.",
    effects: ["shows the overlay"],
    reversible: true,
  },
  close: {
    name: "close",
    summary: "Close the field's calendar or option list.",
    effects: ["hides the overlay"],
    reversible: true,
  },
};

/** The operations this instance publishes, with `setValue` narrowed to it. */
export function fieldOperations(contract: FieldContract): Record<string, OperationDefinition> {
  const out: Record<string, OperationDefinition> = {};
  for (const name of contract.operations) {
    out[name] = name === "setValue" ? { ...BASE.setValue, input: setValueSchema(contract) } : BASE[name];
  }
  return out;
}

// --------------------------------------------------------------- the intent

export interface FieldIntent {
  readonly action: FieldOperationName;
  readonly value?: unknown;
}

export interface FieldCommand {
  readonly action: FieldOperationName;
  /** Present for setValue, already coerced to the field's own type. */
  readonly value?: string | number | boolean | string[] | { start: string; end: string };
}

// ------------------------------------------------------------------ coercion

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar day, not merely four-two-two digits. 2025-02-31 is not one. */
function isRealDay(text: string): boolean {
  if (!DAY.test(text)) return false;
  const [y, m, d] = text.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

const DATE_TIME = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * A real local date-time, in the one form bounds are compared in:
 * yyyy-mm-ddTHH:mm:ss. Null when it is not one. A zone or offset is not
 * accepted — the field holds wall-clock time, and silently converting would
 * move the appointment.
 */
export function canonicalDateTime(text: string): string | null {
  const match = DATE_TIME.exec(text.trim());
  if (!match) return null;
  const [, day, hh, mm, ss = "00"] = match;
  if (!isRealDay(day) || Number(hh) > 23 || Number(mm) > 59 || Number(ss) > 59) return null;
  return `${day}T${hh}:${mm}:${ss}`;
}

/**
 * Read what the producer sent as the type this field holds.
 *
 * Deliberately narrow. "true" becomes true for a boolean field because a model
 * emitting JSON through a text channel does that constantly; "yes" does not,
 * because guessing at natural language is the adapter's job and this is the
 * layer that is supposed to catch the adapter being wrong.
 */
function coerce(
  value: unknown,
  contract: FieldContract,
  notes: ValidationIssue[],
): { ok: true; value: FieldCommand["value"] } | { ok: false; issue: ValidationIssue } {
  const note = (message: string) =>
    notes.push({ layer: "coercion", code: "coerced", message, path: "/value" });

  const bad = (message: string, suggestion?: string) => ({
    ok: false as const,
    issue: { layer: "coercion" as const, code: "wrong-type", message, path: "/value", ...(suggestion ? { suggestion } : {}) },
  });

  switch (contract.kind) {
    case "boolean": {
      if (typeof value === "boolean") return { ok: true, value };
      if (value === "true" || value === "false") {
        note(`read ${JSON.stringify(value)} as the boolean ${value === "true"}`);
        return { ok: true, value: value === "true" };
      }
      return bad(`${contract.component} holds true or false, not ${JSON.stringify(value)}.`);
    }

    case "number": {
      if (typeof value === "number" && Number.isFinite(value)) return { ok: true, value };
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) {
          note(`read the string ${JSON.stringify(value)} as the number ${parsed}`);
          return { ok: true, value: parsed };
        }
      }
      return bad(`${contract.component} holds a number, and ${JSON.stringify(value)} is not one.`);
    }

    case "date": {
      if (typeof value !== "string") return bad("A date must be a string, as yyyy-mm-dd.");
      if (!isRealDay(value)) {
        return bad(
          `${JSON.stringify(value)} is not a calendar date.`,
          "Dates are ISO yyyy-mm-dd. Resolve anything relative before sending it.",
        );
      }
      return { ok: true, value };
    }

    case "dateTime": {
      if (typeof value !== "string") return bad("A date and time must be a string, as yyyy-mm-ddTHH:mm.");
      const canonical = canonicalDateTime(value);
      if (!canonical) {
        return bad(
          `${JSON.stringify(value)} is not a date and time this field can hold.`,
          "Send local time as yyyy-mm-ddTHH:mm, with no time zone. Resolve anything relative before sending it.",
        );
      }
      if (/ /.test(value)) note('read the space between date and time as "T"');
      return { ok: true, value: canonical };
    }

    case "dateRange": {
      const range = value as { start?: unknown; end?: unknown } | null;
      if (!range || typeof range !== "object") return bad("A range must be an object with start and end.");
      const { start, end } = range;
      if (typeof start !== "string" || !isRealDay(start)) return bad("`start` is not a calendar date.");
      if (typeof end !== "string" || !isRealDay(end)) return bad("`end` is not a calendar date.");
      if (start > end) {
        note(`start was after end, so the two were swapped`);
        return { ok: true, value: { start: end, end: start } };
      }
      return { ok: true, value: { start, end } };
    }

    case "choice": {
      if (typeof value !== "string") return bad("A choice must be one option's value, as a string.");
      return { ok: true, value };
    }

    case "multiChoice": {
      if (typeof value === "string") {
        note("read a single option as a list of one");
        return { ok: true, value: [value] };
      }
      if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
        return bad("A multiple choice must be a list of option values.");
      }
      const unique = [...new Set(value as string[])];
      if (unique.length !== value.length) note("removed repeated options");
      return { ok: true, value: unique };
    }

    default: {
      if (typeof value === "string") return { ok: true, value };
      if (typeof value === "number" || typeof value === "boolean") {
        note(`read ${JSON.stringify(value)} as text`);
        return { ok: true, value: String(value) };
      }
      return bad(`${contract.component} holds text, and ${JSON.stringify(value)} is not text.`);
    }
  }
}

// ------------------------------------------------------------- the validator

/** Levenshtein distance, capped — only used to suggest a near-miss option. */
function distance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  let previous = Array.from({ length: cols }, (_, i) => i);
  for (let i = 1; i < rows; i += 1) {
    const current = [i];
    for (let j = 1; j < cols; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[cols - 1];
}

/** The closest option to what was asked for, when one is close enough to mean it. */
function nearestOption(wanted: string, options: readonly FieldOption[]): FieldOption | null {
  const needle = wanted.trim().toLowerCase();
  let best: FieldOption | null = null;
  let bestScore = Infinity;
  for (const option of options) {
    for (const candidate of [option.value, option.label]) {
      const score = distance(needle, candidate.toLowerCase());
      if (score < bestScore) {
        bestScore = score;
        best = option;
      }
    }
  }
  return bestScore <= Math.max(2, Math.floor(needle.length / 3)) ? best : null;
}

/**
 * Validate one intent against one field.
 *
 * Returns a command only when every layer passed. A refusal names the layer
 * that produced it, because "it did not work" and "that column is off-limits"
 * are different things to the person reading it.
 */
export function validateFieldIntent(
  intent: FieldIntent,
  contract: FieldContract,
): ValidationResult<FieldCommand> {
  const warnings: ValidationIssue[] = [];

  // 1. schema — is this even the right shape
  if (!intent || typeof intent !== "object" || typeof intent.action !== "string") {
    return fail({ layer: "schema", code: "malformed", message: "An intent needs an `action`." });
  }

  // 2. reference — does this field do that
  if (!contract.operations.includes(intent.action)) {
    return fail({
      layer: "reference",
      code: "unknown-operation",
      message: `${contract.component} does not support "${intent.action}".`,
      suggestion: `It supports: ${contract.operations.join(", ")}.`,
    });
  }

  // focus, open and close carry nothing and change no value.
  if (intent.action !== "setValue") {
    if (intent.action === "clear" && contract.required) {
      warnings.push({
        layer: "plausibility",
        code: "clearing-required-field",
        message: `${contract.label ?? contract.component} is required, so clearing it leaves the form invalid.`,
      });
    }
    const blocked = policyRefusal(contract, intent.action);
    return blocked ?? ok({ action: intent.action }, warnings);
  }

  /*
   * Only the coarse shape is checked here, not the narrowed schema.
   *
   * `setValueSchema` exists to constrain a decoder, where refusing to emit
   * "enginering" at all is exactly right. Running it as the validator's first
   * gate would be a different thing: every interesting case — a near-miss
   * option, a stringified boolean, one option too many — would fail as
   * "schema" before the layer that can explain it ever ran, and the caller
   * would get "does not match enum" instead of "did you mean Engineering?".
   *
   * So the order is shape, then type, then existence, then permission. Each
   * check still happens; it happens in the layer whose name it should carry.
   */
  const shape = checkSchema(
    { value: intent.value },
    { type: "object", required: ["value"], properties: {} },
  );
  if (shape.length > 0) {
    const [first] = shape;
    return fail({
      layer: "schema",
      code: "schema",
      message: `setValue needs a \`value\`. ${first.message}`.trim(),
      path: first.path,
    });
  }

  // 3. coercion — can it be read as this field's type
  const read = coerce(intent.value, contract, warnings);
  if (!read.ok) return fail(read.issue);
  let value = read.value;

  // 2b. reference, again — a named option has to exist
  if (contract.options?.length) {
    const wanted = contract.kind === "multiChoice" ? (value as string[]) : [value as string];
    const known = new Map(contract.options.map((option) => [option.value, option]));
    for (const entry of wanted) {
      const option = known.get(entry);
      if (!option) {
        const near = nearestOption(entry, contract.options);
        return fail({
          layer: "reference",
          code: "unknown-option",
          message: `${contract.component} has no option ${JSON.stringify(entry)}.`,
          path: "/value",
          ...(near ? { suggestion: `Did you mean ${JSON.stringify(near.value)} (${near.label})?` } : {}),
        });
      }
      if (option.disabled) {
        return fail({
          layer: "policy",
          code: "option-disabled",
          message: `${option.label} is disabled on this field.`,
          path: "/value",
        });
      }
    }
  }

  // 4. policy — is this field accepting writes
  const blocked = policyRefusal(contract, "setValue");
  if (blocked) return blocked;

  if (contract.kind === "number") {
    const n = value as number;
    if (typeof contract.min === "number" && n < contract.min) {
      return fail({
        layer: "policy",
        code: "below-minimum",
        message: `${contract.label ?? contract.component} does not go below ${contract.min}.`,
        path: "/value",
      });
    }
    if (typeof contract.max === "number" && n > contract.max) {
      return fail({
        layer: "policy",
        code: "above-maximum",
        message: `${contract.label ?? contract.component} does not go above ${contract.max}.`,
        path: "/value",
      });
    }
    if (contract.step && Number.isFinite(contract.step)) {
      const base = typeof contract.min === "number" ? contract.min : 0;
      const steps = (n - base) / contract.step;
      if (Math.abs(steps - Math.round(steps)) > 1e-9) {
        const snapped = base + Math.round(steps) * contract.step;
        warnings.push({
          layer: "coercion",
          code: "snapped-to-step",
          message: `${n} is not a multiple of ${contract.step}; the field will snap it to ${snapped}.`,
          path: "/value",
        });
      }
    }
  }

  if ((contract.kind === "date" || contract.kind === "dateRange") && (contract.min || contract.max)) {
    const days = contract.kind === "date"
      ? [value as string]
      : [(value as { start: string }).start, (value as { end: string }).end];
    for (const day of days) {
      if (typeof contract.min === "string" && day < contract.min) {
        return fail({
          layer: "policy",
          code: "before-earliest",
          message: `${contract.label ?? contract.component} does not accept dates before ${contract.min}.`,
          path: "/value",
        });
      }
      if (typeof contract.max === "string" && day > contract.max) {
        return fail({
          layer: "policy",
          code: "after-latest",
          message: `${contract.label ?? contract.component} does not accept dates after ${contract.max}.`,
          path: "/value",
        });
      }
    }
  }

  // Compared in one canonical form, so a bound given without seconds still
  // admits the minute it names.
  if (contract.kind === "dateTime" && (contract.min || contract.max)) {
    const at = value as string;
    const earliest = typeof contract.min === "string" ? canonicalDateTime(contract.min) : null;
    const latest = typeof contract.max === "string" ? canonicalDateTime(contract.max) : null;
    if (earliest && at < earliest) {
      return fail({
        layer: "policy",
        code: "before-earliest",
        message: `${contract.label ?? contract.component} does not accept times before ${contract.min}.`,
        path: "/value",
      });
    }
    if (latest && at > latest) {
      return fail({
        layer: "policy",
        code: "after-latest",
        message: `${contract.label ?? contract.component} does not accept times after ${contract.max}.`,
        path: "/value",
      });
    }
  }

  /*
   * Text limits are policy, not shape: the field really will refuse these, so
   * a caller needs to be told which rule it hit rather than that its JSON was
   * malformed.
   */
  if (contract.kind === "text" && typeof value === "string") {
    if (contract.maxLength && value.length > contract.maxLength) {
      return fail({
        layer: "policy",
        code: "too-long",
        message: `${contract.label ?? contract.component} takes at most ${contract.maxLength} characters; this is ${value.length}.`,
        path: "/value",
      });
    }
    if (contract.pattern) {
      let matches = true;
      try {
        matches = new RegExp(contract.pattern).test(value);
      } catch {
        // A pattern the field itself could not compile is not the caller's
        // fault, so it is not held against them.
        matches = true;
      }
      if (!matches) {
        return fail({
          layer: "policy",
          code: "pattern-mismatch",
          message: `${contract.label ?? contract.component} does not accept that format.`,
          path: "/value",
        });
      }
    }
  }

  if (contract.kind === "multiChoice" && contract.maxSelected) {
    const picked = (value as string[]).length;
    if (picked > contract.maxSelected) {
      return fail({
        layer: "policy",
        code: "too-many-selected",
        message: `${contract.component} takes at most ${contract.maxSelected} option(s); ${picked} were given.`,
        path: "/value",
      });
    }
  }

  // 5. plausibility — allowed, but worth saying out loud
  if (contract.kind === "text" && contract.maxLength) {
    const length = (value as string).length;
    if (length === contract.maxLength) {
      warnings.push({
        layer: "plausibility",
        code: "at-limit",
        message: `The value is exactly at the ${contract.maxLength}-character limit, so it may have been truncated.`,
        path: "/value",
      });
    }
  }

  if (contract.kind === "text" && typeof value === "string" && value.trim() === "" && (value as string).length > 0) {
    warnings.push({
      layer: "plausibility",
      code: "whitespace-only",
      message: "The value is only whitespace, which reads as empty but is not.",
      path: "/value",
    });
  }

  if (contract.required && isEmpty(value)) {
    warnings.push({
      layer: "plausibility",
      code: "emptying-required-field",
      message: `${contract.label ?? contract.component} is required, and this leaves it empty.`,
    });
  }

  return ok({ action: "setValue", value }, warnings);
}

const isEmpty = (value: FieldCommand["value"]): boolean =>
  value === "" || value === null || value === undefined || (Array.isArray(value) && value.length === 0);

/** The one policy check every operation shares. */
function policyRefusal(
  contract: FieldContract,
  action: FieldOperationName,
): ValidationResult<FieldCommand> | null {
  // Focusing a disabled field is harmless and sometimes useful; writing is not.
  if (action === "focus") return null;

  if (contract.disabled) {
    return fail({
      layer: "policy",
      code: "disabled",
      message: `${contract.label ?? contract.component} is disabled.`,
    });
  }
  if (contract.readOnly && (action === "setValue" || action === "clear")) {
    return fail({
      layer: "policy",
      code: "read-only",
      message: `${contract.label ?? contract.component} is read-only.`,
    });
  }
  return null;
}
