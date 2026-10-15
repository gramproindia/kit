/*
 * `grampro-kit secret …` — put a credential where the operating system keeps
 * credentials, and tell the truth about where that is.
 *
 * The value is never passed as an argument. It is typed at a prompt with the
 * echo off, or piped in, because an argument lands in the shell history and
 * in every process listing on the machine for as long as the command runs.
 */
"use strict";

const readline = require("readline");
const secrets = require("./secret.cjs");

/** What each name is for, so `secret list` is readable without the docs. */
const PURPOSE = {
  figma: "Figma personal access token, for reading a design by URL",
};

/** figd_1234…wxyz — enough to tell two tokens apart, not enough to use one. */
function mask(value) {
  if (value.length <= 12) return `${value.slice(0, 2)}${"*".repeat(value.length - 2)}`;
  return `${value.slice(0, 7)}${"*".repeat(8)}${value.slice(-4)}`;
}

/** Reads everything piped in, for `echo $TOKEN | grampro-kit secret set figma`. */
function readPiped() {
  return new Promise((resolve) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
    });
    process.stdin.on("end", () => resolve(input.trim()));
  });
}

/** Reads one line with the echo off. */
function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    let muted = false;
    // readline writes each keystroke back to the terminal; this is where to
    // stop it. There is no supported option for a password prompt.
    rl._writeToOutput = (chunk) => {
      if (!muted) rl.output.write(chunk);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer.trim());
    });
    muted = true;
  });
}

const usage = () =>
  [
    "Usage:",
    "  grampro-kit secret set <name>      store a credential (prompts; echo off)",
    "  grampro-kit secret get <name>      show whether one is stored, masked",
    "  grampro-kit secret remove <name>   delete it",
    "  grampro-kit secret list            what is stored, and where",
    "",
    `Names: ${secrets.KNOWN.join(", ")}`,
  ].join("\n");

async function main(operands) {
  const [action, name] = operands;

  if (!action || action === "help") {
    console.log(usage());
    return;
  }

  if (action === "list") {
    const stored = secrets.listSecrets();
    console.log(`Stored in: ${secrets.describeStore()}`);
    if (!secrets.isEncrypted()) {
      console.log(
        "\nThis machine offers no credential store, so the file is only protected by\n" +
          "its permissions. It is outside your repository, which is the point.",
      );
    }
    console.log("");
    if (stored.length === 0) {
      console.log("Nothing stored yet. Try: grampro-kit secret set figma");
      return;
    }
    for (const key of stored) {
      const value = secrets.getSecret(key);
      const purpose = PURPOSE[key] ? ` — ${PURPOSE[key]}` : "";
      console.log(`  ${key}  ${value ? mask(value) : "(unreadable)"}${purpose}`);
    }
    return;
  }

  if (!name) {
    console.log(`Which secret? Try: grampro-kit secret ${action} figma`);
    return;
  }

  if (action === "set") {
    /*
     * An unknown name is accepted rather than refused — this package is not
     * the only thing that may want a store — but it is worth a word, because
     * the usual reason for one is a typo.
     */
    if (!secrets.KNOWN.includes(name)) {
      console.log(`Note: "${name}" is not a name this package reads (${secrets.KNOWN.join(", ")}).`);
    }

    const value = process.stdin.isTTY
      ? await prompt(`Value for "${name}" (not shown): `)
      : await readPiped();

    if (!value) {
      console.log("Nothing entered; nothing stored.");
      process.exitCode = 1;
      return;
    }

    try {
      secrets.setSecret(name, value);
    } catch (error) {
      console.log(`Could not store it: ${error.message}`);
      process.exitCode = 1;
      return;
    }

    // Read it back. A store that accepts a write and cannot return it is
    // worse than one that fails loudly, and that has happened.
    if (secrets.getSecret(name) !== value) {
      console.log("Stored, but it did not read back correctly. Treat it as not set.");
      process.exitCode = 1;
      return;
    }

    console.log(`Stored "${name}" (${mask(value)}) in ${secrets.describeStore()}.`);
    if (name === "figma") {
      console.log(
        "\nThe MCP server will find it from any project. If you have FIGMA_TOKEN in a\n" +
          ".env, delete that line — the environment still wins over the store.",
      );
    }
    return;
  }

  if (action === "get") {
    const value = secrets.getSecret(name);
    if (!value) {
      console.log(`No "${name}" stored in ${secrets.describeStore()}.`);
      process.exitCode = 1;
      return;
    }
    console.log(`${name}: ${mask(value)}  (${value.length} characters, in ${secrets.describeStore()})`);
    return;
  }

  if (action === "remove" || action === "delete") {
    console.log(
      secrets.removeSecret(name) ? `Removed "${name}".` : `There was no "${name}" to remove.`,
    );
    return;
  }

  console.log(`No such action "${action}".\n\n${usage()}`);
  process.exitCode = 1;
}

module.exports = { main, mask };
