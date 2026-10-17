# Changelog

## 2.6.2

### Changed

**The agent skill now knows the MCP server exists.** It described the
component library and never mentioned the server, so an agent holding both
had nothing to tell it which to trust. The skill is a summary; the server
answers from passports generated from the source, so where they differ the
server is right and the skill is stale — and it now says so, along with
calling `get_component` before writing a component and `validate_usage`
before reporting back.

The only previous mention of "MCP" in the skill was WebMCP, the DataGrid's
browser-agent surface, which is a different thing entirely.

**Neither needs the other, and the docs now say so.** The server carries
its own copy of the guidance inside the package, so `get_guidance` answers
in a project with no `.gbs/` folder at all. What they do together is the
useful part: the skill is always in an agent's context and the server is
not, so the skill is what tells an agent to ask and the server is what it
asks.

The two pages now read in the order they are used — Theming, Agent skill,
MCP server.

**The text LLMs read was teaching a deprecated command.** `llms.txt` has a
hand-written preamble, so it lagged behind the CLI: it told every model
that reached the site to run `npx @grampro/kit -a <Component>`, a spelling
the CLI itself marks "Deprecated. Use: add". It now says `add`, and names
the Figma plugin, the whole-design export and `designFile`, none of which
it mentioned.

**The plugin's install link was invisible to every LLM.** It is rendered by
a component, and the Markdown conversion passed that through verbatim — so
`llms-full.txt` and every `.md` page carried a dangling `<FigmaPlugin />`
tag where the URL should have been, and the plugin's address appeared
nowhere a model could read it. The conversion emits a Markdown link now,
and the URL lives in one place so the button and the converter cannot
disagree about it.

**Every command is listed in one place.** `list` and `passport` appeared
in no user-facing documentation at all, and the rest were scattered across
three pages, so there was nowhere to look to find out what the CLI does.
The README now carries the lot in a table.

## 2.6.1

### Changed

**A screen costs about half what it did to read.** Measured on a real
purchase-orders design: 42.9 KB to 23.9 KB, roughly 13,300 tokens to
7,400.

Eight table rows exported as eight sibling subtrees of identical shape
whose text differed — 48% of that screen was the same row said seven
more times. The first is now given in full, because the agent builds from
its shape, and the rest become `repeatedText`: one array of strings per
row, which is closer to what a DataGrid's `data` prop wants than the
subtrees were.

Runs are matched on structure rather than appearance. Keyed on style, the
rows never matched at all: a striped table alternates its background, so
every consecutive pair looked like a different shape and nothing
collapsed. Where the fills do vary across a run they come back as
`repeatedFills`, which is how the striping and the per-status badge
colours stay legible.

Only runs of three or more collapse, and only where there is depth to
save: two of a thing is a pair, not a list, and a row of labels has
nothing inside it worth folding.

### Fixed

**`depth` is honoured on the plugin and file routes.** The tool has always
offered it — "Lower it if the payload is large" — and only ever applied
it to a design fetched from a URL. A caller who read the schema and
lowered it to cut a large payload got the large payload back. The same
screen at `depth: 3` is now 3.5 KB, and what was dropped says so rather
than going quiet.

**Selecting several frames exports several screens.** It used to produce
one pseudo-frame called "3 selected nodes" holding all of them, which
`design` then wrote as a single file under that name — a folder whose
whole point is one file per screen, with one file for three. The screens
were in there, but nothing said where one ended and the next began.

A selection of several frames now produces the same shape the whole-file
export does, so the split, the index and `figma_frame` treat them
identically. One frame selected is still one screen.

This is also the scoping the all-screens command lacks: a file with forty
frames in it need not be exported entire to build two of them. Select the
screens you want and export those.


## 2.6.0

### Added

**A whole Figma design, exported once and built screen by screen.**

In Figma, **Grampro Kit → Export all screens for an agent** walks every page
and takes each top-level frame. Then:

```bash
npx @grampro/kit design ./design.json
```

```text
Wrote 3 screen(s) to design/
  purchase-orders.json         Purchase orders (Product) — 22 nodes
  suppliers.json               Suppliers (Product) — 16 nodes
  settings.json                Settings (Admin) — 12 nodes
  index.json                   the plan: every screen, shared theme
```

