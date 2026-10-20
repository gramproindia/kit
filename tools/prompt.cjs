/*
 * A multi-select prompt, with no dependency.
 *
 * The old picker cleared the whole screen on every key and printed every
 * component, so it needed a full-screen terminal and visibly jumped. This one
 * redraws only its own lines, in place, and shows a window of the list that
 * fits the terminal, scrolling as the cursor moves. Every line is clipped to
 * the terminal's width: a line that wrapped would throw off the count of lines
 * to redraw, which is the jumping all over again.
 *
 * Keys: ↑/↓ (or PgUp/PgDn, Home/End) move, space toggles, typing filters,
 * ctrl+a toggles everything shown, enter confirms, esc or ctrl+c cancels.
 */

const readline = require("readline");
const { c, s, clip } = require("./ui.cjs");

const ESC = "\x1b[";

/**
 * @param {object} config
 * @param {string} config.message
 * @param {{ value: string, label?: string, tag?: string, hint?: string, note?: string }[]} config.options
 * @param {NodeJS.ReadStream} [config.input]  defaults to stdin; a test passes a fake terminal
 * @param {NodeJS.WriteStream} [config.output] defaults to stdout
 * @returns {Promise<string[] | null>} the chosen values, or null when cancelled
 */
function multiselect({ message, options, input = process.stdin, output = process.stdout }) {

  if (!input.isTTY || !output.isTTY) {
    return Promise.reject(
      new Error("The interactive picker needs a terminal. Name the components instead: npx @grampro/kit add Button Input"),
    );
  }

  return new Promise((resolve) => {
    const chosen = new Set();
    let query = "";
    let cursor = 0;
    let top = 0;
    let drawn = 0;
    let warning = "";

    const tagWidth = Math.max(0, ...options.map((o) => (o.tag || "").length));
    const labelWidth = Math.max(...options.map((o) => (o.label || o.value).length));

    const visible = () => {
      const q = query.trim().toLowerCase();
      if (!q) return options;
      return options.filter((o) =>
        [o.value, o.label, o.tag, o.hint].some((field) => field && field.toLowerCase().includes(q)),
      );
    };

    /* Rows the list may use: what the terminal has, less the prompt's own frame. */
    const windowSize = () => Math.max(3, Math.min(12, (output.rows || 24) - 9));

    const lines = (state) => {
      const cols = Math.max(20, (output.columns || 80) - 1);
      const shown = visible();
      const out = [];

      if (state === "done" || state === "cancel") {
        const symbol = state === "done" ? c.green(s.done) : c.red(s.cancel);
        out.push(`${symbol}  ${c.bold(clip(message, cols - 3))}`);
        const picked = options.filter((o) => chosen.has(o.value)).map((o) => o.label || o.value);
        const summary = state === "done" ? picked.join(", ") : "Cancelled";
        out.push(`${c.gray(s.bar)}  ${c.dim(clip(summary, cols - 3))}`);
        return out;
      }

      out.push(`${c.cyan(s.active)}  ${c.bold(clip(message, cols - 3))}`);
      out.push(
        query
          ? `${c.cyan(s.bar)}  ${c.dim("Search:")} ${clip(query, cols - 12)}${c.cyan("_")}`
          : `${c.cyan(s.bar)}  ${c.dim(clip("Type to search", cols - 3))}`,
      );

      const size = windowSize();
      if (cursor < top) top = cursor;
      if (cursor >= top + size) top = cursor - size + 1;
      top = Math.max(0, Math.min(top, Math.max(0, shown.length - size)));

      if (shown.length === 0) {
        out.push(`${c.cyan(s.bar)}  ${c.yellow(clip(`Nothing matches "${query}"`, cols - 3))}`);
      }

      out.push(
        top > 0 ? `${c.cyan(s.bar)}  ${c.dim(`  ${s.up} ${top} more`)}` : `${c.cyan(s.bar)}`,
      );

      for (let i = top; i < Math.min(shown.length, top + size); i += 1) {
        const option = shown[i];
        const active = i === cursor;
        const on = chosen.has(option.value);
        const box = on ? c.green(s.on) : c.dim(s.off);
        const pointer = active ? c.cyan(s.pointer) : " ";
        // Fixed columns, clipped as plain text before colour goes on.
        const label = clip(option.label || option.value, labelWidth).padEnd(labelWidth);
        const tag = clip(option.tag || "", tagWidth).padEnd(tagWidth);
        const used = 3 + 2 + 2 + labelWidth + 2 + tagWidth + 2;
        const note = option.note ? clip(option.note, Math.max(0, cols - used)) : "";
        out.push(
          `${c.cyan(s.bar)} ${pointer} ${box} ${active ? c.cyan(label) : label}  ${c.gray(tag)}  ${c.yellow(note)}`.trimEnd(),
        );
      }

      const below = shown.length - (top + size);
      out.push(below > 0 ? `${c.cyan(s.bar)}  ${c.dim(`  ${s.down} ${below} more`)}` : `${c.cyan(s.bar)}`);

      const focused = shown[cursor];
      out.push(`${c.cyan(s.bar)}  ${c.dim(clip(focused && focused.hint ? focused.hint : "", cols - 3))}`);
      out.push(
        warning
          ? `${c.yellow(s.end)}  ${c.yellow(clip(warning, cols - 3))}`
          : `${c.cyan(s.end)}  ${c.dim(
              clip(
                `${chosen.size} selected · space select · ctrl+a all · enter confirm · esc cancel`,
                cols - 3,
              ),
            )}`,
      );
      return out;
    };

    const draw = (state = "active") => {
      const next = lines(state);
      let frame = "";
      if (drawn > 0) frame += `${ESC}${drawn}A\r${ESC}J`;
      frame += `${next.join("\n")}\n`;
      output.write(frame);
      drawn = next.length;
    };

    const finish = (state, value) => {
      input.removeListener("keypress", onKey);
      output.removeListener("resize", onResize);
      draw(state);
      if (input.isTTY) input.setRawMode(false);
      input.pause();
      output.write(`${ESC}?25h`);
      process.removeListener("exit", restoreCursor);
      resolve(value);
    };

    const onKey = (text, key = {}) => {
      warning = "";
      const shown = visible();
      const last = Math.max(0, shown.length - 1);

      if ((key.ctrl && key.name === "c") || key.name === "escape") return finish("cancel", null);

      if (key.name === "return" || key.name === "enter") {
        if (chosen.size === 0) {
          warning = "Select at least one component with space, or press esc to cancel.";
          return draw();
        }
        return finish("done", options.filter((o) => chosen.has(o.value)).map((o) => o.value));
      }

      if (key.name === "up") cursor = cursor <= 0 ? last : cursor - 1;
      else if (key.name === "down") cursor = cursor >= last ? 0 : cursor + 1;
      else if (key.name === "pageup") cursor = Math.max(0, cursor - windowSize());
      else if (key.name === "pagedown") cursor = Math.min(last, cursor + windowSize());
      else if (key.name === "home") cursor = 0;
      else if (key.name === "end") cursor = last;
      else if (key.name === "space") {
        const option = shown[cursor];
        if (option) {
          if (chosen.has(option.value)) chosen.delete(option.value);
          else chosen.add(option.value);
        }
      } else if (key.ctrl && key.name === "a") {
        const all = shown.length > 0 && shown.every((o) => chosen.has(o.value));
        for (const option of shown) {
          if (all) chosen.delete(option.value);
          else chosen.add(option.value);
        }
      } else if (key.name === "backspace") {
        query = query.slice(0, -1);
        cursor = 0;
      } else if (text && !key.ctrl && !key.meta && text.length === 1 && text >= " ") {
        query += text;
        cursor = 0;
      } else {
        return undefined;
      }
      return draw();
    };

    const onResize = () => draw();
    const restoreCursor = () => output.write(`${ESC}?25h`);

    readline.emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    input.on("keypress", onKey);
    output.on("resize", onResize);
    process.on("exit", restoreCursor);
    output.write(`${ESC}?25l`);
    draw();
  });
}

module.exports = { multiselect };
