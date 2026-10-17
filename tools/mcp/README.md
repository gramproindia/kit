# GramproKit MCP server — beta

Serves the component catalogue to a coding agent, so it writes against the
real contract instead of recalling one.

> **Beta.** The tools work and are tested, but their names and shapes may
> change before this settles.

## Setup

```bash
npx @grampro/kit mcp install
```

That writes the configuration for every agent it knows about — Claude Code,
Codex and Cursor — and tells you which files it touched. Restrict it with
`--for codex` (or `claude`, `cursor`, or a comma-separated list).

It is worth using rather than editing the files by hand: it writes UTF-8
without a byte-order mark and with LF endings, which is the one thing that
reliably goes wrong. PowerShell's `Out-File -Encoding utf8` adds a BOM, and
every JSON parser then rejects the file with an error that names the first
character and explains nothing.

Running it again is safe. It merges into whatever is already there, leaves
other servers alone, and says `unchanged` when there is nothing to do.

It writes to the project root — the nearest folder up from you with a `.git`
or a `package.json` — and prints which one it chose, because an agent reads
these files from the folder it has open and writing to a subdirectory is the
one way this can quietly do nothing.

### If the server does not appear

The file being written is not the same as the server being loaded, and in
Claude Code two things stand between them.

**It needs approving.** A `.mcp.json` server is project-scoped, and Claude
Code asks before trusting one — until you say yes it sits at `Pending
approval`, and nothing asks twice. `claude mcp reset-project-choices` brings
the prompt back if it was dismissed.

**It needs a fresh session.** The configuration is read when a session
starts, so an editor window that was already open sees nothing. In the VS
Code extension, run *Developer: Reload Window*.

`/mcp` lists the servers and their state, which is the quickest way to tell
"not configured" from "configured, not approved".

To skip both, install it for yourself rather than for the project:

```bash
claude mcp add -s user grampro -- npx -y @grampro/kit mcp
```

User scope lives in `~/.claude.json`, loads in every project, and needs no
approval because it is yours rather than the repository's. Project scope is
the better choice when you want the rest of the team to get it from a commit.

### What it writes

| agent | file | format |
| --- | --- | --- |
| Claude Code | `.mcp.json` | `mcpServers.grampro` |
| Codex | `.codex/config.toml` | `[mcp_servers.grampro]` |
| Cursor | `.cursor/mcp.json` | `mcpServers.grampro` |

The Codex config is project-scoped. For every project instead, put the same
`[mcp_servers.grampro]` block in `~/.codex/config.toml`.

A project that already has the package installed gets a direct `node`
invocation; anywhere else the config uses `npx -y @grampro/kit mcp`, which
works without an install but re-resolves the package on every start.

### By hand, if you prefer

```bash
claude mcp add grampro -- npx -y @grampro/kit mcp
```

```toml
# ~/.codex/config.toml
[mcp_servers.grampro]
command = "npx"
args = ["-y", "@grampro/kit", "mcp"]
```

MCP servers are not invoked by name. There is no `/grampro`; the model calls
the tools itself when they are relevant. In Claude Code, `/mcp` shows whether
the server connected.

## Why

An agent asked to build a page has two ways to learn a component's API: read
the source, which costs a great deal of context and still invites invention,
or be told. This tells it — one component at a time, from the passport that
was generated from the source and so cannot drift from it.

The catalogue is 280 KB of passports. A page needs two or three components,
which is a few KB. That difference is the whole argument for a server over a
document pasted into the prompt.

## Tools

| tool | what it answers |
| --- | --- |
| `list_components` | What exists, and what each one is for |
| `get_component` | Props with types and allowed values, which are required, handler signatures, slots, states, composition rules |
| `get_example` | Working usage from the component's README |
| `get_guidance` | Authored notes on forms, overlays, the grid, pickers, styling, accessibility |
| `figma_frame` | A design's structure, text, repeated regions and theme variables, from a `designFile` path, a pasted `design`, or a Figma `url` |
| `install_component` | Copies components into the project being worked in |
| `validate_usage` | Whether the JSX an agent wrote matches the passports |

`validate_usage` is the one that earns its place. In the experiment that
justified building this, a page written from passports alone compiled on the
first attempt apart from a single prop the model had remembered from
elsewhere rather than read here. Every type, union value and handler
signature the passport carried came out right. So the remaining failure is
invention, and this catches it:

```
<Alert variant="info" title="Hi" dismissible onDismiss={…} />

  dismissible — not a prop of this component. Did you mean: onDismiss
```

## A whole design at once

