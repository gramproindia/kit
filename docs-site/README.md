# GramproKit documentation site

The source of [kit.gramproindia.com](https://kit.gramproindia.com). Next.js
App Router, MDX content, no CMS.

```bash
pnpm install
pnpm dev          # localhost:3000
pnpm build        # production build, 215 static pages
pnpm check:anchors   # every in-page #fragment resolves
```

## Where things are

| Path | What it holds |
| --- | --- |
| `app/content/2.0.0-beta/` | Every 2.x page, as MDX. `ml/` is the Malayalam translation. |
| `app/(main)/_components/` | The MDX component map, the live-demo runtime, the video and diagram components. |
| `app/(main)/_lib/` | Frontmatter loading, heading slugs, and the Markdown conversion behind `llms.txt`. |
| `scripts/generate-demos.mjs` | Builds the live examples from the library source. Runs before `dev` and `build`. |
| `scripts/build-diagrams.mjs` | Renders the architecture diagrams to webp, light and dark. |
| `public/diagrams/` | Generated — edit the script, not these files. |

The library itself is imported from `../source/components`, not copied, which
is why `next.config.ts` sets the Turbopack root to the repository rather than
this folder.

## Pages are also Markdown

Adding `.md` to any page URL serves it as plain Markdown, and `/llms.txt` and
`/llms-full.txt` are generated from the same frontmatter at build time. That
conversion lives in `app/(main)/_lib/markdown.ts`.

It has to be taught about any new MDX component. A component it does not
recognise is passed through as a literal JSX tag, so the Markdown copy ends up
carrying `<YourComponent />` where the content should be — invisible to every
model that reads the site. If you add a component that renders content, add a
case for it there and check `llms-full.txt` afterwards.
