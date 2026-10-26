/*
 * The plain-English guide to GBS SE Agent, printed to PDF.
 *
 * The source is se-agent-guide.html beside this file. `{{diagram:<name>}}`
 * marks are replaced with the light-theme SVG of that diagram, so the guide
 * uses the same pictures as the site; render them first:
 *
 *   node scripts/build-diagrams.mjs --only=se-agent
 *   node scripts/build-se-agent-guide.mjs
 *
 * Printing uses headless Chrome or Edge. Set CHROME_PATH if neither is found
 * in the usual place. Output: public/se-agent/GBS-SE-Agent-Explained.pdf.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "scripts", "se-agent-guide.html");
const DIAGRAMS = join(ROOT, "public", "diagrams");
const OUT_DIR = join(ROOT, "public", "se-agent");
const OUT = join(OUT_DIR, "GBS-SE-Agent-Explained.pdf");

const BROWSERS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const browser = BROWSERS.find((path) => existsSync(path));
if (!browser) {
  console.error("No Chrome or Edge found. Set CHROME_PATH to a Chromium-based browser.");
  process.exit(1);
}

const html = readFileSync(SOURCE, "utf8").replace(/\{\{diagram:([a-z0-9-]+)\}\}/g, (_, name) => {
  const file = join(DIAGRAMS, `${name}-light.svg`);
  if (!existsSync(file)) {
    console.error(`Missing ${file}. Run: node scripts/build-diagrams.mjs --only=se-agent`);
    process.exit(1);
  }
  // The SVG carries a fixed pixel size; let the page's CSS size it instead.
  return readFileSync(file, "utf8").replace(/ width="\d+" height="\d+"/, "");
});

const work = join(tmpdir(), `se-agent-guide-${process.pid}`);
mkdirSync(work, { recursive: true });
const page = join(work, "guide.html");
writeFileSync(page, html, "utf8");
mkdirSync(OUT_DIR, { recursive: true });

try {
  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--user-data-dir=${join(work, "profile")}`,
      `--print-to-pdf=${OUT}`,
      pathToFileURL(page).href,
    ],
    { stdio: "inherit", timeout: 120_000 },
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(`  ${OUT}`);
