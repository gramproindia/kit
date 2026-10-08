# Changelog

## 2.4.0

The first release published as **`@grampro/kit`**. `gbs-add-block` keeps
working for now and installs the same components, but new work happens here.

### The package has a new name

```bash
npx @grampro/kit add DataGrid
```

`npx gbs-add-block` still resolves, and the `gbs-add-block` binary is still
installed, so existing scripts keep running. Both will stay for a few
releases before the old name is deprecated.

### Commands read as commands

`add`, `list`, `skill` and `passport` are verbs now:

```bash
npx @grampro/kit add Button DataGrid
npx @grampro/kit list
npx @grampro/kit skill --for claude
npx @grampro/kit passport --check
```

The old flag spellings (`-a Button`, `-skill`, `-passport`) still work and
print the new spelling once. `--legacy` reaches the 1.x component set, which
is where `--beta` went: it used to opt *in* to the current components, and
there is nothing left to opt into.

### You choose where components land

The destination was fixed at `component-lib/` in the directory you ran the
command from, which put it beside `src/` rather than inside it for most
projects. Now:

- `--dest <path>` puts them wherever you want.
- Failing that, an install already in the project wins, so a second `add`
  lands beside the first. That is how a custom `--dest` is remembered; no
  config file is written into your project.
- Failing that, a project with a `src/` folder gets `src/component-lib/`,
  and everything else keeps `component-lib/` at the root.

Nothing moves on its own: if you already have `component-lib/`, that is
still where components go.

The stylesheet import printed after an install now names the path the files
actually landed at, relative to your project root.

### Fixed

- `add Button --dest app/ui` tried to install a component called `app/ui`.
  A flag's value was being read as a component name; the same was true of
  `--for`.

### Internal

The library source moved from `source/beta-components` to
`source/components`, and the 1.x set from `source/components` to
`source/legacy-components`. This changes nothing for installed components —
the files you receive and their import paths are identical — but every
`passport.json` has a new `sourceHash`, because that hash covers
repo-relative paths.

## 2.3.0

Published as a minor, but **it contains one breaking change to styling**. Read
the upgrade note below before updating.

### Breaking: component CSS is no longer in a cascade layer

Component rules used to live in `@layer gbs`, and 2.1.0 asked Tailwind v4
projects to add `@layer gbs, utilities;` to their global CSS. Both are gone.

A cascade layer loses to *any* unlayered stylesheet regardless of specificity,
and Tailwind v3's preflight and Bootstrap's Reboot are both unlayered. Measured
on 2.2.0: under Tailwind v3 the components rendered with `border: 0` and
`padding-left: 0`; under Bootstrap every button was square. No host-side
declaration could fix either, because nothing layered can outrank unlayered CSS.

Component CSS now ships unlayered and wins on ordinary specificity, so Tailwind
v3, Bootstrap and framework-free projects work with no setup at all.

**What to change:**

- Delete any `@layer gbs, utilities;` (or similar) line you added for 2.1.0.
- Import the generated barrel instead of individual stylesheets:
  `@import "./component-lib/gbs.css";`
- **Tailwind v4 only** — import it after the framework and into its components
  layer, or utilities stop overriding component rules:
  ```css
  @import "tailwindcss";
  @import "./component-lib/gbs.css" layer(components);
  ```

The installer detects which line you need and prints it.

### Added

- **`<DataGrid ai />`** — a natural-language input above the grid, driven by an
  adapter the application supplies through `<GramproAIProvider>`. No model is
  bundled, downloaded or named, and with no provider the prop renders nothing.
- **WebMCP** — `registerGridTool(agent)` exposes one tool, `operate_grid`, to a
  browser agent. Its schema is generated from the live grid. Needs no model.
- **Generated stylesheet barrel** — the CLI writes `component-lib/gbs.css` on
  every install, so the import list stays correct as you add components.
- **Thin scrollbars** across every scrolling surface, themeable from `:root`
  via `--gbs-scrollbar-width`, `--gbs-scrollbar-thumb`,
  `--gbs-scrollbar-thumb-hover` and `--gbs-scrollbar-track`. Add
  `class="gbs-scroll"` to your own scroll areas to match. Scroll containers the
  kit does not own are left alone.

### Security

- Pinned `dompurify` to `^3.4.16` via `overrides`, clearing two DOM XSS
  advisories reachable through `@grampro/headless-helpers → jspdf`. The 2.0 beta
  components never used that chain. `npm audit` is now clean.
- Removed the `path` dependency. `require("path")` resolves to Node's built-in,
  so the npm package was inert — a deprecated userland shim sitting in the
  dependency tree for no reason.

### Documentation

- Documented what leaves the page with a remote AI adapter: the runtime contract
  carries real values from low-cardinality columns. Mark personal columns
  `semantics: { email: { pii: true } }` — a PII column is denied *and* never
  summarised — or pass `stats: false`. Note that `policy.denyFilter` governs what
  may be *done* with a column, not whether it may be *described*.
- Corrected the agent skill's install instructions, which still told agents to
  import each stylesheet individually with no `layer()`.

### Packaging

- Test files are no longer published (35 files, 233 KB). They were filtered out
  at install time anyway.
- Added `repository`, `homepage` and `bugs` metadata.
