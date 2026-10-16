/*
 * What the export costs in each shape it could take.
 *
 * Pretty JSON spends most of itself on punctuation and on repeating the same
 * key names at every node — `"name"`, `"type"`, `"layout"`, `"direction"`.
 * None of that is the design. This measures the alternatives on a tree shaped
 * like a real screen, so the format can be chosen on a number rather than on
 * a preference.
 *
 * Bytes are the proxy for tokens. For this content they track closely: it is
 * ASCII, and the punctuation that dominates JSON tokenises at roughly a token
 * per character, which is the worst case.
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* ------------------------------------------------------- the same fixture */

const solid = (r, g, b) => [{ type: "SOLID", visible: true, color: { r, g, b } }];
const INK = solid(0.098, 0.141, 0.208);
/*
 * Real nodes have a measured size and may have a border, and the export
 * now reports both. A fixture without them cannot price them.
 */
const node = (type, extra = {}) => ({
  type,
  name: "node",
  visible: true,
  fills: [],
  strokes: [],
  width: 240,
  height: 36,
  children: [],
  ...extra,
});
const text = (name, characters, fontSize = 13, fontWeight = 400) =>
  node("TEXT", { name, characters, fontSize, fontWeight, fills: INK });
const icon = (name) => node("FRAME", { name, children: [node("VECTOR", { name: "Vector" })] });

const BORDER = [{ type: "SOLID", visible: true, color: { r: 0.886, g: 0.906, b: 0.937 } }];

const row = (name, children, extra = {}) =>
  node("FRAME", {
    name,
    layoutMode: "HORIZONTAL",
    itemSpacing: extra.gap ?? 11,
    paddingTop: extra.pad?.[0] ?? 0,
    paddingRight: extra.pad?.[1] ?? 0,
    paddingBottom: extra.pad?.[2] ?? 0,
    paddingLeft: extra.pad?.[3] ?? 0,
    counterAxisAlignItems: extra.align ?? "MIN",
    primaryAxisAlignItems: extra.justify ?? "MIN",
    cornerRadius: extra.radius ?? 0,
    fills: extra.fill ?? [],
    strokes: extra.border ? BORDER : [],
    children,
  });
const column = (name, children, extra = {}) => ({ ...row(name, children, extra), layoutMode: "VERTICAL" });

const navItem = (glyph, label) =>
  row("Navigation item", [icon(glyph), text("Label", label)], { radius: 7, pad: [0, 12, 0, 12], align: "CENTER" });
const orderView = (label, count) =>
  row("Order view", [
    text("Label", label, 12),
    row("Count", [text("Label", count, 10)], { radius: 4, pad: [1, 5, 1, 5] }),
  ], { gap: 7, align: "CENTER" });
const metric = (title, value, note) =>
  column("Purchase metric", [
    row("Metric heading", [text("Label", title, 12), icon("arrow-up-right")], { justify: "SPACE_BETWEEN" }),
    row("Metric value", [text("Value", value, 27, 600), text("Label", note, 11, 500)], { justify: "SPACE_BETWEEN" }),
    text("Label", "Across 48 purchase orders", 11),
  ], { radius: 10, pad: [15, 20, 15, 20], gap: 7, fill: solid(1, 1, 1) });

const frame = row("Purchase orders", [
  column("Workspace navigation", [
    row("Product identity", [icon("layers-2"), text("Label", "meridian", 23)], { align: "CENTER", pad: [0, 0, 0, 10] }),
    column("Main menu", [
      navItem("layout-dashboard", "Overview"),
      navItem("shopping-bag", "Purchase orders"),
      navItem("building-2", "Suppliers"),
      navItem("wallet", "Budgets"),
      navItem("chart-no-axes-combined", "Reports"),
      navItem("users", "Team members"),
      navItem("settings-2", "Settings"),
    ], { gap: 5 }),
  ], { gap: 28, pad: [28, 16, 20, 16], fill: solid(0.984, 0.988, 0.996) }),
  column("Orders workspace", [
    row("Workspace bar", [
      row("Breadcrumb", [icon("panel-left"), text("Label", "Purchase orders")], { gap: 12, align: "CENTER" }),
      row("Workspace tools", [icon("search"), text("Label", "Search workspace", 12), icon("bell")], { gap: 22, align: "CENTER" }),
    ], { pad: [0, 32, 0, 32], align: "CENTER", justify: "SPACE_BETWEEN", fill: solid(1, 1, 1) }),
    column("Orders content", [
      row("Purchase overview", [
        metric("Total committed spend", "$284,650", "+8.2% vs. last month"),
        metric("Awaiting approval", "12", "$42,180 in requests"),
        metric("Monthly budget used", "71.2%", "$115,350 remaining"),
      ], { gap: 16 }),
      column("Purchase orders data grid", [
        row("Order views", [
          orderView("All orders", "48"),
          orderView("Pending approval", "12"),
          orderView("Approved", "28"),
          orderView("Drafts", "8"),
        ], { gap: 24, pad: [0, 20, 0, 20], align: "CENTER" }),
      ], { radius: 10, fill: solid(1, 1, 1) }),
    ], { gap: 24, pad: [32, 32, 32, 32] }),
  ]),
], { fill: solid(0.964, 0.972, 0.984) });

