/*
 * Export the selection as something a coding agent can act on.
 *
 * A Figma node carries far more than an agent can use — vector geometry,
 * every inherited style, absolute coordinates for things that will be laid
 * out by flexbox anyway. Handing that over buries the useful part. What is
 * useful is the structure, which of the nodes are kit components, the text,
 * and the handful of values worth turning into theme variables.
 *
 * So this condenses. It reads the scene graph through the plugin API, where
 * the field names are typed and the compiler checks them, rather than
 * guessing at the shape of a REST response.
 */

/** What a node becomes once the parts an agent cannot use are dropped. */
interface ExportedNode {
  name: string;
  type: string;
  /** The master component's name, when this is an instance of one. */
  component?: string;
  /** Variant and property values set on that instance. */
  properties?: Record<string, string | boolean>;
  layout?: {
    direction: "row" | "column";
    gap?: number;
    padding?: [number, number, number, number];
    align?: string;
    justify?: string;
  };
  text?: string;
  style?: {
    fill?: string;
    radius?: number;
    fontSize?: number;
    fontWeight?: number;
  };
  children?: ExportedNode[];
}

interface ExportedSelection {
  frame: string;
  nodes: ExportedNode[];
  /** Distinct values worth mapping onto `--gbs-*`, most used first. */
  tokens: {
    colours: { value: string; uses: number }[];
    radii: { value: number; uses: number }[];
    fontSizes: { value: number; uses: number }[];
  };
}

const hex = (c: number) => Math.round(c * 255).toString(16).padStart(2, "0");

/** The first solid fill as a hex string; anything else is not a token. */
function solidFill(node: SceneNode): string | undefined {
  if (!("fills" in node)) return undefined;
  const fills = node.fills;
  if (fills === figma.mixed || !Array.isArray(fills)) return undefined;
  const solid = fills.find((f) => f.type === "SOLID" && f.visible !== false);
  if (!solid || solid.type !== "SOLID") return undefined;
  return `#${hex(solid.color.r)}${hex(solid.color.g)}${hex(solid.color.b)}`;
}

function cornerRadius(node: SceneNode): number | undefined {
  if (!("cornerRadius" in node)) return undefined;
  const radius = node.cornerRadius;
  return typeof radius === "number" ? radius : undefined;
}

function layoutOf(node: SceneNode): ExportedNode["layout"] {
  if (!("layoutMode" in node) || node.layoutMode === "NONE") return undefined;
  return {
    direction: node.layoutMode === "HORIZONTAL" ? "row" : "column",
    gap: node.itemSpacing || undefined,
    padding: [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft],
    align: node.counterAxisAlignItems,
    justify: node.primaryAxisAlignItems,
  };
}

function textOf(node: SceneNode): string | undefined {
  if (node.type !== "TEXT") return undefined;
  const chars = node.characters;
  return chars && chars.trim() ? chars : undefined;
}

function typography(node: SceneNode): { fontSize?: number; fontWeight?: number } {
  if (node.type !== "TEXT") return {};
  const size = node.fontSize;
  const weight = node.fontWeight;
  return {
    fontSize: typeof size === "number" ? size : undefined,
    fontWeight: typeof weight === "number" ? weight : undefined,
  };
}

const colours = new Map<string, number>();
const radii = new Map<number, number>();
const fontSizes = new Map<number, number>();
const tally = <K>(map: Map<K, number>, key: K | undefined) => {
  if (key !== undefined) map.set(key, (map.get(key) ?? 0) + 1);
};

/**
 * Nested instances are not walked into.
 *
 * Once a node is "this is a Button", what is inside it belongs to the
 * component, not the design — descending would produce a tree of spans the
 * agent would be tempted to rebuild by hand.
 */
async function walk(node: SceneNode, depth: number): Promise<ExportedNode> {
  const fill = solidFill(node);
  const radius = cornerRadius(node);
  const { fontSize, fontWeight } = typography(node);

  tally(colours, fill);
  tally(radii, radius);
  tally(fontSizes, fontSize);

  const out: ExportedNode = { name: node.name, type: node.type };

  if (node.type === "INSTANCE") {
    const main = await node.getMainComponentAsync();
    if (main) out.component = (main.parent?.type === "COMPONENT_SET" ? main.parent.name : main.name);
    const props = node.componentProperties;
    if (props) {
      const simple: Record<string, string | boolean> = {};
      for (const key of Object.keys(props)) {
        const value = props[key].value;
        if (typeof value === "string" || typeof value === "boolean") {
          simple[key.replace(/#\d+:\d+$/, "")] = value;
        }
      }
      if (Object.keys(simple).length) out.properties = simple;
    }
  }

  const layout = layoutOf(node);
  if (layout) out.layout = layout;

  const text = textOf(node);
  if (text) out.text = text;

  const style: ExportedNode["style"] = {};
  if (fill) style.fill = fill;
  if (radius !== undefined) style.radius = radius;
  if (fontSize !== undefined) style.fontSize = fontSize;
  if (fontWeight !== undefined) style.fontWeight = fontWeight;
  if (Object.keys(style).length) out.style = style;

  const descend = node.type !== "INSTANCE" && depth < 12 && "children" in node;
  if (descend) {
    const kids: ExportedNode[] = [];
    for (const child of (node as ChildrenMixin).children) {
      if ("visible" in child && child.visible === false) continue;
      kids.push(await walk(child, depth + 1));
    }
    if (kids.length) out.children = kids;
  }

  return out;
}

const ranked = <K>(map: Map<K, number>) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).map(([value, uses]) => ({ value, uses }));

async function exportSelection(): Promise<void> {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.closePlugin("Select a frame first, then run the export.");
    return;
  }

  colours.clear();
  radii.clear();
  fontSizes.clear();

  const nodes: ExportedNode[] = [];
  for (const node of selection) nodes.push(await walk(node, 0));

  const payload: ExportedSelection = {
    frame: selection.length === 1 ? selection[0].name : `${selection.length} selected nodes`,
    nodes,
    tokens: {
      colours: ranked(colours),
      radii: ranked(radii),
      fontSizes: ranked(fontSizes),
    },
  };

  const json = JSON.stringify(payload, null, 2);
  const size = (json.length / 1024).toFixed(1);

  /*
   * Shown rather than copied: a plugin cannot reach the clipboard without a
   * user gesture, and a textarea the author can select is less machinery
   * than a message channel for a one-off paste.
   */
  figma.showUI(
    `<style>
       body { font: 12px ui-sans-serif, system-ui; margin: 0; padding: 12px; }
       p { margin: 0 0 8px; color: #555; }
       textarea { width: 100%; height: 320px; font: 11px ui-monospace, monospace; }
       button { margin-top: 8px; padding: 6px 12px; }
     </style>
     <p><b>${payload.frame}</b> — ${size} KB. Paste this into your agent's <code>figma_frame</code> tool.</p>
     <textarea id="out" readonly></textarea>
     <button id="copy">Select all</button>
     <script>
       const out = document.getElementById("out");
       out.value = ${JSON.stringify(json)};
       document.getElementById("copy").onclick = () => { out.focus(); out.select(); };
     </script>`,
    { width: 560, height: 440, title: "Export for agent" },
  );
}
