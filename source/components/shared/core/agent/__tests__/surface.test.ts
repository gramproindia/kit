/*
 * The page surface: addressing, the manifest, and the one WebMCP tool.
 * Every action must still go through the member's own validator.
 */
import { describe, expect, it, vi } from "vitest";

import {
  createAgentSurface,
  createFieldAgent,
  describeFieldContract,
  handleFieldExecutors,
  projectFieldAgent,
  registerSurfaceTool,
  type FieldContract,
  type ModelContext,
  type ProjectableAgent,
  type SurfaceMember,
} from "../index";

const teamContract: FieldContract = {
  component: "Select",
  kind: "choice",
  label: "Team",
  operations: ["setValue", "clear", "focus", "open", "close"],
  options: [
    { value: "eng", label: "Engineering" },
    { value: "sales", label: "Sales" },
    { value: "legal", label: "Legal", disabled: true },
  ],
};

/** A real field agent over a fake handle, so validation is the production one. */
function teamMember() {
  const calls: unknown[] = [];
  const handle = { setValue: (v: unknown) => calls.push(["setValue", v]), clear: () => calls.push(["clear"]) };
  const member: SurfaceMember = {
    kind: "field",
    component: "Select",
    label: "Team",
    agent: projectFieldAgent(() =>
      createFieldAgent({ contract: teamContract, executors: handleFieldExecutors(() => handle) }),
    ),
    describe: () => describeFieldContract(teamContract),
  };
  return { member, calls };
}

function fakeAgent(over: Partial<ProjectableAgent> = {}): ProjectableAgent {
  return {
    schema: () => ({ type: "object" }),
    validate: () => ({ status: "done", commands: [{ intent: {}, explain: { summary: "did it" } }], warnings: [] }),
    execute: async () => ({ status: "done", commands: [{ intent: {}, explain: { summary: "did it" } }], warnings: [] }),
    ...over,
  };
}

const plain = (label: string, agent = fakeAgent()): SurfaceMember => ({
  kind: "field",
  component: "Input",
  label,
  agent,
  describe: () => ({}),
});

describe("createAgentSurface", () => {
  it("gives members readable ids from their labels, and keeps duplicates apart", () => {
    const surface = createAgentSurface();
    expect(surface.register(plain("Due date")).id).toBe("due-date");
    expect(surface.register(plain("Due date")).id).toBe("due-date-2");
    expect(surface.register({ ...plain(""), component: "DataGrid" }).id).toBe("datagrid");
  });

  it("forgets a member when it unmounts, and tells subscribers", () => {
    const surface = createAgentSurface();
    const seen = vi.fn();
    surface.subscribe(seen);
    const reg = surface.register(plain("Name"));
    reg.unregister();
    expect(surface.entries()).toHaveLength(0);
    expect(seen).toHaveBeenCalledTimes(2);
  });

  it("describes each member with what it holds and accepts", () => {
    const surface = createAgentSurface();
    surface.register(teamMember().member);
    const [team] = surface.manifest().members as Array<Record<string, any>>;
    expect(team).toMatchObject({ id: "team", kind: "field", component: "Select", label: "Team" });
    expect(team.constraints.holds).toBe("choice");
    expect(team.constraints.options).toContainEqual({ value: "legal", label: "Legal", disabled: true });
    expect(Object.keys(team.operations)).toContain("setValue");
  });
});

describe("surface.run", () => {
  it("refuses an unknown target, and suggests the near one", async () => {
    const surface = createAgentSurface();
    surface.register(teamMember().member);
    const result = await surface.run("teams", [{ action: "setValue", value: "eng" }]);
    expect(result).toMatchObject({ ok: false, code: "unknown-target", suggestion: 'Did you mean "team"?' });
  });

  it("goes through the field's own validator, and does nothing when it refuses", async () => {
    const surface = createAgentSurface();
    const { member, calls } = teamMember();
    surface.register(member);
    const refused = await surface.run("team", [{ action: "setValue", value: "legal" }]);
    expect(refused).toMatchObject({ ok: false, status: "rejected", code: "option-disabled", layer: "policy" });
    const nearMiss = await surface.run("team", [{ action: "setValue", value: "enginering" }]);
    expect(nearMiss).toMatchObject({ ok: false, layer: "reference" });
    expect(String(nearMiss.suggestion)).toMatch(/eng/);
    expect(calls).toEqual([]);
  });

  it("applies what the validator accepts, and says what it did", async () => {
    const surface = createAgentSurface();
    const { member, calls } = teamMember();
    surface.register(member);
    const result = await surface.run("team", [{ action: "setValue", value: "sales" }]);
    expect(result).toMatchObject({ ok: true, status: "done", message: 'Set Team to "sales"' });
    expect(calls).toEqual([["setValue", "sales"]]);
  });

  it("stops at a confirmation instead of running it", async () => {
    const execute = vi.fn();
    const surface = createAgentSurface();
    surface.register(
      plain(
        "Invoices",
        fakeAgent({
          validate: () => ({
            status: "needs-confirmation",
            commands: [{ intent: {}, explain: { summary: "export" } }],
            warnings: [],
            confirm: { code: "export", message: "Download 2,000 rows?" },
          }),
          execute,
        }),
      ),
    );
    const result = await surface.run("invoices", [{ action: "export" }]);
    expect(result).toMatchObject({ ok: false, status: "needs-confirmation", message: "Download 2,000 rows?" });
    expect(execute).not.toHaveBeenCalled();
  });
});

