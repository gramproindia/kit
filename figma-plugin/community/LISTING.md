# Figma Community listing

Copy for the publish flow, and the assets beside it. Publishing a free plugin
costs nothing; the only toll is review, which has no committed turnaround.

Regenerate the art with `node community/make-assets.mjs` from the plugin
folder. Editing the script is how the art changes — the PNGs are output, not
source.

| File | Where it goes | Size |
| --- | --- | --- |
| `icon.png` | Icon | 128 × 128 |
| `cover.png` | Cover art / thumbnail | 1920 × 1080 |

---

## Before you open the publish flow

- **Figma desktop app** on macOS or Windows. The browser cannot publish.
- **Two-factor authentication enabled** on the Figma account. Publishing is
  blocked without it, and it is the step most likely to stop you mid-flow.
- The plugin imported and working: **Plugins → Development → Import plugin
  from manifest…**, pick `figma-plugin/manifest.json`.
- Run all three commands once in a scratch file. Reviewers run what you
  ship, and the export commands are the ones most likely to be tried.

---

## Name

```
Grampro Kit — Design System Generator
```

This matches the manifest, so the development menu and the Community listing
agree. It only names half of what the plugin does — the tagline carries the
rest, which is the right division when the name is also the search term.

If you would rather lead with the part nothing else does:

```
Grampro Kit — Design System & Agent Export
```

Whichever you choose, set `name` in `manifest.json` to match.

---

## Tagline

```
Generate a full design system in Figma, then hand every screen to your coding agent.
```

---

## Description

```
Grampro Kit builds a complete, production-shaped design system inside Figma
— and then gets it out again, in a form a coding agent can act on.

**Generate design system**

One command produces the whole kit:

• 53 variables across Light and Dark modes — colour, size, radius
• 13 text styles
• 38 component sets, with real variants: Button (42), Input (16), DataGrid
  cells, Modal, Dialog, Toast, Menu, Tabs, Checkbox, Radio, Switch, Select,
  Date field, Upload, Alert, Badge, Avatar, Progress, Skeleton and more
• Organised across seven pages, ready to publish as a team library

Every component is laid out with auto-layout and bound to variables, so
switching the Color mode to Dark re-themes the whole file.

**Export all screens for an agent**

Walks every page and exports each screen as structured JSON, with one set
of theme values read across the whole design rather than guessed per frame.
Save it into your project and split it into a folder:

  npx @grampro/kit design ./design.json

  design/
    purchase-orders.json
    suppliers.json
    index.json          every screen, the shared theme, the regions that repeat

An agent reads index.json to plan, then builds one screen at a time.

**Export selection for an agent**

The same thing, scoped. Select one frame for one screen, or several for
several — useful when a file holds forty screens and you are building two.

**What the export carries**

Structure, text, auto-layout, sizes and borders; the component instances and
their variant properties where a screen was built from a library; and the
colours, radii and font sizes the design actually uses. Rows that repeat come
back once with their structure and once per row with their text, which is
both smaller and closer to what a table component wants.

It needs no API token and never calls Figma's REST API, so it works on any
file you can open and cannot be rate limited.

**Privacy**

The plugin makes no network requests of any kind. Nothing about your file
leaves Figma — the export is shown for you to copy or save. The manifest
declares no allowed domains, which you can verify in the source.

Free and open source: https://github.com/gramproindia/kit
Documentation: https://kit.gramproindia.com/mcp-server
```

## The rest of the form

| Field | Value |
| --- | --- |
| Category | Design systems *(fall back to Libraries, then Utilities)* |
| Playground file | Optional. A file with the kit already generated shows it off. |
| Carousel | Optional, up to nine. The two panels of the cover work as stills. |
| Support contact | `https://github.com/gramproindia/kit/issues` |
| Paid | **Off.** |
| Network access label | It should read as no network access — the manifest declares `"allowedDomains": ["none"]`. |

---

## Tags

Figma's tag field is free text; these are the phrases people search.

```
design system, design tokens, variables, components, component library,
design to code, figma to react, react, tailwind, coding agent, AI, MCP,
export, developer handoff, dark mode
```

---

## After you submit

- Review has no fixed timeline; reports range from about a week to a month.
  No network access is the single biggest thing in your favour.
- **Figma assigns the published plugin a numeric id on first publish**, which
  replaces `grampro-kit-design-system-generator` in the manifest. Commit the
  manifest afterwards so later updates publish to the same listing rather
  than creating a second one.
- A rejection can be addressed and resubmitted. Material updates are
  re-reviewed.
- Once it is live, replace the import-from-source instructions in the docs
  with the Community link.
