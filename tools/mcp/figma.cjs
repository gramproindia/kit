/*
 * Read a Figma design through the REST API and condense it to what a coding
 * agent can act on.
 *
 * Written against a real response rather than the documentation: the field
 * names here were confirmed by fetching a live file, and they match the
 * plugin API's scene graph exactly — `layoutMode`, `itemSpacing`, `padding*`,
 * `cornerRadius`, `fills`, `characters`, `primaryAxisAlignItems`.
 *
 * What it deliberately does not do is decide which component each region is.
 * A design drawn without the component library has no `componentId` to look
 * up, so that call is inference — and the agent, holding the catalogue and
 * the designer's own names for things, infers better than string matching in
 * a tool. This supplies structure, names, text and tokens; the agent decides.
 */
"use strict";

const fs = require("fs");
const path = require("path");

/** Figma's own limit is generous; a frame beyond this is unreadable anyway. */
const MAX_DEPTH = 10;

// ------------------------------------------------------------------ token

/**
 * The token, from the environment, the OS secret store, or a `.env`.
 *
 * The store is where it belongs and `.env` is kept only so that anyone who
 * set it up that way is not broken by an upgrade. Reading from a `.env` says
 * so once, on stderr — stdout carries JSON-RPC and nothing else may touch it.
 */
let warnedAboutDotenv = false;

