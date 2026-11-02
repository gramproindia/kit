import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * The rules that keep the library installable.
 *
 * Components are copied into a project one folder at a time, so a component
 * that reaches into a sibling folder breaks as soon as someone installs it on
 * its own. `shared/` is the single exception: the installer copies it with
 * every install. These tests fail the moment a new import would break that.
 */

const LIB = resolve(import.meta.dirname, "..", "..");
const SHARED = "shared";

/** Bare specifiers a component may import. The library ships no dependencies. */
const ALLOWED_PACKAGES = new Set(["react", "react-dom", "react-dom/client", "react-native", "vitest"]);

function packages(): string[] {
  return readdirSync(LIB)
    .filter((name) => statSync(join(LIB, name)).isDirectory())
    .sort();
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/** Comments stripped, so prose about a word in quotes is not read as an import. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
}

/** Every `from "…"` specifier in a file, with `import()` and `export … from` included. */
function specifiers(file: string): string[] {
  const source = withoutComments(readFileSync(file, "utf8"));
  return [...source.matchAll(/from\s+"([^"]+)"|import\("([^"]+)"\)/g)].map(
    (match) => match[1] ?? match[2],
  );
}

/** Which package a relative import lands in, or null when it leaves the library. */
function targetPackage(file: string, specifier: string): string | null {
  const target = resolve(file, "..", specifier);
  const rel = relative(LIB, target);
  if (rel.startsWith("..")) return null;
  return rel.split(sep)[0];
}

describe.each(packages().filter((name) => name !== SHARED))("%s", (pkg) => {
  const files = sourceFiles(join(LIB, pkg));

  it("imports nothing from another component", () => {
    const offenders = files.flatMap((file) =>
      specifiers(file)
        .filter((specifier) => specifier.startsWith("."))
        .map((specifier) => ({ file: relative(LIB, file), specifier, to: targetPackage(file, specifier) }))
        .filter((entry) => entry.to !== pkg && entry.to !== SHARED),
    );
    expect(offenders).toEqual([]);
  });

  it("imports no third-party package", () => {
    const offenders = files.flatMap((file) =>
      specifiers(file)
        .filter((specifier) => !specifier.startsWith(".") && !ALLOWED_PACKAGES.has(specifier))
        .map((specifier) => `${relative(LIB, file)} -> ${specifier}`),
    );
    expect(offenders).toEqual([]);
  });
});

describe("shared", () => {
  it("never imports a component, so it can be installed on its own", () => {
    const offenders = sourceFiles(join(LIB, SHARED)).flatMap((file) =>
      specifiers(file)
        .filter((specifier) => specifier.startsWith("."))
        .map((specifier) => ({ file: relative(LIB, file), to: targetPackage(file, specifier) }))
        .filter((entry) => entry.to !== SHARED),
    );
    expect(offenders).toEqual([]);
  });

  it("is reached only as ../../shared, the path the installer guarantees", () => {
    const offenders = packages()
      .filter((name) => name !== SHARED)
      .flatMap((pkg) => sourceFiles(join(LIB, pkg)))
      .flatMap((file) =>
        specifiers(file)
          .filter((specifier) => specifier.includes(SHARED))
          .filter((specifier) => !specifier.startsWith("../../shared/"))
          .map((specifier) => `${relative(LIB, file)} -> ${specifier}`),
      );
    expect(offenders).toEqual([]);
  });
});

/*
 * Platform rules. A web install copies core/ + react/, a native install copies
 * core/ + native/ (see docs/react-native.md), so each layer may only reach what
 * is copied with it.
 */

type Layer = "core" | "react" | "native" | "other";

function layerOf(file: string): Layer {
  const parts = relative(LIB, file).split(sep);
  if (parts.includes("__tests__")) return "other";
  if (parts[1] === "core") return "core";
  if (parts[1] === "react") return "react";
  if (parts[1] === "native" || parts[parts.length - 1] === "index.native.ts") return "native";
  return "other";
}

const allFiles = () => packages().flatMap((pkg) => sourceFiles(join(LIB, pkg)));

/** Where a relative import lands, as path segments from the library root. */
function targetPath(file: string, specifier: string): string[] {
  return relative(LIB, resolve(file, "..", specifier)).split(sep);
}

/**
 * `react-native` exports that react-native-web also implements, so the docs can
 * render the real native components in a browser. Type-only imports are free.
 */
const WEB_SAFE_RN = new Set([
  "AccessibilityInfo", "ActivityIndicator", "Animated", "Dimensions", "Easing", "FlatList",
  "I18nManager", "Image", "Keyboard", "Modal", "PanResponder", "Platform", "Pressable",
  "ScrollView", "SectionList", "StatusBar", "StyleSheet", "Text", "TextInput", "View", "useColorScheme",
  "useWindowDimensions",
]);

function reactNativeValueImports(file: string): string[] {
  const source = withoutComments(readFileSync(file, "utf8"));
  return [...source.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+"react-native"/g)]
    .filter((match) => !match[1])
    .flatMap((match) => match[2].split(","))
    .map((name) => name.trim())
    .filter((name) => name && !name.startsWith("type "))
    .map((name) => name.split(/\s+as\s+/)[0]);
}

describe("platform layers", () => {
  it("core imports neither react-dom nor react-native", () => {
    const offenders = allFiles()
      .filter((file) => layerOf(file) === "core")
      .flatMap((file) =>
        specifiers(file)
          .filter((s) => s.startsWith("react-dom") || s === "react-native")
          .map((s) => `${relative(LIB, file)} -> ${s}`),
      );
    expect(offenders).toEqual([]);
  });

  it("web code never imports react-native", () => {
    const offenders = allFiles()
      .filter((file) => layerOf(file) === "react")
      .flatMap((file) =>
        specifiers(file)
          .filter((s) => s === "react-native")
          .map((s) => `${relative(LIB, file)} -> ${s}`),
      );
    expect(offenders).toEqual([]);
  });

  it("native code never imports react-dom or a react/ folder", () => {
    // DOM-free hooks in shared/react that native may use.
    const allowed = new Set(["shared/react/useControllableState"]);
    const offenders = allFiles()
      .filter((file) => layerOf(file) === "native")
      .flatMap((file) =>
        specifiers(file)
          .filter((s) => {
            if (s.startsWith("react-dom")) return true;
            if (!s.startsWith(".")) return false;
            const path = targetPath(file, s);
            return path[1] === "react" && !allowed.has(path.join("/"));
          })
          .map((s) => `${relative(LIB, file)} -> ${s}`),
      );
    expect(offenders).toEqual([]);
  });

  it("native code uses only react-native APIs that react-native-web supports", () => {
    const offenders = allFiles()
      .filter((file) => layerOf(file) === "native")
      .flatMap((file) =>
        reactNativeValueImports(file)
          .filter((name) => !WEB_SAFE_RN.has(name))
          .map((name) => `${relative(LIB, file)} -> ${name}`),
      );
    expect(offenders).toEqual([]);
  });
});
