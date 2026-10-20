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
const { jsxOpenings } = require("../jsx-tags.cjs");

const CATALOGUE = path.join(__dirname, "..", "..", "source", "components");
const REFERENCES = path.join(__dirname, "..", "..", ".gbs", "skills", "gbs-components", "references");

/** The newest protocol revision this server knows. Older clients get theirs back. */
const PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED_PROTOCOLS = new Set(["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"]);

// --------------------------------------------------------------- catalogue

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

/*
 * The catalogue, read once.
 *
 * Every lookup used to re-read and re-parse passports off disk: naming one
 * component scanned until it matched, so `get_component("DataGrid")` cost ten
 * file reads, and `validate_usage` parsed all twenty-seven on every call. The
 * catalogue ships inside the package and cannot change while the server runs,
 * so it is built once on first use and kept.
 */
let index = null;

function catalogue() {
  if (index) return index;

  const folders = fs
    .readdirSync(CATALOGUE, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(CATALOGUE, e.name, "passport.json")))
    .map((e) => e.name)
    .sort();

  const byFolder = new Map();
  const byName = new Map();

  for (const folder of folders) {
    // The one place that still touches disk — this is what builds the index.
    const passport = readJson(path.join(CATALOGUE, folder, "passport.json"));
    const entry = { folder, passport };
    byFolder.set(folder, entry);

    // Every spelling an agent might reasonably use.
    const spellings = [folder, passport.identity.component, ...(passport.identity.exports || [])];
    for (const spelling of spellings) {
      byName.set(String(spelling).toLowerCase().replace(/[^a-z0-9]/g, ""), entry);
    }
  }

  index = { folders, byFolder, byName };
  return index;
}

const componentFolders = () => catalogue().folders;

/** Resolve a name the way an agent would write it: "DataGrid", "data-grid", "datagrid". */
function findFolder(name) {
  const entry = catalogue().byName.get(
    String(name || "").toLowerCase().replace(/[^a-z0-9]/g, ""),
  );
  return entry ? entry.folder : null;
}

/** The parsed passport for a folder, from the index rather than from disk. */
const passportOf = (folder) => catalogue().byFolder.get(folder).passport;

/*
 * Most passports carry no `purpose`, so the README's opening line stands in.
 * It is the sentence a human wrote about what the component is for, which is
 * exactly what an agent needs to pick one.
 */
const purposeCache = new Map();

