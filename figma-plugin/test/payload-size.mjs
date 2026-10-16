/*
 * Measure what the export actually costs, on a tree shaped like a real screen.
 *
 * The export is read by a language model, so its size is the price of using
 * it. This builds a sidebar-plus-content layout of the kind the plugin was
 * exercised against — nav rows with icons, metric cards, a toolbar — and
 * reports the bytes, so a change to the condensing can be judged rather than
 * guessed at.
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";

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

/** A lucide-style icon: a frame wrapping one vector, as Figma exports them. */
const icon = (name) =>
  node("FRAME", { name, children: [node("VECTOR", { name: "Vector" })] });

/** An auto-layout frame with the zero padding real designs are full of. */
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

const column = (name, children, extra = {}) =>
  ({ ...row(name, children, extra), layoutMode: "VERTICAL" });

const navItem = (glyph, label) =>
  row("Navigation item", [icon(glyph), text("Label", label)], { radius: 7, pad: [0, 12, 0, 12], align: "CENTER" });

const metric = (title, value, note) =>
  column(
    "Purchase metric",
    [
      row("Metric heading", [text("Label", title, 12), icon("arrow-up-right")], { justify: "SPACE_BETWEEN" }),
      row("Metric value", [text("Value", value, 27, 600), text("Label", note, 11, 500)], { justify: "SPACE_BETWEEN" }),
      text("Label", "Across 48 purchase orders", 11),
    ],
    { radius: 10, pad: [15, 20, 15, 20], gap: 7, fill: solid(1, 1, 1) },
  );

const frame = row(
  "Purchase orders",
  [
    column(
      "Workspace navigation",
      [
        row("Product identity", [icon("layers-2"), text("Label", "meridian", 23)], { align: "CENTER", pad: [0, 0, 0, 10] }),
        row("Workspace switcher", [icon("chevrons-up-down"), text("Label", "Acme Studio", 12, 600)], { radius: 8, pad: [10, 10, 10, 10] }),
        column(
          "Main menu",
          [
            navItem("layout-dashboard", "Overview"),
            navItem("shopping-bag", "Purchase orders"),
            navItem("building-2", "Suppliers"),
            navItem("wallet", "Budgets"),
            navItem("chart-no-axes-combined", "Reports"),
            navItem("users", "Team members"),
            navItem("settings-2", "Settings"),
          ],
          { gap: 5 },
        ),
        row("Help link", [icon("circle-help"), text("Label", "Help & resources")], { pad: [0, 12, 0, 12] }),
      ],
      { gap: 28, pad: [28, 16, 20, 16], fill: solid(0.984, 0.988, 0.996) },
    ),
    column(
      "Orders workspace",
      [
        row(
          "Workspace bar",
          [
            row("Breadcrumb", [icon("panel-left"), text("Label", "Purchase orders")], { gap: 12, align: "CENTER" }),
            row("Workspace tools", [icon("search"), text("Label", "Search workspace", 12), icon("bell")], { gap: 22, align: "CENTER" }),
          ],
          { pad: [0, 32, 0, 32], align: "CENTER", justify: "SPACE_BETWEEN", fill: solid(1, 1, 1) },
        ),
        column(
          "Orders content",
          [
            row(
              "Page heading",
              [
                column("Title and description", [text("Page title", "Purchase orders", 28), text("Label", "Track every purchase.")], { gap: 5 }),
                row("Page actions", [
                  row("Action", [icon("download"), text("Label", "Export")], { radius: 7, pad: [0, 14, 0, 14], align: "CENTER", gap: 8 }),
                  row("Action", [icon("plus"), text("Label", "New request")], { radius: 7, pad: [0, 14, 0, 14], align: "CENTER", gap: 8 }),
                ], { gap: 10 }),
              ],
              { align: "CENTER", justify: "SPACE_BETWEEN" },
            ),
            row("Purchase overview", [
              metric("Total committed spend", "$284,650", "+8.2% vs. last month"),
              metric("Awaiting approval", "12", "$42,180 in requests"),
              metric("Monthly budget used", "68%", "of $420,000"),
            ], { gap: 16 }),
          ],
          { gap: 24, pad: [32, 32, 32, 32] },
        ),
      ],
    ),
  ],
  { fill: solid(0.964, 0.972, 0.984) },
);