function figmaToken() {
  if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN.trim();

  const stored = require("./secret.cjs").getSecret("figma");
  if (stored) return stored;

  for (const dir of [process.cwd(), path.join(__dirname, "..", "..")]) {
    const file = path.join(dir, ".env");
    if (!fs.existsSync(file)) continue;
    const match = fs.readFileSync(file, "utf8").match(/^\s*FIGMA_TOKEN\s*=\s*(.+)$/m);
    if (!match) continue;
    if (!warnedAboutDotenv) {
      warnedAboutDotenv = true;
      process.stderr.write(
        "grampro-kit: read FIGMA_TOKEN from .env. Move it out of the repository with " +
          "`npx @grampro/kit secret set figma`, then delete the line.\n",
      );
    }
    return match[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

/** figma.com/design/<key>/<name>?node-id=1-23 → { fileKey, nodeId } */
function parseFigmaUrl(url) {
  const key = String(url).match(/figma\.com\/(?:file|design|proto)\/([A-Za-z0-9]+)/);
  if (!key) return { error: "That does not look like a Figma file URL." };
  const node = String(url).match(/[?&]node-id=([0-9]+[-:][0-9]+)/);
  return { fileKey: key[1], nodeId: node ? node[1].replace("-", ":") : null };
}

/*
 * A file is fetched once and held briefly.
 *
 * The natural flow is two calls — list the frames, then read one — and a
 * file of any size is hundreds of KB. Fetching it twice in a row is what
 * earns a 429, which is how this cache came to exist.
 */
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map();

async function figmaGet(pathname, token) {
  const hit = cache.get(pathname);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.body;

  const res = await fetch(`https://api.figma.com/v1${pathname}`, {
    headers: { "X-Figma-Token": token },
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 403) {
      throw new Error(
        "Figma refused the token. Check FIGMA_TOKEN has 'File content: read' scope and can see this file.",
      );
    }
    if (res.status === 429) {
      /*
       * Figma's file-read limit is cost-based, and once a token is over it the
       * window is long — tens of minutes, not the "try again shortly" that
       * this message used to promise. The plugin route is the honest advice,
       * because it does not touch the API at all.
       */
      /*
       * Retry-After is meant to be seconds, and Figma has been seen to return
       * 395274 on a file read — four and a half days, or six minutes if the
       * value is milliseconds. Rather than state a figure that may be wrong by
       * three orders of magnitude, the number is passed through as given.
       */
      const after = res.headers.get("retry-after");
      const when = after
        ? `Figma's Retry-After says ${after} (nominally seconds).`
        : "That window is usually tens of minutes, not seconds.";
      throw new Error(
        `Figma is rate limiting this token. ${when} Nothing here can shorten it. ` +
          "To carry on now, use the kit's Figma plugin → 'Export selection for an agent' " +
          "and pass the result as `design` — that route reads the file from inside Figma " +
          "and never calls the API.",
      );
    }
    throw new Error(`Figma returned ${res.status}: ${body.slice(0, 160)}`);
  }

  const body = await res.json();
  cache.set(pathname, { at: Date.now(), body });
  return body;
}

// ------------------------------------------------------------- condensing

const hex = (c) => Math.round(c * 255).toString(16).padStart(2, "0");

function solidFill(node) {
  const fill = (node.fills || []).find((f) => f.type === "SOLID" && f.visible !== false);
  return fill ? `#${hex(fill.color.r)}${hex(fill.color.g)}${hex(fill.color.b)}` : undefined;
}

function layoutOf(node) {
  if (!node.layoutMode || node.layoutMode === "NONE") return undefined;
  const pad = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft];
  return {
    direction: node.layoutMode === "HORIZONTAL" ? "row" : "column",
    gap: node.itemSpacing || undefined,
    padding: pad.some((v) => v) ? pad.map((v) => v || 0) : undefined,
    align: node.counterAxisAlignItems,
    justify: node.primaryAxisAlignItems,
  };
}

/*
 * Text is lifted to the parent when a node's only content is one label.
 * Figma wraps nearly every string in its own frame, and passing that
 * structure through verbatim buries the design in scaffolding.
 */
function condense(node, depth) {
  const out = { name: node.name, type: node.type };

  const layout = layoutOf(node);
  if (layout) out.layout = layout;

  if (node.type === "TEXT" && node.characters && node.characters.trim()) {
    out.text = node.characters.trim();
    if (node.style) {
      out.font = { size: node.style.fontSize, weight: node.style.fontWeight };
    }
  }

  // An instance is a lookup, when the design was built from a library.
  if (node.type === "INSTANCE" && node.componentId) out.instanceOf = node.componentId;

  const style = {};
  const fill = solidFill(node);
  if (fill && node.type !== "TEXT") style.fill = fill;
  if (typeof node.cornerRadius === "number" && node.cornerRadius) style.radius = node.cornerRadius;
  if (Object.keys(style).length) out.style = style;

  if (node.absoluteBoundingBox) {
    out.size = [Math.round(node.absoluteBoundingBox.width), Math.round(node.absoluteBoundingBox.height)];
  }

  const kids = (node.children || []).filter((c) => c.visible !== false);
  if (kids.length && depth < MAX_DEPTH) {
    const children = kids.map((c) => condense(c, depth + 1));
    // A frame that exists only to hold one text node is noise.
    if (children.length === 1 && children[0].text && !children[0].children && !out.text) {
      out.text = children[0].text;
      out.font = children[0].font;
    } else {
      out.children = children;
    }
  }

  return out;
}

// ---------------------------------------------------------------- tokens

const luminance = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const saturation = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
};

/*
 * Colours get roles, not ranks.
 *
 * The most-used colour in a design is almost always the body text, and the
 * accent is used a handful of times on the one button that matters. Sorting
 * by frequency alone would theme the whole library the colour of its
 * paragraphs.
 */
function themeFrom(colours, radii, fontSizes) {
  const used = [...colours.entries()].sort((a, b) => b[1] - a[1]);
  const theme = [];
  const take = (variable, entry, note) => {
    if (entry) theme.push({ variable, value: entry[0], seenOn: entry[1], why: note });
  };

  /*
   * A near-black navy reads as highly saturated by the HSV measure — #192435
   * scores 0.53 — so saturation alone picks the body text as the brand
   * colour. Requiring real lightness as well is what separates an accent
   * from a dark neutral.
   */
  const saturated = used.filter(
    ([h]) => saturation(h) > 0.45 && luminance(h) > 0.2 && luminance(h) < 0.8,
  );
  const darkest = used.filter(([h]) => luminance(h) < 0.25).sort((a, b) => luminance(a[0]) - luminance(b[0]));
  const lightest = used.filter(([h]) => luminance(h) > 0.9).sort((a, b) => b[1] - a[1]);
  const mid = used.filter(([h]) => luminance(h) >= 0.25 && luminance(h) <= 0.9 && saturation(h) <= 0.35);

  take("--gbs-accent", saturated[0], "the most-used saturated colour");
  take("--gbs-fg", darkest[0], "the darkest colour, used for text");
  take("--gbs-bg", lightest[0], "the lightest colour, used for surfaces");
  take("--gbs-muted", mid[0], "a desaturated mid tone");

  const radius = [...radii.entries()].sort((a, b) => b[1] - a[1])[0];
  if (radius) theme.push({ variable: "--gbs-radius", value: `${radius[0]}px`, seenOn: radius[1] });

  // The body size is the most-used that a person could actually read.
  const body = [...fontSizes.entries()]
    .filter(([size]) => size >= 12)
    .sort((a, b) => b[1] - a[1])[0];
  if (body) theme.push({ variable: "--gbs-font-size", value: `${body[0]}px`, seenOn: body[1] });

  return theme;
}

function collectTokens(node, colours, radii, fontSizes) {
  const fill = solidFill(node);
  if (fill) colours.set(fill, (colours.get(fill) || 0) + 1);
  if (typeof node.cornerRadius === "number" && node.cornerRadius) {
    radii.set(node.cornerRadius, (radii.get(node.cornerRadius) || 0) + 1);
  }
  if (node.style && node.style.fontSize) {
    fontSizes.set(node.style.fontSize, (fontSizes.get(node.style.fontSize) || 0) + 1);
  }
  for (const child of node.children || []) collectTokens(child, colours, radii, fontSizes);
}

/** Names the designer repeated are the ones that mean something. */
function repeatedNames(node, counts) {
  counts.set(node.name, (counts.get(node.name) || 0) + 1);
  for (const child of node.children || []) repeatedNames(child, counts);
}

// ------------------------------------------------------------------- tool

/*
 * A selection exported by the plugin, which has already done the condensing
 * inside Figma. The work left is the part that needs no file access: giving
 * the colours roles and counting the names that repeat.
 *
 * This is the path for anyone who would rather not hold an API token, and
 * for files the token cannot reach.
 */
function fromPluginExport(design) {
  let parsed;
  try {
    parsed = typeof design === "string" ? JSON.parse(design) : design;
  } catch (error) {
    return { error: `That is not JSON: ${error.message}` };
  }
  if (!parsed || !Array.isArray(parsed.nodes)) {
    return {
      error:
        "Expected the output of the Figma plugin's 'Export selection for an agent' command.",
    };
  }

  const colours = new Map();
  const radii = new Map();
  const fontSizes = new Map();
  const names = new Map();
  const visit = (node) => {
    names.set(node.name, (names.get(node.name) || 0) + 1);
    if (node.style) {
      if (node.style.fill) colours.set(node.style.fill, (colours.get(node.style.fill) || 0) + 1);
      if (node.style.radius) radii.set(node.style.radius, (radii.get(node.style.radius) || 0) + 1);
      if (node.style.fontSize) {
        fontSizes.set(node.style.fontSize, (fontSizes.get(node.style.fontSize) || 0) + 1);
      }
    }
    for (const child of node.children || []) visit(child);
  };
  for (const node of parsed.nodes) visit(node);

  const instances = [];
  const findInstances = (n) => {
    if (n.component) instances.push(n.component);
    for (const c of n.children || []) findInstances(c);
  };
  for (const node of parsed.nodes) findInstances(node);

  return {
    source: "figma plugin export",
    frame: parsed.frame,
    theme: themeFrom(colours, radii, fontSizes),
    repeatedRegions: [...names.entries()]
      .filter(([, n]) => n > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, n]) => ({ name, times: n })),
    builtFromLibrary: instances.length > 0,
    componentsNamed: [...new Set(instances)],
    tree: parsed.nodes,
  };
}

