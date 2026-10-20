/*
 * A page that describes itself to an agent.
 *
 * Browser agents operate apps today by reading pixels or the accessibility
 * tree and guessing. Neither says what a control will accept — a date field
 * is "textbox", not "2025 only" — and neither stops a wrong click. A page
 * built from these components already knows, per instance, what each one
 * holds, what it accepts and what it refuses. This collects that into one
 * live manifest, and routes every action back through the component's own
 * validator.
 *
 * Framework-free. Members arrive as `ProjectableAgent`s plus a `describe()`;
 * the React side (shared/react/AgentSurface.tsx) is what turns mounted
 * components into members. Nothing here knows about the DOM.
 *
 * The guarantees are the ones `runProjected` already gives a single component:
 * no repair, no retry, confirmation before anything irreversible, refusals
 * named by the layer that made them. The surface adds addressing, not a
 * second path in.
 */

import { fieldOperations, type FieldCommand, type FieldContract, type FieldIntent } from "./field";
import type { FieldAgent } from "./field-agent";
import {
  runProjected,
  toToolResult,
  type ModelContext,
  type ProjectableAgent,
  type ProjectedOutcome,
  type RegistrationResult,
  type ToolCallLog,
  type ToolResultPayload,
} from "./webmcp";
import type { JsonSchema, ValidationIssue } from "./types";

export const SURFACE_VERSION = 1;
export const SURFACE_TOOL_NAME = "operate_page";
const MAX_INTENTS = 8;

// ------------------------------------------------------------------ members

export interface SurfaceMember {
  readonly kind: "field" | "grid";
  /** The component, as the docs name it: "DatePicker", "Select". */
  readonly component: string;
  /** What a person sees it called. Used to build its id. */
  readonly label?: string;
  /** The agent every action goes through. */
  readonly agent: ProjectableAgent;
  /** Live: constraints, operations and their input schemas, as plain data. */
  describe(): Record<string, unknown>;
  /** Extra fields for a successful result, e.g. rows now showing. */
  summarise?(): Record<string, unknown>;
}

export interface SurfaceEntry {
  readonly id: string;
  readonly member: SurfaceMember;
}

export interface SurfaceManifest {
  readonly surfaceVersion: number;
  readonly members: readonly Record<string, unknown>[];
}

export interface AgentSurfaceHandle {
  /** Add a member. Its id is derived from its label and stays fixed while it is mounted. */
  register(member: SurfaceMember): { id: string; unregister(): void };
  entries(): readonly SurfaceEntry[];
  /** Everything on the page that can be operated, with what each accepts. */
  manifest(): SurfaceManifest;
  /** Validate, confirm and execute against one member. Never bypasses its validator. */
  run(target: string, intents: unknown): Promise<ToolResultPayload>;
  /** Called whenever a member arrives or leaves. Returns an unsubscribe. */
  subscribe(listener: () => void): () => void;
}

/** "Due date" → "due-date". Readable ids an agent can quote back. */
const slug = (text: string) =>
  text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "member";

