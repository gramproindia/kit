/*
 * Make React resolvable for the library sources this site compiles.
 *
 * The pages import `../source/components/*`, and Node resolves a module by
 * walking up from the file doing the import. Those files live at
 * <repo>/source/components, so the walk goes
 *
 *   source/components/button/react/node_modules
 *   …
 *   <repo>/node_modules        <- the last stop
 *
 * and never passes docs-site. On a developer's machine the repo root has its
 * own node_modules and the imports resolve by luck. A deployment that
 * installs only this folder has nothing there, and every component file
 * fails on `react/jsx-runtime` -- seventy of them, which is how this was
 * found.
 *
 * So the root gets React: a link to the copy this app already installed, not
 * a second download. Linking rather than copying matters, because React is
 * resolved through its package.json `exports` -- including the `react-server`
 * condition that keeps server and client components apart -- and a link
 * preserves that where a hand-built file path would not.
 *
 * A root that already has React is left alone, which is every local checkout.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.resolve(here, "..");
const rootModules = path.join(repoRoot, "node_modules");

const PACKAGES = ["react", "react-dom"];

const linked = [];
for (const name of PACKAGES) {
  const target = path.join(here, "node_modules", name);
  const link = path.join(rootModules, name);

  if (fs.existsSync(link)) continue;
  if (!fs.existsSync(target)) {
    console.warn(`ensure-root-react: ${name} is not installed here; skipping`);
    continue;
  }

  fs.mkdirSync(rootModules, { recursive: true });
  // "junction" is the Windows form that needs no elevated permissions; it is
  // ignored on platforms where symlinks are unprivileged.
  fs.symlinkSync(fs.realpathSync(target), link, "junction");
  linked.push(name);
}

console.log(
  linked.length
    ? `ensure-root-react: linked ${linked.join(", ")} into the repo root`
    : "ensure-root-react: the repo root already resolves React",
);
