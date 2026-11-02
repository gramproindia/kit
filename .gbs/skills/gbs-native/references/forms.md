# Forms on native

There is no `<form>` and no form posting on native. Keep field values in state
and submit from a Button's `onPress`. `name`, `pattern` and the browser's
validation are gone; `required` adds the asterisk and nothing else, so
validate in your own code and pass the message to `error`.

Every field takes `label`, `description` (spoken as the accessibility hint),
`error` (red, announced, marks the field invalid), `required`, `disabled`,
`size`, `style` and `styles`. Never wrap a field in your own label or error
`Text`.

## Text

**Input** (`component-lib/input`): `value` / `defaultValue` /
`onValueChange(text)`; `type` `text` | `password` | `email` | `number` | `tel` |
`url` | `search` (sets the keyboard, autofill and secure entry); `leading`,
`trailing`; `clearable`; `revealPassword` (eye toggle for passwords);
`maxLength` + `showCount` (counts characters as people do, emoji included);
`readOnly`. Other `TextInput` props pass through (`returnKeyType`,
`onSubmitEditing`, `autoCapitalize`). `onChangeText` also works.

**OtpInput** (same folder): `length` (default 6), `mode` `numeric` |
`alphanumeric` | `alphabetic`, `groups` (e.g. `[3, 3]`), `mask`, `uppercase`,
`value` / `onValueChange`, `onComplete(code)`. It is one hidden `TextInput`
under drawn cells, so SMS autofill (Android `sms-otp`, iOS `one-time-code`)
and pasting a whole message fill every cell. Editing is from the end; tapping a
middle cell does not move the caret.

**Textarea** (`component-lib/textarea`): `value` / `onValueChange`, `rows`
(fixed height), `autoResize` with `minRows` / `maxRows`, `maxLength` +
`showCount`.

**NumberInput** (`component-lib/number-input`): `value: number | null` /
`onValueChange`; `min`, `max`, `step`, `decimals`, `snapToStep`,
`clampBehavior`; `format` `decimal` | `currency` | `percent` with `currency`
(e.g. `"INR"`) and `locale`; `stepper` (− and + buttons, hold to repeat);
`clearable`. Screen readers can swipe up/down to step. `percent` holds 0.45 for
45%, as on the web.

## Choices

**Checkbox** (`component-lib/checkbox`): `checked: boolean | "indeterminate"`
/ `defaultChecked` / `onCheckedChange(checked)`; `label`, `description`.
**CheckboxGroup**: `value: string[]` / `onValueChange(values)`; `options`
(`{ value, label, description?, disabled? }[]`) or `Checkbox` children with
`value`; `orientation`; `selectAll` (true or a label).

**RadioGroup** (`component-lib/radio-group`): `value: string | null` /
`onValueChange`; `options` (strings or `{ value, label, description?,
disabled? }`) or `Radio` children; `orientation`; `variant` `default` |
`card`; `clearable`.

**Switch** (`component-lib/switch`): `checked` / `onCheckedChange(checked)`.
Return a promise from `onCheckedChange` and the switch shows a busy thumb
until it settles, and flips back if it rejects. `labelPosition` `end` |
`start` (settings rows), `loading`, `readOnly`. No `onChange`.

## Pickers

All pickers open as a **bottom sheet on a phone** and a **popover under the
field on a tablet** (600dp+); `presentation="sheet" | "popover" | "auto"`
overrides. All take `onOpenChange`.

**Select / MultiSelect** (`component-lib/combobox`): `options`
(`{ value, label, description?, group?, disabled? }[]`); Select `value: V | null`,
`onChange(value, option)`; MultiSelect `value: V[]`, `onChange(values,
options)`. `searchable` (default true), `mode` `client` | `server` with
`onSearchChange` + `loading`, `hasMore` + `onLoadMore`, `allowCreate` +
`onCreate(label)`, `clearable` (default true), `emptyMessage`,
`renderOption`. The list is a `FlatList`, so thousands of options are fine.

**DatePicker / DateRangePicker / DateTimePicker** (`component-lib/date-picker`):
`value` / `defaultValue` (a `Date`, an ISO string, or null), `onChange` —
DatePicker and DateTimePicker `(date: Date | null)`, DateRangePicker
`(range, complete)`. `min`, `max`, `locale` (week start follows the locale,
Sunday for en-IN and en-US, Saturday for ar-EG), `weekStartsOn`, `format`,
`showWeekNumbers`, `clearable`, `placeholder`. DateRangePicker: `presets`.
DateTimePicker: `hourCycle` 12 | 24, `showSeconds`, `minuteStep`,
`defaultTime`, `showNow`; changes in the panel commit only on **Done**
(dismissing discards them). Values are wall-clock local time; no time zones.
Tap-only: typing a date is not supported on native.

