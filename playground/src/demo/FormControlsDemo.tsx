/*
 * FormControls, every behaviour the docs document.
 *
 * These are the documented examples themselves, not copies: each file lives
 * in docs-site/app/components/examples and is rendered on the matching doc
 * page too. Keeping one copy is the point -- the playground used to hold a
 * richer version than the docs, and nobody noticed the docs had fallen
 * behind.
 *
 * Add a behaviour by adding an example file and listing it here; it shows up
 * in both places.
 */
import SwitchVariants from "@/examples/SwitchVariantsWrapper";
import RadioGroupVariants from "@/examples/RadioGroupVariantsWrapper";
import RadioGroupCards from "@/examples/RadioGroupCardsWrapper";
import NumberInputVariants from "@/examples/NumberInputVariantsWrapper";
import NumberInputCurrency from "@/examples/NumberInputCurrencyWrapper";

const card =
  "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950";
const cardTitle = "mb-3 text-sm font-semibold";

const PANELS = [
  { title: "Switch", Panel: SwitchVariants },
  { title: "RadioGroup", Panel: RadioGroupVariants },
  { title: "RadioGroup cards", Panel: RadioGroupCards },
  { title: "NumberInput", Panel: NumberInputVariants },
  { title: "NumberInput locales and units", Panel: NumberInputCurrency },
];

export function FormControlsDemo() {
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
