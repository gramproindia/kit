/*
 * Figma Community listing art for the Grampro Kit plugin.
 *
 * The mark is the one already in docs-site/public/gkitlogo.svg: two rounded
 * squares, the grey one rotated behind the cyan one. Reusing it rather than
 * inventing something means the Community listing, the docs site and the
 * plugin's own UI read as the same product.
 *
 * Sizes are Figma's: a 128x128 icon and 1920x1080 cover art.
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(OUT, { recursive: true });

/* Brand, from the logo and the plugin's own light-mode tokens. */
const CYAN = "#29ABE2";
const GREY = "#D9D9D9";
const INK = "#0B0B0E";
const PANEL = "#141419";
const LINE = "#26262E";
const TEXT = "#FAFAFA";
const MUTED = "#8A8A99";
const FONT = "Segoe UI, Inter, Helvetica, Arial, sans-serif";

/** The two-square mark, drawn at an arbitrary size. */
function mark(size, x = 0, y = 0) {
  const s = size * 0.62; // square edge, as a fraction of the mark's box
  const r = s * 0.18;
  return `
    <g transform="translate(${x} ${y})">
      <rect x="${size * 0.02}" y="${size * 0.3}" width="${s}" height="${s}" rx="${r}"
            fill="${GREY}" transform="rotate(-19.24 ${size * 0.02 + s / 2} ${size * 0.3 + s / 2})"/>
      <rect x="${size * 0.33}" y="${size * 0.08}" width="${s}" height="${s}" rx="${r}" fill="${CYAN}"/>
    </g>`;
}

/* ------------------------------------------------------------------ icon */

const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="${INK}"/>
  <rect x="0.5" y="0.5" width="127" height="127" rx="27.5" fill="none" stroke="${LINE}"/>
  ${mark(84, 22, 20)}
</svg>`;

/* ----------------------------------------------------------------- cover */

/** A small component-set swatch, the thing the generator produces in Figma. */
const chip = (x, y, w, h, fill, stroke = LINE) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(10, h / 2)}" fill="${fill}" stroke="${stroke}"/>`;

const line = (x, y, w, h = 10, fill = "#2E2E38") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"/>`;

/* Left panel: what it builds in Figma. Right panel: what it hands an agent. */
const designPanel = `
  <g transform="translate(150 560)">
    <rect width="740" height="380" rx="24" fill="${PANEL}" stroke="${LINE}"/>
    <text x="40" y="66" font-family="${FONT}" font-size="26" font-weight="600" fill="${TEXT}">Generate design system</text>
    <text x="40" y="104" font-family="${FONT}" font-size="20" fill="${MUTED}">53 variables · 13 text styles · 38 component sets</text>

    ${chip(40, 140, 150, 48, CYAN, CYAN)}
    <text x="78" y="171" font-family="${FONT}" font-size="20" font-weight="600" fill="${INK}">Button</text>
    ${chip(206, 140, 150, 48, "#1C1C22")}
    <text x="246" y="171" font-family="${FONT}" font-size="20" fill="${TEXT}">Input</text>
    ${chip(372, 140, 120, 48, "#1C1C22")}
    <text x="404" y="171" font-family="${FONT}" font-size="20" fill="${TEXT}">Tab</text>
    ${chip(508, 140, 190, 48, "#1C1C22")}
    <text x="536" y="171" font-family="${FONT}" font-size="20" fill="${TEXT}">DataGrid</text>

    ${line(40, 226, 300)}
    ${line(40, 258, 480)}
    ${line(40, 290, 220)}

    <g transform="translate(40 324)">
      ${[CYAN, "#1D4ED8", "#18181B", "#F4F4F5", "#22C55E", "#F59E0B", "#EF4444"]
        .map((c, i) => `<rect x="${i * 46}" y="0" width="34" height="34" rx="8" fill="${c}" stroke="${LINE}"/>`)
        .join("")}
    </g>
  </g>`;

/* The right panel: what comes out, and what you do with it. */
const agentPanel = `
  <g transform="translate(1030 560)">
    <rect width="740" height="380" rx="24" fill="${PANEL}" stroke="${LINE}"/>
    <text x="40" y="66" font-family="${FONT}" font-size="26" font-weight="600" fill="${TEXT}">Export all screens for an agent</text>
    <text x="40" y="104" font-family="${FONT}" font-size="20" fill="${MUTED}">Every screen, one shared theme, ready for a coding agent</text>

    <rect x="40" y="134" width="660" height="212" rx="16" fill="#0E0E13" stroke="${LINE}"/>
    ${[
      ['<tspan fill="#8A8A99">$</tspan> <tspan fill="#C3E88D">npx @grampro/kit design ./design.json</tspan>', 0],
      ['', 0],
      ['<tspan fill="#7FD1F2">design/</tspan>', 0],
      ['<tspan fill="#8A8A99">  purchase-orders.json</tspan>', 0],
      ['<tspan fill="#8A8A99">  suppliers.json</tspan>', 0],
      ['<tspan fill="#8A8A99">  index.json</tspan>  <tspan fill="#5C5C6B">the plan: screens, theme</tspan>', 0],
    ]
      .map(([line], i) => `<text x="${72}" y="${178 + i * 30}" font-family="Consolas, monospace" font-size="20">${line}</text>`)
      .join("")}
  </g>`;

const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.16"/>
      <stop offset="55%" stop-color="${CYAN}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1920" height="1080" fill="${INK}"/>
  <rect width="1920" height="1080" fill="url(#glow)"/>

  ${mark(150, 150, 120)}

  <text x="330" y="232" font-family="${FONT}" font-size="76" font-weight="700" fill="${TEXT}">Grampro Kit</text>
  <text x="332" y="286" font-family="${FONT}" font-size="30" fill="${CYAN}">Design system generator, and a bridge to your coding agent</text>

  <text x="150" y="420" font-family="${FONT}" font-size="40" fill="${MUTED}">Build the full kit in Figma — variables, text styles, 38 component sets —</text>
  <text x="150" y="478" font-family="${FONT}" font-size="40" fill="${MUTED}">then hand every screen to a coding agent as structured JSON.</text>

  ${designPanel}
  ${agentPanel}

  <text x="150" y="1012" font-family="${FONT}" font-size="24" fill="#5C5C6B">kit.gramproindia.com · free and open source · no network access</text>
</svg>`;

/* ------------------------------------------------------------------ emit */

async function emit(name, svg, width, height) {
  writeFileSync(`${OUT}/${name}.svg`, svg);
  const png = await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(`${OUT}/${name}.png`, png);
  const meta = await sharp(png).metadata();
  console.log(`${name}.png  ${meta.width}x${meta.height}  ${(png.length / 1024).toFixed(0)} KB`);
}

await emit("icon", icon, 128, 128);
await emit("cover", cover, 1920, 1080);
console.log("\nwritten to " + OUT);