let shown = null;
const figma = {
  mixed: Symbol("mixed"),
  command: "export",
  currentPage: { selection: [frame] },
  notify: () => {},
  showUI: (html) => {
    shown = html;
  },
  closePlugin(message) {
    figma.closed = message;
  },
};

vm.runInContext(
  readFileSync(new URL("../dist/code.js", import.meta.url), "utf8"),
  vm.createContext({
    figma, console, Promise, Math, Date, Object, Array, JSON,
    Map, Set, Number, String, Symbol, Error, parseInt,
  }),
);

const started = Date.now();
while (!shown && !figma.closed && Date.now() - started < 30000) {
  await new Promise((resolve) => setTimeout(resolve, 20));
}
if (!shown) {
  console.log("no export produced:", figma.closed);
  process.exit(1);
}

const MARK = "out.value = ";
const from = shown.indexOf(MARK) + MARK.length;
const to = shown.indexOf("\n", from);
const json = JSON.parse(shown.slice(from, to).trim().replace(/;$/, ""));
const design = JSON.parse(json);

const count = (list) => list.reduce((n, item) => n + 1 + count(item.children ?? []), 0);
const nodes = count(design.nodes);
const bytes = json.length;

// What is in there that carries nothing.
const flat = [];
(function visit(list) {
  for (const n of list) {
    flat.push(n);
    visit(n.children ?? []);
  }
})(design.nodes);

const zeroRadius = flat.filter((n) => n.style?.radius === 0).length;
const zeroPadding = flat.filter((n) => n.layout?.padding?.every((p) => p === 0)).length;
const vectors = flat.filter((n) => n.type === "VECTOR").length;
const defaultAlign = flat.filter((n) => n.layout?.align === "MIN" && n.layout?.justify === "MIN").length;

/*
 * What repetition costs.
 *
 * A screen is mostly the same row eight times. The repetition is the
 * signal — eight `Status cell` siblings are a column — but carrying each
 * one in full is the signal restated eight times. This measures how much
 * of the payload is spent on sibling subtrees that differ only in their
 * text, so the question of whether to collapse them can be settled with a
 * number.
 */
const shapeOf = (n) =>
  JSON.stringify({
    name: n.name,
    type: n.type,
    layout: n.layout,
    style: n.style,
    children: (n.children ?? []).map(shapeOf),
  });

let repeatedBytes = 0;
let repeatedGroups = 0;
(function scan(list) {
  const seen = new Map();
  for (const child of list) {
    const key = shapeOf(child);
    seen.set(key, [...(seen.get(key) ?? []), child]);
    scan(child.children ?? []);
  }
  for (const group of seen.values()) {
    if (group.length < 2) continue;
    repeatedGroups += 1;
    // Everything after the first is the shape said again.
    for (const extra of group.slice(1)) repeatedBytes += JSON.stringify(extra).length;
  }
})(design.nodes);

console.log(`${nodes} nodes, ${(bytes / 1024).toFixed(1)} KB of JSON`);
console.log(`  radius: 0            on ${zeroRadius} nodes`);
console.log(`  padding: [0,0,0,0]   on ${zeroPadding} nodes`);
console.log(`  bare VECTOR children    ${vectors}`);
console.log(`  align/justify both MIN  ${defaultAlign}`);
console.log(`  repeated sibling shapes ${repeatedGroups} groups, ${(repeatedBytes / 1024).toFixed(1)} KB (${Math.round((repeatedBytes / bytes) * 100)}% of the payload)`);
