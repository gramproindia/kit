/*
 * DatePicker, every behaviour the docs document.
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
import DatePickerVariants from "@/examples/DatePickerVariantsWrapper";
import DatePickerLimits from "@/examples/DatePickerLimitsWrapper";
import DateRangePickerVariants from "@/examples/DateRangePickerVariantsWrapper";
import DatePickerForm from "@/examples/DatePickerFormWrapper";

const card =
  "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950";
const cardTitle = "mb-3 text-sm font-semibold";

const PANELS = [
  { title: "Basic", Panel: DatePickerVariants },
  { title: "Limits and blocked days", Panel: DatePickerLimits },
  { title: "Range", Panel: DateRangePickerVariants },
  { title: "In a form", Panel: DatePickerForm },
];

export function DatePickerDemo() {
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
