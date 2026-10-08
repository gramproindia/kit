"use client";

import { useEffect, useState } from "react";
import { MultiSelect, type ComboboxOption } from "@/components/combobox";
import { searchEmployees } from "./_combobox-data";

/*
 * Options that live on a server.
 *
 * The component reports the search text (debounced 250ms) and asks for more
 * while scrolling; the application owns the fetching. Three behaviours worth
 * watching: stale requests are aborted, chosen names keep their labels after
 * the result set changes beneath them, and `loading` is derived rather than
 * set in the effect — so there is no synchronous setState on every keystroke.
 */

interface Query {
  search: string;
  page: number;
}

const NO_OPTIONS: ComboboxOption<number>[] = [];

export default function SelectServerWrapper() {
  const [query, setQuery] = useState<Query>({ search: "", page: 0 });
  const [result, setResult] = useState<{
    query: Query;
    options: ComboboxOption<number>[];
    hasMore: boolean;
  } | null>(null);
  const [people, setPeople] = useState<number[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    searchEmployees(query.search, query.page, controller.signal).then(
      (response) => setResult({ query, ...response }),
      () => {},
    );
    return () => controller.abort();
  }, [query]);

  // Derived: the result we hold is for an older query, so we are still waiting.
  const loading = result?.query !== query;

  return (
    <div className="flex flex-col gap-3">
      <MultiSelect<number>
        label="Team members"
        mode="server"
        options={result?.options ?? NO_OPTIONS}
        hasMore={result?.hasMore}
        loading={loading}
        onSearchChange={(term) => setQuery({ search: term, page: 0 })}
        onLoadMore={() =>
          !loading && setQuery((previous) => ({ ...previous, page: previous.page + 1 }))
        }
        value={people}
        onChange={setPeople}
        placeholder="Search 2,000 employees"
        emptyMessage="No employee matches that search"
        maxVisibleTags={2}
      />
      <p className="text-xs text-(--v2-muted)">
        Selected ids: {people.length > 0 ? people.join(", ") : "none"}
      </p>
    </div>
  );
}