The accuracy is in the theme rather than the convenience. Derived one
frame at a time it disagrees with itself — a screen that is mostly white
names a different background from one that is mostly grey — and the agent
then themes each page differently. Read across every screen, once, it is
well founded.

`index.json` is the plan: every screen with its size, node count and the
regions whose names repeat, plus that shared theme. It is the cheap place
to be wrong. A design drawn without the component library names nothing
directly, so every component is inferred, and a guess that `Action` is a
Card rather than a Button costs one sentence there and five screens of
rework later.

**`figma_frame` reads a file.** Pass `designFile` with a path instead of
`design` with the JSON. A chat input caps at around fifty thousand
characters and a whole screen passes that; and a pasted export sits in the
conversation twice, once as the argument and again inside the tool call,
where a file appears only in the answer.

**Every prop the library declares now carries a description.** 117 did
not, and the passports are what an agent reads instead of the source, so
an undescribed prop is one it guesses at. `DataGrid`'s `columns` and
`data` had none at all. See 2.5.0's notes — this is that work, reaching
npm for the first time.

### Changed

**The Figma export costs a third of what it did.** The copy button takes
minified JSON: `JSON.parse` cannot tell the difference, and indentation
was most of the payload. Three fields that said nothing went with it —
`radius: 0` on every square frame, `padding: [0,0,0,0]` on every frame
without padding, and `align`/`justify` restating Figma's own defaults —
along with the child frame Figma wraps around every icon, whose entire
content was the word "Vector" when the frame's name (`search`, `plus`)
was the whole signal.

**It also says more about what it exports.** Node size and stroke colour
are now included, because most designs are not built from the kit's Figma
library and an agent has to infer every component from what it can see. A
36px pill with a label is a button; the same shape at 200px is a card. A
white box with a border is a secondary button; without one it is a
surface. Neither was visible before.

### Fixed

**The design system generator laid out over itself.** Variant grids were
placed by column count without measuring whether the row fitted, so 14 of
38 component sets overflowed the card holding them — Alert reached 2444px
inside a 1320px section.

**Text that was told a width kept its own.** Figma creates a text node
auto-width, and setting it to fill is quietly ignored, so 23 layers across
the file measured themselves from their own characters. NumberInput's
value layer, created empty and filled in later by a component property,
wrapped one glyph per line.

**Alert's coloured edge did not match its card**, being sized before the
card had any content and never clipped to its rounded corners. Toast drew
the same edge with the same fault.

**The uploader thumbnails and the dialog's intent badge rendered at full
saturation**, which also hid the icon drawn on them in the same colour.

**The plugin's name displayed as mojibake** in Figma's menu, and its
build was never committed despite its README saying so, so a clone could
not run it.

## 2.5.0

### Added

**Every prop this library declares now carries a description.**

117 did not, and the passports are what an agent reads instead of the
source, so an undescribed prop is one it has to guess at. The worst of them
were not obscure: `DataGrid`'s `columns` and `data` had no description at
all, and `label`, `error`, `description` and `onChange` were bare on
Checkbox, Switch and RadioGroup.

Where reading the code turned up something a type cannot say, that is in
the description now:

- `onCellEdit` fires only when the value actually changed, and returning a
  promise makes the edit optimistic - the cell reverts and shows the
  rejection's message if it fails, so reject with the reason you want read.
- `CheckboxGroup`'s values accumulate in the order they were checked, not
  the order the options are declared, so sort before comparing selections.
- `Checkbox.onCheckedChange` never fires with `"indeterminate"`.
- `FileUploader` treats name, size and last-modified time as a file's
  identity when rejecting duplicates.
- `NumberInput`'s `min` and `max` apply on blur rather than per keystroke,
  unless `clampBehavior` says otherwise.
- `DatePicker.onChange` always hands back a `Date` at local midnight, even
  though `value` accepts a string or a number.
**The Figma token belongs to your operating system now, not to a file in
your repository.**

```bash
npx @grampro/kit secret set figma
```

