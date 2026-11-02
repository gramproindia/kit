import { useState } from "react";
import { View } from "react-native";
import { Alert } from "../../../source/components/alert";
import { Button } from "../../../source/components/button";
import { Card, CardBody, CardHeader } from "../../../source/components/card";
import { CheckboxGroup } from "../../../source/components/checkbox";
import { MultiSelect, Select, type ComboboxOption } from "../../../source/components/combobox";
import { DatePicker, DateRangePicker, DateTimePicker, type DateRange } from "../../../source/components/date-picker";
import { dialog } from "../../../source/components/dialog";
import { FileUploader, type NativeFile, type Transport } from "../../../source/components/file-uploader";
import { Input } from "../../../source/components/input";
import { NumberInput } from "../../../source/components/number-input";
import { RadioGroup } from "../../../source/components/radio-group";
import { Switch } from "../../../source/components/switch";
import { Textarea } from "../../../source/components/textarea";
import { toast } from "../../../source/components/toaster";
import { formatINR, useInvoices } from "../data/invoices";
import { useNav } from "../navigation/Navigator";
import { Heading, Screen } from "../ui/kit";

const STATES: ComboboxOption[] = [
  ["KL", "Kerala", "South"], ["TN", "Tamil Nadu", "South"], ["KA", "Karnataka", "South"],
  ["AP", "Andhra Pradesh", "South"], ["TG", "Telangana", "South"], ["MH", "Maharashtra", "West"],
  ["GJ", "Gujarat", "West"], ["GA", "Goa", "West"], ["DL", "Delhi", "North"], ["UP", "Uttar Pradesh", "North"],
  ["WB", "West Bengal", "East"], ["AS", "Assam", "North-east"],
].map(([value, label, group]) => ({ value, label, group, keywords: [value] }));