function purposeOf(folder, passport) {
  if (passport.purpose && passport.purpose.trim()) return passport.purpose.trim();
  if (purposeCache.has(folder)) return purposeCache.get(folder);
  const readme = path.join(CATALOGUE, folder, "README.md");
  if (!fs.existsSync(readme)) return "";
  const line = fs
    .readFileSync(readme, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#") && !l.startsWith("<!--"));
  const purpose = line ? line.replace(/\s+/g, " ") : "";
  purposeCache.set(folder, purpose);
  return purpose;
}

// -------------------------------------------------------------------- tools

function listComponents() {
  return componentFolders().map((folder) => {
    const passport = passportOf(folder);
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
  const p = passportOf(folder);
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
    /*
     * The authored half of the passport. `safeMutations` is the one an agent
     * acts on directly — it is the difference between "you may restyle this"
     * and "you are about to answer a form on the user's behalf" — so leaving
     * it out of the tool meant authoring it and then never telling anyone.
     *
     * `operations` is empty for every component that is not agent-operable
     * yet, and an empty object is the honest answer to "what can you drive".
     */
    safeMutations: p.safeMutations || {},
    intentDomains: p.intentDomains || [],
    operations: p.operations || {},
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

  /*
   * `topic` is caller-controlled, and `path.join(REFERENCES, topic + ".md")`
   * followed a `../` out of the references folder: a prompt-injected agent
   * could turn this into "read any .md file on disk". The list is already an
   * allowlist of what actually ships, so a topic that is not one of those
   * names is refused before any path is built. The resolved-prefix check is
   * the belt to that braces — it also stops a name that readdir would never
   * produce, such as one reaching through a symlink.
   */
  if (!available.includes(topic)) {
    return { error: `No guidance for "${topic}".`, topics: available };
  }
  const file = path.join(REFERENCES, `${topic}.md`);
  if (!path.resolve(file).startsWith(path.resolve(REFERENCES) + path.sep)) {
    return { error: `No guidance for "${topic}".`, topics: available };
  }
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
    const p = passportOf(folder);
    const props = new Set((p.props || []).map((x) => x.name));
    for (const e of p.events || []) props.add(e.name);
    const required = (p.props || []).filter((x) => x.required).map((x) => x.name);
    for (const exported of [p.identity.component, ...(p.identity.exports || [])]) {
      known.set(exported, { folder, props, required, values: p.props || [] });
    }
  }

  const issues = [];
  const used = [];
  // Shared with `doctor`, which scans whole projects with the same rules.
  for (const { name, attrs } of jsxOpenings(source)) {
    const entry = known.get(name);
    if (!entry) continue; // Not ours; the agent may compose with its own components.
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
  const withoutColour = (env) => {
    const copy = { ...env };
    delete copy.FORCE_COLOR;
    return copy;
  };
  let stdout = "";
  let stderr = "";
  let failed = false;
  try {
    stdout = execFileSync(process.execPath, [cli, "add", ...wanted], {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 120000,
      // Captured, not forwarded: the installer explains a refusal on stderr,
      // and that explanation is what the agent most needs to read.
      stdio: ["ignore", "pipe", "pipe"],
      // The output below is read by pattern. Colour would break the match, and
      // a host that sets FORCE_COLOR for its own reasons would turn it on.
      env: { ...withoutColour(process.env), NO_COLOR: "1" },
    });
  } catch (error) {
    failed = true;
    stdout = (error.stdout || "").toString();
    stderr = (error.stderr || "").toString();
    if (!stdout && !stderr) return { error: `Install failed: ${error.message}` };
  }
  // Belt and braces: whatever reached the output, match it without escapes.
  const ansi = /\x1b\[[0-9;?]*[A-Za-z]/g;
  stdout = stdout.replace(ansi, "");
  stderr = stderr.replace(ansi, "");

  // The installer prints the one manual step; the agent needs to see it.
  const importLine = (stdout.match(/^\s*@import .+$/gm) || []).map((l) => l.trim());
  const done = [...stdout.matchAll(/✓ Component (\S+) /g)].map((m) => m[1]);

  /*
   * A component the project has edited is left alone by `add`, and this tool
   * never passes --force. That is deliberate: replacing someone's edited
   * component is their decision, and an agent asked to "install Button" has
   * not been asked to discard the Button they already customised. So the
   * agent is told what was kept, why, and how the user can see the changes —
   * not handed a generic failure it might try to work around.
   */
  const kept = [...stderr.matchAll(/✗ (\S+) was not replaced/g)].map((m) => m[1]);
  if (kept.length) {
    return {
      installed: done,
      kept,
      reason:
        "These components have changes made in this project since they were installed, and " +
        "install_component never overwrites them. They are still in place and still usable.",
      advice:
        "Do not try to replace them. Tell the user, and suggest " +
        `\`npx @grampro/kit doctor ${kept.join(" ")}\`: it shows what was changed locally, what the ` +
        "new version changes, and which call sites an update would break. Replacing them with " +
        "--force discards the user's work, which is their decision to make.",
      detail: stderr.trim().slice(-1500),
      stylesheet: importLine,
    };
  }

  if (failed) return { error: `Install failed: ${(stderr || stdout).trim().slice(-600)}` };
  return { installed: wanted, stylesheet: importLine, output: stdout.trim().slice(-1200) };
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
      "Authored guidance on a topic: forms (including making a page operable by a browser agent with <AgentSurface>), overlays, data-grid, pickers, styling, accessibility, data-display, toaster, install. Omit the topic to list them.",
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
      "BETA. Read a Figma design. Start with a URL (`url`, needs FIGMA_TOKEN): it is one step, and it resolves the names of any component instances in the frame. A file the kit's Figma plugin saved (`designFile`) needs no token and carries every screen at once, which is what to use for a whole product or when a token is unavailable; that export pasted in (`design`) works for a small frame. Called with just a URL it lists the frames in the file; called with `frame` it returns that screen's structure, text, the repeated regions that indicate lists and tables, and the theme variables its colours and radii map onto.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "A figma.com/design/... URL. Needs FIGMA_TOKEN." },
        design: {
          type: "string",
          description:
            "Alternative to url, needing no token: JSON from the kit's Figma plugin, 'Export selection for an agent'. For anything but a small frame, prefer designFile.",
        },
        designFile: {
          type: "string",
          description:
            "Path to a .json saved by the plugin's 'Save .json' button, or to one screen of a folder `grampro-kit design` wrote. Preferred over `design`: the file is read here, so the raw export never passes through the conversation.",
        },
        frame: { type: "string", description: "Which frame to read, from the listing." },
        depth: { type: "number", description: "How deep to descend. Lower it if the payload is large." },
      },
      required: [],
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