/* ------------------------------------------------------- run the exporter */

let shown = null;
const figma = {
  mixed: Symbol("mixed"),
  command: "export",
  currentPage: { selection: [frame] },
  notify: () => {},
  showUI: (html) => { shown = html; },
  closePlugin(message) { figma.closed = message; },
};
vm.runInContext(
  readFileSync(new URL("../dist/code.js", import.meta.url), "utf8"),
  vm.createContext({ figma, console, Promise, Math, Date, Object, Array, JSON, Map, Set, Number, String, Symbol, Error, parseInt }),
);
const started = Date.now();
while (!shown && !figma.closed && Date.now() - started < 30000) {
  await new Promise((resolve) => setTimeout(resolve, 20));
}
const MARK = "out.value = ";
const from = shown.indexOf(MARK) + MARK.length;
const pretty = JSON.parse(shown.slice(from, shown.indexOf("\n", from)).trim().replace(/;$/, ""));
const design = JSON.parse(pretty);

/* ----------------------------------------------------------- the formats */

/** YAML, in the subset this tree needs. */
function toYaml(value, indent = 0) {
  const pad = "  ".repeat(indent);
  if (Array.isArray(value)) {
    return value.map((item) => `${pad}- ${toYaml(item, indent + 1).trimStart()}`).join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, v]) => {
        if (v === undefined) return null;
        if (Array.isArray(v) && v.every((x) => typeof x === "number")) return `${pad}${key}: [${v.join(", ")}]`;
        if (v && typeof v === "object") return `${pad}${key}:\n${toYaml(v, indent + 1)}`;
        return `${pad}${key}: ${typeof v === "string" ? JSON.stringify(v) : v}`;
      })
      .filter(Boolean)
      .join("\n");
  }
  return `${pad}${typeof value === "string" ? JSON.stringify(value) : value}`;
}

/**
 * An indented tree, one node per line.
 *
 * The structure is the indentation, so every brace, bracket, quote and
 * repeated key name goes away. What is left is what the design says.
 */
function toOutline(nodes, depth = 0) {
  const lines = [];
  for (const n of nodes) {
    const bits = [];
    const l = n.layout;
    if (l) {
      bits.push(l.direction);
      if (l.gap) bits.push(`gap:${l.gap}`);
      if (l.padding) bits.push(`pad:${l.padding.join(",")}`);
      if (l.align) bits.push(`align:${l.align.toLowerCase()}`);
      if (l.justify) bits.push(`justify:${l.justify.toLowerCase()}`);
    }
    const s = n.style;
    if (s) {
      if (s.fill) bits.push(s.fill);
      if (s.radius) bits.push(`r:${s.radius}`);
      if (s.fontSize) bits.push(`${s.fontSize}/${s.fontWeight ?? 400}`);
    }
    if (n.component) bits.push(`=${n.component}`);

    const head = n.text !== undefined ? `${n.name} ${JSON.stringify(n.text)}` : n.name;
    lines.push(`${"  ".repeat(depth)}${head}${bits.length ? "  " + bits.join(" ") : ""}`);
    if (n.children) lines.push(toOutline(n.children, depth + 1));
  }
  return lines.join("\n");
}

const minified = JSON.stringify(design);
const yaml = toYaml(design);
const outline = [
  `frame: ${design.frame}`,
  `colours: ${design.tokens.colours.map((c) => `${c.value}(${c.uses})`).join(" ")}`,
  `radii: ${design.tokens.radii.map((r) => `${r.value}(${r.uses})`).join(" ")}`,
  `fontSizes: ${design.tokens.fontSizes.map((f) => `${f.value}(${f.uses})`).join(" ")}`,
  "",
  toOutline(design.nodes),
].join("\n");

const base = pretty.length;
const show = (label, body) => {
  const pct = Math.round((body.length / base) * 100);
  console.log(
    `  ${label.padEnd(16)} ${(body.length / 1024).toFixed(1).padStart(6)} KB   ${String(pct).padStart(3)}% of pretty JSON`,
  );
};

console.log(`Same tree, four shapes (${base.toLocaleString()} bytes as pretty JSON):\n`);
show("pretty JSON", pretty);
show("minified JSON", minified);
show("YAML", yaml);
show("outline", outline);

console.log("\nFirst lines of the outline:\n");
console.log(outline.split("\n").slice(0, 14).map((l) => "  " + l).join("\n"));