const TAGS: ComboboxOption[] = ["GST", "Retainer", "Consulting", "Export", "Priority", "Recurring"].map((label) => ({
  value: label.toLowerCase(),
  label,
}));

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// The app hands FileUploader a picker; this demo fakes one so it runs in Expo Go.
const SAMPLE_FILES: NativeFile[] = [
  { uri: "file:///demo/purchase-order.pdf", name: "purchase-order.pdf", size: 412_000, type: "application/pdf" },
  { uri: "file:///demo/timesheet.xlsx", name: "timesheet.xlsx", size: 88_064, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
];
const fakePick = async () => {
  await wait(250);
  return SAMPLE_FILES;
};
const fakeTransport: Transport = ({ file, signal, onProgress }) =>
  new Promise((resolve, reject) => {
    let sent = 0;
    const timer = setInterval(() => {
      sent = Math.min(file.size, sent + file.size / 15);
      onProgress(sent);
      if (sent >= file.size) {
        clearInterval(timer);
        resolve({ id: `srv-${file.name}` });
      }
    }, 100);
    signal.addEventListener("abort", () => {
      clearInterval(timer);
      reject(Object.assign(new Error("Upload aborted"), { name: "AbortError" }));
    });
  });

interface Draft {
  customer: string;
  email: string;
  state: string | null;
  tags: string[];
  issued: Date | null;
  period: DateRange;
  reminder: Date | null;
  amount: number | null;
  terms: string | null;
  channels: string[];
  recurring: boolean;
  notes: string;
}

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const EMPTY = (): Draft => ({
  customer: "",
  email: "",
  state: null,
  tags: ["gst"],
  issued: today(),
  period: { start: null, end: null },
  reminder: null,
  amount: null,
  terms: "net15",
  channels: ["email"],
  recurring: false,
  notes: "",
});

type Errors = Partial<Record<keyof Draft, string>>;

function validate(d: Draft): Errors {
  const errors: Errors = {};
  if (d.customer.trim().length < 2) errors.customer = "Enter the customer's name.";
  if (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) errors.email = "That email doesn't look right.";
  if (!d.state) errors.state = "Choose the place of supply.";
  if (!d.issued) errors.issued = "Pick the invoice date.";
  if (!d.amount || d.amount <= 0) errors.amount = "Enter an amount above zero.";
  if (!d.terms) errors.terms = "Choose payment terms.";
  if (d.channels.length === 0) errors.channels = "Pick at least one way to send it.";
  return errors;
}

export function CreateScreen() {
  const nav = useNav();
  const { add } = useInvoices();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  // Bumped on reset so uncontrolled bits (uploads) start over.
  const [formKey, setFormKey] = useState(0);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (attempted) setErrors(validate(next));
      return next;
    });
  };

  const submit = async () => {
    setAttempted(true);
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Check the highlighted fields", { description: `${Object.keys(found).length} to fix` });
      return;
    }
    const ok = await dialog.confirm({
      title: "Send this invoice?",
      description: `${formatINR(draft.amount ?? 0)} to ${draft.customer}, by ${draft.channels.join(" and ")}.`,
      confirmLabel: "Send",
      onConfirm: () => wait(900),
    });
    if (!ok) return;
    const issued = draft.issued ?? today();
    const due = new Date(issued);
    due.setDate(due.getDate() + (draft.terms === "net30" ? 30 : draft.terms === "net15" ? 15 : 0));
    const invoice = add({
      customer: draft.customer.trim(),
      state: draft.state ?? "KL",
      amount: draft.amount ?? 0,
      issued,
      due,
      status: "unpaid",
      tags: draft.tags,
      lines: [{ item: "Services", qty: 1, rate: draft.amount ?? 0 }],
      notes: draft.notes,
    });
    toast.success(`${invoice.id} sent`, {
      description: `${formatINR(invoice.amount)} · ${invoice.customer}`,
      action: {
        label: "View",
        onClick: () => {
          nav.setTab("home");
        },
      },
    });
    setDraft(EMPTY());
    setErrors({});
    setAttempted(false);
    setFormKey((k) => k + 1);
  };

  return (
    <Screen title="New invoice" subtitle="Every field is a Kit component">
      {attempted && Object.keys(errors).length > 0 && (
        <Alert size="sm" variant="danger" description={`${Object.keys(errors).length} field(s) need attention.`} />
      )}

      <Card>
        <CardHeader title="Customer" />
        <CardBody>
          <View style={{ gap: 14 }} key={`c${formKey}`}>
            <Input
              label="Customer name"
              placeholder="Anand Remanan"
              required
              clearable
              value={draft.customer}
              onValueChange={(v) => set("customer", v)}
              error={errors.customer}
            />
            <Input
              label="Email"
              type="email"
              placeholder="billing@example.com"
              value={draft.email}
              onValueChange={(v) => set("email", v)}
              error={errors.email}
            />
            <Select
              label="Place of supply"
              options={STATES}
              value={draft.state}
              onChange={(v) => set("state", v)}
              required
              error={errors.state}
              description="Decides CGST + SGST or IGST."
            />
            <MultiSelect label="Tags" options={TAGS} value={draft.tags} onChange={(v) => set("tags", v)} max={4} />
          </View>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Dates" />
        <CardBody>
          <View style={{ gap: 14 }}>
            <DatePicker
              label="Invoice date"
              locale="en-IN"
              required
              value={draft.issued}
              onChange={(v) => set("issued", v)}
              error={errors.issued}
            />
            <DateRangePicker
              label="Billing period"
              locale="en-IN"
              value={draft.period}
              onChange={(v) => set("period", v)}
              description="Optional. Shown on the PDF."
            />
            <DateTimePicker
              label="Remind me"
              locale="en-IN"
              hourCycle={12}
              minuteStep={15}
              defaultTime="09:00"
              value={draft.reminder}
              onChange={(v) => set("reminder", v)}
            />
          </View>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Amount and terms" />
        <CardBody>
          <View style={{ gap: 14 }}>
            <NumberInput
              label="Amount"
              locale="en-IN"
              format="currency"
              currency="INR"
              decimals={2}
              step={500}
              min={0}
              required
              value={draft.amount}
              onValueChange={(v) => set("amount", v)}
              error={errors.amount}
            />
            <RadioGroup
              label="Payment terms"
              value={draft.terms}
              onValueChange={(v) => set("terms", v)}
              error={errors.terms}
              options={[
                { value: "receipt", label: "Due on receipt" },
                { value: "net15", label: "Net 15", description: "Due 15 days after the invoice date" },
                { value: "net30", label: "Net 30" },
              ]}
            />
            <Switch
              label="Recurring every month"
              description="Sends a copy on the same date."
              checked={draft.recurring}
              onCheckedChange={(v) => set("recurring", v)}
            />
          </View>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Delivery" />
        <CardBody>
          <View style={{ gap: 14 }}>
            <CheckboxGroup
              label="Send by"
              orientation="horizontal"
              value={draft.channels}
              onValueChange={(v) => set("channels", v)}
              error={errors.channels}
              options={[
                { value: "email", label: "Email" },
                { value: "sms", label: "SMS" },
                { value: "whatsapp", label: "WhatsApp" },
              ]}
            />
            <Textarea
              label="Notes"
              placeholder="Thank you for your business."
              autoResize
              minRows={2}
              maxRows={6}
              showCount
              maxLength={200}
              value={draft.notes}
              onValueChange={(v) => set("notes", v)}
            />
            <FileUploader
              key={`f${formKey}`}
              label="Attachments"
              description="Adds two sample files (no picker in Expo Go)."
              multiple
              maxFiles={4}
              pick={fakePick}
              transport={fakeTransport}
            />
          </View>
        </CardBody>
      </Card>

      <Heading>Ready?</Heading>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button
          variant="outline"
          onPress={() => {
            setDraft(EMPTY());
            setErrors({});
            setAttempted(false);
            setFormKey((k) => k + 1);
          }}
        >
          Reset
        </Button>
        <View style={{ flex: 1 }}>
          <Button fullWidth onPress={submit}>
            Send invoice
          </Button>
        </View>
      </View>
    </Screen>
  );
}
