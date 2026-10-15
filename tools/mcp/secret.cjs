/*
 * Credentials, kept by the operating system instead of by the repository.
 *
 * The Figma token used to live in a `.env`, which meant a long-lived
 * credential sitting in a file inside a git working tree — one `git add -A`
 * away from being published. This moves it to whatever the platform already
 * uses for secrets: the Windows Data Protection API, the macOS keychain, or
 * the Secret Service on Linux. Each of those ties the ciphertext to the
 * logged-in user, so a copied file is useless on another machine.
 *
 * Nothing here adds a dependency. Every backend is a command the OS ships
 * with, and the fallback is a 0600 file — worse, but still outside the repo,
 * and it says so rather than pretending otherwise.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

/** Namespace for keychain/Secret-Service entries. */
const SERVICE = "grampro-kit";

/** Per-user config directory, following each platform's own convention. */
function configDir() {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), SERVICE);
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", SERVICE);
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), SERVICE);
}

/** True when a command exists and runs. */
function available(command, args) {
  try {
    const probe = spawnSync(command, args, { stdio: "ignore", windowsHide: true });
    return !probe.error;
  } catch {
    return false;
  }
}

// --------------------------------------------------------------- windows

/*
 * DPAPI, reached through PowerShell because Node has no binding for it.
 *
 * The plaintext goes in over stdin, never as an argument — command lines are
 * readable by other processes on the machine.
 *
 * The script is passed with `-Command` rather than `-EncodedCommand`, which
 * accepts the base64 and then silently runs nothing on at least one shipped
 * 5.1 build (5.1.22621): exit 0, no output, no error. Statements are joined
 * with semicolons for that reason, and quoting is kept to single quotes so
 * nothing needs escaping between here and the shell.
 */
function powershell(script, input) {
  const run = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { input: input === undefined ? "" : input, encoding: "utf8", windowsHide: true },
  );
  if (run.error) throw run.error;
  if (run.status !== 0) {
    throw new Error((run.stderr || "PowerShell failed").trim().split("\n")[0]);
  }
  return run.stdout;
}

const DPAPI_PROTECT = [
  "Add-Type -AssemblyName System.Security",
  "$plain = [Console]::In.ReadToEnd()",
  "$bytes = [System.Text.Encoding]::UTF8.GetBytes($plain)",
  "[Convert]::ToBase64String([System.Security.Cryptography.ProtectedData]::Protect($bytes, $null, 'CurrentUser'))",
].join("; ");

const DPAPI_UNPROTECT = [
  "Add-Type -AssemblyName System.Security",
  "$sealed = [Convert]::FromBase64String([Console]::In.ReadToEnd().Trim())",
  "[System.Text.Encoding]::UTF8.GetString([System.Security.Cryptography.ProtectedData]::Unprotect($sealed, $null, 'CurrentUser'))",
].join("; ");

const dpapiFile = (name) => path.join(configDir(), "secrets", `${name}.dpapi`);

const dpapi = {
  label: "Windows Data Protection API (tied to your Windows account)",
  set(name, value) {
    // PowerShell may fold a long string across lines when there is no console
    // to measure, and base64 does not survive that. Whitespace is dropped on
    // the way in and on the way out.
    const sealed = powershell(DPAPI_PROTECT, value).replace(/\s+/g, "");
    if (!sealed) throw new Error("DPAPI returned nothing; the secret was not stored.");
    const file = dpapiFile(name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, sealed, { encoding: "utf8", mode: 0o600 });
  },
  get(name) {
    const file = dpapiFile(name);
    if (!fs.existsSync(file)) return null;
    // A file carried over from another account will not decrypt; that is the
    // protection working, so it reads as absent rather than as an error.
    try {
      const sealed = fs.readFileSync(file, "utf8").replace(/\s+/g, "");
      return powershell(DPAPI_UNPROTECT, sealed).trim() || null;
    } catch {
      return null;
    }
  },
  remove(name) {
    const file = dpapiFile(name);
    if (!fs.existsSync(file)) return false;
    fs.unlinkSync(file);
    return true;
  },
  list() {
    const dir = path.join(configDir(), "secrets");
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.endsWith(".dpapi")).map((f) => f.slice(0, -6));
  },
};

// ----------------------------------------------------------------- macos

/*
 * The keychain. `security` takes the password as an argument, which is
 * visible in `ps` for the moment the command runs — a real if narrow
 * exposure, and the alternative is an interactive prompt that cannot work
 * from a tool. Any process able to read that argument is already running as
 * this user and could ask the keychain directly.
 */
