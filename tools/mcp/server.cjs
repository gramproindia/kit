#!/usr/bin/env node
/*
 * An MCP server over the component catalogue.
 *
 * A coding agent asked to build a page has two ways to learn an API: read the
 * source, which costs a lot of context and invites invention, or be told. This
 * tells it — one component at a time, from the passport that was generated
 * from the source and cannot drift from it.
 *
 * It also marks its own homework. `validate_usage` checks written JSX against
 * the passports, which catches the failure that matters: a prop the model
 * remembered from somewhere rather than read here. That was the only mistake
 * in the experiment that justified building this — every type, union value and
 * handler signature the passport carried came out right, and the one error was
 * an invented prop.
 *
 * No dependencies on purpose. MCP is newline-delimited JSON-RPC over stdio,
 * which is a few hundred lines, and a server that ships inside a library every
 * consumer installs should not drag an SDK along for the ride.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { figmaFrame } = require("./figma.cjs");

const CATALOGUE = path.join(__dirname, "..", "..", "source", "components");
const REFERENCES = path.join(__dirname, "..", "..", ".gbs", "skills", "gbs-components", "references");

/** The newest protocol revision this server knows. Older clients get theirs back. */
const PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED_PROTOCOLS = new Set(["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"]);

// --------------------------------------------------------------- catalogue

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const componentFolders = () =>
  fs
    .readdirSync(CATALOGUE, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(CATALOGUE, e.name, "passport.json")))
    .map((e) => e.name)
    .sort();

/** Resolve a name the way an agent would write it: "DataGrid", "data-grid", "datagrid". */
function findFolder(name) {
  const wanted = String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const folder of componentFolders()) {
    if (folder.replace(/[^a-z0-9]/g, "") === wanted) return folder;
    const passport = readJson(path.join(CATALOGUE, folder, "passport.json"));
    const names = [passport.identity.component, ...(passport.identity.exports || [])];
    if (names.some((n) => String(n).toLowerCase() === wanted)) return folder;
  }
  return null;
}

/*
 * Most passports carry no `purpose`, so the README's opening line stands in.
 * It is the sentence a human wrote about what the component is for, which is
 * exactly what an agent needs to pick one.
 */
function purposeOf(folder, passport) {
  if (passport.purpose && passport.purpose.trim()) return passport.purpose.trim();
  const readme = path.join(CATALOGUE, folder, "README.md");
  if (!fs.existsSync(readme)) return "";
  const line = fs
    .readFileSync(readme, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#") && !l.startsWith("<!--"));
  return line ? line.replace(/\s+/g, " ") : "";
}

// -------------------------------------------------------------------- tools

function listComponents() {
  return componentFolders().map((folder) => {
    const passport = readJson(path.join(CATALOGUE, folder, "passport.json"));
    return {
      component: passport.identity.component,
      folder,
      exports: passport.identity.exports || [],
      purpose: purposeOf(folder, passport),
    };
  });
}

/**
 * The passport, trimmed to what writing code needs.
 *
 * The whole file averages 8.6 KB and runs to 26 KB; most of that is provenance
 * an agent cannot act on. What it can act on is the shape: names, types, the
 * union values for enum props, which are required, and the handler signatures.
 */
function getComponent(name) {
  const folder = findFolder(name);
  if (!folder) {
    return { error: `No component named "${name}". Call list_components for the catalogue.` };
  }
  const p = readJson(path.join(CATALOGUE, folder, "passport.json"));
  return {
    component: p.identity.component,
    folder,
    exports: p.identity.exports || [],
    importFrom: `@/component-lib/${folder}`,
    purpose: purposeOf(folder, p),
    props: (p.props || []).map((prop) => ({
      name: prop.name,
      type: prop.typeText || prop.type,
      values: prop.values,
      required: prop.required || undefined,
      default: prop.default,
      description: prop.description,
    })),
    events: (p.events || []).map((e) => ({
      name: e.name,
      signature: e.signature,
      description: e.description,
    })),
    slots: p.slots || [],
    states: p.states || [],
    composition: p.composition || {},
    accessibility: p.accessibility || {},
  };
}

/** The README's code fences: how the component is meant to be used. */
function getExample(name) {
  const folder = findFolder(name);
  if (!folder) return { error: `No component named "${name}".` };
  const readme = path.join(CATALOGUE, folder, "README.md");
  if (!fs.existsSync(readme)) return { error: `No README for ${folder}.` };

  const blocks = [];
  const text = fs.readFileSync(readme, "utf8");
  const fence = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  while ((match = fence.exec(text))) blocks.push({ language: match[1] || "txt", code: match[2].trim() });
  return { component: folder, examples: blocks };
}

/** The authored guidance that ships with the agent skill. */
function getGuidance(topic) {
  const available = fs.existsSync(REFERENCES)
    ? fs.readdirSync(REFERENCES).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""))
    : [];
  if (!topic) return { topics: available };
  const file = path.join(REFERENCES, `${topic}.md`);
  if (!fs.existsSync(file)) return { error: `No guidance for "${topic}".`, topics: available };
  return { topic, text: fs.readFileSync(file, "utf8") };
}