export function createAgentSurface(): AgentSurfaceHandle {
  const members = new Map<string, SurfaceMember>();
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch {
        /* a broken observer must not break registration */
      }
    }
  };

  const nearest = (wanted: string) => {
    const ids = [...members.keys()];
    const lower = wanted.toLowerCase();
    return ids.find((id) => id.includes(lower) || lower.includes(id)) ?? null;
  };

  return {
    register(member) {
      const base = slug(member.label || member.component);
      let id = base;
      for (let n = 2; members.has(id); n += 1) id = `${base}-${n}`;
      members.set(id, member);
      notify();
      return {
        id,
        unregister() {
          if (members.get(id) === member) {
            members.delete(id);
            notify();
          }
        },
      };
    },

    entries: () => [...members].map(([id, member]) => ({ id, member })),

    manifest: () => ({
      surfaceVersion: SURFACE_VERSION,
      members: [...members].map(([id, member]) => ({
        id,
        kind: member.kind,
        component: member.component,
        ...(member.label ? { label: member.label } : {}),
        ...member.describe(),
      })),
    }),

    async run(target, intents) {
      const member = typeof target === "string" ? members.get(target) : undefined;
      if (!member) {
        const near = typeof target === "string" ? nearest(target) : null;
        return {
          ok: false,
          status: "rejected",
          code: "unknown-target",
          layer: "reference",
          message: `Nothing on this page is called ${JSON.stringify(target)}.`,
          ...(near ? { suggestion: `Did you mean "${near}"?` } : {}),
          available: [...members.keys()],
        };
      }
      // The tool's schema says at most eight; a caller that ignores the schema
      // is held to it here, not trusted to have read it.
      if (Array.isArray(intents) && intents.length > MAX_INTENTS) {
        return {
          ok: false,
          status: "rejected",
          code: "too-many-intents",
          layer: "schema",
          message: `At most ${MAX_INTENTS} operations per call; this one had ${intents.length}.`,
        };
      }
      return runProjected(member.agent, intents, {
        summarise: member.summarise ? () => member.summarise!() : undefined,
      });
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// ---------------------------------------------------------- field adaptation

const quote = (value: unknown) => {
  if (Array.isArray(value)) return value.map((v) => JSON.stringify(v)).join(", ");
  if (value && typeof value === "object") {
    const range = value as { start?: unknown; end?: unknown };
    if ("start" in range) return `${range.start} to ${range.end}`;
  }
  return JSON.stringify(value);
};

/** One accepted field command, in words. */
function summarise(label: string, command: FieldCommand): string {
  switch (command.action) {
    case "setValue":
      return `Set ${label} to ${quote(command.value)}`;
    case "clear":
      return `Cleared ${label}`;
    case "focus":
      return `Focused ${label}`;
    case "open":
      return `Opened ${label}`;
    case "close":
      return `Closed ${label}`;
    default:
      return `${command.action} ${label}`;
  }
}

/**
 * A field's agent in the shape a surface or a WebMCP tool expects.
 *
 * `getAgent` is called per request, so a field whose props changed since it
 * mounted — now disabled, now with different options — is judged by what it
 * is now.
 */
export function projectFieldAgent(getAgent: () => FieldAgent): ProjectableAgent {
  const label = (agent: FieldAgent) => agent.contract.label || agent.contract.component;

  return {
    schema: () => {
      const operations = fieldOperations(getAgent().contract);
      return {
        oneOf: Object.values(operations).map((op) => ({
          type: "object",
          required: ["action"],
          properties: {
            action: { const: op.name, description: op.summary },
            ...(op.input?.properties ?? {}),
          },
          ...(op.input?.required ? { required: ["action", ...op.input.required] } : {}),
        })),
      } as JsonSchema;
    },

    validate(intents) {
      const agent = getAgent();
      const list = intents as FieldIntent[];
      const commands = [];
      const warnings: ValidationIssue[] = [];
      for (const intent of list) {
        const verdict = agent.check(intent);
        if (!verdict.ok) {
          return {
            status: "rejected",
            reason: verdict.reason ?? "Refused.",
            code: verdict.code ?? "rejected",
            layer: verdict.layer ?? "policy",
            ...(verdict.suggestion ? { suggestion: verdict.suggestion } : {}),
          } as ProjectedOutcome;
        }
        warnings.push(...verdict.warnings);
        commands.push({ intent, explain: { summary: summarise(label(agent), verdict.command!) } });
      }
      return { status: "done", commands, warnings };
    },

    async execute(intents) {
      const agent = getAgent();
      const commands = [];
      const warnings: ValidationIssue[] = [];
      for (const intent of intents as FieldIntent[]) {
        const result = await agent.run(intent);
        if (!result.ok) {
          return {
            status: "rejected",
            reason: result.reason ?? "Refused.",
            code: result.code ?? "rejected",
            layer: result.layer ?? "policy",
            ...(result.suggestion ? { suggestion: result.suggestion } : {}),
          } as ProjectedOutcome;
        }
        warnings.push(...result.warnings);
        commands.push({ intent, explain: { summary: summarise(label(agent), result.command!) } });
      }
      return { status: "done", commands, warnings };
    },
  };
}

/** What a field tells an agent about itself: what it holds, what it accepts. */
export function describeFieldContract(contract: FieldContract): Record<string, unknown> {
  const constraints: Record<string, unknown> = { holds: contract.kind };
  for (const key of ["required", "disabled", "readOnly"] as const) if (contract[key]) constraints[key] = true;
  if (contract.min !== undefined) constraints.min = contract.min;
  if (contract.max !== undefined) constraints.max = contract.max;
  if (contract.step !== undefined) constraints.step = contract.step;
  if (contract.maxLength !== undefined) constraints.maxLength = contract.maxLength;
  if (contract.pattern !== undefined) constraints.pattern = contract.pattern;
  if (contract.options) {
    constraints.options = contract.options.map((o) => ({
      value: o.value,
      label: o.label,
      ...(o.disabled ? { disabled: true } : {}),
    }));
  }
  if (contract.maxSelected !== undefined) constraints.maxSelected = contract.maxSelected;

  const operations = fieldOperations(contract);
  return {
    constraints,
    operations: Object.fromEntries(
      Object.values(operations).map((op) => [op.name, { summary: op.summary, ...(op.input ? { input: op.input } : {}) }]),
    ),
  };
}

// ------------------------------------------------------------ WebMCP tool

/*
 * One tool for the page, registered once.
 *
 * WebMCP has no way to unregister a tool, throws on a duplicate name, and
 * React's StrictMode runs effects twice — so the tool is registered once per
 * (modelContext, name) and looks up whichever surface is current when it is
 * called. A surface that unmounts and remounts takes the tool over rather
 * than fighting it.
 *
 * Its schema is fixed, because the page is not: components mount and
 * unmount, and a registered schema cannot change. `describe` returns the live
 * manifest, including each member's own input schema; `operate` sends intents
 * to one member by id.
 */
const registered = new WeakMap<ModelContext, Map<string, { current: () => AgentSurfaceHandle | null }>>();

export const SURFACE_TOOL_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["action"],
  properties: {
    action: {
      type: "string",
      enum: ["describe", "operate"],
      description:
        "describe: list everything on this page that can be operated, what each holds and accepts. " +
        "operate: send intents to one of them.",
    },
    target: { type: "string", description: "With operate: a member id from describe." },
    intents: {
      type: "array",
      minItems: 1,
      maxItems: MAX_INTENTS,
      description:
        "With operate: operations for that member, in the shape its `input` schema from describe gives, applied in order.",
      items: { type: "object" },
    },
  },
};

const SURFACE_DESCRIPTION =
  "Operate the form fields and data grids on this page. Call describe first: it lists each " +
  "control with what it holds and accepts — options, date ranges, limits — and the operations it " +
  "supports. Then operate one by id. Every request is validated by the control itself before " +
  "anything changes; a request it cannot accept is refused with the reason and, where there is " +
  "one, the nearest valid value. Nothing irreversible runs without confirmation.";

export interface RegisterSurfaceToolOptions {
  name?: string;
  modelContext?: ModelContext;
  onCall?: (entry: ToolCallLog) => void;
}

/** Point the page's tool at `getSurface`, registering it if this is the first time. */
export function registerSurfaceTool(
  getSurface: () => AgentSurfaceHandle | null,
  options: RegisterSurfaceToolOptions = {},
): RegistrationResult & { release(): void } {
  const name = options.name ?? SURFACE_TOOL_NAME;
  const modelContext =
    options.modelContext ?? (typeof document === "undefined" ? undefined : document.modelContext);

  if (typeof modelContext?.registerTool !== "function") {
    return {
      registered: false,
      toolName: name,
      reason: "document.modelContext is unavailable in this browser.",
      release() {},
    };
  }

  let byName = registered.get(modelContext);
  if (!byName) {
    byName = new Map();
    registered.set(modelContext, byName);
  }

  const pointer = { current: getSurface };
  const existing = byName.get(name);
  if (existing) {
    existing.current = getSurface;
  } else {
    byName.set(name, pointer);
    const slot = pointer;
    modelContext.registerTool({
      name,
      description: SURFACE_DESCRIPTION,
      inputSchema: SURFACE_TOOL_SCHEMA,
      async execute(rawInput: unknown) {
        const input = (rawInput ?? {}) as { action?: unknown; target?: unknown; intents?: unknown };
        const surface = slot.current();
        let payload: ToolResultPayload;
        if (!surface) {
          payload = { ok: false, status: "declined", message: "This page has no operable controls right now." };
        } else if (input.action === "describe") {
          const manifest = surface.manifest();
          payload = {
            ok: true,
            status: "done",
            message: `${manifest.members.length} operable control(s): ${manifest.members
              .map((m) => `${m.id} (${m.component}${m.label ? `, "${m.label}"` : ""})`)
              .join("; ")}.`,
            manifest,
          };
        } else if (input.action === "operate") {
          payload = await surface.run(String(input.target ?? ""), input.intents);
        } else {
          payload = {
            ok: false,
            status: "rejected",
            code: "unknown-action",
            message: 'action must be "describe" or "operate".',
          };
        }
        try {
          options.onCall?.({ input: rawInput, result: payload });
        } catch {
          /* observers never break a call */
        }
        return toToolResult(payload);
      },
    });
  }

  const slot = byName.get(name)!;
  return {
    registered: true,
    toolName: name,
    inputSchema: SURFACE_TOOL_SCHEMA,
    release() {
      // Leave the tool registered (it cannot be removed) but stop it pointing here.
      if (slot.current === getSurface) slot.current = () => null;
    },
  };
}