const keychain = {
  label: "macOS keychain",
  set(name, value) {
    const run = spawnSync(
      "security",
      ["add-generic-password", "-U", "-a", os.userInfo().username, "-s", `${SERVICE}.${name}`,
        "-D", "api token", "-j", "GramproKit", "-w", value],
      { encoding: "utf8" },
    );
    if (run.status !== 0) throw new Error((run.stderr || "security failed").trim());
  },
  get(name) {
    const run = spawnSync(
      "security",
      ["find-generic-password", "-a", os.userInfo().username, "-s", `${SERVICE}.${name}`, "-w"],
      { encoding: "utf8" },
    );
    return run.status === 0 ? run.stdout.trim() || null : null;
  },
  remove(name) {
    const run = spawnSync(
      "security",
      ["delete-generic-password", "-a", os.userInfo().username, "-s", `${SERVICE}.${name}`],
      { encoding: "utf8", stdio: "ignore" },
    );
    return run.status === 0;
  },
  /* The keychain has no cheap listing by service, so the known names are probed. */
  list() {
    return KNOWN.filter((name) => keychain.get(name) !== null);
  },
};

// ----------------------------------------------------------------- linux

/** libsecret's CLI, which every desktop keyring implements. */
const secretTool = {
  label: "Secret Service (GNOME Keyring, KWallet)",
  set(name, value) {
    const run = spawnSync(
      "secret-tool",
      ["store", "--label", `GramproKit ${name}`, "service", SERVICE, "account", name],
      { input: value, encoding: "utf8" },
    );
    if (run.status !== 0) throw new Error((run.stderr || "secret-tool failed").trim());
  },
  get(name) {
    const run = spawnSync("secret-tool", ["lookup", "service", SERVICE, "account", name], {
      encoding: "utf8",
    });
    return run.status === 0 ? run.stdout.trim() || null : null;
  },
  remove(name) {
    const run = spawnSync("secret-tool", ["clear", "service", SERVICE, "account", name], {
      encoding: "utf8",
      stdio: "ignore",
    });
    return run.status === 0;
  },
  list() {
    return KNOWN.filter((name) => secretTool.get(name) !== null);
  },
};

// -------------------------------------------------------------- fallback

/*
 * A 0600 file under the user's config directory. Not encrypted, and it says
 * so when used — but it is outside the repository, which is the failure this
 * whole module exists to prevent.
 */
const plainFile = {
  label: "a 0600 file in your config directory (not encrypted)",
  file: () => path.join(configDir(), "secrets.json"),
  read() {
    try {
      return JSON.parse(fs.readFileSync(plainFile.file(), "utf8"));
    } catch {
      return {};
    }
  },
  write(all) {
    fs.mkdirSync(configDir(), { recursive: true });
    fs.writeFileSync(plainFile.file(), `${JSON.stringify(all, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
  },
  set(name, value) {
    const all = plainFile.read();
    all[name] = value;
    plainFile.write(all);
  },
  get(name) {
    return plainFile.read()[name] || null;
  },
  remove(name) {
    const all = plainFile.read();
    if (!(name in all)) return false;
    delete all[name];
    plainFile.write(all);
    return true;
  },
  list() {
    return Object.keys(plainFile.read());
  },
};

/** Secret names this package uses, for the backends that cannot enumerate. */
const KNOWN = ["figma"];

/** The best store this machine offers. Resolved once. */
let chosen = null;
function store() {
  if (chosen) return chosen;
  if (process.platform === "win32" && available("powershell.exe", ["-NoProfile", "-Command", "exit 0"])) {
    chosen = dpapi;
  } else if (process.platform === "darwin" && available("security", ["-h"])) {
    chosen = keychain;
  } else if (process.platform === "linux" && available("secret-tool", ["--version"])) {
    chosen = secretTool;
  } else {
    chosen = plainFile;
  }
  return chosen;
}

const setSecret = (name, value) => store().set(name, value);
const removeSecret = (name) => store().remove(name);
const listSecrets = () => store().list();
const describeStore = () => store().label;
const isEncrypted = () => store() !== plainFile;

/**
 * A secret, if this machine holds one. Never throws: a missing or unreadable
 * store is the same answer as an empty one, because every caller has another
 * place to look.
 */
function getSecret(name) {
  try {
    return store().get(name);
  } catch {
    return null;
  }
}

module.exports = {
  setSecret,
  getSecret,
  removeSecret,
  listSecrets,
  describeStore,
  isEncrypted,
  configDir,
  KNOWN,
};