**FileUploader** (`component-lib/file-uploader`): **needs `pick`**, a function
returning `NativeFile[]` (`{ uri, name, size, type, lastModified? }`) or null.
Upload with `endpoint` (+ `method`, `headers`, `params`, `fieldNames`,
`parseResponse`) or your own `transport`; `multiple`, `accept`, `maxFiles`,
`maxSize`, `concurrency`, `retries`, `autoUpload`, `preview`,
`existingFiles`. Events: `onChange(files)`, `onRejected`, `onFileSuccess`,
`onFileError`, `onUploadComplete`. One request per file; no chunking on native.

## A full form

```tsx
import { useState } from "react";
import { ScrollView } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Button } from "component-lib/button";
import { Checkbox, CheckboxGroup } from "component-lib/checkbox";
import { MultiSelect, Select } from "component-lib/combobox";
import { DatePicker } from "component-lib/date-picker";
import { dialog } from "component-lib/dialog";
import { FileUploader, type PickFiles } from "component-lib/file-uploader";
import { Input } from "component-lib/input";
import { NumberInput } from "component-lib/number-input";
import { RadioGroup } from "component-lib/radio-group";
import { Switch } from "component-lib/switch";
import { Textarea } from "component-lib/textarea";
import { toast } from "component-lib/toaster";

const STATES = [
  { value: "KL", label: "Kerala" },
  { value: "TN", label: "Tamil Nadu" },
  { value: "KA", label: "Karnataka" },
];
const TAGS = [
  { value: "gst", label: "GST" },
  { value: "export", label: "Export" },
  { value: "retainer", label: "Retainer" },
];

// Kit takes no picker dependency: the app hands FileUploader a pick() function.
const pick: PickFiles = async () => {
  const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
  if (result.canceled || !result.assets) return null;
  return result.assets.map((a) => ({
    uri: a.uri,
    name: a.name,
    size: a.size ?? 0,
    type: a.mimeType ?? "",
    lastModified: a.lastModified,
  }));
};

export function NewInvoiceForm() {
  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [due, setDue] = useState<Date | null>(null);
  const [terms, setTerms] = useState<string | null>("net30");
  const [channels, setChannels] = useState<string[]>(["email"]);
  const [recurring, setRecurring] = useState(false);
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    customer: submitted && !customer ? "Enter the customer's name." : undefined,
    amount: submitted && !amount ? "Enter an amount." : undefined,
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
      <Input label="Customer" value={customer} onValueChange={setCustomer} required error={errors.customer} />
      <Input label="Email" type="email" value={email} onValueChange={setEmail} description="Receipts go here." />
      <NumberInput
        label="Amount"
        value={amount}
        onValueChange={setAmount}
        format="currency"
        currency="INR"
        locale="en-IN"
        min={0}
        required
        error={errors.amount}
      />
      <Select label="State" options={STATES} value={state} onChange={(value) => setState(value)} />
      <MultiSelect label="Tags" options={TAGS} value={tags} onChange={(values) => setTags(values)} />
      <DatePicker label="Due date" value={due} onChange={setDue} min={new Date()} locale="en-IN" />
      <RadioGroup
        label="Payment terms"
        value={terms}
        onValueChange={setTerms}
        options={[
          { value: "net15", label: "Net 15" },
          { value: "net30", label: "Net 30" },
        ]}
      />
      <CheckboxGroup
        label="Send via"
        value={channels}
        onValueChange={setChannels}
        orientation="horizontal"
        options={[
          { value: "sms", label: "SMS" },
          { value: "email", label: "Email" },
          { value: "whatsapp", label: "WhatsApp" },
        ]}
      />
      <Switch label="Recurring monthly" checked={recurring} onCheckedChange={setRecurring} />
      <Textarea label="Notes" value={notes} onValueChange={setNotes} maxLength={280} showCount autoResize />
      <FileUploader label="Attachments" pick={pick} endpoint="https://api.example.com/uploads" multiple maxSize={10_000_000} />
      <Checkbox label="I checked the GST number" checked={agreed} onCheckedChange={setAgreed} />
      <Button
        fullWidth
        disabled={!agreed}
        onPress={async () => {
          setSubmitted(true);
          if (!customer || !amount) return;
          const ok = await dialog.confirm({
            title: "Send invoice?",
            description: `${customer} will receive it by ${channels.join(", ")}.`,
            confirmLabel: "Send invoice",
          });
          if (!ok) return;
          await saveInvoice();
          toast.success("Invoice sent");
        }}
      >
        Send
      </Button>
    </ScrollView>
  );
}

async function saveInvoice() {}
```

`keyboardShouldPersistTaps="handled"` on the scroll view lets a tap on a picker
or button land while the keyboard is up.
