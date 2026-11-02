/*
 * Props tables for the React Native docs, read from the components' own
 * TypeScript so they cannot drift from the code.
 *
 * Scans the native views:
 *   ../source/components/<folder>/native/*.tsx   cross-platform components
 *   ../source/native/<folder>/native/*.tsx       mobile-only components
 *
 * and writes native-preview/generated/props.json:
 *   { "<folder>/<InterfaceName>": { extends: [...], members: [{ name, type, optional, doc }] } }
 *
 * Only syntax is read (no type checking), so inherited members are listed by
 * the name of what they extend, and members of an extended interface in the
 * same folder are merged in.
 *
 * Run by `npm run dev` and `npm run build`; also `npm run gen:native`.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const repo = path.resolve(root, "..");
const OUT = path.join(root, "native-preview", "generated");

const roots = [
  path.join(repo, "source", "components"),
  path.join(repo, "source", "native"),
];

/** @type {Record<string, { extends: string[], members: { name: string, type: string, optional: boolean, doc: string }[] }>} */
const found = {};

const docOf = (node, sf) => {
  const ranges = ts.getLeadingCommentRanges(sf.text, node.getFullStart()) ?? [];
  const block = ranges
    .map((r) => sf.text.slice(r.pos, r.end))
    .filter((c) => c.startsWith("/**"))
    .pop();
  if (!block) return "";
  return block
    .replace(/^\/\*\*|\*\/$/g, "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};

for (const base of roots) {
  if (!fs.existsSync(base)) continue;
  for (const folder of fs.readdirSync(base)) {
    const dir = path.join(base, folder, "native");
    if (!fs.existsSync(dir) || folder === "shared") continue;
    for (const file of fs.readdirSync(dir).filter((f) => /\.tsx?$/.test(f))) {
      const text = fs.readFileSync(path.join(dir, file), "utf8");
      const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      sf.forEachChild((node) => {
        if (!ts.isInterfaceDeclaration(node) || !/Props$/.test(node.name.text)) return;
        // Unexported ones too: a shared base such as `CommonProps` is merged into
        // the exported interfaces that extend it below.
        const members = node.members
          .filter((m) => (ts.isPropertySignature(m) || ts.isMethodSignature(m)) && m.name && ts.isIdentifier(m.name))
          .map((m) => {
            let type;
            if (ts.isMethodSignature(m)) {
              const params = m.parameters.map((p) => p.getText(sf)).join(", ");
              type = `(${params}) => ${m.type ? m.type.getText(sf) : "void"}`;
            } else {
              type = m.type ? m.type.getText(sf) : "unknown";
            }
            return {
              name: m.name.text,
              type: type.replace(/\s+/g, " "),
              optional: !!m.questionToken,
              doc: docOf(m, sf),
            };
          })
          .filter((m) => m.name !== "ref");
        const heritage = (node.heritageClauses ?? []).flatMap((h) => h.types.map((t) => t.getText(sf).replace(/\s+/g, " ")));
        found[`${folder}/${node.name.text}`] = { extends: heritage, members };
      });
    }
  }
}

// Merge members of an extended interface from the same folder, so a prop
// declared once (e.g. ComboboxSharedProps) shows on every component using it.
for (const [key, entry] of Object.entries(found)) {
  const folder = key.split("/")[0];
  const seen = new Set(entry.members.map((m) => m.name));
  const outside = [];
  for (const parent of entry.extends) {
    const name = parent.replace(/<.*$/, "");
    const local = found[`${folder}/${name}`];
    if (!local) {
      outside.push(parent);
      continue;
    }
    for (const m of local.members) if (!seen.has(m.name)) entry.members.push(m), seen.add(m.name);
  }
  entry.extends = outside;
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "props.json"), JSON.stringify(found, null, 1));
console.log(`generate-native-props: ${Object.keys(found).length} props interfaces`);