It prompts with the echo off and stores the token where the platform keeps
credentials: the Data Protection API on Windows, the keychain on macOS, the
Secret Service on Linux. Anywhere else it falls back to a 0600 file in your
config directory and says so rather than implying otherwise. The value is
never passed as an argument, because arguments land in shell history and in
every process listing on the machine; pipe it instead if you need to script
it.

`secret list` shows what is stored, masked, and names the backend. `secret
remove figma` deletes it.

The old `.env` route still works, so upgrading breaks nothing, but reading
from one now prints a note telling you to move it. A credential sitting in a
working tree is one `git add -A` away from being published, which is the
whole reason for the change.

**`mcp install` writes the configuration for you.**

```bash
npx @grampro/kit mcp install            # every agent it knows
npx @grampro/kit mcp install --for codex
```

Claude Code, Codex and Cursor each take the same stdio server and differ
only in where the configuration lives and what format it is in. This writes
`.mcp.json`, `.codex/config.toml` and `.cursor/mcp.json` respectively,
merging into whatever is already there and leaving other servers alone.

It is worth preferring over editing those files by hand, which is how this
goes wrong: PowerShell's `Out-File -Encoding utf8` adds a byte-order mark,
and every JSON parser then rejects the file with an error naming the first
character and explaining nothing. This writes UTF-8 without a BOM and with
LF endings, and strips a BOM from a file that already has one.

It writes to the project root — the nearest folder above you with a `.git`
or a `package.json` — and prints which one it chose. An agent reads these
files from the folder it has open, so running the command from a
subdirectory would have written somewhere nothing ever looks while still
reporting success.

It also now says what has to happen next, because writing the file is not
the same as loading the server. A `.mcp.json` server is project-scoped and
Claude Code asks before trusting one, so it sits at `Pending approval` until
you agree; and the configuration is read when a session starts, so an editor
window that was already open sees nothing until it reloads. Installing at
user scope — `claude mcp add -s user grampro -- npx -y @grampro/kit mcp` —
skips both, at the cost of not being shareable through a commit.

### Changed

**Reading a Figma design no longer downloads the whole file.**

Figma charges for file reads by the size of the response, and the frame
listing was fetching the entire document — 710 KB on the file this was
tested against — to answer a question about one screen. Two of those in a
row is what earns a 429, and the lockout is long: a `Retry-After` of 395274
was observed on a single token.

The listing now uses `depth=1`, which returns the document's outline rather
than its contents, and the chosen frame is fetched by id. A URL that already
carries a `node-id` — what Figma copies when you right-click a frame — goes
straight there in one call. Responses are still held for five minutes, so
the usual list-then-read flow costs one outline and one frame.

If a token is already rate limited, the Figma plugin export route still
works; it reads the scene graph from inside Figma and never calls the API.

**The MCP server starts in about the time an empty Node process takes.**

An agent spawns the server once per session, and it was loading the CLI's
own dependencies first — `fs-extra` and `yargs`, roughly 70ms, and of no use
to a JSON-RPC loop. The `mcp` command is now routed before they load.

The passports are also indexed on the first question rather than re-read
from disk for each one.

### Fixed

**`Select`'s `closeOnSelect` was documented backwards, in both directions.**
Its description read "Keep the list open after choosing. Default false."
while the code defaults it to `true` and closing is what the prop does. An
agent reading that passport would have had both the behaviour and the
default inverted - the failure mode that makes a wrong description worse
than a missing one. MultiSelect's was already right.

**Description coverage was measured against a denominator nobody could
move.** It counted every prop, including the HTML and ARIA attributes that
arrive through `extends ButtonHTMLAttributes` - 390 of the 507 undescribed
props were those. So Button sat at 31% with its entire own API documented
bar one prop, and eleven components stayed under the 40% threshold with
nothing left to write. A gate that cannot be satisfied by doing the work it
asks for gets ignored.

