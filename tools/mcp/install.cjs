/*
 * `grampro-kit mcp install` — register the server with whichever agent you use.
 *
 * This exists because the configuration is three lines and still goes wrong.
 * Hand-written config files pick up a byte-order mark from PowerShell's
 * `Out-File`, which every JSON parser rejects with an error that names the
 * first character and explains nothing. Writing the file from here means it
 * is UTF-8 without a BOM, with LF endings, every time.
 *
 * Each agent is given the same stdio server; only the file format differs.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const PACKAGE = "@grampro/kit";
const SERVER = "grampro";

/*
 * Where the project starts, which is not necessarily where you ran this.
 *
 * An agent looks for `.mcp.json` at the root of the folder it opened. Writing
 * to the working directory means that running this from `src/` puts the
 * configuration somewhere nothing will ever read, and the command still
 * reports success — the one way this can quietly do nothing.
 *
 * The nearest marker of either kind wins, rather than `.git` in preference to
 * `package.json`. Someone who opens one workspace of a monorepo should get
 * that workspace, and searching for `.git` first would walk straight past it
 * and write above the folder their agent has open.
 */
function projectRoot(from) {
  let dir = path.resolve(from);
  for (;;) {
    for (const mark of [".git", "package.json"]) {
      if (fs.existsSync(path.join(dir, mark))) return dir;
    }
    const up = path.dirname(dir);
    if (up === dir) return path.resolve(from);
    dir = up;
  }
}

/**
 * How the agent should start the server.
 *
 * A project that already has the package gets a direct `node` invocation:
 * `npx` would re-resolve the package on every start, which costs a second and
 * needs the network. Anywhere else, `npx -y` is the only thing that works
 * without an install step.
 */
function launcher(cwd) {
  const local = path.join(cwd, "node_modules", PACKAGE, "index.cjs");
  if (fs.existsSync(local)) {
    // Relative, so the config survives being committed and cloned elsewhere.
    return { command: "node", args: [`node_modules/${PACKAGE}/index.cjs`, "mcp"] };
  }
  return { command: "npx", args: ["-y", PACKAGE, "mcp"] };
}

/** UTF-8, no BOM, LF. The three things that go wrong by hand. */
function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.replace(/\r\n/g, "\n"), { encoding: "utf8" });
}

function readText(file) {
  if (!fs.existsSync(file)) return null;
  // Strip a BOM if one is already there, rather than preserving the bug.
  return fs.readFileSync(file, "utf8").replace(/^﻿/, "");
}

// ------------------------------------------------------------------- json

/*
 * Claude Code and Cursor both take `mcpServers` in a JSON file; they differ
 * only in where it lives. An existing file is merged into, because it may
 * already hold servers that are nothing to do with this one.
 */
function installJson(file, cwd) {
  const existing = readText(file);
  let config = {};
  if (existing && existing.trim()) {
    try {
      config = JSON.parse(existing);
    } catch (error) {
      return { file, status: "failed", detail: `${file} is not valid JSON (${error.message}). Left alone.` };
    }
  }

  config.mcpServers = config.mcpServers || {};
  const before = JSON.stringify(config.mcpServers[SERVER]);
  config.mcpServers[SERVER] = launcher(cwd);
  const after = JSON.stringify(config.mcpServers[SERVER]);

  writeText(file, `${JSON.stringify(config, null, 2)}\n`);
  return { file, status: before === after ? "unchanged" : before ? "updated" : "added" };
}

// ------------------------------------------------------------------- toml

