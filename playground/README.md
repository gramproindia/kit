# Playground

Where the components are developed and broken on purpose. It is a Vite app
that imports the library from source, so a change to a component shows up here
immediately — no build, no install step, no published package in between.

This is not an example app and it is not documentation. The documented,
runnable examples live in `docs-site/`; this is the workbench.

```bash
pnpm dev          # localhost:5173
pnpm test         # unit tests (node, no browser)
pnpm test:e2e     # browser tests, starts Vite itself
pnpm test:all     # both
```

`pnpm test` from the repository root runs the unit layer here, which is what
`prepublishOnly` gates a release on.

## What is in here

| Path | What it is |
| --- | --- |
| `src/demo/` | Scratch screens for exercising a component by hand. |
| `src/webmcp/` | The browser-agent surface, driven against a real grid. |
| `tests/` | Browser tests and accessibility checks — see [`tests/README.md`](tests/README.md). |
| `installer/` | A copy of the CLI carrying the changes `shared/` needs, with its own [`CHANGES.md`](installer/CHANGES.md). |

Most unit tests do not live here. Vitest runs from this folder but collects
from the library itself — `source/**/__tests__` and `tools/**/__tests__` — so
a component's tests sit beside the component. What remains under `src/` is the
integration layer: the tests that need a real app around them, such as driving
a live DataGrid through the registered WebMCP tool. The globs are in
[`vite.config.ts`](vite.config.ts).