It now measures the props the library authors, excluding inherited
attributes and the handful whose meaning is library-wide (`className`,
`style`, `ref` and friends) rather than restating them 27 times. On that
measure the library is at 87% and the weakest component at 75%, so the
threshold moves from 40 to 75 - a floor rather than an aspiration.
**The rate-limit message no longer promises that waiting a minute will
help.** It said to try again shortly, which is wrong for a cost-based limit
whose window runs to tens of minutes or longer. It now passes Figma's own
`Retry-After` through as given, without asserting a unit — the value has
been seen in a range where seconds and milliseconds differ by three orders
of magnitude — and points at the plugin route, which cannot be rate limited.

## 2.4.4

### Added

**An MCP server, so an agent can ask about a component instead of recalling
it.**

```bash
npx @grampro/kit mcp
```

Seven tools: `list_components`, `get_component`, `get_example`,
`get_guidance`, `figma_frame`, `install_component` and `validate_usage`. The
catalogue is 280 KB of passports and a page needs two or three components,
which is the argument for answering on demand rather than pasting a document
into the prompt.

`validate_usage` is the one that earns its place. A page written from
passports alone compiled on the first attempt apart from a single prop the
model had remembered from elsewhere — every type, union value and handler
signature the passports carried came out right. So the remaining failure
mode is invention, and that is what this checks.

No dependencies: MCP is newline-delimited JSON-RPC over stdio, and a server
shipped inside a library every consumer installs should not drag an SDK
along with it.

Marked beta — the tools work and are tested, but their names and shapes may
change.

## 2.4.3

### Fixed

**`passport --check` reported every component as stale on a machine whose
line endings differed from the one that generated the passport.**

A passport records a hash of the source it was derived from, and that hash
was taken over the file bytes exactly as they sat on disk. A checkout on
Windows holds CRLF and one on Linux holds LF, so the same unchanged file
produced two different hashes, and the check announced that all 27
components had drifted when nothing had changed at all.

It now normalises line endings before hashing, so the hash describes the
content rather than the checkout. If you have been seeing

```
passport stale - source changed since the passport was generated
```

on components you never touched, this is why, and it stops.

Running `npm run passport` once after upgrading rewrites the hashes in your
own copies.

## 2.4.2

### Fixed

**Your own class now beats a component's variant.**

Restyling a variant used to fail silently. A rule like

```css
.btn-brand { --bt-fill: #7c3aed; }
```

worked on a plain button and was ignored the moment anyone wrote
`variant="outline"`, because the shipped rule named two things
(`.bt-root[data-variant="outline"]`) where yours named one, and the browser
prefers the more specific selector. No error, nothing in devtools -- the
colour simply did not apply.

Selectors that carry an option you chose -- `variant`, `size`, `orientation`,
`appearance`, `placement` and the rest -- are now written so they add no
weight of their own. One class from you is enough, on any variant, in any
setup:

```tsx
<Button variant="outline" className="btn-brand">Save</Button>
```

**State deliberately still wins.** Disabled, invalid, selected, loading and
the other runtime states keep their weight, because a brand colour has no
business painting over a disabled control. To restyle a state, name the
state: `.btn-brand[data-disabled] { ... }`.

215 selectors across 26 stylesheets. Verified by capturing the computed
styles of 3,716 elements across every demo in light and dark before and
after: the only differences were opacity on the shimmer and spinner, which
differ between two runs of the same build because they are mid-animation.
Nothing else moved.

Nothing in your code needs to change. If you had already worked around this
with a more specific selector, that still wins.

## 2.4.1

### Fixed

**The stylesheet import printed after an install is now one you can paste.**

2.4.0 could put the components under `src/`, and printed the path to the
barrel from the project root -- which is correct from nowhere in particular.
In a Next.js app it read:

```css
@import "./src/component-lib/gbs.css" layer(components);
```

while the file to edit was `src/app/globals.css`, two directories away. You
had to work out the `../` yourself.

The installer now finds your global stylesheet in the usual places
(`src/app/globals.css`, `app/globals.css`, `src/styles/globals.css`,
`src/index.css` and friends), names it, and writes the path from there:

```
Add this to src/app/globals.css:

  @import "tailwindcss";
  @import "../component-lib/gbs.css" layer(components);
```

Where no stylesheet is found it falls back to the path from the project root,
as before. The header inside the generated `gbs.css` follows the same rule.

Nothing about the installed components changed; this is the installer's
output only.

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
