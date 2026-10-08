import type { ComboboxOption } from "@/components/combobox";

/*
 * Shared fixtures for the Combobox examples.
 *
 * Kept out of the example files so each one shows only the thing it is
 * demonstrating — a reader looking at "Server options" should not scroll past
 * seventeen countries first. The leading underscore keeps it out of the
 * `*Wrapper.tsx` glob the demo generator scans.
 */

export const COUNTRIES: ComboboxOption[] = [
  { value: "in", label: "India", group: "Asia", keywords: ["bharat"] },
  { value: "jp", label: "Japan", group: "Asia" },
  { value: "kr", label: "South Korea", group: "Asia" },
  { value: "sg", label: "Singapore", group: "Asia" },
  { value: "ae", label: "United Arab Emirates", group: "Asia" },
  { value: "de", label: "Germany", group: "Europe", description: "Berlin" },
  { value: "fr", label: "France", group: "Europe", description: "Paris" },
  { value: "es", label: "Spain", group: "Europe", description: "Madrid" },
  { value: "se", label: "Sweden", group: "Europe", description: "Stockholm" },
  { value: "uk", label: "United Kingdom", group: "Europe", description: "London" },
  { value: "us", label: "United States", group: "Americas" },
  { value: "ca", label: "Canada", group: "Americas" },
  { value: "br", label: "Brazil", group: "Americas" },
  { value: "mx", label: "Mexico", group: "Americas", disabled: true },
  { value: "ng", label: "Nigeria", group: "Africa" },
  { value: "za", label: "South Africa", group: "Africa" },
  { value: "au", label: "Australia", group: "Oceania" },
];

export const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Sales",
  "Marketing",
  "Finance",
  "Support",
];

export const DEPARTMENT_OPTIONS: ComboboxOption[] = DEPARTMENTS.map((d) => ({
  value: d,
  label: d,
}));

/** Ten thousand options, to show that the list virtualizes on its own. */
export const CITY_OPTIONS: ComboboxOption[] = Array.from({ length: 10_000 }, (_, i) => ({
  value: `city-${i}`,
  label: `City ${i + 1}`,
  description: i % 3 === 0 ? "Regional office" : undefined,
}));

/* ------------------------------------------------- a stand-in for a backend */

const FIRST = ["Ava", "Liam", "Noah", "Emma", "Olivia", "Mateo", "Aarav", "Sofia", "Yuki", "Zara"];
const LAST = ["Smith", "Garcia", "Kim", "Patel", "Muller", "Rossi", "Silva", "Nguyen", "Cohen", "Okafor"];

/** Generated without randomness, so the docs look the same on every load. */
const DIRECTORY = Array.from({ length: 2_000 }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 7) % LAST.length];
  return {
    id: i + 1,
    name: `${first} ${last}`,
    email: `${first}.${last}${i + 1}@example.com`.toLowerCase(),
    department: DEPARTMENTS[(i * 5) % DEPARTMENTS.length],
  };
});

const PAGE_SIZE = 20;

/**
 * Stands in for an API: search and paging, with enough latency that the
 * loading and abort behaviour is visible rather than theoretical.
 */
export function searchEmployees(search: string, page: number, signal: AbortSignal) {
  return new Promise<{ options: ComboboxOption<number>[]; hasMore: boolean }>((resolve, reject) => {
    const timer = setTimeout(() => {
      const term = search.trim().toLowerCase();
      const matches = term
        ? DIRECTORY.filter((e) =>
            `${e.name} ${e.email} ${e.department}`.toLowerCase().includes(term),
          )
        : DIRECTORY;
      const slice = matches.slice(0, (page + 1) * PAGE_SIZE);
      resolve({
        options: slice.map((employee) => ({
          value: employee.id,
          label: employee.name,
          description: `${employee.department} · ${employee.email}`,
        })),
        hasMore: matches.length > slice.length,
      });
    }, 320);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}