Install [Grampro Kit from the Figma Community](https://www.figma.com/community/plugin/1692828324805361551).

> The listing is in review, which Figma is quoting at a few weeks. Until it
> clears: clone the repository and, in the Figma **desktop** app, use
> **Plugins → Development → Import plugin from manifest...** on
> `figma-plugin/manifest.json`. The build is committed, so there is nothing
> to compile.

Then
**Grampro Kit → Export all screens for an agent** walks every
page and exports each top-level frame, with one set of theme values read
across the whole design rather than guessed per frame. Save it, then:

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

A browser cannot write a directory and a plugin is an iframe, so the
plugin hands over one file and the CLI does the filesystem work. Each
screen is written in the shape a single-frame export has, so `figma_frame`
reads one with `designFile` and no special case.

`index.json` is the plan: every screen with its size, node count and
repeated regions, plus the shared theme. Have an agent map regions to
components from that and correct it before any code exists — a guess that
`Action` is a Card rather than a Button costs one sentence there and five
screens of rework later. Then build one screen at a time, validating each.

## From a Figma design

Three routes, and only the first needs credentials.

**By URL.** Pass a `figma.com/design/...` link. Called with just the URL it
lists the frames in the file; called again with `frame` it returns that
screen. A link that already carries a `node-id` — which is what Figma copies
when you right-click a frame — skips straight to that frame in one call.
Needs a token.

**By plugin export.** In Figma, run **Grampro Kit → Export selection for an
agent**, then pass the JSON as `design`. The plugin reads the scene graph
directly, so this works on any file you can open, asks for no token, and
never touches the REST API — which also means it cannot be rate limited.

**By file.** Press **Save .json** in that panel and pass the path as
`designFile`. Prefer this for anything but a small frame: a chat input
caps at around fifty thousand characters, and a pasted export sits in the
conversation twice — once as the argument, again inside the tool call —
where a file appears only in the answer.

Either way the answer is the same shape: the structure, the text, the
regions whose names repeat — eight `Status cell` nodes are a column — and
the `--gbs-*` variables the design's own colours and radii map onto.

It does not decide which component each region is. A design drawn without
the component library has no component instances to look up, so that call is
inference, and an agent holding the catalogue and the designer's own names
infers better than string matching in a tool. What is not a kit component is
reported as such rather than approximated.

Colours are given roles rather than ranked. The most-used colour in a design
is the body text, and a near-black navy scores high on saturation, so both
"most common" and "most saturated" pick the wrong thing. Lightness and
saturation together find the accent.

### Rate limits

Figma's limits on file reads are cost-based, and the cost is the size of the
response. Asking for a whole file to answer a question about one frame is
what earns a 429, and the lockout is long — a `Retry-After` of 395274 has
been observed on a single token.

So nothing here fetches a whole file. Listing the frames uses `depth=1`,
which returns the document's outline rather than its contents, and the frame
itself is then fetched by id. A URL carrying a `node-id` skips the listing
altogether. Responses are held for five minutes, so the natural two-call
flow — list, then read — costs one listing and one frame.

If a token is already locked out, the plugin export route still works.

## Credentials

The URL route needs a Figma personal access token. Store it where the
operating system keeps credentials:

```bash
npx @grampro/kit secret set figma
```

It prompts, with the echo off, and never takes the value as an argument —
arguments land in shell history and in every process listing on the machine.
Piping works too, for a script: `echo "$TOKEN" | npx @grampro/kit secret set figma`.

| platform | where it goes |
| --- | --- |
| Windows | Data Protection API, tied to your Windows account |
| macOS | the keychain |
| Linux | Secret Service (GNOME Keyring, KWallet) |
| anything else | a 0600 file in your config directory, and it says so |

`secret list` shows what is stored, masked, and names the backend in use.
`secret remove figma` deletes it. Create the token at Figma → Settings →
Security → Personal access tokens, with `File content: read` and nothing
else.

The token is read from `FIGMA_TOKEN` in the environment first, then the
store, then a `.env` — the last only so that an upgrade does not break a
project set up the old way. Reading from a `.env` prints a note saying to
move it. A credential in a file inside a working tree is one `git add -A`
away from being published, which is why this moved.

## Suggested use

Tell the agent to call `get_component` before writing JSX for a component,
and `validate_usage` on what it wrote before reporting back. Both are cheap,
and together they close the gap between code that looks right and code that
compiles.

## Notes

No dependencies. MCP is newline-delimited JSON-RPC over stdio, which is a
few hundred lines, and a server shipped inside a library that every consumer
installs should not drag an SDK along with it.

Start-up is about the cost of an empty Node process. An agent spawns the
server once per session, and `index.cjs` routes `mcp` before loading the
CLI's own dependencies, which are no use to a JSON-RPC loop and cost around
70ms. The passports are indexed on the first question and not re-read after.

The catalogue it serves is the one in this package, not the components
copied into your project — so an agent can see a component before you
install it, and `install_component` puts it in place.