/*
 * Check written JSX against the passports.
 *
 * Deliberately tolerant parsing rather than a real one: the agent hands over a
 * fragment, not a file, and the failure worth catching is a prop that does not
 * exist. Spread props and expressions are skipped rather than guessed at — a
 * validator that invents errors is worse than none.
 */
function validateUsage(code) {
  const source = String(code || "");
  const known = new Map();
  for (const folder of componentFolders()) {
    const p = readJson(path.join(CATALOGUE, folder, "passport.json"));
    const props = new Set((p.props || []).map((x) => x.name));
    for (const e of p.events || []) props.add(e.name);
    const required = (p.props || []).filter((x) => x.required).map((x) => x.name);
    for (const exported of [p.identity.component, ...(p.identity.exports || [])]) {
      known.set(exported, { folder, props, required, values: p.props || [] });
    }
  }

  const issues = [];
  const used = [];
  const opening = /<([A-Z][A-Za-z0-9]*)(?=[\s/>])/g;
  let match;

  while ((match = opening.exec(source))) {
    const [, name] = match;
    const entry = known.get(name);
    if (!entry) continue; // Not ours; the agent may compose with its own components.

    /*
     * Scan to the tag's own `>` rather than matching one. An attribute can
     * hold an arrow function — `onDismiss={() => {}}` — so the first `>` is
     * usually inside a brace, and a regex that stops there finds nothing.
     */
    let depth = 0;
    let quote = null;
    let end = -1;
    for (let i = match.index + match[0].length; i < source.length; i += 1) {
      const ch = source[i];
      if (quote) {
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
      } else if (ch === "{") {
        depth += 1;
      } else if (ch === "}") {
        depth -= 1;
      } else if (ch === ">" && depth === 0) {
        end = i;
        break;
      }
    }
    if (end === -1) continue; // Unterminated fragment; nothing reliable to say.

    const rawAttrs = source.slice(match.index + match[0].length, end);
    const attrs = [...rawAttrs.matchAll(/(?:^|\s)([a-zA-Z][a-zA-Z0-9:_-]*)(?=\s*=|\s|$)/g)].map(
      (m) => m[1],
    );
    used.push({ component: name, props: attrs });

    for (const attr of attrs) {
      if (entry.props.has(attr)) continue;
      if (attr.startsWith("data-") || attr.startsWith("aria-") || attr === "key") continue;
      /*
       * A wrong prop is usually a near miss for a real one — `dismissible`
       * for `onDismiss`, `onChange` for `onValueChange`. Matching on a shared
       * stem in either direction finds those; matching on a prefix does not,
       * because the handler's name starts with `on`.
       */
      const low = attr.toLowerCase();
      const stem = low.slice(0, Math.max(4, Math.round(low.length * 0.6)));
      const near = [...entry.props].filter((p) => {
        const other = p.toLowerCase();
        return other.includes(stem) || low.includes(other.replace(/^on/, "").slice(0, 5));
      });
      issues.push({
        component: name,
        prop: attr,
        problem: "not a prop of this component",
        didYouMean: near.slice(0, 4),
      });
    }

    for (const req of entry.required) {
      if (!attrs.includes(req) && !/\{\s*\.\.\./.test(rawAttrs)) {
        issues.push({ component: name, prop: req, problem: "required prop is missing" });
      }
    }
  }

  return {
    checked: used,
    issues,
    ok: issues.length === 0,
    summary: issues.length
      ? `${issues.length} problem(s) across ${used.length} element(s).`
      : `${used.length} element(s) check out against their passports.`,
  };
}

/*
 * Put components into the project the agent is working in.
 *
 * The CLI already knows where they belong — it finds an existing install or
 * follows the project's own layout — so this runs it rather than
 * reimplementing that judgement.
 */
function installComponents(names) {
  const list = Array.isArray(names) ? names : String(names || "").split(/[\s,]+/);
  const wanted = list.map((n) => String(n).trim()).filter(Boolean);
  if (wanted.length === 0) return { error: "Name at least one component." };

  const unknown = wanted.filter((n) => !findFolder(n));
  if (unknown.length) {
    return {
      error: `Not in the catalogue: ${unknown.join(", ")}. Call list_components.`,
    };
  }

  const cli = path.join(__dirname, "..", "..", "index.cjs");
  try {
    const output = execFileSync(process.execPath, [cli, "add", ...wanted], {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 120000,
    });
    // The installer prints the one manual step; the agent needs to see it.
    const importLine = (output.match(/^\s*@import .+$/gm) || []).map((l) => l.trim());
    return { installed: wanted, stylesheet: importLine, output: output.trim().slice(-1200) };
  } catch (error) {
    return { error: `Install failed: ${(error.stdout || error.message || "").toString().slice(-600)}` };
  }
}

const TOOLS = [
  {
    name: "list_components",
    description:
      "Every component in the catalogue with its exports and what it is for. Call this first when deciding which component a design calls for.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => listComponents(),
  },
  {
    name: "get_component",
    description:
      "A component's full contract: props with types and allowed values, which are required, event handler signatures, slots, states and composition rules. Read this before writing any JSX that uses it, rather than recalling the API.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: 'Component or folder name, e.g. "DataGrid".' } },
      required: ["name"],
      additionalProperties: false,
    },
    run: (args) => getComponent(args.name),
  },
  {
    name: "get_example",
    description: "Working usage taken from the component's own README.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
      additionalProperties: false,
    },
    run: (args) => getExample(args.name),
  },
  {
    name: "get_guidance",
    description:
      "Authored guidance on a topic: forms, overlays, data-grid, pickers, styling, accessibility, data-display, toaster, install. Omit the topic to list them.",
    inputSchema: {
      type: "object",
      properties: { topic: { type: "string" } },
      additionalProperties: false,
    },
    run: (args) => getGuidance(args.topic),
  },
  {
    name: "figma_frame",
    description:
      "Read a Figma design. Called with just a URL it lists the frames in the file; called with `frame` it returns that screen's structure, text, the repeated regions that indicate lists and tables, and the theme variables its colours and radii map onto. Needs FIGMA_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "A figma.com/design/... URL." },
        frame: { type: "string", description: "Which frame to read, from the listing." },
        depth: { type: "number", description: "How deep to descend. Lower it if the payload is large." },
      },
      required: ["url"],
      additionalProperties: false,
    },
    run: (args) => figmaFrame(args),
  },
  {
    name: "install_component",
    description:
      "Copy components into the project being worked in, with their shared folder and stylesheet. Run this before importing them.",
    inputSchema: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: 'Component names, e.g. ["DataGrid", "Button"].',
        },
      },
      required: ["names"],
      additionalProperties: false,
    },
    run: (args) => installComponents(args.names),
  },
  {
    name: "validate_usage",
    description:
      "Check JSX against the passports and report props that do not exist or required props left out. Run this on code you have written before telling the user it is done.",
    inputSchema: {
      type: "object",
      properties: { code: { type: "string", description: "JSX source to check." } },
      required: ["code"],
      additionalProperties: false,
    },
    run: (args) => validateUsage(args.code),
  },
];

