/*
 * Turns shell blocks that only run package-manager commands into <CommandTabs>,
 * which shows the npm and pnpm form of the same command.
 *
 * Done at render time rather than in the MDX, so the docs keep their plain
 * `npx …` source and regenerating them upstream cannot undo it.
 */

const SHELL = new Set(["bash", "sh", "shell", "console", "zsh"]);

/*
 * @grampro/kit ships two binaries (grampro-kit and gbs-add-block). npx copes,
 * but `pnpm dlx @grampro/kit` stops with ERR_PNPM_DLX_MULTIPLE_BINS, so the
 * pnpm form has to name the package and the binary separately.
 */
const KIT_NPX = /^npx\s+(?:-y\s+)?(@grampro\/kit(?:@\S+)?)(?=\s|$)(.*)$/;

/** `npx @grampro/kit@native add Button` -> `pnpm dlx --package=@grampro/kit@native grampro-kit add Button`. */
export function kitDlx(packageSpec: string, rest: string): string {
  return `pnpm dlx --package=${packageSpec} grampro-kit${rest}`;
}

/** npm-style command -> the pnpm equivalent, or null when there is no mapping. */
export function toPnpm(command: string): string | null {
  const line = command.trim();
  const kit = KIT_NPX.exec(line);
  if (kit) return kitDlx(kit[1], kit[2]);
  if (line.startsWith("npx ")) return `pnpm dlx ${line.slice(4)}`;
  if (line.startsWith("npm install ")) return `pnpm add ${line.slice(12)}`;
  if (line.startsWith("npm i ")) return `pnpm add ${line.slice(6)}`;
  if (line.startsWith("npm run ")) return `pnpm ${line.slice(8)}`;
  if (line.startsWith("npm create ")) return `pnpm create ${line.slice(11)}`;
  return null;
}

/** True when every line of the block is a command we can translate. */
function isTranslatable(value: string) {
  const lines = value.split("\n").filter((line) => line.trim() !== "");
  return lines.length > 0 && lines.every((line) => toPnpm(line) !== null);
}

type MdastNode = {
  type: string;
  lang?: string | null;
  value?: string;
  name?: string;
  attributes?: unknown[];
  children?: MdastNode[];
};

export function remarkCommandTabs() {
  return (tree: MdastNode) => {
    const walk = (node: MdastNode) => {
      if (!node) return;
      if (node.type === "code" && node.lang && SHELL.has(node.lang) && node.value && isTranslatable(node.value)) {
        const npm = node.value.trim();
        const pnpm = npm
          .split("\n")
          .map((line) => (line.trim() === "" ? line : toPnpm(line)))
          .join("\n");

        node.type = "mdxJsxFlowElement";
        node.name = "CommandTabs";
        node.attributes = [
          { type: "mdxJsxAttribute", name: "npm", value: npm },
          { type: "mdxJsxAttribute", name: "pnpm", value: pnpm },
        ];
        node.children = [];
        delete node.value;
        return;
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
