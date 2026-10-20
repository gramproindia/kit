"use client";

/*
 * <AgentSurface>: the page describes itself to an agent.
 *
 *   <AgentSurface>
 *     <Input label="Name" />
 *     <Select label="Team" options={teams} />
 *     <DatePicker label="Due date" minDate={today} />
 *     <DataGrid data={rows} columns={columns} />
 *   </AgentSurface>
 *
 * Every operable component inside registers itself, with what it holds and
 * accepts as it is rendered now. In a browser with WebMCP, one tool,
 * `operate_page`, is registered: `describe` returns that live manifest,
 * `operate` sends intents to one component by id. Each request goes through
 * that component's own validator; nothing reaches the DOM that the component
 * would not accept from a person.
 *
 * Without WebMCP nothing is registered and nothing breaks. `useAgentSurface()`
 * hands the same surface to an application that runs its own agent loop.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  autoFieldExecutors,
  createAgentSurface,
  createFieldAgent,
  describeFieldContract,
  projectFieldAgent,
  registerSurfaceTool,
  type AgentSurfaceHandle as Surface,
  type ToolCallLog,
} from "../core/agent";
import {
  AgentSurfaceRegistrar,
  type SurfaceFieldSource,
  type SurfaceGridAgent,
  type SurfaceRegistrar,
} from "./agentSurfaceContext";

const SurfaceContext = createContext<Surface | null>(null);

export interface AgentSurfaceProps {
  children: ReactNode;
  /** Register the `operate_page` WebMCP tool when the browser has it. Default true. */
  webmcp?: boolean;
  /** Override the tool name. One name per page: WebMCP cannot unregister a tool. */
  toolName?: string;
  /** Observe every tool call, for a UI log or a test. */
  onCall?: (entry: ToolCallLog) => void;
}

/** A field as a member: rebuilt from its current source on every request. */
function fieldMember(source: () => SurfaceFieldSource) {
  const first = source().contract;
  const agentNow = () => {
    const { contract, target } = source();
    return createFieldAgent({
      contract,
      executors: autoFieldExecutors(target, {
        checkable: contract.kind === "boolean",
        component: contract.component,
      }),
    });
  };
  return {
    kind: "field" as const,
    component: first.component,
    label: first.label,
    agent: projectFieldAgent(agentNow),
    describe: () => describeFieldContract(source().contract),
  };
}

/** A grid as a member: its columns, operations and the schema of one intent. */
function gridMember(label: string | undefined, agent: SurfaceGridAgent) {
  return {
    kind: "grid" as const,
    component: "DataGrid",
    label,
    agent,
    describe: () => {
      const contract = agent.contract();
      return {
        columns: contract.columns
          // A policy-restricted column is not offered; the grid refuses it anyway.
          .filter((column) => !column.restricted)
          .map((column) => ({
            id: column.id,
            label: column.label,
            type: column.type,
            ...(column.sortable ? { sortable: true } : {}),
            ...(column.filterable ? { filterable: true, operators: column.operators } : {}),
            ...(column.options ? { options: column.options } : {}),
          })),
        operations: contract.operations,
        rows: { showing: contract.stats?.filteredRows, total: contract.stats?.totalRows },
        input: agent.schema(),
      };
    },
    summarise: () => {
      const contract = agent.contract();
      return {
        rowsShowing: contract.stats?.filteredRows,
        rowsTotal: contract.stats?.totalRows,
        canUndo: contract.state?.canUndo,
      };
    },
  };
}

export function AgentSurface({ children, webmcp = true, toolName, onCall }: AgentSurfaceProps) {
  const [surface] = useState(createAgentSurface);

  const registrar = useMemo<SurfaceRegistrar>(
    () => ({
      field: (source) => surface.register(fieldMember(source)).unregister,
      grid: (label, agent) => surface.register(gridMember(label, agent)).unregister,
    }),
    [surface],
  );

  useEffect(() => {
    if (!webmcp) return undefined;
    const registration = registerSurfaceTool(() => surface, { name: toolName, onCall });
    return registration.release;
  }, [surface, webmcp, toolName, onCall]);

  return (
    <SurfaceContext.Provider value={surface}>
      <AgentSurfaceRegistrar.Provider value={registrar}>{children}</AgentSurfaceRegistrar.Provider>
    </SurfaceContext.Provider>
  );
}

/**
 * The surface in scope, or null outside an <AgentSurface>.
 *
 * For an application that runs its own agent: `manifest()` is what to put in
 * front of the model, `run(id, intents)` is how to act on its answer.
 */
export function useAgentSurface(): Surface | null {
  return useContext(SurfaceContext);
}
