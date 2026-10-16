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
  /** Rounded width and height. Absent on text, whose size is its content. */
  size?: [number, number];
  style?: {
    fill?: string;
    stroke?: string;
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
  // Zero is the default and says nothing; reporting it put `radius: 0` on
  // every square frame in the file.
  if (typeof radius !== "number" || radius === 0) return undefined;
  return radius;
}

/**
 * The border colour, where there is one.
 *
 * A white box with a border is a secondary button; without one it is a
 * surface. Capturing only fills made those two identical in the export.
 */
function solidStroke(node: SceneNode): string | undefined {
  if (!("strokes" in node)) return undefined;
  const strokes = node.strokes;
  if (!Array.isArray(strokes)) return undefined;
  const solid = strokes.find((s) => s.type === "SOLID" && s.visible !== false);
  if (!solid || solid.type !== "SOLID") return undefined;
  return `#${hex(solid.color.r)}${hex(solid.color.g)}${hex(solid.color.b)}`;
}

/**
 * Rounded width and height.
 *
 * The size is how a hand-drawn design says what something is: a 36px pill
 * with a label is a button, the same shape at 200px is a card, at 1px it is
 * a divider. Text is left out — its size is its content and its font.
 */
function sizeOf(node: SceneNode): [number, number] | undefined {
  if (node.type === "TEXT") return undefined;
  if (!("width" in node) || !("height" in node)) return undefined;
  return [Math.round(node.width), Math.round(node.height)];
}

function layoutOf(node: SceneNode): ExportedNode["layout"] {
  if (!("layoutMode" in node) || node.layoutMode === "NONE") return undefined;
  const padding: [number, number, number, number] = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft];
  return {
    direction: node.layoutMode === "HORIZONTAL" ? "row" : "column",
    gap: node.itemSpacing || undefined,
    // Omitted where they are Figma's defaults. A screen is mostly frames
    // with no padding aligned to the start, and saying so every time costs
    // more than it tells anyone.
    padding: padding.some((side) => side !== 0) ? padding : undefined,
    align: node.counterAxisAlignItems === "MIN" ? undefined : node.counterAxisAlignItems,
    justify: node.primaryAxisAlignItems === "MIN" ? undefined : node.primaryAxisAlignItems,
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
  const stroke = solidStroke(node);
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

  const size = sizeOf(node);
  if (size) out.size = size;

  const style: ExportedNode["style"] = {};
  if (fill) style.fill = fill;
  if (stroke) style.stroke = stroke;
  if (radius !== undefined) style.radius = radius;
  if (fontSize !== undefined) style.fontSize = fontSize;
  if (fontWeight !== undefined) style.fontWeight = fontWeight;
  if (Object.keys(style).length) out.style = style;

  /*
   * An icon is a frame wrapping vectors, and its name is the whole signal:
   * `search`, `chevrons-up-down`, `plus`. Walking in yields a child called
   * "Vector" and nothing an agent can act on — it cannot rebuild a path, and
   * should be reaching for the matching icon in its own set instead.
   */
  const vectorOnly =
    "children" in node &&
    (node as ChildrenMixin).children.length > 0 &&
    (node as ChildrenMixin).children.every((child) =>
      ["VECTOR", "BOOLEAN_OPERATION", "ELLIPSE", "STAR", "POLYGON", "LINE"].includes(child.type),
    );

  const descend = node.type !== "INSTANCE" && depth < 12 && "children" in node && !vectorOnly;
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

  // Indented for a person to read; minified for the agent to receive. The
  // same tree costs about a third as much without the indentation, and
  // JSON.parse cannot tell the difference.
  const json = JSON.stringify(payload, null, 2);
  const compact = JSON.stringify(payload);
  const size = (json.length / 1024).toFixed(1);
  const compactSize = (compact.length / 1024).toFixed(1);

  /*
   * The panel copies on click.
   *
   * It used to select the text and leave the person to press Ctrl+C, on the
   * grounds that a plugin cannot reach the clipboard without a user gesture.
   * A click handler is a user gesture: execCommand("copy") works from one
   * inside the plugin iframe. navigator.clipboard is frequently blocked
   * there by permissions policy, so it is the fallback, and selecting the
   * text is the last resort — which is where this started.
   */
  figma.showUI(
    `<style>
       body { font: 12px ui-sans-serif, system-ui; margin: 0; padding: 12px; color: #333; }
       p { margin: 0 0 8px; color: #555; }
       textarea { width: 100%; height: 300px; font: 11px ui-monospace, monospace;
                  border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px; resize: none; }
       .row { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
       /* Off-screen, not hidden: a display:none field cannot be selected, */
       /* and selecting is what execCommand copies. */
       #mini { position: absolute; left: -9999px; top: 0; }
       button { padding: 7px 14px; border: 0; border-radius: 6px; font: inherit;
                font-weight: 600; color: #fff; background: #18a0fb; cursor: pointer; }
       button:hover { background: #0d8ee0; }
       #said { color: #666; }
     </style>
     <p><b>${payload.frame}</b> — copies as ${compactSize} KB of minified JSON (${size} KB shown). Paste it into your agent's <code>figma_frame</code> tool, as the <code>design</code> argument.</p>
     <textarea id="out" readonly></textarea>
     <textarea id="mini" readonly></textarea>
     <div class="row"><button id="copy">Copy JSON</button><span id="said"></span></div>
     <script>
       const out = document.getElementById("out");
       out.value = ${JSON.stringify(json)};
       const mini = document.getElementById("mini");
       mini.value = ${JSON.stringify(compact)};
       const button = document.getElementById("copy");
       const said = document.getElementById("said");
       button.onclick = async () => {
         mini.focus();
         mini.select();
         let done = false;
         try { done = document.execCommand("copy"); } catch (error) { done = false; }
         if (!done && navigator.clipboard) {
           try { await navigator.clipboard.writeText(mini.value); done = true; } catch (error) { done = false; }
         }
         said.textContent = done
           ? "Copied " + mini.value.length.toLocaleString() + " characters of minified JSON."
           : "Selected — press Ctrl+C to copy.";
         setTimeout(() => { said.textContent = ""; }, 4000);
       };
     </script>`,
    { width: 560, height: 440, title: "Export for agent" },
  );
}
