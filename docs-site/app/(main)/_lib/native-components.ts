/*
 * The React Native component pages, as data. Each entry becomes
 * /native/docs/<slug>: a live phone preview of its demo from
 * native-playground, a short usage snippet, a props table generated from the
 * component's TypeScript (scripts/generate-native-props.mjs), the full demo
 * source, and how it differs from the web component.
 *
 * Keep the snippets small and real: every prop in them is checked against the
 * generated props table when the page is built (see native-docs.ts).
 */

export interface NativeComponentEntry {
  slug: string;
  title: string;
  group: string;
  description: string;
  /** Folder under source/components (cross-platform) or source/native (mobile-only). */
  folder: string;
  mobileOnly?: boolean;
  /** Demo export from native-playground/demos. */
  demo: string;
  /** Props interfaces to document, by name, in order. */
  props: string[];
  /** Names the import line brings in. */
  imports: string[];
  usage: string;
  /** How it differs from the web component, or notes for mobile-only ones. */
  notes: string[];
  /** The web page for the same component, e.g. "/button". */
  web?: string;
}

export const NATIVE_COMPONENTS: NativeComponentEntry[] = [
  // ---------------------------------------------------------------- Mobile
  {
    slug: "app-bar",
    title: "AppBar",
    group: "Mobile",
    description: "The bar at the top of a screen: title, back or menu button, and actions. Small, centred, medium and large-title variants.",
    folder: "app-bar",
    mobileOnly: true,
    demo: "AppBarDemo",
    props: ["AppBarProps", "AppBarActionProps"],
    imports: ["AppBar", "AppBarAction"],
    usage: `<AppBar
  variant="large"
  title="Payments"
  onBack={() => router.back()}
  scrolled={scrolled}
  actions={
    <AppBarAction aria-label="Search" onPress={openSearch}>
      <SearchIcon />
    </AppBarAction>
  }
/>`,
    notes: [
      "Pads its top by `KitProvider`'s `insets.top`; pass `insets={useSafeAreaInsets()}` to the provider, or `safeArea={false}`.",
      "`scrolled` raises the bar with a divider while the content beneath it is scrolled.",
      "`AppBarAction` is a 44dp round icon button and needs an `aria-label`.",
    ],
  },
  {
    slug: "bottom-navigation",
    title: "BottomNavigation",
    group: "Mobile",
    description: "Top-level destinations at the bottom of the app, Material 3 style: icon in a pill, labels and badges.",
    folder: "bottom-navigation",
    mobileOnly: true,
    demo: "BottomNavigationDemo",
    props: ["BottomNavigationProps"],
    imports: ["BottomNavigation"],
    usage: `<BottomNavigation
  value={tab}
  onValueChange={setTab}
  items={[
    { key: "home", label: "Home", icon: ({ color }) => <HomeIcon color={color} /> },
    { key: "invoices", label: "Invoices", badge: 3 },
    { key: "settings", label: "Settings" },
  ]}
/>`,
    notes: [
      "Items are `role=\"tab\"` with `aria-selected`; a badge is spoken with its label (\"Invoices, 3 new\").",
      "`onReselect` fires when the active item is tapped again, for scroll-to-top or refresh.",
      "Pads its bottom by `KitProvider`'s `insets.bottom`.",
    ],
  },
  {
    slug: "fab",
    title: "Fab & SpeedDial",
    group: "Mobile",
    description: "The floating action button for a screen's main action, extended with a label, and a SpeedDial of related actions.",
    folder: "fab",
    mobileOnly: true,
    demo: "FabDemo",
    props: ["FabProps", "SpeedDialProps"],
    imports: ["Fab", "SpeedDial"],
    usage: `<Fab
  icon={<PlusIcon />}
  label="New invoice"
  extended={!scrolledDown}
  offset={64} // above a BottomNavigation
  onPress={create}
/>`,
    notes: [
      "Floats over its parent at `bottom-end` by default and follows RTL; `placement=\"none\"` leaves layout to you.",
      "An icon-only Fab needs an `aria-label`. `extended={false}` collapses the label, animated.",
      "`SpeedDial` opens over a dimmed screen; Android back, a tap outside or ✕ closes it.",
    ],
  },
  {
    slug: "segmented-control",
    title: "SegmentedControl",
    group: "Mobile",
    description: "A row of mutually exclusive (or, with `multiple`, combinable) options, iOS style.",
    folder: "segmented-control",
    mobileOnly: true,
    demo: "SegmentedControlDemo",
    props: ["SingleSegmentedControlProps", "MultipleSegmentedControlProps"],
    imports: ["SegmentedControl"],
    usage: `<SegmentedControl
  value={range}
  onValueChange={setRange}
  options={[
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
  ]}
/>`,
    notes: ["With `multiple`, `value` is an array of selected values."],
  },
  {
    slug: "list-item",
    title: "ListItem & List",
    group: "Mobile",
    description: "Rows for settings, contacts and inboxes: leading icon, title and description, trailing value, control or chevron.",
    folder: "list-item",
    mobileOnly: true,
    demo: "ListItemDemo",
    props: ["ListItemProps", "ListProps", "ListSectionProps"],
    imports: ["ListItem", "ListSection"],
    usage: `<ListSection header="Account" footer="Signed in as anand@example.com">
  <ListItem title="Language" value="English" chevron onPress={openLanguage} />
  <ListItem title="Notifications" trailing={<Switch checked={on} onCheckedChange={setOn} />} />
  <ListItem title="Sign out" destructive onPress={signOut} />
</ListSection>`,
    notes: [
      "Rows are at least 44dp tall (56dp with a description).",
      "A pressable row with a chevron is announced as a link, otherwise as a button.",
      "`ListSection` defaults to the rounded `inset` look of iOS settings.",
    ],
  },
  {
    slug: "bottom-sheet",
    title: "BottomSheet",
    group: "Mobile",
    description: "A panel that slides up from the bottom for secondary actions, a short form or details. Drag down, tap outside or press back to close.",
    folder: "bottom-sheet",
    mobileOnly: true,
    demo: "BottomSheetDemo",
    props: ["BottomSheetProps"],
    imports: ["BottomSheet"],
    usage: `<BottomSheet
  trigger={<Button variant="outline">Share</Button>}
  title="Share invoice"
  footer={(close) => <Button onPress={close}>Done</Button>}
>
  <ListItem title="Copy link" onPress={copy} />
</BottomSheet>`,
    notes: [
      "Built on Kit's shared `Sheet`: clears the home indicator and stays above the keyboard.",
      "No gesture or animation library: core `Animated` and `PanResponder`.",
    ],
  },
  {
    slug: "search-bar",
    title: "SearchBar",
    group: "Mobile",
    description: "A rounded search field with a clear button, an optional iOS-style Cancel, and a debounced onSearch.",
    folder: "search-bar",
    mobileOnly: true,
    demo: "SearchBarDemo",
    props: ["SearchBarProps"],
    imports: ["SearchBar"],
    usage: `<SearchBar showCancel loading={pending} onSearch={(query) => setQuery(query)} />`,
    notes: ["`onSearch` is debounced (250ms by default) and called with `\"\"` when cleared."],
  },

  // ---------------------------------------------------------------- Actions
  {
    slug: "button",
    title: "Button",
    group: "Actions",
    description: "Variants, sizes, icons and a loading state. An async onPress shows progress by itself.",
    folder: "button",
    demo: "ButtonDemo",
    props: ["ButtonProps"],
    imports: ["Button"],
    usage: `<Button onPress={() => save()}>Save</Button>
<Button variant="outline" leading={<PlusIcon />}>New invoice</Button>
<Button variant="danger" loading>Deleting</Button>`,
    notes: [
      "`onPress` instead of `onClick`. Return a promise and the button shows its spinner until it settles.",
      "Every size keeps a 44dp touch target (small buttons get `hitSlop`).",
      "No `type=\"submit\"` or form status: React Native has no forms.",
    ],
    web: "/button",
  },
  {
    slug: "badge",
    title: "Badge & Tag",
    group: "Actions",
    description: "Status labels, counts and dots, and removable tags.",
    folder: "badge",
    demo: "BadgeDemo",
    props: ["BadgeProps", "TagProps"],
    imports: ["Badge", "Tag"],
    usage: `<Badge variant="success">Paid</Badge>
<Badge count={128} max={99} />
<Tag onRemove={() => remove("react")}>React</Tag>`,
    notes: ["A count's spoken text goes on the badge's `aria-label`."],
    web: "/badge",
  },

  // ---------------------------------------------------------------- Forms
  {
    slug: "input",
    title: "Input & OtpInput",
    group: "Forms",
    description: "Text fields with label, hint and error, clear and reveal buttons, a character count, and a one-time-code input that fills from SMS.",
    folder: "input",
    demo: "InputDemo",
    props: ["InputProps", "OtpInputProps"],
    imports: ["Input", "OtpInput"],
    usage: `<Input label="Email" type="email" required description="We never share it." />
<OtpInput label="Verification code" length={6} onComplete={verify} />`,
    notes: [
      "`type` picks the keyboard, autofill and secure entry. `onChangeText` fires alongside `onValueChange`.",
      "OtpInput is one real TextInput under drawn cells, so paste and SMS autofill (`oneTimeCode`, `sms-otp`) fill every cell.",
      "`description` and `error` become the accessibility hint; errors are announced.",
    ],
    web: "/input",
  },
  {
    slug: "number-input",
    title: "NumberInput",
    group: "Forms",
    description: "Locale-aware numbers, currency and percent with − and + steppers that repeat when held.",
    folder: "number-input",
    demo: "NumberInputDemo",
    props: ["NumberInputProps"],
    imports: ["NumberInput"],
    usage: `<NumberInput label="Amount" format="currency" currency="INR" locale="en-IN" min={0} step={100} />`,
    notes: [
      "Screen readers adjust it with increment and decrement actions (`role=\"spinbutton\"`).",
      "Uses the same Intl parsing and formatting as the web, which Hermes supports.",
    ],
    web: "/numberinput",
  },
  {
    slug: "textarea",
    title: "Textarea",
    group: "Forms",
    description: "Multi-line text with a fixed or auto-growing height and a grapheme-accurate character count.",
    folder: "textarea",
    demo: "TextareaDemo",
    props: ["TextareaProps"],
    imports: ["Textarea"],
    usage: `<Textarea label="Message" autoResize minRows={2} maxRows={6} maxLength={140} showCount />`,
    notes: ["There is no `resize` handle on touch; use `rows` or `autoResize`."],
    web: "/textarea",
  },
  {
    slug: "checkbox",
    title: "Checkbox",
    group: "Forms",
    description: "Checkboxes and groups with select-all and the mixed state.",
    folder: "checkbox",
    demo: "CheckboxDemo",
    props: ["CheckboxProps", "CheckboxGroupProps"],
    imports: ["Checkbox", "CheckboxGroup"],
    usage: `<CheckboxGroup label="Notify me by" selectAll defaultValue={["sms"]}>
  <Checkbox value="sms" label="SMS" />
  <Checkbox value="email" label="Email" />
</CheckboxGroup>`,
    notes: ["The whole row is one target. Indeterminate reports `aria-checked=\"mixed\"`."],
    web: "/checkbox",
  },
  {
    slug: "radio-group",
    title: "RadioGroup",
    group: "Forms",
    description: "Single choice from a list, as rows or as cards.",
    folder: "radio-group",
    demo: "RadioGroupDemo",
    props: ["RadioGroupProps", "RadioProps"],
    imports: ["RadioGroup", "Radio"],
    usage: `<RadioGroup label="Billing cycle" defaultValue="monthly">
  <Radio value="monthly" label="Monthly" />
  <Radio value="yearly" label="Yearly" />
</RadioGroup>`,
    notes: ["No arrow-key navigation on touch; each radio is its own target."],
    web: "/radiogroup",
  },
  {
    slug: "switch",
    title: "Switch",
    group: "Forms",
    description: "On/off settings with an async save state that rolls back on failure.",
    folder: "switch",
    demo: "SwitchDemo",
    props: ["SwitchProps"],
    imports: ["Switch"],
    usage: `<Switch label="Email me receipts" onCheckedChange={(on) => saveSetting(on)} />`,
    notes: ["Sizes are larger for touch than on the web. `labelPosition=\"start\"` makes a settings row."],
    web: "/switch",
  },
  {
    slug: "file-uploader",
    title: "FileUploader",
    group: "Forms",
    description: "Pick, validate and upload files with progress, retry and remove. You bring the picker; Kit takes no dependency.",
    folder: "file-uploader",
    demo: "FileUploaderDemo",
    props: ["FileUploaderProps"],
    imports: ["FileUploader"],
    usage: `import * as DocumentPicker from "expo-document-picker";

<FileUploader
  endpoint="/api/upload"
  maxSize={5_000_000}
  pick={async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true });
    return result.canceled
      ? []
      : result.assets.map((a) => ({ uri: a.uri, name: a.name, size: a.size ?? 0, type: a.mimeType ?? "" }));
  }}
/>`,
    notes: [
      "`pick()` returns `{ uri, name, size, type }` files from any picker (expo-document-picker, expo-image-picker, …).",
      "Each file uploads in one request; there is no chunking without a filesystem library.",
    ],
    web: "/fileuploader",
  },

  // ---------------------------------------------------------------- Pickers
  {
    slug: "select",
    title: "Select & MultiSelect",
    group: "Pickers",
    description: "Pick one or many from a list, searchable and virtualised. A bottom sheet on phones, a popover on tablets.",
    folder: "combobox",
    demo: "ComboboxDemo",
    props: ["SelectProps", "MultiSelectProps"],
    imports: ["Select", "MultiSelect"],
    usage: `<Select
  label="State"
  options={[
    { value: "KL", label: "Kerala" },
    { value: "TN", label: "Tamil Nadu" },
  ]}
  onChange={setState}
/>`,
    notes: [
      "`presentation`: `\"auto\"` (sheet below 600dp, popover above), `\"sheet\"` or `\"popover\"`.",
      "Change events are `onChange`, as on the web. No keyboard navigation or type-ahead on touch.",
    ],
    web: "/combobox",
  },
  {
    slug: "date-picker",
    title: "DatePicker",
    group: "Pickers",
    description: "Dates, ranges and date-times with a Kit-drawn calendar that looks the same on iOS, Android and the web.",
    folder: "date-picker",
    demo: "DatePickerDemo",
    props: ["DatePickerProps", "DateRangePickerProps", "DateTimePickerProps"],
    imports: ["DatePicker", "DateRangePicker", "DateTimePicker"],
    usage: `<DatePicker label="Due date" locale="en-IN" min={new Date()} onChange={setDue} />
<DateTimePicker label="Reminder" hourCycle={12} minuteStep={15} />`,
    notes: [
      "The week starts per locale (Sunday for en-IN, Saturday for ar-EG) even though Hermes has no `Intl.Locale`.",
      "Tap-only for now: no typed dates. DateTimePicker commits on Done.",
    ],
    web: "/datepicker",
  },

  // ---------------------------------------------------------------- Overlays
  {
    slug: "toaster",
    title: "Toaster",
    group: "Overlays",
    description: "Brief messages that stack, auto-dismiss, pause on touch and swipe away. Fire them with toast() from anywhere.",
    folder: "toaster",
    demo: "ToasterDemo",
    props: ["ToasterProps"],
    imports: ["Toaster", "toast"],
    usage: `// Once, inside KitProvider:
<Toaster />

// Anywhere:
toast.success("Invoice sent");`,
    notes: [
      "Defaults to `top-center` on native and keeps clear of the notch and gesture bar.",
      "Known gap: a toast fired from inside an open Modal or Dialog shows once it closes.",
    ],
    web: "/toaster",
  },
  {
    slug: "dialog",
    title: "Dialog",
    group: "Overlays",
    description: "Alert, confirm and prompt dialogs, awaited from code with dialog.confirm().",
    folder: "dialog",
    demo: "DialogDemo",
    props: ["DialogProps", "DialogHostProps"],
    imports: ["DialogHost", "dialog"],
    usage: `// Once, inside KitProvider:
<DialogHost />

const ok = await dialog.confirm({ title: "Delete invoice?", intent: "danger" });`,
    notes: ["Android back cancels. The prompt picks its keyboard from `inputType` and moves above it."],
    web: "/dialog",
  },
  {
    slug: "modal",
    title: "Modal",
    group: "Overlays",
    description: "Centre, drawer, full-screen and bottom-sheet modals with close guards.",
    folder: "modal",
    demo: "ModalDemo",
    props: ["ModalProps"],
    imports: ["Modal"],
    usage: `<Modal open={open} onOpenChange={setOpen} title="Edit customer" placement="bottom">
  <CustomerForm />
</Modal>`,
    notes: ["Android back closes with reason `escape` and follows `closeOnEscape`."],
    web: "/modal",
  },
  {
    slug: "menu",
    title: "Menu",
    group: "Overlays",
    description: "Action menus with checkbox and radio items and submenus. An action sheet on phones, a popover on tablets.",
    folder: "menu",
    demo: "MenuDemo",
    props: ["MenuProps", "MenuItemProps", "MenuSubProps"],
    imports: ["Menu", "MenuItem"],
    usage: `<Menu trigger={<Button variant="outline">Actions</Button>}>
  <MenuItem onSelect={duplicate}>Duplicate</MenuItem>
  <MenuItem onSelect={archive}>Archive</MenuItem>
</Menu>`,
    notes: ["In a sheet, a submenu replaces the list with a back row."],
    web: "/menu",
  },
  {
    slug: "popover",
    title: "Popover",
    group: "Overlays",
    description: "A panel anchored to its trigger, placed with the same maths as the web Popover.",
    folder: "popover",
    demo: "PopoverDemo",
    props: ["PopoverProps"],
    imports: ["Popover"],
    usage: `<Popover trigger={<Button variant="outline">Details</Button>} title="GST">
  <Text>18% on services.</Text>
</Popover>`,
    notes: ["Android back and a tap outside both close with reason `outside`."],
    web: "/popover",
  },
  {
    slug: "tooltip",
    title: "Tooltip",
    group: "Overlays",
    description: "A short hint on long-press, since touch has no hover. Also added to the trigger's accessibility hint.",
    folder: "tooltip",
    demo: "TooltipDemo",
    props: ["TooltipProps"],
    imports: ["Tooltip"],
    usage: `<Tooltip content="Copy invoice number">
  <Button icon={<CopyIcon />} aria-label="Copy" />
</Tooltip>`,
    notes: ["`delay` is how long to press; `duration` is how long it stays after the finger lifts."],
    web: "/tooltip",
  },

  // ---------------------------------------------------------------- Display
  {
    slug: "tabs",
    title: "Tabs",
    group: "Display",
    description: "A scrollable tab bar with a sliding indicator, and its panels.",
    folder: "tabs",
    demo: "TabsDemo",
    props: ["TabsProps", "TabProps", "TabPanelProps"],
    imports: ["Tabs", "TabList", "Tab", "TabPanel"],
    usage: `<Tabs defaultValue="open">
  <TabList>
    <Tab value="open">Open</Tab>
    <Tab value="paid">Paid</Tab>
  </TabList>
  <TabPanel value="open">…</TabPanel>
  <TabPanel value="paid">…</TabPanel>
</Tabs>`,
    notes: ["`activation` is accepted for parity but a tap always selects."],
    web: "/tabs",
  },
  {
    slug: "accordion",
    title: "Accordion",
    group: "Display",
    description: "Collapsible sections with animated height.",
    folder: "accordion",
    demo: "AccordionDemo",
    props: ["AccordionProps", "AccordionItemProps"],
    imports: ["Accordion", "AccordionItem"],
    usage: `<Accordion collapsible>
  <AccordionItem value="gst" title="Is GST included?">Yes, 18%.</AccordionItem>
  <AccordionItem value="refund" title="Refunds">Within 7 days.</AccordionItem>
</Accordion>`,
    notes: ["Closed sections stay mounted but are hidden from screen readers."],
    web: "/accordion",
  },
  {
    slug: "card",
    title: "Card & Stat",
    group: "Display",
    description: "Outlined, elevated and plain cards with header, body and footer, and KPI tiles.",
    folder: "card",
    demo: "CardDemo",
    props: ["CardProps", "CardHeaderProps", "StatProps"],
    imports: ["Card", "CardHeader", "CardBody", "CardFooter", "Stat"],
    usage: `<Card variant="elevated" onPress={openInvoice}>
  <CardHeader title="INV-0042" description="Due 12 Nov" />
  <CardBody>₹12,400</CardBody>
</Card>`,
    notes: ["`onPress` replaces `href`; the whole card becomes one button. Elevated cards use the `raised` token, lighter in dark mode."],
    web: "/card",
  },
  {
    slug: "avatar",
    title: "Avatar",
    group: "Display",
    description: "Pictures, initials in any script, status dots and overlapping groups.",
    folder: "avatar",
    demo: "AvatarDemo",
    props: ["AvatarProps", "AvatarGroupProps"],
    imports: ["Avatar", "AvatarGroup"],
    usage: `<Avatar name="Anand Remanan" status="online" />
<AvatarGroup max={3}>{people.map((p) => <Avatar key={p.id} name={p.name} src={p.photo} />)}</AvatarGroup>`,
    notes: ["Initials are grapheme-aware even without `Intl.Segmenter` (Hermes): അര, 👨‍👩‍👧 stay whole."],
    web: "/avatar",
  },
  {
    slug: "alert",
    title: "Alert",
    group: "Display",
    description: "Inline messages with an intent, actions and dismiss.",
    folder: "alert",
    demo: "AlertDemo",
    props: ["AlertProps"],
    imports: ["Alert"],
    usage: `<Alert variant="danger" title="Payment declined" description="Try another card." onDismiss={hide} />`,
    notes: ["`aria-live` is Android only; iOS needs `AccessibilityInfo.announceForAccessibility` for appearing alerts."],
    web: "/alert",
  },
  {
    slug: "breadcrumb",
    title: "Breadcrumb",
    group: "Display",
    description: "A sideways-scrolling trail that collapses with the web's rules.",
    folder: "breadcrumb",
    demo: "BreadcrumbDemo",
    props: ["BreadcrumbProps"],
    imports: ["Breadcrumb"],
    usage: `<Breadcrumb
  items={[{ label: "Home", href: "/" }, { label: "Invoices", href: "/invoices" }, { label: "INV-0042" }]}
  onNavigate={(item) => router.push(item.href)}
/>`,
    notes: ["Navigation is your router's job on mobile: `onNavigate` receives the crumb."],
    web: "/breadcrumb",
  },

  // ---------------------------------------------------------------- Feedback
  {
    slug: "progress",
    title: "Progress",
    group: "Feedback",
    description: "Bars and rings, determinate or indeterminate.",
    folder: "progress",
    demo: "ProgressDemo",
    props: ["ProgressProps", "CircularProgressProps"],
    imports: ["Progress", "CircularProgress"],
    usage: `<Progress label="Uploading statement.pdf" value={35} showValue />
<CircularProgress value={88} variant="success" showValue />`,
    notes: ["Rings are drawn with Views, no SVG; their ends are square."],
    web: "/progress",
  },
  {
    slug: "spinner",
    title: "Spinner",
    group: "Feedback",
    description: "Loading indicators with a delay so fast loads never flash.",
    folder: "spinner",
    demo: "SpinnerDemo",
    props: ["SpinnerProps"],
    imports: ["Spinner"],
    usage: `<Spinner loading={pending} delay={200} label="Loading invoices" />`,
    notes: ["Takes a `color` (native has no `currentColor`); defaults to the accent."],
    web: "/spinner",
  },
  {
    slug: "skeleton",
    title: "Skeleton & Empty",
    group: "Feedback",
    description: "Loading placeholders that pulse or shimmer, and empty states.",
    folder: "skeleton",
    demo: "SkeletonDemo",
    props: ["SkeletonProps", "EmptyProps"],
    imports: ["Skeleton", "Empty"],
    usage: `<Skeleton variant="text" lines={3} />
<Empty title="No invoices yet" description="Create one to get paid." />`,
    notes: ["Respects the device's Reduce Motion setting."],
    web: "/skeleton",
  },
];
