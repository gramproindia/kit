/*
 * The authored overlays validate against the schema meant for them.
 *
 * They used to point at `passport-v1.schema.json`, which describes the merged
 * passport. An overlay is a partial, so an editor validating one reported all
 * eight generated fields as missing, and `additionalProperties: false` made
 * errors of the four keys only an overlay has — `component`, `propNotes`,
 * `notImplemented`, `$operationsNote`. Twenty-seven files of permanent
 * squiggles train people to ignore the squiggles, which is the real cost.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const at = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

const COMPONENTS = at("../../../source/components");
const OVERLAY_SCHEMA = JSON.parse(
  readFileSync(at("../../../schema/passport-overlay-v1.schema.json"), "utf8"),
) as {
  required?: string[];
  additionalProperties?: boolean;
  properties: Record<string, { $ref?: string }>;
};
const MERGED_SCHEMA = JSON.parse(
  readFileSync(at("../../../schema/passport-v1.schema.json"), "utf8"),
) as Record<string, unknown>;

const overlays = readdirSync(COMPONENTS)
  .filter((folder) => existsSync(`${COMPONENTS}/${folder}/passport.manual.json`))
  .map((folder) => ({
    folder,
    body: JSON.parse(readFileSync(`${COMPONENTS}/${folder}/passport.manual.json`, "utf8")) as Record<
      string,
      unknown
    >,
  }));

describe("the overlay schema", () => {
  it("covers every component", () => {
    expect(overlays.length).toBe(
      readdirSync(COMPONENTS).filter((folder) => folder !== "shared").length,
    );
  });

  it("resolves every $ref into the merged schema", () => {
    for (const [name, definition] of Object.entries(OVERLAY_SCHEMA.properties)) {
      if (!definition.$ref) continue;
      const pointer = definition.$ref.split("#")[1] ?? "";
      let node: unknown = MERGED_SCHEMA;
      for (const segment of pointer.split("/").filter(Boolean)) {
        node = (node as Record<string, unknown>)?.[segment];
      }
      expect(node, `${name} -> ${definition.$ref}`).toBeDefined();
    }
  });

  it("forbids keys it does not declare, so a typo is an error rather than a silent no-op", () => {
    expect(OVERLAY_SCHEMA.additionalProperties).toBe(false);
  });
});

describe.each(overlays)("$folder/passport.manual.json", ({ folder, body }) => {
  it("points at the overlay schema, not the merged one", () => {
    expect(body.$schema).toBe("../../../schema/passport-overlay-v1.schema.json");
  });

  it("uses only keys the overlay schema declares", () => {
    const declared = new Set(Object.keys(OVERLAY_SCHEMA.properties));
    const undeclared = Object.keys(body).filter((key) => !declared.has(key));
    expect(undeclared).toEqual([]);
  });

  it("carries everything the overlay schema requires", () => {
    for (const key of OVERLAY_SCHEMA.required ?? []) {
      expect(body, key).toHaveProperty(key);
    }
  });

  it("names the component whose folder it sits in", () => {
    const normalise = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");
    // MultiSelect and Select share the combobox folder, and the range picker
    // shares date-picker, so the folder is a prefix of the name rather than
    // equal to it in a couple of cases.
    const name = normalise(String(body.component));
    const dir = normalise(folder);
    expect(name.includes(dir) || dir.includes(name), `${body.component} in ${folder}/`).toBe(true);
  });
});
