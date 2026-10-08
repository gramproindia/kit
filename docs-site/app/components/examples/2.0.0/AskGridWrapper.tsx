"use client";

import { useEffect, useState } from "react";
import { createColumnHelper, DataGrid } from "@/components/data-grid";
import { GramproAIProvider, type AgentAdapter } from "@/components/shared";

/*
 * The "Asking in Words" demo.
 *
 * The adapter posts to this site's own `/api/ask`, which holds the API key and
 * builds the prompt. That split is the point of the demo as much as the typing
 * is: a model key in client JavaScript is readable by every visitor, so it has
 * to live on a server the application owns.
 *
 * With no key configured the provider gets `null`, the ask box does not render,
 * and the grid below is the grid you would have had anyway.
 */

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  country: string;
  salary: number;
  rating: number;
  startDate: string;
  active: boolean;
}

const FIRST = ["Ava", "Liam", "Noah", "Emma", "Olivia", "Mateo", "Aarav", "Sofia", "Yuki", "Zara"];
const LAST = ["Smith", "Garcia", "Kim", "Patel", "Muller", "Rossi", "Silva", "Nguyen", "Cohen", "Okafor"];
const DEPARTMENTS = ["Engineering", "Design", "Sales", "Marketing", "Finance", "Support"];
const COUNTRIES = ["India", "United States", "Germany", "Brazil", "Japan", "France"];

/** Generated without randomness, so the docs look the same on every load. */
const rows: Employee[] = Array.from({ length: 60 }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 7) % LAST.length];
  return {
    id: i + 1,
    name: `${first} ${last}`,
    email: `${first}.${last}${i + 1}@example.com`.toLowerCase(),
    department: DEPARTMENTS[(i * 5) % DEPARTMENTS.length],
    country: COUNTRIES[(i * 3) % COUNTRIES.length],
    salary: 42_000 + ((i * 2731) % 150_000),
    rating: 1 + (i % 5),
    startDate: `20${12 + (i % 13)}-${String(1 + (i % 12)).padStart(2, "0")}-14`,
    active: i % 7 !== 0,
  };
});

const col = createColumnHelper<Employee>();
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const columns = [
  col.field("id", { header: "ID", type: "number", width: 70, align: "start" }),
  col.field("name", { header: "Name", width: 170 }),
  col.field("email", { header: "Email", width: 230 }),
  col.field("department", {
    header: "Department",
    width: 140,
    options: DEPARTMENTS.map((d) => ({ label: d, value: d })),
  }),
  col.field("country", { header: "Country", width: 140 }),
  col.field("salary", {
    header: "Salary",
    type: "number",
    width: 120,
    format: (value) => currency.format(value),
  }),
  col.field("rating", { header: "Rating", type: "number", width: 90 }),
  col.field("startDate", { header: "Start date", type: "date", width: 120 }),
  col.field("active", { header: "Active", type: "boolean", width: 90 }),
];

/*
 * What a machine cannot read off a column definition. This is the only
 * hand-written input, and it is where most of the quality comes from — it is
 * what lets "what does she earn" find `salary` and "worst rated" pick a
 * direction.
 */
const SEMANTICS = {
  salary: {
    description: "Gross annual salary.",
    unit: "USD",
    synonyms: ["pay", "compensation", "earnings"],
    higherIsBetter: true,
  },
  rating: {
    description: "Performance rating, 1 to 5.",
    synonyms: ["score", "performance"],
    higherIsBetter: true,
  },
  startDate: { description: "The day they joined.", synonyms: ["joined", "hire date"] },
  department: { synonyms: ["team", "org"] },
  email: { pii: true },
} as const;

/** Email stays readable on screen but is not something a machine may filter on. */
const POLICY = { denyFilter: ["email"], confirmExportRows: 100 } as const;

const SUGGESTIONS = [
  "Show people in Engineering",
  "Who earns over 150k?",
  "Engineering staff, highest paid first",
  "Only active people in Germany",
  "Clear the filters",
];

/** Sends the utterance and this grid's live contract to our own endpoint. */
const askViaDocsBackend: AgentAdapter = async ({ utterance, contract, responseSchema, signal }) => {
  const response = await fetch("/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ utterance, contract, responseSchema }),
    signal,
  });
  const payload = (await response.json()) as { content?: string; error?: string };
  if (!response.ok) throw new Error(payload.error ?? `Request failed: ${response.status}`);

  // Parsed, not repaired: output that is not JSON is a finding, not something
  // to patch over.
  try {
    return JSON.parse(payload.content ?? "");
  } catch {
    throw new Error("The model did not return JSON.");
  }
};

export default function AskGridWrapper() {
  const [ready, setReady] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/ask")
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((d: { available?: boolean }) => live && setReady(d.available === true))
      .catch(() => live && setReady(false));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {ready === false && (
        <p className="text-sm text-(--v2-muted)">
          This deployment has no model key, so the ask box is hidden — which is exactly what
          your app does until you configure an adapter. The grid below is unchanged. Run the
          docs locally with a <code>GOOGLE_API_KEY</code> to try it.
        </p>
      )}

      <GramproAIProvider
        adapter={ready ? askViaDocsBackend : null}
        placeholder="Ask about these employees…"
        suggestions={SUGGESTIONS}
      >
        <DataGrid
          data={rows}
          columns={columns}
          getRowId="id"
          height={360}
          enableRowSelection
          enablePagination={false}
          aria-label="Employees"
          ai
          semantics={SEMANTICS}
          agentPolicy={POLICY}
        />
      </GramproAIProvider>
    </div>
  );
}