async function figmaFrame({ url, design, frame, depth }) {
  // The export needs no token, so it is offered before one is demanded.
  if (design) return fromPluginExport(design);

  const token = figmaToken();
  if (!token) {
    return {
      error:
        "No Figma token. Two ways forward, and the first needs no credentials: " +
        "run the kit's Figma plugin → 'Export selection for an agent' and pass the result as `design`. " +
        "Otherwise create a token at Figma → Settings → Security → Personal access tokens " +
        "(scope: File content, read) and store it with `npx @grampro/kit secret set figma`.",
    };
  }

  const { fileKey, nodeId, error } = parseFigmaUrl(url);
  if (error) return { error };

  /*
   * Three shapes of request, cheapest first.
   *
   * A URL carrying a node-id — which is what Figma gives you when you copy a
   * link to a frame — is one targeted call and nothing else. Otherwise the
   * frames are listed with depth=1, which returns the outline of the document
   * rather than the document, and the chosen frame is then fetched by id.
   * Figma's limits are cost-based and the cost is the payload, so pulling the
   * whole file to answer either question is what earns a 429.
   */
  let file;
  let roots;
  try {
    if (nodeId) {
      file = await figmaGet(`/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, token);
      roots = Object.values(file.nodes || {}).filter(Boolean).map((n) => n.document);
    } else {
      const outline = await figmaGet(`/files/${fileKey}?depth=1`, token);
      const tops = (outline.document.children || []).flatMap((page) => page.children || []);

      if (!frame) {
        return {
          file: outline.name,
          frames: tops.map((f) => ({
            name: f.name,
            id: f.id,
            size: f.absoluteBoundingBox
              ? [Math.round(f.absoluteBoundingBox.width), Math.round(f.absoluteBoundingBox.height)]
              : undefined,
          })),
          next: "Call again with `frame` set to the one you want to build. Passing a URL that already carries a node-id skips this step.",
        };
      }

      const match = tops.find((f) => f.name.toLowerCase() === String(frame).toLowerCase());
      if (!match) {
        return { error: `No frame called "${frame}".`, frames: tops.map((f) => f.name) };
      }
      file = await figmaGet(`/files/${fileKey}/nodes?ids=${encodeURIComponent(match.id)}`, token);
      roots = Object.values(file.nodes || {}).filter(Boolean).map((n) => n.document);
      file.name = outline.name;
    }
  } catch (e) {
    return { error: e.message };
  }

  if (!roots || roots.length === 0) return { error: "Nothing to read at that URL." };

  /*
   * Without a frame named, the whole file would arrive at once — hundreds of
   * KB that buries the screen the agent was asked about. So the first call
   * lists what is there and the second asks for one.
   */
  const wanted = frame
    ? roots.filter((r) => r.name.toLowerCase() === String(frame).toLowerCase())
    : roots;

  if (wanted.length === 0) {
    return { error: `No frame called "${frame}".`, frames: roots.map((r) => r.name) };
  }

  const target = wanted[0];
  const colours = new Map();
  const radii = new Map();
  const fontSizes = new Map();
  const names = new Map();
  collectTokens(target, colours, radii, fontSizes);
  repeatedNames(target, names);

  const limit = Math.min(Number(depth) || MAX_DEPTH, MAX_DEPTH);
  const tree = condense(target, MAX_DEPTH - limit);

  const instances = [];
  const findInstances = (n) => {
    if (n.instanceOf) instances.push(n.name);
    for (const c of n.children || []) findInstances(c);
  };
  findInstances(tree);

  return {
    file: file.name,
    frame: target.name,
    size: tree.size,
    theme: themeFrom(colours, radii, fontSizes),
    /* Repetition is the signal: eight "Status cell" nodes are a column. */
    repeatedRegions: [...names.entries()]
      .filter(([, n]) => n > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, n]) => ({ name, times: n })),
    builtFromLibrary: instances.length > 0,
    tree,
    howToUse: instances.length
      ? "This design uses component instances; `instanceOf` names the master for each."
      : "This design was drawn without the component library, so nothing names a component directly. Use the region names and structure to decide which catalogue component each part is, then call get_component before writing it.",
  };
}

module.exports = { figmaFrame, parseFigmaUrl, themeFrom };
