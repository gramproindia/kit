/*
 * The architecture diagrams, drawn here and rendered to webp.
 *
 * Three concepts on this site are flows rather than components, and a flow is
 * the one thing a code sample cannot show: what talks to what, in what order,
 * and which step is the one that makes it work. Those get a picture.
 *
 * Why generate rather than commit an export from a drawing tool:
 *
 *   - the colours come from v2.css, so a diagram cannot drift from the site's
 *     palette without someone editing this file;
 *   - a webp is a raster, so it cannot follow the theme switch the way CSS
 *     can. Each diagram is therefore rendered twice, light and dark, and the
 *     page shows whichever matches. Doing that by hand means four files to
 *     keep in step per diagram instead of one source;
 *   - the source stays readable in the repository, which matters for a
 *     project people are meant to be able to fork.
 *
 * Fonts are the one thing this cannot pin down: librsvg resolves them from
 * the machine that runs the script, so regenerating on a different OS can
 * shift text metrics slightly. The output is committed, so this only matters
 * to whoever regenerates.
 *
 *   node scripts/build-diagrams.mjs
 *   node scripts/build-diagrams.mjs --only=se-agent   # just the diagrams whose name starts with this
 *
 * `--only` also skips the social card, so regenerating one set does not
 * rewrite every other committed image with this machine's font metrics.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "diagrams");

/* The v2.css palettes, so the diagrams match the page they sit on. */
const LIGHT = {
  name: "light",
  bg: "#ffffff",
  fg: "#09090b",
  muted: "#52525b",
  faint: "#71717a",
  border: "#e4e4e7",
  borderStrong: "#d4d4d8",
  surface: "#fafafa",
  subtle: "#f4f4f5",
  accent: "#0284c7",
  accentSoft: "#e0f2fe",
  accentFg: "#ffffff",
  tip: "#059669",
  tipSoft: "#ecfdf5",
  warning: "#b45309",
  warningSoft: "#fffbeb",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
};

const DARK = {
  name: "dark",
  bg: "#09090b",
  fg: "#fafafa",
  muted: "#a1a1aa",
  faint: "#8b8b94",
  border: "#232327",
  borderStrong: "#34343a",
  surface: "#0e0e11",
  subtle: "#18181b",
  accent: "#38bdf8",
  accentSoft: "#10242f",
  accentFg: "#06121a",
  tip: "#34d399",
  tipSoft: "#0c1f19",
  warning: "#fbbf24",
  warningSoft: "#231b0c",
  danger: "#f87171",
  dangerSoft: "#241113",
};

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

/* ------------------------------------------------------------- primitives */

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A rounded panel. `tone` picks a soft fill and a matching border. */
function box({ x, y, w, h, p, tone = "surface", dashed = false, r = 10 }) {
  const fills = {
    surface: [p.surface, p.border],
    subtle: [p.subtle, p.border],
    accent: [p.accentSoft, p.accent],
    tip: [p.tipSoft, p.tip],
    warning: [p.warningSoft, p.warning],
    danger: [p.dangerSoft, p.danger],
    plain: ["none", p.borderStrong],
  };
  const [fill, stroke] = fills[tone] ?? fills.surface;
  const dash = dashed ? ' stroke-dasharray="5 4"' : "";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.25"${dash}/>`;
}

function text({
  x,
  y,
  s,
  p,
  size = 14,
  weight = 400,
  fill = "fg",
  anchor = "start",
  mono = false,
  opacity = 1,
}) {
  const colour = p[fill] ?? fill;
  return `<text x="${x}" y="${y}" font-family="${mono ? MONO : FONT}" font-size="${size}" font-weight="${weight}" fill="${colour}" text-anchor="${anchor}" opacity="${opacity}">${esc(s)}</text>`;
}

/** An arrow. Horizontal unless `down`. */
function arrow({ x1, y1, x2, y2, p, colour = "borderStrong", dashed = false, head = true }) {
  const stroke = p[colour] ?? colour;
  const dash = dashed ? ' stroke-dasharray="4 4"' : "";
  const line = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.5"${dash}/>`;
  if (!head) return line;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const size = 6;
  // Two barbs, rotated with the line.
  const bx = x2 - ux * size;
  const by = y2 - uy * size;
  const nx = -uy * (size * 0.55);
  const ny = ux * (size * 0.55);
  return `${line}<polygon points="${x2},${y2} ${bx + nx},${by + ny} ${bx - nx},${by - ny}" fill="${stroke}"/>`;
}

/** A small pill, for labelling a step or a count. */
function pill({ x, y, s, p, tone = "accent", size = 11 }) {
  const w = String(s).length * (size * 0.62) + 16;
  const fills = {
    accent: [p.accentSoft, p.accent],
    tip: [p.tipSoft, p.tip],
    danger: [p.dangerSoft, p.danger],
    warning: [p.warningSoft, p.warning],
    subtle: [p.subtle, p.muted],
  };
  const [fill, fg] = fills[tone] ?? fills.accent;
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${size + 9}" rx="${(size + 9) / 2}" fill="${fill}"/>` +
    text({
      x: x + w / 2,
      y: y + size + 1.5,
      s,
      p: { [fg]: fg },
      size,
      weight: 600,
      fill: fg,
      anchor: "middle",
    })
  );
}

