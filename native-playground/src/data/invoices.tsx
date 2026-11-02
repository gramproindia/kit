import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/** Sample data for the demo business, "Grampro Books". */
export type InvoiceStatus = "paid" | "unpaid" | "overdue" | "draft";

export interface Invoice {
  id: string;
  customer: string;
  state: string;
  amount: number;
  issued: Date;
  due: Date;
  status: InvoiceStatus;
  tags: string[];
  lines: { item: string; qty: number; rate: number }[];
  notes?: string;
}

const day = (offset: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};

const CUSTOMERS = [
  ["Anand Remanan", "KL"],
  ["Gita Hari", "KL"],
  ["Ravi Shankar", "TN"],
  ["Meera Nair", "KA"],
  ["Farhan Ali", "MH"],
  ["Priya Menon", "KL"],
  ["Suresh Kumar", "TN"],
  ["Lakshmi Iyer", "KA"],
  ["Vikram Rao", "TG"],
  ["Divya Pillai", "KL"],
] as const;

const STATUSES: InvoiceStatus[] = ["unpaid", "paid", "overdue", "paid", "unpaid", "paid", "draft", "paid", "overdue", "unpaid"];

const SEED: Invoice[] = CUSTOMERS.map(([customer, state], i) => {
  const lines = [
    { item: "Consulting (hours)", qty: 4 + i, rate: 1500 },
    { item: "GST filing", qty: 1, rate: 2500 + i * 250 },
  ];
  return {
    id: `INV-${2041 - i}`,
    customer,
    state,
    amount: lines.reduce((sum, l) => sum + l.qty * l.rate, 0),
    issued: day(-i * 3 - 2),
    due: day(STATUSES[i] === "overdue" ? -3 - i : 12 - i),
    status: STATUSES[i],
    tags: i % 3 === 0 ? ["gst", "retainer"] : ["gst"],
    lines,
  };
});

interface InvoicesValue {
  invoices: Invoice[];
  byId(id: string): Invoice | undefined;
  add(invoice: Omit<Invoice, "id">): Invoice;
  setStatus(id: string, status: InvoiceStatus): void;
  remove(id: string): void;
}

const InvoicesContext = createContext<InvoicesValue | null>(null);

export function InvoicesProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(SEED);
  const value = useMemo<InvoicesValue>(
    () => ({
      invoices,
      byId: (id) => invoices.find((invoice) => invoice.id === id),
      add(draft) {
        const top = Math.max(...invoices.map((i) => Number(i.id.slice(4))), 2041);
        const invoice = { ...draft, id: `INV-${top + 1}` };
        setInvoices((list) => [invoice, ...list]);
        return invoice;
      },
      setStatus: (id, status) => setInvoices((list) => list.map((i) => (i.id === id ? { ...i, status } : i))),
      remove: (id) => setInvoices((list) => list.filter((i) => i.id !== id)),
    }),
    [invoices],
  );
  return <InvoicesContext.Provider value={value}>{children}</InvoicesContext.Provider>;
}

export function useInvoices(): InvoicesValue {
  const value = useContext(InvoicesContext);
  if (!value) throw new Error("useInvoices needs <InvoicesProvider>.");
  return value;
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatINR = (amount: number) => inr.format(amount);

const short = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
export const formatShortDate = (date: Date) => short.format(date);

export const STATUS_BADGE: Record<InvoiceStatus, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  paid: { label: "Paid", variant: "success" },
  unpaid: { label: "Unpaid", variant: "warning" },
  overdue: { label: "Overdue", variant: "danger" },
  draft: { label: "Draft", variant: "neutral" },
};
