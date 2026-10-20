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

/* -------------------------------------------------------------- rendering */

const DIAGRAMS = [
  { slug: "agent-skill", draw: agentSkill },
  { slug: "mcp-server", draw: mcpServer },
  { slug: "ask-the-grid", draw: askTheGrid },
];

mkdirSync(OUT, { recursive: true });

for (const { slug, draw } of DIAGRAMS) {
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

console.log(`\n${DIAGRAMS.length * 2} file(s) in public/diagrams/`);

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

{
  const png = await sharp(Buffer.from(socialCard(DARK)), { density: 72 }).png({ compressionLevel: 9 }).toBuffer();
  const file = join(ROOT, "public", "og.png");
  writeFileSync(file, png);
  const { width, height } = await sharp(png).metadata();
  console.log(`  og.png  ${width}x${height}  ${(png.length / 1024).toFixed(1)} KB  (social preview)`);
}