const frame = (w, h, p, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
  `<rect width="${w}" height="${h}" fill="${p.bg}"/>${body}</svg>`;

/** Several lines of text, one under the other. */
function lines({ x, y, rows, p, size = 11, lh = 16, ...rest }) {
  return rows.map((s, i) => text({ x, y: y + i * lh, s, p, size, ...rest })).join("");
}

/** A diagram's title and one-line summary, in the same place on every diagram. */
const heading = (p, title, summary) =>
  text({ x: 28, y: 36, s: title, p, size: 17, weight: 700 }) +
  text({ x: 28, y: 58, s: summary, p, size: 12.5, fill: "muted" });

/* ----------------------------------------------------- 1. the agent skill */

/*
 * The point of the picture: two tiers. SKILL.md is small and always in the
 * agent's context; the references are bigger and fetched only when the task
 * touches them. That split is the whole reason the skill fits in a budget
 * measured in characters.
 */
function agentSkill(p) {
  const W = 920;
  const H = 430;
  let s = "";

  s += text({ x: 28, y: 36, s: "The agent skill", p, size: 17, weight: 700 });
  s += text({
    x: 28,
    y: 58,
    s: "One command writes guidance into your repo. The agent reads it before it writes code.",
    p,
    size: 12.5,
    fill: "muted",
  });

  // The command.
  s += box({ x: 28, y: 170, w: 250, h: 46, p, tone: "subtle" });
  s += text({ x: 44, y: 198, s: "npx @grampro/kit skill", p, size: 13, mono: true, fill: "accent" });

  s += arrow({ x1: 286, y1: 193, x2: 326, y2: 193, p });

  // What lands in the repo.
  s += box({ x: 334, y: 78, w: 300, h: 230, p, tone: "plain", dashed: true });
  s += text({ x: 350, y: 100, s: "your repo", p, size: 11, weight: 600, fill: "faint" });

  s += box({ x: 350, y: 112, w: 268, h: 70, p, tone: "accent" });
  s += text({ x: 364, y: 132, s: ".gbs/skills/gbs-components/", p, size: 10, mono: true, fill: "muted" });
  s += text({ x: 364, y: 150, s: "SKILL.md", p, size: 12.5, mono: true, weight: 700 });
  s += text({ x: 364, y: 166, s: "always in the agent's context", p, size: 10.5, fill: "accent" });
  s += pill({ x: 540, y: 136, s: "~10 KB", p, tone: "accent" });

  s += box({ x: 350, y: 194, w: 268, h: 96, p, tone: "subtle" });
  s += text({ x: 364, y: 208, s: "references/", p, size: 11.5, mono: true, weight: 600 });
  s += text({ x: 364, y: 228, s: "forms · pickers · overlays · toaster", p, size: 10.5, fill: "muted", mono: true });
  s += text({ x: 364, y: 245, s: "data-grid · data-display · styling", p, size: 10.5, fill: "muted", mono: true });
  s += text({ x: 364, y: 271, s: "read only when the task needs them", p, size: 11, fill: "faint" });

  s += arrow({ x1: 642, y1: 143, x2: 690, y2: 143, p, colour: "accent" });
  s += arrow({ x1: 642, y1: 238, x2: 690, y2: 238, p, dashed: true });

  // The agent, and the difference it makes.
  s += box({ x: 698, y: 78, w: 194, h: 230, p, tone: "surface" });
  s += text({ x: 795, y: 104, s: "your coding agent", p, size: 12, weight: 600, anchor: "middle" });

  s += box({ x: 714, y: 120, w: 162, h: 76, p, tone: "danger" });
  s += text({ x: 728, y: 140, s: "without the skill", p, size: 10.5, weight: 600, fill: "danger" });
  s += text({ x: 728, y: 160, s: 'import { Button }', p, size: 10, mono: true, fill: "muted" });
  s += text({ x: 728, y: 175, s: 'from "@grampro/kit"', p, size: 10, mono: true, fill: "muted" });
  s += text({ x: 728, y: 190, s: "does not resolve", p, size: 10, fill: "danger" });

  s += box({ x: 714, y: 208, w: 162, h: 82, p, tone: "tip" });
  s += text({ x: 728, y: 228, s: "with it", p, size: 10.5, weight: 600, fill: "tip" });
  s += text({ x: 728, y: 248, s: "copies source in,", p, size: 10, fill: "muted" });
  s += text({ x: 728, y: 263, s: "imports the real path,", p, size: 10, fill: "muted" });
  s += text({ x: 728, y: 278, s: "uses props that exist", p, size: 10, fill: "muted" });

  // The footnote that answers the obvious question.
  s += box({ x: 28, y: 336, w: 864, h: 66, p, tone: "subtle" });
  s += text({
    x: 46,
    y: 360,
    s: "Independent of the MCP server. The skill is what tells an agent the library exists and that it should ask;",
    p,
    size: 11.5,
    fill: "muted",
  });
  s += text({
    x: 46,
    y: 380,
    s: "the server is what it asks. Either works alone — together, the agent reaches for the tools unprompted.",
    p,
    size: 11.5,
    fill: "muted",
  });

  return frame(W, H, p, s);
}

/* ----------------------------------------------------- 2. the MCP server */

/*
 * Two things to get across: the server answers from its own package rather
 * than from anything in your project, and the tools form a loop — read, act,
 * then check what you wrote.
 */
function mcpServer(p) {
  const W = 920;
  const H = 470;
  let s = "";

  s += text({ x: 28, y: 36, s: "The MCP server", p, size: 17, weight: 700 });
  s += text({
    x: 28,
    y: 58,
    s: "Seven tools over stdio. The agent reads the real API instead of recalling one.",
    p,
    size: 12.5,
    fill: "muted",
  });

  // Agent.
  s += box({ x: 28, y: 92, w: 168, h: 92, p, tone: "surface" });
  s += text({ x: 112, y: 122, s: "your coding agent", p, size: 12, weight: 600, anchor: "middle" });
  s += text({ x: 112, y: 142, s: "Claude Code · Codex", p, size: 10.5, fill: "muted", anchor: "middle" });
  s += text({ x: 112, y: 158, s: "Cursor", p, size: 10.5, fill: "muted", anchor: "middle" });

  s += arrow({ x1: 204, y1: 128, x2: 266, y2: 128, p, colour: "accent" });
  s += arrow({ x1: 266, y1: 150, x2: 204, y2: 150, p, colour: "accent" });
  s += text({ x: 235, y: 118, s: "JSON-RPC", p, size: 9.5, fill: "faint", anchor: "middle", mono: true });
  s += text({ x: 235, y: 174, s: "stdio", p, size: 9.5, fill: "faint", anchor: "middle", mono: true });

  // The server and its tools.
  s += box({ x: 274, y: 80, w: 360, h: 286, p, tone: "accent" });
  s += text({ x: 292, y: 104, s: "grampro MCP server", p, size: 12.5, weight: 700 });
  s += text({ x: 292, y: 122, s: "npx -y @grampro/kit mcp", p, size: 10.5, mono: true, fill: "accent" });

  const tools = [
    ["list_components", "what exists"],
    ["get_component", "props, from the passport"],
    ["get_example", "a working usage"],
    ["get_guidance", "the reference notes"],
    ["figma_frame", "read a design"],
    ["install_component", "copy it into the project"],
    ["validate_usage", "check the JSX just written"],
  ];
  tools.forEach(([name, what], i) => {
    const y = 140 + i * 31;
    s += box({ x: 292, y, w: 324, h: 25, p, tone: "surface", r: 6 });
    s += text({ x: 304, y: y + 17, s: name, p, size: 10.5, mono: true, weight: 600 });
    s += text({ x: 608, y: y + 17, s: what, p, size: 10, fill: "muted", anchor: "end" });
  });

  // What it answers from.
  s += arrow({ x1: 454, y1: 374, x2: 454, y2: 404, p });
  s += box({ x: 274, y: 410, w: 360, h: 48, p, tone: "subtle" });
  s += text({ x: 454, y: 430, s: "its own package — not your project", p, size: 11.5, weight: 600, anchor: "middle" });
  s += text({
    x: 454,
    y: 448,
    s: "catalogue · passports · guidance",
    p,
    size: 10.5,
    fill: "muted",
    anchor: "middle",
    mono: true,
  });

  // Design sources on the right.
  s += text({ x: 660, y: 100, s: "figma_frame reads from", p, size: 11, weight: 600, fill: "faint" });

  s += box({ x: 660, y: 112, w: 232, h: 60, p, tone: "surface" });
  s += text({ x: 674, y: 134, s: "a Figma URL", p, size: 11.5, weight: 600 });
  s += text({ x: 674, y: 154, s: "one step · needs a token", p, size: 10.5, fill: "muted" });
  s += pill({ x: 820, y: 119, s: "start here", p, tone: "tip" });

  s += box({ x: 660, y: 184, w: 232, h: 60, p, tone: "subtle" });
  s += text({ x: 674, y: 206, s: "a plugin export", p, size: 11.5, weight: 600 });
  s += text({ x: 674, y: 226, s: "every screen · no token", p, size: 10.5, fill: "muted" });

  s += arrow({ x1: 656, y1: 142, x2: 624, y2: 265, p, dashed: true, head: false });
  s += arrow({ x1: 656, y1: 214, x2: 624, y2: 265, p, dashed: true, head: false });

  // The loop that matters.
  s += box({ x: 660, y: 268, w: 232, h: 98, p, tone: "tip" });
  s += text({ x: 674, y: 290, s: "why it compiles", p, size: 11.5, weight: 600, fill: "tip" });
  s += text({ x: 674, y: 310, s: "the agent reads the props", p, size: 10.5, fill: "muted" });
  s += text({ x: 674, y: 326, s: "before writing, then has", p, size: 10.5, fill: "muted" });
  s += text({ x: 674, y: 342, s: "its own JSX checked against", p, size: 10.5, fill: "muted" });
  s += text({ x: 674, y: 358, s: "the passport it read", p, size: 10.5, fill: "muted" });

  return frame(W, H, p, s);
}

/* -------------------------------------------- 3. ask the grid (DataGrid AI) */

/*
 * The five layers, and the fact that nothing reaches the grid until all of
 * them pass. The outcomes hanging off the validator are the part people
 * assume is missing: a refusal is a designed result, not an error.
 */
function askTheGrid(p) {
  const W = 920;
  const H = 450;
  let s = "";

  s += text({ x: 28, y: 36, s: "Ask the grid", p, size: 17, weight: 700 });
  s += text({
    x: 28,
    y: 58,
    s: "A sentence becomes a grid operation only if every layer passes. No model is bundled.",
    p,
    size: 12.5,
    fill: "muted",
  });

  // The sentence.
  s += box({ x: 28, y: 92, w: 268, h: 58, p, tone: "surface" });
  s += text({ x: 44, y: 114, s: "what they typed", p, size: 10.5, weight: 600, fill: "faint" });
  s += text({ x: 44, y: 136, s: '"people in Engineering over 150k"', p, size: 11.5, fill: "fg" });

  s += arrow({ x1: 304, y1: 121, x2: 344, y2: 121, p });

  // The adapter — theirs, not ours.
  s += box({ x: 352, y: 92, w: 236, h: 58, p, tone: "warning" });
  s += text({ x: 368, y: 114, s: "your adapter", p, size: 11.5, weight: 700 });
  s += text({ x: 368, y: 134, s: "your endpoint, your key, your model", p, size: 10, fill: "muted" });
  s += pill({ x: 500, y: 99, s: "proposes", p, tone: "warning" });

  s += arrow({ x1: 596, y1: 121, x2: 636, y2: 121, p });

  s += box({ x: 644, y: 92, w: 248, h: 58, p, tone: "subtle" });
  s += text({ x: 660, y: 114, s: "untrusted output", p, size: 11.5, weight: 600 });
  s += text({ x: 660, y: 134, s: "treated like any form submission", p, size: 10, fill: "muted" });

  s += arrow({ x1: 768, y1: 158, x2: 768, y2: 184, p });

  // The validator.
  s += box({ x: 28, y: 190, w: 864, h: 96, p, tone: "accent" });
  s += text({ x: 46, y: 214, s: "the validator decides", p, size: 12.5, weight: 700 });

  const layers = ["schema", "reference", "coercion", "policy", "plausibility"];
  layers.forEach((layer, i) => {
    const x = 46 + i * 168;
    s += box({ x, y: 228, w: 156, h: 42, p, tone: "surface", r: 8 });
    s += text({ x: x + 78, y: 248, s: layer, p, size: 11.5, weight: 600, anchor: "middle" });
    s += text({
      x: x + 78,
      y: 263,
      s: ["shape", "real columns", "types", "what you allow", "does it make sense"][i],
      p,
      size: 9.5,
      fill: "muted",
      anchor: "middle",
    });
    if (i < layers.length - 1) {
      s += arrow({ x1: x + 158, y1: 249, x2: x + 166, y2: 249, p, head: false });
    }
  });

  // Outcomes.
  s += arrow({ x1: 180, y1: 294, x2: 180, y2: 322, p, colour: "tip" });
  s += arrow({ x1: 640, y1: 294, x2: 640, y2: 322, p, colour: "danger" });

  s += box({ x: 28, y: 328, w: 304, h: 96, p, tone: "tip" });
  s += text({ x: 46, y: 350, s: "every layer passed", p, size: 11.5, weight: 700, fill: "tip" });
  s += text({ x: 46, y: 372, s: "executors run, the grid filters,", p, size: 10.5, fill: "muted" });
  s += text({ x: 46, y: 388, s: "and the box reports what it did", p, size: 10.5, fill: "muted" });
  s += text({ x: 46, y: 410, s: "irreversible work still asks first", p, size: 10.5, fill: "tip" });

  s += box({ x: 352, y: 328, w: 540, h: 96, p, tone: "danger" });
  s += text({ x: 370, y: 350, s: "a layer refused", p, size: 11.5, weight: 700, fill: "danger" });
  s += text({ x: 370, y: 372, s: "the grid is untouched, and the box names the layer that said no", p, size: 10.5, fill: "muted" });
  s += text({ x: 370, y: 394, s: "no such column  ·  operator the type lacks  ·  a column you marked off-limits", p, size: 10, fill: "muted", mono: true });
  s += text({ x: 370, y: 412, s: "rejected · declined — or clarify / needs-confirmation when it must ask you first", p, size: 10, fill: "danger" });

  return frame(W, H, p, s);
}

/* ------------------------------------------------- GBS SE Agent diagrams */

/*
 * The agent's own pages, under /se-agent. Same palette and primitives as the
 * component diagrams, so the section reads as part of this site rather than a
 * page pasted in from elsewhere.
 */

/* The four layers, and the rule that nothing skips one. */
function seAgentLayers(p) {
  const W = 920;
  const H = 580;
  let s = heading(p, "The parts, and who may talk to whom", "Four layers inside the extension. Each one only talks to its neighbour.");

  s += box({ x: 28, y: 84, w: 572, h: 62, p, tone: "subtle" });
  s += text({ x: 46, y: 109, s: "Chat panel (webview)", p, size: 12.5, weight: 700 });
  s += text({ x: 46, y: 129, s: "sandboxed · holds no state · renders what it is sent", p, size: 10.5, fill: "muted" });
  s += pill({ x: 508, y: 104, s: "UI only", p, tone: "subtle" });

  const link = (y, down, up) => {
    let out = arrow({ x1: 200, y1: y, x2: 200, y2: y + 34, p });
    out += arrow({ x1: 240, y1: y + 34, x2: 240, y2: y, p });
    out += text({ x: 190, y: y + 21, s: down, p, size: 10, fill: "faint", anchor: "end" });
    out += text({ x: 250, y: y + 21, s: up, p, size: 10, fill: "faint" });
    return out;
  };

  s += link(150, "your messages, clicks", "updates to draw");

  s += box({ x: 28, y: 188, w: 572, h: 62, p, tone: "surface" });
  s += text({ x: 46, y: 213, s: "Session controller", p, size: 12.5, weight: 700 });
  s += text({ x: 46, y: 233, s: "owns the chat: history, approvals, queued messages, saving", p, size: 10.5, fill: "muted" });

  s += link(254, "runs a turn", "progress, tool rows");

  s += box({ x: 28, y: 292, w: 572, h: 62, p, tone: "accent" });
  s += text({ x: 46, y: 317, s: "Agent loop", p, size: 12.5, weight: 700 });
  s += text({ x: 46, y: 337, s: "owns one turn: model calls, tool scheduling, checks, compaction", p, size: 10.5, fill: "muted" });
  s += pill({ x: 464, y: 312, s: "permission gate", p, tone: "warning" });

  s += arrow({ x1: 167, y1: 358, x2: 167, y2: 392, p });
  s += arrow({ x1: 461, y1: 358, x2: 461, y2: 392, p });

  s += box({ x: 28, y: 396, w: 278, h: 62, p, tone: "surface" });
  s += text({ x: 46, y: 421, s: "Tools", p, size: 12.5, weight: 700 });
  s += text({ x: 46, y: 441, s: "10 built in, plus MCP tools", p, size: 10.5, fill: "muted" });

  s += box({ x: 322, y: 396, w: 278, h: 62, p, tone: "surface" });
  s += text({ x: 340, y: 421, s: "Providers", p, size: 12.5, weight: 700 });
  s += text({ x: 340, y: 441, s: "Ollama · OpenAI-compatible", p, size: 10.5, fill: "muted" });

  s += arrow({ x1: 94, y1: 462, x2: 94, y2: 496, p, dashed: true });
  s += arrow({ x1: 240, y1: 462, x2: 240, y2: 496, p, dashed: true });
  s += arrow({ x1: 461, y1: 462, x2: 461, y2: 496, p, dashed: true });

  s += box({ x: 28, y: 500, w: 134, h: 54, p, tone: "plain", dashed: true });
  s += text({ x: 95, y: 523, s: "your workspace", p, size: 11, weight: 600, anchor: "middle" });
  s += text({ x: 95, y: 540, s: "files · terminal", p, size: 10, fill: "muted", anchor: "middle" });

  s += box({ x: 172, y: 500, w: 134, h: 54, p, tone: "plain", dashed: true });
  s += text({ x: 239, y: 523, s: "MCP servers", p, size: 11, weight: 600, anchor: "middle" });
  s += text({ x: 239, y: 540, s: "child processes", p, size: 10, fill: "muted", anchor: "middle" });

  s += box({ x: 322, y: 500, w: 278, h: 54, p, tone: "plain", dashed: true });
  s += text({ x: 461, y: 523, s: "the model", p, size: 11, weight: 600, anchor: "middle" });
  s += text({ x: 461, y: 540, s: "on your machine, a company server, or a cloud API", p, size: 10, fill: "muted", anchor: "middle" });

  s += box({ x: 632, y: 84, w: 260, h: 470, p, tone: "subtle" });
  s += text({ x: 652, y: 112, s: "The rules", p, size: 12.5, weight: 700 });
  s += lines({
    x: 652,
    y: 140,
    p,
    size: 11,
    fill: "muted",
    rows: [
      "Nothing skips a layer.",
      "",
      "The chat panel cannot touch files",
      "or the network. It sends what you",
      "did and draws what it is told.",
      "",
      "Every action that changes",
      "anything runs in the extension",
      "host, behind the permission gate.",
      "",
      "Providers own the wire format, so",
      "the loop never deals with HTTP.",
      "Switching model servers changes",
      "nothing above them.",
      "",
      "Dashed boxes are outside the",
      "extension: everything it touches",
      "goes through a tool or a provider.",
    ],
  });

  return frame(W, H, p, s);
}

/* One turn: a loop, not a pipeline. */
function seAgentTurn(p) {
  const W = 920;
  const H = 440;
  let s = heading(p, "One turn, start to finish", "The model is called again and again until it answers without asking for a tool.");

  const step = (x, y, w, title, sub, tone = "surface") =>
    box({ x, y, w, h: 56, p, tone }) +
    text({ x: x + 14, y: y + 23, s: title, p, size: 12, weight: 700 }) +
    text({ x: x + 14, y: y + 41, s: sub, p, size: 10, fill: "muted" });

  s += step(28, 96, 150, "Your message", "+ open file, @mentions");
  s += arrow({ x1: 182, y1: 124, x2: 202, y2: 124, p });
  s += step(206, 96, 166, "Compact if needed", "keep the prompt in budget", "subtle");
  s += arrow({ x1: 376, y1: 124, x2: 396, y2: 124, p });
  s += step(400, 96, 150, "Call the model", "streamed · retried if busy", "accent");
  s += arrow({ x1: 554, y1: 124, x2: 576, y2: 124, p });

  // The decision.
  const cx = 634;
  const cy = 124;
  s += `<polygon points="${cx},${cy - 34} ${cx + 56},${cy} ${cx},${cy + 34} ${cx - 56},${cy}" fill="${p.warningSoft}" stroke="${p.warning}" stroke-width="1.25"/>`;
  s += text({ x: cx, y: cy + 4, s: "tools asked?", p, size: 11, weight: 600, anchor: "middle" });

  s += arrow({ x1: cx + 58, y1: cy, x2: 730, y2: cy, p, colour: "tip" });
  s += text({ x: 711, y: cy - 8, s: "no", p, size: 10.5, weight: 600, fill: "tip", anchor: "middle" });
  s += step(734, 96, 158, "Answer", "files changed · tokens · undo", "tip");

  s += arrow({ x1: cx, y1: cy + 36, x2: cx, y2: 234, p, colour: "warning" });
  s += text({ x: cx + 10, y: 200, s: "yes", p, size: 10.5, weight: 600, fill: "warning" });

  s += step(560, 238, 150, "Permission gate", "ask, allow or deny", "warning");
  s += arrow({ x1: 556, y1: 266, x2: 536, y2: 266, p });
  s += step(370, 238, 162, "Run the tools", "read-only ones in parallel");
  s += arrow({ x1: 366, y1: 266, x2: 346, y2: 266, p });
  s += step(196, 238, 146, "Check diagnostics", "after any edit");
  s += arrow({ x1: 192, y1: 266, x2: 172, y2: 266, p });
  s += step(28, 238, 140, "Append results", "to the conversation", "subtle");

  // Back round to the top: the edge that makes it a loop.
  s += arrow({ x1: 98, y1: 234, x2: 98, y2: 178, p, colour: "accent", head: false });
  s += arrow({ x1: 98, y1: 178, x2: 289, y2: 178, p, colour: "accent", head: false });
  s += arrow({ x1: 289, y1: 178, x2: 289, y2: 156, p, colour: "accent" });
  s += text({ x: 194, y: 172, s: "call again", p, size: 10, fill: "accent", anchor: "middle" });

  s += box({ x: 28, y: 330, w: 864, h: 82, p, tone: "subtle" });
  const notes = [
    ["Step budget", ["60 model calls per request", "(gbsAgent.maxSteps), then it pauses."]],
    ["Steer while it works", ["Messages you send mid-turn", "join at the next step."]],
    ["Stop any time", ["Esc cancels the current call.", "Finished edits stay."]],
  ];
  notes.forEach(([title, rows], i) => {
    const x = 48 + i * 288;
    s += text({ x, y: 356, s: title, p, size: 11.5, weight: 700 });
    s += lines({ x, y: 376, rows, p, size: 10.5, fill: "muted" });
  });

  return frame(W, H, p, s);
}

/* What a request costs, and what gets cut first. */
function seAgentContext(p) {
  const W = 920;
  const H = 460;
  let s = heading(p, "What every request carries", "The opening never changes between steps. Growth happens at the end, and cuts come from the middle.");

  const seg = (x, w, tone, title, sub, dashed = false) =>
    box({ x, y: 104, w, h: 58, p, tone, dashed, r: 6 }) +
    text({ x: x + 10, y: 128, s: title, p, size: 11, weight: 700 }) +
    text({ x: x + 10, y: 146, s: sub, p, size: 9.5, fill: "muted" });

  s += seg(28, 148, "accent", "system prompt", "rules · tool list");
  s += seg(180, 116, "accent", "environment", "OS · AGENTS.md");
  s += seg(300, 106, "accent", "skills · MCP", "catalog lines");
  s += seg(410, 290, "surface", "conversation", "your requests, tool results — grows every step");
  s += seg(704, 188, "plain", "reserved for the answer", "up to maxOutputTokens", true);

  s += arrow({ x1: 28, y1: 92, x2: 406, y2: 92, p, colour: "accent", head: false });
  s += text({ x: 217, y: 86, s: "byte-identical on every step, so the server can cache it", p, size: 10, fill: "accent", anchor: "middle" });

  s += `<line x1="650" y1="96" x2="650" y2="172" stroke="${p.danger}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  s += text({ x: 650, y: 188, s: "compaction starts here: about 85% of what is left", p, size: 10, fill: "danger", anchor: "middle" });

  s += text({ x: 28, y: 226, s: "When the conversation outgrows the budget, the cheapest thing goes first", p, size: 12, weight: 700 });

  const rung = (x, n, tone, title, rows, cost) =>
    box({ x, y: 240, w: 272, h: 92, p, tone }) +
    pill({ x: x + 14, y: 252, s: n, p, tone: tone === "warning" ? "warning" : "accent" }) +
    text({ x: x + 46, y: 265, s: title, p, size: 12, weight: 700 }) +
    lines({ x: x + 14, y: 290, rows, p, size: 10.5, fill: "muted" }) +
    text({ x: x + 258, y: 265, s: cost, p, size: 10, weight: 600, fill: tone === "warning" ? "warning" : "tip", anchor: "end" });

  s += rung(28, "1", "surface", "Stub earlier requests", ["Each new request turns big tool", "output from earlier ones into notes."], "free");
  s += arrow({ x1: 304, y1: 286, x2: 322, y2: 286, p });
  s += rung(324, "2", "surface", "Drop old tool output", ["Over budget: the six newest", "results stay, older ones go."], "free");
  s += arrow({ x1: 600, y1: 286, x2: 618, y2: 286, p });
  s += rung(620, "3", "warning", "Summarise", ["A model call condenses older", "history. Also: /compact."], "1 request");

  s += box({ x: 28, y: 352, w: 864, h: 84, p, tone: "subtle" });
  s += text({ x: 48, y: 376, s: "In normal numbers", p, size: 11.5, weight: 700 });
  s += lines({
    x: 48,
    y: 396,
    p,
    size: 10.5,
    fill: "muted",
    rows: [
      "The default window is 32,768 tokens, about 24,000 words. With an 8,192-token answer reserve, compaction starts near 20,900 tokens.",
      "Set gbsAgent.contextWindow to what your model really supports, so it compacts before the server cuts the request off.",
    ],
  });

  return frame(W, H, p, s);
}

/* Skills: three stages, each paid for only when it is used. */
function seAgentSkills(p) {
  const W = 920;
  const H = 426;
  let s = heading(p, "Skills, in three stages", "A skill the agent never needs costs one line. The rest arrives only when the task matches.");

  const source = (y, title, where, asks) => {
    let out = box({ x: 28, y, w: 236, h: 54, p, tone: "surface" });
    out += text({ x: 42, y: y + 22, s: title, p, size: 12, weight: 700 });
    out += text({ x: 42, y: y + 40, s: where, p, size: 10, mono: true, fill: "muted" });
    if (asks) out += pill({ x: 186, y: y + 10, s: "asks once", p, tone: "warning", size: 9.5 });
    out += arrow({ x1: 268, y1: y + 27, x2: 296, y2: 172, p });
    return out;
  };
  s += source(86, "This project", ".gbs/skills/", true);
  s += source(146, "A package", 'package.json "gbsSkills"', true);
  s += source(206, "Your folder", "gbsAgent.skillsPath", false);

  s += box({ x: 300, y: 112, w: 176, h: 120, p, tone: "subtle" });
  s += text({ x: 316, y: 138, s: "Registry", p, size: 12.5, weight: 700 });
  s += lines({
    x: 316,
    y: 162,
    p,
    size: 10.5,
    fill: "muted",
    rows: ["merged by name:", "project, then package,", "then yours", "fixed for the whole run"],
  });

  s += arrow({ x1: 480, y1: 172, x2: 510, y2: 117, p, colour: "accent" });

  const level = (y, tone, title, sub, size, ptone) =>
    box({ x: 514, y, w: 378, h: 58, p, tone }) +
    text({ x: 530, y: y + 24, s: title, p, size: 12, weight: 700 }) +
    text({ x: 530, y: y + 43, s: sub, p, size: 10.5, fill: "muted" }) +
    pill({ x: 790, y: y + 12, s: size, p, tone: ptone, size: 10 });

  s += level(88, "accent", "1 · Always in the prompt", "name and description, one line each", "~45 tokens", "accent");
  s += arrow({ x1: 703, y1: 148, x2: 703, y2: 162, p });
  s += level(164, "surface", "2 · skill(name)", "the SKILL.md instructions, once it matches", "6,000 chars", "subtle");
  s += arrow({ x1: 703, y1: 224, x2: 703, y2: 238, p, dashed: true });
  s += level(240, "subtle", "3 · skill(name, resource)", "one bundled reference file, if needed", "12,000 chars", "subtle");

  s += box({ x: 28, y: 324, w: 864, h: 78, p, tone: "subtle" });
  s += lines({
    x: 48,
    y: 348,
    p,
    size: 11,
    fill: "muted",
    rows: [
      "Up to 12 skills are listed. Skills whose autoAttach globs match the open file come first, which helps small local models pick the right one.",
      "Skills from a repository or a package are instructions the agent will follow, so they are used only after you allow them once per workspace,",
      "and the model is told they are project guidance, not instructions from you. A skill is loaded once per conversation.",
    ],
  });

  return frame(W, H, p, s);
}

/* The permission gate: mode sets the floor, sensitivity can only raise it. */
function seAgentPermissions(p) {
  const W = 920;
  const H = 572;
  let s = heading(p, "The permission gate", "Every tool call passes one decision. Sensitive files and risky commands can raise it, never lower it.");

  s += box({ x: 380, y: 80, w: 160, h: 40, p, tone: "surface" });
  s += text({ x: 460, y: 105, s: "a tool call", p, size: 12, weight: 700, anchor: "middle" });
  s += arrow({ x1: 460, y1: 122, x2: 460, y2: 140, p });

  s += box({ x: 380, y: 144, w: 160, h: 40, p, tone: "warning" });
  s += text({ x: 460, y: 169, s: "Full auto mode?", p, size: 12, weight: 700, anchor: "middle" });
  s += arrow({ x1: 542, y1: 164, x2: 610, y2: 164, p, colour: "tip" });
  s += text({ x: 576, y: 157, s: "yes", p, size: 10.5, weight: 600, fill: "tip", anchor: "middle" });
  s += box({ x: 614, y: 144, w: 150, h: 40, p, tone: "tip" });
  s += text({ x: 689, y: 169, s: "runs, never asks", p, size: 11.5, weight: 600, fill: "tip", anchor: "middle" });

  s += arrow({ x1: 460, y1: 186, x2: 460, y2: 206, p, head: false });
  s += text({ x: 470, y: 200, s: "no", p, size: 10.5, weight: 600, fill: "muted" });
  s += arrow({ x1: 135, y1: 206, x2: 795, y2: 206, p, head: false });

  const columns = [
    {
      title: "Read a file",
      checks: [["Looks like credentials?", ".env, keys, .npmrc", "asks"]],
      otherwise: "reads it",
    },
    {
      title: "Edit or write",
      checks: [
        ["Sensitive path?", "config, scripts, CI, .mcp.json", "asks"],
        ["Mode is Ask first?", "", "asks"],
      ],
      otherwise: "applies it",
    },
    {
      title: "Run a command",
      checks: [
        ["Chained or hidden chars?", "; & | > $( ) or invisible text", "asks"],
        ["Safe list or always-allowed?", "", "runs"],
      ],
      otherwise: "asks",
    },
    {
      title: "Call an MCP tool",
      checks: [["Allowed this session?", "you chose Always allow", "runs"]],
      otherwise: "asks",
    },
  ];

  columns.forEach((col, i) => {
    const x = 40 + i * 220;
    const cx = x + 95;
    s += arrow({ x1: cx, y1: 206, x2: cx, y2: 224, p });
    s += box({ x, y: 228, w: 190, h: 38, p, tone: "accent" });
    s += text({ x: cx, y: 252, s: col.title, p, size: 12, weight: 700, anchor: "middle" });

    let y = 282;
    for (const [question, hint, yes] of col.checks) {
      s += arrow({ x1: cx, y1: y - 12, x2: cx, y2: y - 2, p });
      s += box({ x, y, w: 190, h: hint ? 70 : 54, p, tone: "subtle" });
      s += text({ x: x + 12, y: y + 20, s: question, p, size: 11, weight: 600 });
      if (hint) s += text({ x: x + 12, y: y + 37, s: hint, p, size: 9.5, fill: "muted", mono: true });
      const yesTone = yes === "runs" ? "tip" : "danger";
      s += text({ x: x + 12, y: y + (hint ? 58 : 41), s: `yes → ${yes}`, p, size: 10.5, weight: 600, fill: yesTone });
      s += text({ x: x + 178, y: y + (hint ? 58 : 41), s: "no ↓", p, size: 10.5, fill: "faint", anchor: "end" });
      y += (hint ? 70 : 54) + 16;
    }
    const tone = col.otherwise === "asks" ? "danger" : "tip";
    s += arrow({ x1: cx, y1: y - 14, x2: cx, y2: y - 2, p });
    s += box({ x, y, w: 190, h: 34, p, tone });
    s += text({ x: cx, y: y + 22, s: `otherwise ${col.otherwise}`, p, size: 11, weight: 600, fill: tone, anchor: "middle" });
  });

  s += box({ x: 28, y: 498, w: 864, h: 54, p, tone: "subtle" });
  s += lines({
    x: 48,
    y: 520,
    p,
    size: 10.5,
    fill: "muted",
    rows: [
      "\"Always allow\" stores a rule, not a blanket yes: a prefix such as npm run build for ordinary commands, the exact string for interpreters,",
      "downloaders and destructive tools, and never for chained commands or sensitive files. A denied call is reported to the model, which tries another way.",
    ],
  });

  return frame(W, H, p, s);
}

/* Subagents: spend the search in a context that is thrown away. */
function seAgentSubagents(p) {
  const W = 920;
  const H = 410;
  let s = heading(p, "Why subagents exist", "Searching produces far more text than the answer needs. A subagent absorbs it and hands back the conclusion.");

  s += box({ x: 28, y: 86, w: 250, h: 214, p, tone: "accent" });
  s += text({ x: 46, y: 112, s: "Main conversation", p, size: 12.5, weight: 700 });
  s += lines({ x: 46, y: 138, p, size: 11, fill: "muted", rows: ["your request", "the plan", "the edits", "six-line reports"] });
  s += pill({ x: 46, y: 262, s: "stays small", p, tone: "tip" });

  s += arrow({ x1: 282, y1: 130, x2: 364, y2: 130, p, colour: "accent" });
  s += text({ x: 323, y: 120, s: "task", p, size: 10, fill: "accent", anchor: "middle" });
  s += arrow({ x1: 364, y1: 252, x2: 282, y2: 252, p, colour: "tip" });
  s += text({ x: 323, y: 244, s: "report", p, size: 10, fill: "tip", anchor: "middle" });

  s += box({ x: 368, y: 86, w: 300, h: 214, p, tone: "plain", dashed: true });
  s += text({ x: 386, y: 112, s: "Explore subagent · its own context", p, size: 12.5, weight: 700 });
  const work = ['grep "login"  → 212 matches', "read src/auth.ts", "read src/session.ts", "read 14 more files"];
  work.forEach((row, i) => {
    s += box({ x: 386, y: 128 + i * 32, w: 264, h: 25, p, tone: "subtle", r: 6 });
    s += text({ x: 398, y: 145 + i * 32, s: row, p, size: 10.5, mono: true });
  });
  s += pill({ x: 386, y: 264, s: "~40k tokens, then discarded", p, tone: "danger" });

  s += box({ x: 700, y: 86, w: 192, h: 214, p, tone: "subtle" });
  s += text({ x: 716, y: 112, s: "Limits", p, size: 12.5, weight: 700 });
  s += lines({
    x: 716,
    y: 138,
    p,
    size: 10.5,
    fill: "muted",
    lh: 18,
    rows: ["4 at the same time", "12 per request", "explore: read-only tools", "general: can edit, run", "own model, if you set", "gbsAgent.subagentModel"],
  });

  s += box({ x: 28, y: 320, w: 864, h: 66, p, tone: "subtle" });
  s += lines({
    x: 48,
    y: 346,
    p,
    size: 11,
    fill: "muted",
    rows: [
      "Raw search output is expensive and used once, so it is spent in a context that is thrown away. Only the conclusion reaches the main",
      "conversation, which is how a small context window copes with a large codebase. Explore subagents run in parallel; their tool rows nest under a card.",
    ],
  });

  return frame(W, H, p, s);
}

/* MCP servers: from a config line to a tool the agent can call. */
function seAgentMcp(p) {
  const W = 920;
  const H = 470;
  let s = heading(p, "MCP servers", "A line of configuration becomes tools the agent can call, with your approval in between.");

  const src = (y, file, who) =>
    box({ x: 28, y, w: 204, h: 46, p, tone: "surface" }) +
    text({ x: 42, y: y + 20, s: file, p, size: 11, mono: true, weight: 600 }) +
    text({ x: 42, y: y + 36, s: who, p, size: 10, fill: "muted" }) +
    arrow({ x1: 236, y1: y + 23, x2: 262, y2: 165, p });
  s += src(86, ".mcp.json", "project · same file as Claude Code");
  s += src(142, ".gbs/mcp.json", "project · this agent only");
  s += src(198, "gbsAgent.mcpServers", "your user setting");

  s += box({ x: 266, y: 110, w: 176, h: 112, p, tone: "warning" });
  s += text({ x: 282, y: 134, s: "Consent", p, size: 12.5, weight: 700 });
  s += lines({ x: 282, y: 156, p, size: 10.5, fill: "muted", rows: ["repository servers start", "only after you approve", "their exact commands;", "changed commands re-ask"] });

  s += arrow({ x1: 446, y1: 166, x2: 470, y2: 166, p });

  s += box({ x: 474, y: 110, w: 176, h: 112, p, tone: "surface" });
  s += text({ x: 490, y: 134, s: "Manager", p, size: 12.5, weight: 700 });
  s += lines({ x: 490, y: 156, p, size: 10.5, fill: "muted", rows: ["starts on first request", "keeps servers running", "restarts on change or exit", "reports a failure once"] });

  s += arrow({ x1: 654, y1: 152, x2: 684, y2: 152, p, colour: "accent" });
  s += arrow({ x1: 684, y1: 180, x2: 654, y2: 180, p, colour: "accent" });
  s += text({ x: 669, y: 142, s: "stdio", p, size: 9.5, fill: "faint", anchor: "middle", mono: true });

  s += box({ x: 688, y: 86, w: 204, h: 160, p, tone: "accent" });
  s += text({ x: 704, y: 110, s: "MCP server", p, size: 12.5, weight: 700 });
  s += text({ x: 704, y: 128, s: "a child process", p, size: 10.5, fill: "muted" });
  s += lines({ x: 704, y: 154, p, size: 10.5, mono: true, rows: ["initialize", "tools/list", "tools/call", "notifications/cancelled"], lh: 19 });

  s += arrow({ x1: 790, y1: 250, x2: 790, y2: 288, p });

  s += box({ x: 474, y: 292, w: 418, h: 76, p, tone: "surface" });
  s += text({ x: 490, y: 316, s: "mcp__grampro__get_component", p, size: 11.5, mono: true, weight: 700, fill: "accent" });
  s += lines({ x: 490, y: 338, p, size: 10.5, fill: "muted", rows: ["each server tool becomes an agent tool; every call shows", "an approval card with its arguments unless in Full auto"] });

  s += arrow({ x1: 470, y1: 330, x2: 436, y2: 330, p });

  s += box({ x: 28, y: 292, w: 404, h: 76, p, tone: "tip" });
  s += text({ x: 46, y: 316, s: "Agent loop", p, size: 12.5, weight: 700, fill: "tip" });
  s += lines({ x: 46, y: 338, p, size: 10.5, fill: "muted", rows: ["calls the tools when they fit, and treats what", "comes back as data, never as instructions"] });

  s += box({ x: 28, y: 388, w: 864, h: 58, p, tone: "subtle" });
  s += lines({
    x: 48,
    y: 412,
    p,
    size: 10.5,
    fill: "muted",
    rows: [
      "Stdio servers only, for now. On Windows, .cmd shims such as npx are started through cmd.exe with quoted arguments. Tools the server marks",
      "read-only may run in parallel and are offered to explore subagents; that hint never skips approval, because it is the server's own claim.",
    ],
  });

  return frame(W, H, p, s);
}

/* The whole thing in plain words, for the plain-English page. */
function seAgentPlain(p) {
  const W = 920;
  const H = 300;
  let s = heading(p, "How it works, in plain words", "One instruction turns into a loop of small steps. The loop is the whole trick.");

  const steps = [
    ["You describe", ["the job, in", "your own words"], "surface"],
    ["It looks", ["searches and", "reads the files"], "subtle"],
    ["It asks", ["before anything", "risky"], "warning"],
    ["It changes", ["edits the", "code"], "accent"],
    ["It checks", ["runs the tests,", "reads errors"], "tip"],
    ["It shows you", ["every file it", "changed"], "surface"],
  ];
  steps.forEach(([title, rows, tone], i) => {
    const x = 28 + i * 146;
    s += box({ x, y: 92, w: 132, h: 104, p, tone });
    s += pill({ x: x + 12, y: 104, s: String(i + 1), p, tone: tone === "surface" || tone === "subtle" ? "accent" : tone });
    s += text({ x: x + 12, y: 146, s: title, p, size: 12.5, weight: 700 });
    s += lines({ x: x + 12, y: 166, rows, p, size: 10.5, fill: "muted" });
    if (i < steps.length - 1) s += arrow({ x1: x + 134, y1: 144, x2: x + 144, y2: 144, p });
  });

  s += arrow({ x1: 678, y1: 200, x2: 678, y2: 236, p, colour: "accent", head: false });
  s += arrow({ x1: 678, y1: 236, x2: 240, y2: 236, p, colour: "accent", head: false });
  s += arrow({ x1: 240, y1: 236, x2: 240, y2: 200, p, colour: "accent" });
  s += text({ x: 459, y: 258, s: "if a check fails, it goes back and fixes it — as many times as it takes", p, size: 11, fill: "accent", anchor: "middle" });

  return frame(W, H, p, s);
}

/* -------------------------------------------------------------- rendering */

const DIAGRAMS = [
  { slug: "agent-skill", draw: agentSkill },
  { slug: "mcp-server", draw: mcpServer },
  { slug: "ask-the-grid", draw: askTheGrid },
  { slug: "se-agent-layers", draw: seAgentLayers },
  { slug: "se-agent-turn", draw: seAgentTurn },
  { slug: "se-agent-context", draw: seAgentContext },
  { slug: "se-agent-skills", draw: seAgentSkills },
  { slug: "se-agent-permissions", draw: seAgentPermissions },
  { slug: "se-agent-subagents", draw: seAgentSubagents },
  { slug: "se-agent-mcp", draw: seAgentMcp },
  { slug: "se-agent-plain", draw: seAgentPlain },
];

const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);
const selected = only ? DIAGRAMS.filter((d) => d.slug.startsWith(only)) : DIAGRAMS;
if (only && selected.length === 0) {
  console.error(`No diagram name starts with "${only}".`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

for (const { slug, draw } of selected) {
  for (const palette of [LIGHT, DARK]) {
    const svg = draw(palette);
    // Keep the vector beside the raster: it is the editable form, and it is
    // what to look at when librsvg rejects something.
    writeFileSync(join(OUT, `${slug}-${palette.name}.svg`), svg, "utf8");
    const file = join(OUT, `${slug}-${palette.name}.webp`);
    // 2x so the text stays crisp on a high-density display.
    const buffer = await sharp(Buffer.from(svg), { density: 192 })
      .webp({ quality: 92 })
      .toBuffer();
    writeFileSync(file, buffer);
    const { width, height } = await sharp(buffer).metadata();
    console.log(
      `  ${slug}-${palette.name}.webp  ${width}x${height}  ${(buffer.length / 1024).toFixed(1)} KB`,
    );
  }
}

console.log(`\n${selected.length * 2} file(s) in public/diagrams/`);

/* --------------------------------------------------------- social preview */

/*
 * The card a link unfurls into in Slack, X, LinkedIn and chat apps.
 *
 * PNG, not webp: several unfurlers still refuse webp, and this is the one
 * image on the site that is fetched by something other than a browser. Dark
 * only — a social card cannot follow the reader's theme, and the dark card
 * reads on both a light and a dark timeline. 1200×630 is the size every one
 * of those platforms crops to without letterboxing.
 */
function socialCard(p) {
  const W = 1200;
  const H = 630;
  let s = "";

  s += box({ x: 56, y: 56, w: 1088, h: 518, p, tone: "surface", r: 24 });

  s += text({ x: 112, y: 168, s: "GramproKit", p, size: 76, weight: 700 });
  s += text({
    x: 112,
    y: 238,
    s: "Copy-paste React components",
    p,
    size: 40,
    weight: 600,
    fill: "accent",
  });
  s += text({ x: 112, y: 288, s: "with an MCP server for AI coding agents", p, size: 34, fill: "muted" });

  const facts = ["27 components", "zero runtime dependencies", "React 19", "open source"];
  let x = 112;
  for (const fact of facts) {
    const w = fact.length * 13.2 + 40;
    s += box({ x, y: 352, w, h: 50, p, tone: "subtle", r: 25 });
    s += text({ x: x + w / 2, y: 384, s: fact, p, size: 22, anchor: "middle", fill: "fg" });
    x += w + 16;
  }

  s += box({ x: 112, y: 448, w: 470, h: 66, p, tone: "subtle", r: 12 });
  s += text({ x: 140, y: 490, s: "npx @grampro/kit add Button", p, size: 24, mono: true, fill: "accent" });

  s += text({ x: 1088, y: 490, s: "kit.gramproindia.com", p, size: 26, anchor: "end", fill: "faint" });
  s += text({ x: 1088, y: 524, s: "Also known as Grampro Kit · GBS Kit", p, size: 20, anchor: "end", fill: "faint" });

  return frame(W, H, p, s);
}

if (!only) {
  const png = await sharp(Buffer.from(socialCard(DARK)), { density: 72 }).png({ compressionLevel: 9 }).toBuffer();
  const file = join(ROOT, "public", "og.png");
  writeFileSync(file, png);
  const { width, height } = await sharp(png).metadata();
  console.log(`  og.png  ${width}x${height}  ${(png.length / 1024).toFixed(1)} KB  (social preview)`);
}
