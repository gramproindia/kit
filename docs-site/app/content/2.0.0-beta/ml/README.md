# Malayalam translations (മലയാളം)

Translated docs for the 2.0.0 beta site. Served at `/2.0.0-beta/ml/<slug>`.

## How to add one

1. Copy the English file from the folder above, e.g. `../button.mdx`, to this
   folder with the **same file name**: `button.mdx`.
2. Translate the prose. Leave code blocks, component names, prop names and CSS
   variables (`--gbs-*`) as they are.
3. In the frontmatter keep only `title` and `description`, translated:

   ```yaml
   ---
   title: "ബട്ടൺ"
   description: "ഒറ്റവരി വിവരണം."
   ---
   ```

   `group` and `order` are read from the English file, so both languages always
   have the same pages, in the same groups, in the same order. Anything else you
   put here is ignored.
4. Keep the same headings in the same order where you can: the table of contents,
   in-page links and search are all built from them.

Pages without a file here still work — they show the English text with a note
saying the page is not translated yet. Nothing else needs changing: navigation,
search, the `.md` version and the language switcher pick the file up on the next
build.

Adding another language: see `app/2.0.0-beta/_lib/i18n.ts` and `strings.ts`.
