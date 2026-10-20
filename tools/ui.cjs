/*
 * Colour and symbols for the CLI, with no dependency.
 *
 * Colour is on only when it will be seen: stdout is a terminal, NO_COLOR is
 * not set (https://no-color.org), and TERM is not "dumb". FORCE_COLOR turns it
 * on regardless. Piped output, CI logs and the tests that read this CLI's
 * stdout therefore get exactly the plain text they always did.
 */

const env = process.env;
const enabled = (stream = process.stdout) => {
  if (env.FORCE_COLOR && env.FORCE_COLOR !== "0") return true;
  if ("NO_COLOR" in env || env.TERM === "dumb") return false;
  return Boolean(stream && stream.isTTY);
};

const paint = (open, close) => (text, stream) =>
  enabled(stream) ? `\x1b[${open}m${text}\x1b[${close}m` : String(text);

const c = {
  bold: paint(1, 22),
  dim: paint(2, 22),
  inverse: paint(7, 27),
  red: paint(31, 39),
  green: paint(32, 39),
  yellow: paint(33, 39),
  blue: paint(34, 39),
  magenta: paint(35, 39),
  cyan: paint(36, 39),
  gray: paint(90, 39),
  bgCyan: paint(46, 49),
};

/* Windows' legacy console has no box-drawing glyphs worth trusting. */
const unicode = process.platform !== "win32" || Boolean(env.WT_SESSION || env.TERM_PROGRAM || env.ConEmuANSI);

const s = unicode
  ? { bar: "│", start: "┌", end: "└", active: "◆", done: "◇", cancel: "■", on: "◼", off: "◻", pointer: "❯", up: "↑", down: "↓" }
  : { bar: "|", start: "T", end: "L", active: "*", done: "o", cancel: "x", on: "[x]", off: "[ ]", pointer: ">", up: "^", down: "v" };

/** ✓ and ✗ in colour, for the install log. Plain when colour is off. */
const check = (stream) => c.green("✓", stream);
const cross = (stream = process.stderr) => c.red("✗", stream);

/** Visible width of a string, ignoring ANSI sequences. */
const width = (text) => String(text).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "").length;

/** Cut plain text to `max` visible characters, with an ellipsis. */
const clip = (text, max) => {
  const plain = String(text);
  if (max <= 0) return "";
  return plain.length <= max ? plain : `${plain.slice(0, Math.max(0, max - 1))}…`;
};

/** The opening line, as create-vite and friends draw it. */
const intro = (title) => {
  console.log(`${c.gray(s.start)}  ${c.bgCyan(c.bold(` ${title} `))}`);
  console.log(c.gray(s.bar));
};

const outro = (message) => {
  console.log(c.gray(s.bar));
  console.log(`${c.gray(s.end)}  ${message}`);
  console.log("");
};

module.exports = { c, s, check, cross, enabled, width, clip, intro, outro };
