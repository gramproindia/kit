# GramproKit MCP server

Serves the component catalogue to a coding agent, so it writes against the
real contract instead of recalling one.

```bash
claude mcp add grampro -- npx -y @grampro/kit mcp
```

Codex, Cursor and anything else that speaks MCP take the same command; it is a
stdio server with no configuration.

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
| `get_guidance` | Authored notes on forms, overlays, data-grid, pickers, styling, accessibility |
| `figma_frame` | Which nodes in a Figma selection are kit components, what to install, and which theme variables the design maps onto |
| `validate_usage` | Whether JSX you have written matches the passports |

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

The design half does not go through this server. Figma knows its own file;
asking it through the REST API would mean guessing at a schema that changes.
Instead the kit's Figma plugin exports the selection, because inside Figma the
scene graph is typed and the compiler checks every field name.

1. In Figma, select a frame and run **Grampro Kit → Export selection for an
   agent**. It condenses the selection: structure, which nodes are instances
   of kit components, the text, and the values worth turning into theme
   variables. Vector geometry and absolute coordinates are dropped — they
   bury the useful part.
2. Paste that JSON into `figma_frame`.
3. It answers with the components to install, the `--gbs-*` variables the
   design's own colours and radii map onto, and the structure to translate.

It does not write the code. An agent with the passports to hand and
`validate_usage` to check itself writes better JSX than a tool guessing at a
layout it cannot see rendered. Anything in the design that is not a kit
component is reported as unmapped rather than approximated.

## Suggested use

Tell the agent to call `get_component` before writing JSX for a component,
and `validate_usage` on what it wrote before reporting back. Both are cheap,
and together they close the gap between code that looks right and code that
compiles.

## Notes

No dependencies. MCP is newline-delimited JSON-RPC over stdio, which is a few
hundred lines, and a server shipped inside a library that every consumer
installs should not drag an SDK along with it.

The catalogue it serves is the one in this package, not the components copied
into your project — so an agent can see a component before you install it,
and `npx @grampro/kit add <Name>` puts it in place.
