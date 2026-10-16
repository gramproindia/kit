/*
 * Run the "Export selection for an agent" command against a mock Figma API.
 *
 * The other smoke test covers `generate`, which was the plugin's only command
 * when it was written. `export` is now the command the documentation points
 * readers at — the route that needs no API token — and it had no coverage at
 * all. It runs inside Figma, where a thrown error is a closed plugin and a
 * one-line notice, so the only place it can be exercised honestly is here.
 *
 * The payload shape is a contract with the MCP server: `figma_frame` rejects
 * anything whose `nodes` is not an array, so that is asserted rather than
 * eyeballed.
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";

const problems = [];
const fail = (message) => problems.push(message);

/* ------------------------------------------------------------------ mock */

const solid = (r, g, b) => [{ type: "SOLID", visible: true, color: { r, g, b } }];

/** A scene node with the fields `walk()` reads, and nothing it does not. */
function node(type, extra = {}) {
  return {
    type,
    name: "node",
    visible: true,
    fills: [],
    children: [],
    ...extra,
  };
}

const text = (name, characters, fontSize = 14) =>
  node("TEXT", {
    name,
    characters,
    fontSize,
    fontWeight: 400,
    fills: solid(0.098, 0.141, 0.208),
  });

/** Eight rows of the same name: the repetition the server reads as a column. */
const statusCells = Array.from({ length: 8 }, (_, i) =>
  node("FRAME", {
    name: "Status cell",
    cornerRadius: 8,
    fills: solid(0.14, 0.45, 0.9),
    children: [text("label", `Open ${i}`)],
  }),
);

/* An instance, so the component lookup and property flattening are covered. */
const instance = node("INSTANCE", {
  name: "Primary button",
  fills: solid(0.14, 0.45, 0.9),
  cornerRadius: 8,
  componentProperties: {
    "Variant#1:0": { type: "VARIANT", value: "primary" },
    "Size#2:0": { type: "VARIANT", value: "md" },
    "Disabled#3:0": { type: "BOOLEAN", value: false },
    "Icon#4:0": { type: "INSTANCE_SWAP", value: { id: "1:2" } }, // dropped: not string/boolean
  },
  children: [text("label", "New PO")],
  getMainComponentAsync: async () => ({
    name: "Button",
    parent: { type: "COMPONENT_SET", name: "Button" },
  }),
});

const frame = node("FRAME", {
  name: "Purchase orders",
  layoutMode: "VERTICAL",
  itemSpacing: 16,
  paddingTop: 24,
  paddingRight: 24,
  paddingBottom: 24,
  paddingLeft: 24,
  counterAxisAlignItems: "MIN",
  primaryAxisAlignItems: "MIN",
  cornerRadius: 8,
  fills: solid(1, 1, 1),
  children: [text("Title", "Purchase orders", 20), instance, ...statusCells],
});

let shown = null;
const figma = {
  mixed: Symbol("mixed"),
  command: "export",
  currentPage: { selection: [frame] },
  notify: () => {},
  showUI(html) {
    shown = html;
  },
  closePlugin(message) {
    figma.closed = message;
  },
};

/* ------------------------------------------------------------------- run */

const code = readFileSync(new URL("../dist/code.js", import.meta.url), "utf8");
vm.runInContext(
  code,
  vm.createContext({
    figma,
    console,
    Promise,
    Math,
    Date,
    Object,
    Array,
    JSON,
    Map,
    Set,
    Number,
    String,
    Symbol,
    Error,
    parseInt,
  }),
);

const started = Date.now();
while (!shown && !figma.closed && Date.now() - started < 30_000) {
  await new Promise((resolve) => setTimeout(resolve, 20));
}

if (figma.closed) fail(`closed instead of showing the export: ${figma.closed}`);
if (!shown) fail("the export produced no UI within 30s");

/* --------------------------------------------------------------- assert */

let payload = null;
if (shown) {
  // The UI embeds the JSON as a string literal assigned to the textarea.
  const match = shown.match(/out\.value = ("(?:[^"\\]|\\.)*")/);
  if (!match) fail("could not find the exported JSON in the plugin UI");
  else {
    try {
      payload = JSON.parse(JSON.parse(match[1]));
    } catch (error) {
      fail(`the exported JSON does not parse: ${error.message}`);
    }
  }
}

if (payload) {
  // The contract the MCP server checks first.
  if (!Array.isArray(payload.nodes)) fail("payload.nodes must be an array");
  if (payload.frame !== "Purchase orders") fail(`frame name wrong: ${payload.frame}`);

  const root = payload.nodes[0] ?? {};
  if (root.name !== "Purchase orders") fail("the selected frame is not the root node");
  if (!root.layout || root.layout.direction !== "column") fail("auto-layout was not carried over");
  if (root.layout && root.layout.gap !== 16) fail(`itemSpacing lost: ${root.layout?.gap}`);

  const flat = [];
  (function visit(n) {
    flat.push(n);
    for (const child of n.children ?? []) visit(child);
  })(root);

  const cells = flat.filter((n) => n.name === "Status cell");
  if (cells.length !== 8) fail(`expected 8 "Status cell" nodes, got ${cells.length}`);

  const found = flat.find((n) => n.component);
  if (!found) fail("the instance did not record its component");
  else {
    if (found.component !== "Button") fail(`component name wrong: ${found.component}`);
    const props = found.properties ?? {};
    if (props.Variant !== "primary") fail(`variant property lost: ${JSON.stringify(props)}`);
    if (props.Disabled !== false) fail("boolean property lost");
    if ("Icon" in props) fail("non-primitive property should have been dropped");
    if (Object.keys(props).some((k) => k.includes("#"))) fail("property ids were not stripped");
  }

  const titled = flat.find((n) => n.text === "Purchase orders");
  if (!titled) fail("the title text was not carried over");

  // Colour roles: the accent is the saturated mid-tone, not the near-black text.
  const colours = payload.tokens?.colours ?? [];
  if (!colours.length) fail("no colours were tallied");
}

/* -------------------------------------------------------------- report */

if (payload) {
  const count = (function total(list) {
    return list.reduce((n, item) => n + 1 + total(item.children ?? []), 0);
  })(payload.nodes);
  console.log(`exported "${payload.frame}": ${count} nodes, ${JSON.stringify(shown.length)} bytes of UI`);
  console.log(`tokens: ${JSON.stringify(payload.tokens)}`);
}

if (problems.length) {
  console.log(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("export: OK");
