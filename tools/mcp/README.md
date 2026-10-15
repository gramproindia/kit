# GramproKit MCP server — beta

Serves the component catalogue to a coding agent, so it writes against the
real contract instead of recalling one.

> **Beta.** The tools work and are tested, but their names and shapes may
> change before this settles. The Figma token handling in particular is not
> where it should be — see *Credentials* below.

```bash
claude mcp add grampro -- npx -y @grampro/kit mcp
```

Codex, Cursor and anything else that speaks MCP take the same command; it is
a stdio server with no configuration. Without the CLI, write `.mcp.json` in
your project:

```json
{
  "mcpServers": {
    "grampro": {
      "command": "node",
      "args": ["node_modules/@grampro/kit/index.cjs", "mcp"]
    }
  }
}
```

MCP servers are not invoked by name. There is no `/grampro`; the model calls
the tools itself when they are relevant. Use `/mcp` to check the server is
connected.

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
| `figma_frame` | A design's structure, text, repeated regions and theme variables |
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

## From a Figma design

Two routes, and the second needs no credentials.

**By URL.** Pass a `figma.com/design/...` link. Called with just the URL it
lists the frames in the file; called again with `frame` it returns that
screen. Needs a token.

**By plugin export.** In Figma, run **Grampro Kit → Export selection for an
agent**, then pass the JSON as `design`. The plugin reads the scene graph
directly, so this works on any file you can open and asks for no token at
all.

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

## Credentials

**This is the weakest part of the current design, and it is temporary.**

The URL route reads `FIGMA_TOKEN` from the environment, or from a `.env`
file beside the project. That means a long-lived credential sitting in a
file, which is not where it belongs.

A future release will keep it in the editor's own secret storage — VS Code's
`SecretStorage` for the extension, and the equivalent elsewhere — so the
token is held by the host rather than the repository. Until then:

- prefer the plugin export route, which needs no token at all;
- if you do use a token, give it only `File content: read`;
- keep `.env` out of version control.

## Suggested use

Tell the agent to call `get_component` before writing JSX for a component,
and `validate_usage` on what it wrote before reporting back. Both are cheap,
and together they close the gap between code that looks right and code that
compiles.

## Notes

No dependencies. MCP is newline-delimited JSON-RPC over stdio, which is a
few hundred lines, and a server shipped inside a library that every consumer
installs should not drag an SDK along with it.

The catalogue it serves is the one in this package, not the components
copied into your project — so an agent can see a component before you
install it, and `install_component` puts it in place.

A Figma file is fetched once and held for five minutes. The natural flow is
two calls, list then read, and refetching a large file in between is what
earns a rate limit.