// ------------------------------------------------------------- the protocol

const send = (message) => process.stdout.write(JSON.stringify(message) + "\n");
const reply = (id, result) => send({ jsonrpc: "2.0", id, result });
const fail = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });

function handle(request) {
  const { id, method, params } = request;

  if (method === "initialize") {
    const asked = params && params.protocolVersion;
    return reply(id, {
      protocolVersion: SUPPORTED_PROTOCOLS.has(asked) ? asked : PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: "grampro-kit", version: require("../../package.json").version },
    });
  }

  if (method === "notifications/initialized") return; // A notification; no reply.
  if (method === "ping") return reply(id, {});

  if (method === "tools/list") {
    return reply(id, {
      tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
    });
  }

  if (method === "tools/call") {
    const tool = TOOLS.find((t) => t.name === (params && params.name));
    if (!tool) return fail(id, -32602, `Unknown tool: ${params && params.name}`);
    try {
      // Some tools reach the network, so a result may be a promise.
      const result = tool.run((params && params.arguments) || {});
      return Promise.resolve(result).then(
        (value) => reply(id, { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] }),
        (error) =>
          reply(id, { content: [{ type: "text", text: `Tool failed: ${error.message}` }], isError: true }),
      );
    } catch (error) {
      // Reported as a result, not a protocol error: the model should see it and retry.
      return reply(id, {
        content: [{ type: "text", text: `Tool failed: ${error.message}` }],
        isError: true,
      });
    }
  }

  if (id !== undefined) fail(id, -32601, `Method not found: ${method}`);
}

function main() {
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    buffer += chunk;
    // Newline-delimited JSON: a message may arrive split across chunks.
    let newline;
    while ((newline = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      try {
        handle(JSON.parse(line));
      } catch {
        fail(null, -32700, "Parse error");
      }
    }
  });
  process.stdin.on("end", () => process.exit(0));
}

if (require.main === module) main();

module.exports = { main, listComponents, getComponent, getExample, getGuidance, validateUsage, installComponents, TOOLS };
