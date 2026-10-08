/*
 * Select and MultiSelect, every behaviour the docs document.
 *
 * These are the documented examples themselves, not copies: each file lives
 * in docs-site/app/components/examples and is rendered on the Combobox page
 * too. Keeping one copy is the point — the playground used to hold a richer
 * version than the docs, and nobody noticed the docs had fallen behind.
 *
 * Add a behaviour by adding an example file and listing it here; it shows up
 * in both places.
 */
import SelectBasic from "@/examples/SelectWrapper";
import MultiSelectBasic from "@/examples/MultiSelectWrapper";
import SelectOptions from "@/examples/SelectOptionsWrapper";
import SelectServer from "@/examples/SelectServerWrapper";
import SelectCreatable from "@/examples/SelectCreatableWrapper";
import SelectForm from "@/examples/SelectFormWrapper";

const card =
  "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950";
const cardTitle = "mb-3 text-sm font-semibold";

const PANELS = [
  { title: "Basic", Panel: SelectBasic },
  { title: "Multi-select", Panel: MultiSelectBasic },
  { title: "Options: groups, descriptions, 10,000 rows", Panel: SelectOptions },
  { title: "Server options", Panel: SelectServer },
  { title: "Creating options", Panel: SelectCreatable },
  { title: "Inside a form", Panel: SelectForm },
];

export function SelectDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {PANELS.map(({ title, Panel }) => (
        <section key={title} className={card}>
          <h2 className={cardTitle}>{title}</h2>
          <Panel />
        </section>
      ))}
    </div>
  );
}
