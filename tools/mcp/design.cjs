/*
 * `grampro-kit design <file>` — a whole-file Figma export, split into a folder.
 *
 * The plugin downloads one file because a browser cannot write a directory.
 * Splitting it is filesystem work, which belongs in the CLI rather than in a
 * plugin iframe, and it is what makes the result usable: an agent reads the
 * index to plan, then opens one screen at a time, instead of loading every
 * screen to build any of them.
 *
 * Each screen is written in the same shape a single-frame export has, so
 * `figma_frame` reads one with no special case.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { themeFrom } = require("./figma.cjs");

/** A file name from a screen name: lowercase, dashes, nothing exotic. */
const slug = (name) =>
  String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "screen";

/** Names a designer repeated are the ones that mean something. */
function countNames(node, counts) {
  counts.set(node.name, (counts.get(node.name) || 0) + 1);
  for (const child of node.children || []) countNames(child, counts);
}

const repeatedIn = (nodes) => {
  const counts = new Map();
  for (const node of nodes) countNames(node, counts);
  return [...counts.entries()]
    .filter(([, n]) => n > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, times]) => ({ name, times }));
};

/** Component instances found anywhere in a screen. */
function componentsIn(nodes) {
  const found = new Set();
  const visit = (node) => {
    if (node.component) found.add(node.component);
    for (const child of node.children || []) visit(child);
  };
  for (const node of nodes) visit(node);
  return [...found];
}

const countNodes = (nodes) =>
  nodes.reduce((n, node) => n + 1 + countNodes(node.children || []), 0);

/**
 * Split an export into `dest`.
 *
 * Returns what it wrote rather than printing, so the CLI owns the words and
 * this stays testable.
 */
function splitDesign(file, dest) {
  const source = path.resolve(file);
  if (!fs.existsSync(source)) return { error: `No file at ${source}.` };

  let design;
  try {
    design = JSON.parse(fs.readFileSync(source, "utf8").replace(/^﻿/, ""));
  } catch (error) {
    return { error: `${source} is not JSON: ${error.message}` };
  }

  /*
   * A single-frame export is accepted too, as one screen. Someone who ran the
   * wrong menu item should get a folder, not a lecture.
   */
  const screens = Array.isArray(design.screens)
    ? design.screens
    : Array.isArray(design.nodes)
      ? [{ name: design.frame || "screen", page: "", nodes: design.nodes }]
      : null;

  if (!screens) {
    return {
      error:
        "Expected the output of the Figma plugin's 'Export all screens for an agent' " +
        "(or 'Export selection'). This file has neither `screens` nor `nodes`.",
    };
  }
  if (screens.length === 0) return { error: "That export contains no screens." };

  const out = path.resolve(dest);
  fs.mkdirSync(out, { recursive: true });

  const tokens = design.tokens || {};
  const colours = new Map((tokens.colours || []).map((c) => [c.value, c.uses]));
  const radii = new Map((tokens.radii || []).map((r) => [r.value, r.uses]));
  const fontSizes = new Map((tokens.fontSizes || []).map((f) => [f.value, f.uses]));

  const taken = new Set();
  const written = [];

  for (const screen of screens) {
    // Two screens may share a name across pages; the second gets a suffix
    // rather than quietly overwriting the first.
    let name = slug(screen.name);
    if (taken.has(name)) {
      let n = 2;
      while (taken.has(`${name}-${n}`)) n += 1;
      name = `${name}-${n}`;
    }
    taken.add(name);

    const fileName = `${name}.json`;
    fs.writeFileSync(
      path.join(out, fileName),
      `${JSON.stringify({ frame: screen.name, nodes: screen.nodes, tokens }, null, 2)}\n`,
      "utf8",
    );

    written.push({
      name: screen.name,
      page: screen.page || undefined,
      file: fileName,
      size: screen.size,
      nodes: countNodes(screen.nodes),
      repeatedRegions: repeatedIn(screen.nodes),
      componentsNamed: componentsIn(screen.nodes),
    });
  }

  /*
   * The index is what an agent reads first: every screen, how big it is, the
   * regions whose names repeat, and one theme for all of them. Enough to
   * propose a component for each region before any code is written, which is
   * where a wrong guess is cheap to correct.
   */
  const index = {
    screens: written,
    theme: themeFrom(colours, radii, fontSizes),
    builtFromLibrary: written.some((s) => s.componentsNamed.length > 0),
    howToUse:
      "Read this index first and say which kit component each repeated region maps to, " +
      "so the mapping can be corrected before any screen is built. Then take one screen " +
      "at a time: figma_frame with designFile set to its file, get_component for each " +
      "component before writing it, install_component for what is missing, and " +
      "validate_usage on the JSX before moving to the next screen.",
  };
  fs.writeFileSync(path.join(out, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");

  return { dest: out, index, written };
}

module.exports = { splitDesign, slug };