const tomlString = (value) => `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function tomlBlock({ command, args }) {
  return [
    `[mcp_servers.${SERVER}]`,
    `command = ${tomlString(command)}`,
    `args = [${args.map(tomlString).join(", ")}]`,
  ].join("\n");
}

/*
 * Codex reads TOML, and this edits it as text.
 *
 * Bringing in a TOML parser to add one table is not a trade worth making for
 * a library that ships with no dependencies. The risk in text editing is
 * clobbering something, so the only region touched is the span from our own
 * table header to the next one — and if that table is already right, the file
 * is not rewritten at all.
 */
function installToml(file, cwd) {
  const launch = launcher(cwd);
  const block = tomlBlock(launch);
  const existing = readText(file);

  if (!existing || !existing.trim()) {
    writeText(file, `${block}\n`);
    return { file, status: "added" };
  }

  const text = existing.replace(/\r\n/g, "\n");
  const header = new RegExp(`^\\[mcp_servers\\.${SERVER}\\]\\s*$`, "m");
  const match = header.exec(text);

  if (!match) {
    const separator = text.endsWith("\n\n") ? "" : text.endsWith("\n") ? "\n" : "\n\n";
    writeText(file, `${text}${separator}${block}\n`);
    return { file, status: "added" };
  }

  // From our header to the start of the next table, which is where our keys end.
  const rest = text.slice(match.index + match[0].length);
  const next = rest.search(/^\s*\[/m);
  const end = next === -1 ? text.length : match.index + match[0].length + next;
  const current = text.slice(match.index, end).trim();

  if (current === block) return { file, status: "unchanged" };

  const tail = text.slice(end);
  writeText(file, `${text.slice(0, match.index)}${block}\n${tail.startsWith("\n") ? "" : "\n"}${tail}`);
  return { file, status: "updated" };
}

// ---------------------------------------------------------------- targets

const TARGETS = {
  claude: {
    label: "Claude Code",
    where: (cwd) => path.join(cwd, ".mcp.json"),
    apply: installJson,
    /*
     * A `.mcp.json` server is project-scoped, and Claude Code will not load
     * one without being asked first — it sits at "Pending approval" until
     * you say yes, and nothing asks again. That prompt only appears at the
     * start of a session, so an editor window already open sees nothing at
     * all. Both are worth saying out loud, because the file is written
     * either way and the command otherwise looks like it worked.
     */
    note:
      "Reload the window (VS Code: Developer: Reload Window), approve the server\n" +
      "      when asked, then `/mcp` should show it connected. Prefer it in every\n" +
      "      project instead? `claude mcp add -s user grampro -- npx -y @grampro/kit mcp`\n" +
      "      skips the approval, since user scope is yours rather than the repo's.",
  },
  codex: {
    label: "Codex",
    where: (cwd) => path.join(cwd, ".codex", "config.toml"),
    apply: installToml,
    note: `Project-scoped. For every project instead, put the same block in ${path.join(os.homedir(), ".codex", "config.toml")}.`,
  },
  cursor: {
    label: "Cursor",
    where: (cwd) => path.join(cwd, ".cursor", "mcp.json"),
    apply: installJson,
    note: "Settings → MCP shows whether it connected.",
  },
};

const NAMES = Object.keys(TARGETS);

/**
 * Writes the configuration for one or more agents.
 *
 * `for` is a comma-separated list of agent names, or "all". With nothing
 * given it writes for every agent, because the cost of an unused config file
 * is nil and guessing wrong wastes a round trip with the user.
 */
function install({ cwd = projectRoot(process.cwd()), for: which } = {}) {
  const wanted = !which || which === "all"
    ? NAMES
    : String(which)
        .split(",")
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean);

  const unknown = wanted.filter((name) => !TARGETS[name]);
  if (unknown.length) {
    return { error: `No such agent: ${unknown.join(", ")}. Known: ${NAMES.join(", ")}.` };
  }

  const launch = launcher(cwd);
  const results = wanted.map((name) => {
    const target = TARGETS[name];
    try {
      return { agent: name, label: target.label, note: target.note, ...target.apply(target.where(cwd), cwd) };
    } catch (error) {
      return { agent: name, label: target.label, status: "failed", detail: error.message };
    }
  });

  return { launch, results, root: cwd };
}

/** The CLI face of the above. */
function main(operands, options = {}) {
  const root = projectRoot(process.cwd());
  const outcome = install({ cwd: root, for: options.for });
  if (outcome.error) {
    console.log(outcome.error);
    process.exitCode = 1;
    return;
  }

  const { launch, results } = outcome;

  // Say which directory, always. An agent reads these files from the folder
  // it opened, so the wrong directory is the failure that looks like success.
  console.log(`Project root:   ${root}`);
  if (path.resolve(process.cwd()) !== root) {
    console.log(`                (you ran this in ${process.cwd()})`);
  }
  console.log(`Server command: ${launch.command} ${launch.args.join(" ")}\n`);

  for (const result of results) {
    const rel = path.relative(root, result.file) || result.file;
    if (result.status === "failed") {
      console.log(`  ${result.label}: ${result.detail}`);
      process.exitCode = 1;
      continue;
    }
    console.log(`  ${result.label}: ${result.status} ${rel}`);
    if (result.status !== "unchanged") console.log(`    ${result.note}`);
  }

  console.log(
    "\nAn MCP server is not called by name — there is no slash command for it.\n" +
      "The agent calls its tools when they are relevant. Ask for a component and watch.",
  );

  if (launch.command === "npx") {
    console.log(
      `\nThis project does not have ${PACKAGE} installed, so the config uses npx.\n` +
        `Installing it (\`npm i -D ${PACKAGE}\`) and running this again gives a faster start.`,
    );
  }
}

module.exports = { install, main, NAMES };