describe("hostile input", () => {
  it("does not reach Object.prototype through a target name", async () => {
    const surface = createAgentSurface();
    surface.register(teamMember().member);
    for (const target of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
      expect(await surface.run(target, [{ action: "setValue", value: "eng" }])).toMatchObject({
        ok: false,
        code: "unknown-target",
      });
    }
  });

  it("refuses intents that are not a list, are empty, or are not objects", async () => {
    const surface = createAgentSurface();
    const { member, calls } = teamMember();
    surface.register(member);
    for (const intents of [undefined, null, "setValue", { action: "setValue" }, []]) {
      expect((await surface.run("team", intents)).ok).toBe(false);
    }
    for (const intent of [null, 42, "eng", { action: "setValue", value: { __proto__: { polluted: true } } }]) {
      expect((await surface.run("team", [intent])).ok).toBe(false);
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(calls).toEqual([]);
  });

  it("holds a caller to eight operations per call, whatever the schema was ignored", async () => {
    const surface = createAgentSurface();
    const { member, calls } = teamMember();
    surface.register(member);
    const many = Array.from({ length: 9 }, () => ({ action: "setValue", value: "eng" }));
    expect(await surface.run("team", many)).toMatchObject({ ok: false, code: "too-many-intents" });
    expect(calls).toEqual([]);
  });

  it("refuses an operation the field does not publish", async () => {
    const surface = createAgentSurface();
    const { member, calls } = teamMember();
    surface.register(member);
    expect((await surface.run("team", [{ action: "eval", value: "alert(1)" }])).ok).toBe(false);
    expect(calls).toEqual([]);
  });
});

describe("registerSurfaceTool", () => {
  const fakeContext = () => {
    const tools: Array<{ name: string; execute(input: unknown): Promise<any> }> = [];
    const modelContext: ModelContext = { registerTool: (tool) => void tools.push(tool as never) };
    return { modelContext, tools };
  };

  it("registers one tool per page, even when registered twice (StrictMode)", () => {
    const { modelContext, tools } = fakeContext();
    const surface = createAgentSurface();
    registerSurfaceTool(() => surface, { modelContext });
    registerSurfaceTool(() => surface, { modelContext });
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("operate_page");
  });

  it("describes the page and operates it by id", async () => {
    const { modelContext, tools } = fakeContext();
    const surface = createAgentSurface();
    const { member, calls } = teamMember();
    surface.register(member);
    registerSurfaceTool(() => surface, { modelContext });

    const described = await tools[0].execute({ action: "describe" });
    expect(described.structuredContent.manifest.members[0].id).toBe("team");
    expect(described.content[0].text).toMatch(/team \(Select, "Team"\)/);

    const operated = await tools[0].execute({ action: "operate", target: "team", intents: [{ action: "setValue", value: "eng" }] });
    expect(operated.isError).toBe(false);
    expect(calls).toEqual([["setValue", "eng"]]);
  });

  it("follows the surface that is mounted now, not the one it was first given", async () => {
    const { modelContext, tools } = fakeContext();
    const first = createAgentSurface();
    const second = createAgentSurface();
    second.register(plain("Name"));
    const reg = registerSurfaceTool(() => first, { modelContext });
    reg.release();
    registerSurfaceTool(() => second, { modelContext });
    const described = await tools[0].execute({ action: "describe" });
    expect(described.structuredContent.manifest.members.map((m: { id: string }) => m.id)).toEqual(["name"]);
  });

  it("declines politely once its surface has gone", async () => {
    const { modelContext, tools } = fakeContext();
    const reg = registerSurfaceTool(() => createAgentSurface(), { modelContext });
    reg.release();
    const result = await tools[0].execute({ action: "describe" });
    expect(result.structuredContent).toMatchObject({ ok: false, status: "declined" });
  });

  it("refuses an action it does not know", async () => {
    const { modelContext, tools } = fakeContext();
    registerSurfaceTool(() => createAgentSurface(), { modelContext });
    const result = await tools[0].execute({ action: "delete-everything" });
    expect(result.structuredContent).toMatchObject({ ok: false, code: "unknown-action" });
  });

  it("reports, rather than throws, when the browser has no WebMCP", () => {
    expect(registerSurfaceTool(() => null, { modelContext: {} as ModelContext }).registered).toBe(false);
  });
});
