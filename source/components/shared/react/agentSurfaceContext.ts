"use client";

/*
 * How a component joins an <AgentSurface>, if there is one.
 *
 * Every operable component imports this, so it is kept to a context and two
 * hooks with type-only imports: an app that never renders an <AgentSurface>
 * pays for a `useContext` per component and nothing else. The validators,
 * executors and WebMCP code live behind AgentSurface.tsx, and are only in a
 * bundle that imports it.
 *
 * Components register *themselves*. That is the point: a page gets an agent
 * interface without its author writing a single tool definition, and without
 * one drifting from the UI, because the description is the component's own.
 */
import { createContext, useContext, useEffect, useRef } from "react";
import type { FieldContract, FieldHandleTarget, ProjectableAgent } from "../core/agent";

/** What a field hands the surface: what it accepts now, and how to write to it. */
export interface SurfaceFieldSource {
  readonly contract: FieldContract;
  /** The element or handle to write through, read when an action runs. */
  readonly target: () => HTMLInputElement | HTMLTextAreaElement | FieldHandleTarget | null;
}

/**
 * A grid's agent, described structurally: `shared/` cannot import the
 * DataGrid, and does not need to — anything with a schema, a validator and a
 * live contract of columns can join.
 */
export interface SurfaceGridAgent extends ProjectableAgent {
  contract(): {
    readonly columns: readonly {
      readonly id: string;
      readonly label: string;
      readonly type: string;
      readonly sortable: boolean;
      readonly filterable: boolean;
      readonly operators?: readonly string[];
      readonly options?: readonly unknown[];
      readonly restricted?: string;
    }[];
    readonly operations: readonly string[];
    readonly stats?: { readonly filteredRows?: number | null; readonly totalRows?: number | null };
    readonly state?: { readonly canUndo?: boolean };
  };
}

export interface SurfaceRegistrar {
  field(source: () => SurfaceFieldSource): () => void;
  grid(label: string | undefined, agent: SurfaceGridAgent): () => void;
}

export const AgentSurfaceRegistrar = createContext<SurfaceRegistrar | null>(null);

/** Whether this component is inside an <AgentSurface>. */
export const useInAgentSurface = (): boolean => useContext(AgentSurfaceRegistrar) !== null;

/**
 * Join the surface as a field, for as long as this component is mounted.
 *
 * `build` is read when an agent asks, not when the component renders, so a
 * field that has just become disabled is refused on the very next request.
 * `enabled: false` keeps a field out entirely — a password input is never
 * offered to an agent.
 */
export function useAgentSurfaceField(build: () => SurfaceFieldSource, enabled = true): void {
  const registrar = useContext(AgentSurfaceRegistrar);
  const latest = useRef(build);
  latest.current = build;
  useEffect(() => {
    if (!registrar || !enabled) return undefined;
    return registrar.field(() => latest.current());
  }, [registrar, enabled]);
}

/** Join the surface as a grid, once its agent exists. */
export function useAgentSurfaceGrid(agent: SurfaceGridAgent | null, label: string | undefined): void {
  const registrar = useContext(AgentSurfaceRegistrar);
  useEffect(() => {
    if (!registrar || !agent) return undefined;
    return registrar.grid(label, agent);
  }, [registrar, agent, label]);
}

/** The text of a label prop, when it is text. A ReactNode label has none to offer. */
export const labelText = (...candidates: unknown[]): string | undefined => {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return undefined;
};
