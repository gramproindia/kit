// Mobile (React Native) components, iOS and Android. BETA, like the native
// kit itself. Where the platforms draw a pattern differently, the set has a
// Platform property; where Kit renders one look on both (Button, fields,
// Checkbox, Badge…), it does not. Light/Dark is a variable mode, never a
// duplicate component. Sizes follow source/components/*/native and
// source/native/*.

type MPlatform = "iOS" | "Android";
const M_PLATFORMS: MPlatform[] = ["iOS", "Android"];

/** Device widths the screen-level components are drawn at. */
const M_DEVICE: Record<MPlatform, { name: string; width: number; height: number; status: number; bottom: number }> = {
  iOS: { name: "iPhone 16", width: 393, height: 852, status: 54, bottom: 34 },
  Android: { name: "Pixel 9", width: 412, height: 915, status: 48, bottom: 24 },
};

/** Every mobile set built, by name, for the screens page to instance. */
const M_SETS = new Map<string, ComponentSetNode>();

function mSet(name: string): ComponentSetNode {
  const set = M_SETS.get(name);
  if (!set) throw new Error(`Mobile set not built yet: ${name}`);
  return set;
}

async function mVariantSet(section: FrameNode, name: string, description: string, variants: Variant[], columns = 4) {
  const set = await variantSet(section, `Mobile/${name}`, `BETA · ${description}`, variants, columns);
  M_SETS.set(name, set);
  return set;
}

/** A fixed-size square slot with a centred icon: icon buttons, leading icons. */
function mIconSlot(parent: BaseNode & ChildrenMixin, name: IconName, color: string, box: number, size: number, slotName = "Icon"): FrameNode {
  const slot = frame(slotName, { direction: "row", justify: "center", align: "center" }, parent);
  applySize(slot, box, box);
  icon(slot, name, color, size);
  return slot;
}

/** A plain hex fill, for things that are deliberately not tokens (preset swatches). */
function mHexFill(node: MinimalFillsMixin, hex: string) {
  const { r, g, b, a } = hexToRgba(hex);
  node.fills = [{ type: "SOLID", color: { r, g, b }, opacity: a }];
}

function mTopRadius(node: FrameNode | ComponentNode, radius: number) {
  node.topLeftRadius = radius;
  node.topRightRadius = radius;
  node.bottomLeftRadius = 0;
  node.bottomRightRadius = 0;
}

const M_SHADOW = () => [shadow(8, 24, -6, 0.18)];

async function buildMobileComponents(page: PageNode) {
  await docSection(
    page,
    "Mobile components (BETA)",
    [
      "The GramproKit React Native components, for iOS and Android. BETA: the native kit is in prerelease on the npm `native` tag, and these components may change or break between prereleases.",
      "Sets prefixed Mobile/ are the native components. A Platform property appears only where iOS and Android draw a pattern differently (app bar, tab bar, switch, sheet, dialog, menu, toast, search, segmented control, lists); elsewhere Kit renders one look on both. Switch a frame to Dark in Appearance → Grampro Kit · Color.",
    ].join("\n\n"),
  );
  await buildMobileNavigation(page);
  await buildMobileActions(page);
  await buildMobileInputs(page);
  await buildMobileOverlays(page);
  await buildMobileDisplay(page);
}

/* ============================================================ navigation */

async function buildMobileNavigation(page: PageNode) {
  // AppBar
  let section = await docSection(
    page,
    "AppBar",
    "source/native/app-bar · <AppBar variant title subtitle onBack actions scrolled>. iOS: a 44pt navigation bar with a text back button, the title centred, or a large title below it. Android (Material 3): a back arrow, the title at the start (or centred), medium and large add a second, larger title row. Kit draws the bar at 56dp on both; the iOS variants show the native proportions designers expect.",
  );
  const bars: Variant[] = [];
  for (const variant of ["Small", "Large"]) {
    bars.push({ props: { Platform: "iOS", Variant: variant }, build: (c) => mAppBar(c, "iOS", variant) });
  }
  for (const variant of ["Small", "Center", "Medium", "Large"]) {
    bars.push({ props: { Platform: "Android", Variant: variant }, build: (c) => mAppBar(c, "Android", variant) });
  }
  let set = await mVariantSet(section, "AppBar", "Top of every screen. Code: <AppBar>.", bars, 2);
  textProperty(set, "Title", "Title", "Invoices");
  booleanProperty(set, "Back", "Back", true);
  booleanProperty(set, "Actions", "Actions", true);

  // BottomNavigation
  section = await docSection(
    page,
    "BottomNavigation",
    "source/native/bottom-navigation · <BottomNavigation items value onValueChange labelVisibility>. iOS: a 49pt tab bar, the selected tab tinted. Android (Material 3): a navigation bar where the selected icon sits in a pill. Badges are a count (99+) or a dot. Add the home indicator / gesture bar below it in a screen.",
  );
  const navs: Variant[] = [];
  for (const platform of M_PLATFORMS) {
    for (const badges of ["Off", "On"]) {
      navs.push({ props: { Platform: platform, Badges: badges }, build: (c) => mBottomNav(c, platform, badges === "On") });
    }
  }
  set = await mVariantSet(section, "BottomNavigation", "Top-level destinations. Code: <BottomNavigation>.", navs, 2);
  void set;

  // SegmentedControl
  section = await docSection(
    page,
    "SegmentedControl",
    "source/native/segmented-control · <SegmentedControl options value indicator=\"thumb\"|\"check\">. iOS: a sliding thumb on a grey track. Android (Material 3): outlined segmented buttons with a check on the selected one.",
  );
  const segs: Variant[] = M_PLATFORMS.map((platform) => ({
    props: { Platform: platform },
    build: (c) => mSegmented(c, platform),
  }));
  await mVariantSet(section, "SegmentedControl", "A small set of views or filters. Code: <SegmentedControl>.", segs, 2);

  // Tabs
  section = await docSection(
    page,
    "Tabs",
    "source/components/tabs · <Tabs><TabList><Tab/></TabList><TabPanel/></Tabs>. A scrollable tab row with a sliding underline. The same on both platforms.",
  );
  const tabs: Variant[] = ["Underline", "Contained"].map((style) => ({
    props: { Style: style },
    build: (c) => mTabs(c, style),
  }));
  await mVariantSet(section, "Tabs", "Sections of one screen. Code: <Tabs>.", tabs, 2);
}

async function mAppBar(component: ComponentNode, platform: MPlatform, variant: string) {
  const width = M_DEVICE[platform].width;
  applyLayout(component, { direction: "column", fill: "surface/bg" });
  applySize(component, width, "hug");
  const ios = platform === "iOS";
  const centred = (ios && variant === "Small") || variant === "Center";
  const twoRow = variant === "Large" || variant === "Medium";

  const bar = frame("Bar", { direction: "row", align: "center", gap: 0, padding: [0, ios ? 8 : 4] }, component);
  applySize(bar, "fill", ios ? 44 : 56);

  // Leading slot: fixed width when the title is centred, so it stays centred.
  const lead = frame("Back", { direction: "row", align: "center", gap: 2 }, bar);
  if (ios) {
    icon(lead, "chevronLeft", "accent/default", 24);
    await text(lead, "Back", "iOS/Body", { color: "accent/default" });
  } else {
    mIconSlot(lead, "arrowLeft", "text/primary", 48, 24, "Back icon");
  }
  if (centred) applySize(lead, ios ? 96 : 96, "hug");

  if (twoRow) {
    const spacer = frame("Spacer", { direction: "row" }, bar);
    applySize(spacer, "fill", 1);
  } else {
    const title = await text(bar, "Invoices", ios ? "iOS/Headline" : "Android/Title Large", {
      width: "fill",
      align: centred ? "CENTER" : "LEFT",
      truncate: true,
    });
    title.name = "Title";
  }

  const actions = frame("Actions", { direction: "row", align: "center", justify: "end", gap: 0 }, bar);
  if (ios) {
    mIconSlot(actions, "search", "accent/default", 44, 22);
    mIconSlot(actions, "more", "accent/default", 44, 22);
  } else {
    mIconSlot(actions, "search", "text/primary", 48, 24);
    mIconSlot(actions, "more", "text/primary", 48, 24);
  }
  if (centred) applySize(actions, 96, "hug");

  if (twoRow) {
    const style = ios ? "iOS/Large Title" : variant === "Large" ? "Android/Headline Medium" : "Android/Headline Small";
    const padding: [number, number, number, number] = ios ? [2, 16, 8, 16] : variant === "Large" ? [36, 16, 28, 16] : [12, 16, 20, 16];
    const row = frame("Title row", { direction: "row", padding }, component);
    applySize(row, "fill", "hug");
    const title = await text(row, "Invoices", style, { width: "fill", truncate: true });
    title.name = "Title";
  }
}

const M_NAV_ITEMS: [string, IconName][] = [
  ["Home", "home"],
  ["Invoices", "file"],
  ["Payments", "rupee"],
  ["Profile", "user"],
];

async function mBottomNav(component: ComponentNode, platform: MPlatform, badges: boolean) {
  const ios = platform === "iOS";
  applyLayout(component, { direction: "row", align: "start", fill: ios ? "surface/raised" : "surface/raised", padding: ios ? [6, 0, 0, 0] : [12, 0, 16, 0] });
  applySize(component, M_DEVICE[platform].width, ios ? 49 : 80);
  setStroke(component, ios ? "border/default" : null, 0.5);
  if (ios) {
    component.strokeTopWeight = 0.5;
    component.strokeBottomWeight = 0;
    component.strokeLeftWeight = 0;
    component.strokeRightWeight = 0;
  }

  for (const [index, [label, glyph]] of M_NAV_ITEMS.entries()) {
    const active = index === 1;
    const item = frame(label, { direction: "column", align: "center", gap: ios ? 2 : 4 }, component);
    applySize(item, "fill", "hug");
    const ink = active ? (ios ? "accent/default" : "accent/strong") : "text/muted";
    const holder = frame("Indicator", {
      direction: "row",
      justify: "center",
      align: "center",
      fill: !ios && active ? "accent/soft" : null,
      radius: ios ? 0 : 16,
    }, item);
    applySize(holder, ios ? 32 : 64, ios ? 26 : 32);
    icon(holder, glyph, ink, ios ? 24 : 24);
    await text(item, label, ios ? "iOS/Tab" : "Android/Label Medium", { color: active ? (ios ? "accent/default" : "text/primary") : "text/muted" });

    if (badges && (index === 1 || index === 2 || index === 3)) {
      // Added after the icon, so the holder already has its size.
      const dot = index === 3;
      const badge = frame("Badge", { direction: "row", justify: "center", align: "center", padding: dot ? 0 : [0, 4], fill: "status/danger", radius: 999 }, holder);
      badge.layoutPositioning = "ABSOLUTE";
      if (dot) {
        applySize(badge, 8, 8);
      } else {
        await text(badge, index === 1 ? "3" : "99+", "Android/Label Small", { color: "status/on-danger" });
        applySize(badge, "hug", 16);
      }
      badge.x = ios ? 20 : 36;
      badge.y = ios ? -2 : 2;
    }
  }
}

async function mSegmented(component: ComponentNode, platform: MPlatform) {
  const labels = ["Week", "Month", "Quarter"];
  if (platform === "iOS") {
    applyLayout(component, { direction: "row", padding: 2, gap: 0, fill: "surface/subtle", radius: 9 });
    applySize(component, 340, 32);
    for (const [index, label] of labels.entries()) {
      const selected = index === 1;
      const seg = frame(label, { direction: "row", justify: "center", align: "center", fill: selected ? "surface/raised" : null, radius: 7 }, component);
      applySize(seg, "fill", "fill");
      if (selected) seg.effects = [shadow(1, 4, 0, 0.12)];
      await text(seg, label, "iOS/Subhead", { color: "text/primary" });
    }
    return;
  }
  applyLayout(component, { direction: "row", gap: 0, stroke: "border/control", radius: 999, clip: true });
  applySize(component, 340, 40);
  for (const [index, label] of labels.entries()) {
    const selected = index === 0;
    if (index > 0) {
      const divider = frame("Divider", { direction: "none", fill: "border/control" }, component);
      applySize(divider, 1, "fill");
    }
    const seg = frame(label, { direction: "row", justify: "center", align: "center", gap: 8, fill: selected ? "accent/soft" : null }, component);
    applySize(seg, "fill", "fill");
    if (selected) icon(seg, "check", "accent/strong", 18);
    await text(seg, label, "Android/Label Large", { color: selected ? "accent/strong" : "text/primary" });
  }
}

async function mTabs(component: ComponentNode, style: string) {
  const underline = style === "Underline";
  applyLayout(component, {
    direction: "row",
    gap: underline ? 4 : 4,
    padding: underline ? [0, 8] : 4,
    fill: underline ? "surface/bg" : "surface/subtle",
    radius: underline ? 0 : "radius/md",
  });
  applySize(component, 361, underline ? 48 : 44);
  if (underline) {
    setStroke(component, "border/default", 1);
    component.strokeTopWeight = 0;
    component.strokeLeftWeight = 0;
    component.strokeRightWeight = 0;
    component.strokeBottomWeight = 1;
  }
  for (const [index, label] of ["All", "Unpaid", "Paid"].entries()) {
    const active = index === 1;
    const tab = frame(label, {
      direction: "column",
      justify: "center",
      align: "center",
      padding: [0, 12],
      fill: !underline && active ? "surface/raised" : null,
      radius: underline ? 0 : "radius/sm",
    }, component);
    applySize(tab, underline ? "hug" : "fill", "fill");
    await text(tab, label, "Kit/Label", { color: active ? (underline ? "accent/default" : "text/primary") : "text/muted" });
    if (underline && active) {
      const bar = frame("Indicator", { direction: "none", fill: "accent/default", radius: 1 }, tab);
      bar.layoutPositioning = "ABSOLUTE";
      bar.resize(40, 2);
      bar.y = 46;
      bar.x = 0;
      bar.constraints = { horizontal: "STRETCH", vertical: "MAX" };
    }
  }
}

/* =============================================================== actions */

const M_BUTTON: Record<string, { fill: string | null; ink: string; line: string | null }> = {
  Primary: { fill: "accent/default", ink: "accent/on-accent", line: "accent/default" },
  Secondary: { fill: "surface/subtle", ink: "text/primary", line: "surface/subtle" },
  Outline: { fill: null, ink: "text/primary", line: "border/default" },
  Ghost: { fill: null, ink: "text/primary", line: null },
  Danger: { fill: "status/danger", ink: "status/on-danger", line: "status/danger" },
};

const M_BUTTON_HEIGHT: Record<SizeName, [number, string]> = {
  sm: [34, "mobile/control-sm"],
  md: [44, "mobile/control-md"],
  lg: [52, "mobile/control-lg"],
};

async function buildMobileActions(page: PageNode) {
  let section = await docSection(
    page,
    "Button (mobile)",
    "source/components/button/native · <Button variant size loading leading icon fullWidth onPress>. Touch sizes 34 / 44 / 52; a small button keeps a 44 hit area through hitSlop. Pressed darkens the fill. An async onPress shows the spinner until it settles. One look on iOS and Android.",
  );
  const variants: Variant[] = [];
  for (const variant of Object.keys(M_BUTTON)) {
    for (const state of ["Default", "Pressed", "Disabled"]) {
      variants.push({ props: { Variant: variant, Size: "md", State: state }, build: (c) => mButton(c, variant, "md", state) });
    }
  }
  for (const size of ["sm", "lg"] as SizeName[]) {
    variants.push({ props: { Variant: "Primary", Size: size, State: "Default" }, build: (c) => mButton(c, "Primary", size, "Default") });
  }
  variants.push({ props: { Variant: "Primary", Size: "md", State: "Loading" }, build: (c) => mButton(c, "Primary", "md", "Loading") });
  let set = await mVariantSet(section, "Button", "Actions. Code: <Button>.", variants, 3);
  textProperty(set, "Label", "Label", "Save invoice");
  booleanProperty(set, "Leading icon", "Leading icon", false);

  // Fab + SpeedDial
  section = await docSection(
    page,
    "Fab and SpeedDial",
    "source/native/fab · <Fab icon label size variant extended placement> and <SpeedDial actions>. The floating action button is a Material pattern: on Android it follows M3 (40 / 56 / 96, radius 12 / 16 / 28, extended pill). iOS has no FAB; the iOS variants are a floating button for apps that use one on both platforms — prefer a toolbar or navigation-bar action in iOS-only designs.",
  );
  const fabs: Variant[] = [];
  for (const size of ["sm", "md", "lg"] as SizeName[]) {
    fabs.push({ props: { Platform: "Android", Size: size, Style: "Primary", Extended: "False" }, build: (c) => mFab(c, "Android", size, "Primary", false) });
  }
  for (const style of ["Secondary", "Surface"]) {
    fabs.push({ props: { Platform: "Android", Size: "md", Style: style, Extended: "False" }, build: (c) => mFab(c, "Android", "md", style, false) });
  }
  fabs.push({ props: { Platform: "Android", Size: "md", Style: "Primary", Extended: "True" }, build: (c) => mFab(c, "Android", "md", "Primary", true) });
  fabs.push({ props: { Platform: "iOS", Size: "md", Style: "Primary", Extended: "False" }, build: (c) => mFab(c, "iOS", "md", "Primary", false) });
  fabs.push({ props: { Platform: "iOS", Size: "md", Style: "Primary", Extended: "True" }, build: (c) => mFab(c, "iOS", "md", "Primary", true) });
  set = await mVariantSet(section, "Fab", "The screen's primary action. Code: <Fab>.", fabs, 5);
  textProperty(set, "Label", "Label", "New invoice");

  await mVariantSet(section, "SpeedDial", "A FAB that opens related actions over a scrim. Code: <SpeedDial actions>.", [
    { props: { State: "Open" }, build: (c) => mSpeedDial(c) },
  ]);
}

async function mButton(component: ComponentNode, variant: string, size: SizeName, state: string) {
  const look = M_BUTTON[variant];
  const [height, token] = M_BUTTON_HEIGHT[size];
  const pressed = state === "Pressed";
  applyLayout(component, {
    direction: "row",
    gap: 8,
    padding: [0, { sm: 12, md: 16, lg: 20 }[size]],
    justify: "center",
    align: "center",
    fill: pressed ? (variant === "Outline" || variant === "Ghost" ? "surface/hover" : look.fill === "accent/default" ? "accent/strong" : look.fill) : look.fill,
    stroke: look.line,
    radius: "radius/md",
  });
  applySize(component, "hug", height);
  bindNumber(component, "height", token);
  if (state === "Disabled") component.opacity = 0.5;
  icon(component, "plus", look.ink, size === "sm" ? 16 : 18).name = "Leading icon";
  const label = await text(component, "Save invoice", size === "sm" ? "Kit/Label Small" : "Kit/Label", { color: look.ink });
  label.name = "Label";
  if (state === "Loading") {
    label.opacity = 0;
    const spinner = icon(component, "spinnerArc", look.ink, 18);
    spinner.name = "Spinner";
    spinner.layoutPositioning = "ABSOLUTE";
    // The label keeps the button's width (hidden, not removed), so centre on that.
    spinner.x = Math.round((component.width - spinner.width) / 2);
    spinner.y = Math.round((component.height - spinner.height) / 2);
    spinner.constraints = { horizontal: "CENTER", vertical: "CENTER" };
  }
}

const M_FAB_LOOK: Record<string, { fill: string; ink: string }> = {
  Primary: { fill: "accent/default", ink: "accent/on-accent" },
  Secondary: { fill: "accent/soft", ink: "accent/strong" },
  Surface: { fill: "surface/raised", ink: "accent/default" },
};

async function mFab(component: ComponentNode, platform: MPlatform, size: SizeName, style: string, extended: boolean) {
  const look = M_FAB_LOOK[style];
  const side = { sm: 40, md: 56, lg: 96 }[size];
  const radius = platform === "iOS" ? 999 : { sm: 12, md: 16, lg: 28 }[size];
  applyLayout(component, {
    direction: "row",
    gap: 12,
    padding: extended ? [0, 20, 0, 16] : 0,
    justify: "center",
    align: "center",
    fill: look.fill,
    radius,
  });
  applySize(component, extended ? "hug" : side, side);
  component.effects = M_SHADOW();
  icon(component, "plus", look.ink, { sm: 20, md: 24, lg: 36 }[size]).name = "Icon";
  if (extended) {
    const label = await text(component, "New invoice", platform === "iOS" ? "iOS/Headline" : "Android/Label Large", { color: look.ink });
    label.name = "Label";
  }
}

async function mSpeedDial(component: ComponentNode) {
  applyLayout(component, { direction: "column", justify: "end", align: "end", gap: 16, padding: 16, fill: "surface/backdrop" });
  applySize(component, 360, 420);
  for (const [label, glyph] of [["Invoice", "file"], ["Payment", "rupee"], ["Customer", "user"]] as [string, IconName][]) {
    const row = frame(label, { direction: "row", gap: 16, align: "center", padding: [0, 8, 0, 0] }, component);
    const chip = frame("Label", { direction: "row", padding: [6, 12], fill: "surface/raised", radius: "radius/md" }, row);
    chip.effects = [shadow(2, 6, 0, 0.12)];
    await text(chip, label, "Kit/Body");
    const mini = frame("Action", { direction: "row", justify: "center", align: "center", fill: "accent/soft", radius: 12 }, row);
    applySize(mini, 40, 40);
    icon(mini, glyph, "accent/strong", 20);
  }
  const main = frame("Close", { direction: "row", justify: "center", align: "center", fill: "accent/default", radius: 16 }, component);
  applySize(main, 56, 56);
  main.effects = M_SHADOW();
  icon(main, "x", "accent/on-accent", 24);
}

/* ================================================================ inputs */

async function buildMobileInputs(page: PageNode) {
  // Fields
  let section = await docSection(
    page,
    "Fields: Input, Select, DatePicker",
    "source/components/{input,combobox,date-picker}/native. 44dp tall, radius 8, the label above and the hint or error below. Select and DatePicker open a bottom sheet on phones and an anchored popover on tablets (presentation=\"auto\"). One look on iOS and Android; the keyboard and pickers are the platform's.",
  );
  const fields: Variant[] = [];
  for (const kind of ["Input", "Select", "Date"]) {
    for (const state of ["Default", "Focused", "Error", "Disabled"]) {
      fields.push({ props: { Kind: kind, State: state }, build: (c) => mField(c, kind, state) });
    }
  }
  let set = await mVariantSet(section, "Field", "Text, choice and date fields. Code: <Input>, <Select>, <DatePicker>.", fields, 4);
  textProperty(set, "Label", "Label", "Customer");
  textProperty(set, "Value", "Value", "Anand Remanan");
  textProperty(set, "Hint", "Hint", "As it appears on the invoice.");

  // SearchBar
  section = await docSection(
    page,
    "SearchBar",
    "source/native/search-bar · <SearchBar value onSearch debounce showCancel>. iOS: a 36pt rounded field with a Cancel button while focused. Android (Material 3): a 56dp search bar pill.",
  );
  const searches: Variant[] = [];
  for (const platform of M_PLATFORMS) {
    for (const state of ["Default", "Active"]) {
      searches.push({ props: { Platform: platform, State: state }, build: (c) => mSearch(c, platform, state === "Active") });
    }
  }
  set = await mVariantSet(section, "SearchBar", "Search a list or the app. Code: <SearchBar>.", searches, 2);
  textProperty(set, "Placeholder", "Placeholder", "Search invoices");

  // Switch, Checkbox, Radio
  section = await docSection(
    page,
    "Switch, Checkbox and Radio",
    "Switch: iOS 51×31 with a large thumb; Android (Material 3) 52×32 whose thumb grows when on. Kit's Switch follows the same proportions and uses the accent colour on both. Checkbox (20, radius 5) and Radio (20) are one look on both platforms; the whole row is the touch target (44 minimum).",
  );
  const switches: Variant[] = [];
  for (const platform of M_PLATFORMS) {
    for (const on of ["False", "True"]) {
      switches.push({ props: { Platform: platform, On: on }, build: (c) => mSwitch(c, platform, on === "True") });
    }
  }
  set = await mVariantSet(section, "Switch", "A setting that applies at once. Code: <Switch>.", switches, 4);
  textProperty(set, "Label", "Label", "Send by email");

  const checks: Variant[] = [];
  for (const checked of ["False", "True", "Mixed"]) {
    for (const state of ["Default", "Disabled"]) {
      checks.push({ props: { Checked: checked, State: state }, build: (c) => mCheck(c, checked, state) });
    }
  }
  checks.push({ props: { Checked: "False", State: "Error" }, build: (c) => mCheck(c, "False", "Error") });
  set = await mVariantSet(section, "Checkbox", "Code: <Checkbox>.", checks, 4);
  textProperty(set, "Label", "Label", "SMS");

  const radios: Variant[] = [];
  for (const selected of ["False", "True"]) {
    for (const state of ["Default", "Disabled"]) {
      radios.push({ props: { Selected: selected, State: state }, build: (c) => mRadio(c, selected === "True", state) });
    }
  }
  set = await mVariantSet(section, "Radio", "Code: <RadioGroup><Radio/></RadioGroup>.", radios, 4);
  textProperty(set, "Label", "Label", "Net 15");
}

async function mField(component: ComponentNode, kind: string, state: string) {
  applyLayout(component, { direction: "column", gap: 6 });
  applySize(component, 320, "hug");
  if (state === "Disabled") component.opacity = 0.5;
  const label = await text(component, "Customer", "Kit/Label Small");
  label.name = "Label";
  const error = state === "Error";
  const focused = state === "Focused";
  const box = frame("Control", {
    direction: "row",
    gap: 8,
    padding: [0, 12],
    align: "center",
    fill: "surface/input",
    stroke: error ? "status/danger" : focused ? "accent/focus" : "border/control",
    strokeWeight: focused || error ? 2 : 1,
    radius: "radius/md",
  }, component);
  applySize(box, "fill", 44);
  bindNumber(box, "height", "mobile/control-md");
  const placeholder = kind === "Input" ? "Anand Remanan" : kind === "Select" ? "Kerala" : "22 Nov 2024";
  const value = await text(box, placeholder, "Kit/Body", { width: "fill", truncate: true });
  value.name = "Value";
  if (kind === "Select") icon(box, "chevronDown", "text/muted", 18);
  if (kind === "Date") icon(box, "calendar", "text/muted", 18);
  const hint = await text(component, error ? "Enter a customer name." : "As it appears on the invoice.", "Kit/Small", {
    color: error ? "status/danger" : "text/muted",
    width: "fill",
  });
  hint.name = "Hint";
}

async function mSearch(component: ComponentNode, platform: MPlatform, active: boolean) {
  if (platform === "iOS") {
    applyLayout(component, { direction: "row", gap: 8, align: "center", padding: [0, 16] });
    applySize(component, 393, 52);
    const field = frame("Field", { direction: "row", gap: 6, align: "center", padding: [0, 8], fill: "surface/subtle", radius: 10 }, component);
    applySize(field, "fill", 36);
    icon(field, "search", "text/muted", 16);
    const placeholder = await text(field, active ? "GST" : "Search invoices", "iOS/Body", { color: active ? "text/primary" : "text/muted", width: "fill" });
    placeholder.name = "Placeholder";
    if (active) {
      const clear = frame("Clear", { direction: "row", justify: "center", align: "center", fill: "text/muted", radius: 999 }, field);
      applySize(clear, 16, 16);
      icon(clear, "x", "surface/bg", 10);
      await text(component, "Cancel", "iOS/Body", { color: "accent/default" });
    }
    return;
  }
  applyLayout(component, { direction: "row", gap: 16, align: "center", padding: [0, 16], fill: "surface/subtle", radius: 28 });
  applySize(component, 380, 56);
  icon(component, active ? "arrowLeft" : "search", "text/primary", 24);
  const placeholder = await text(component, active ? "GST" : "Search invoices", "Android/Body Large", { color: active ? "text/primary" : "text/muted", width: "fill" });
  placeholder.name = "Placeholder";
  if (active) {
    icon(component, "x", "text/primary", 24);
  } else {
    const avatar = frame("Avatar", { direction: "row", justify: "center", align: "center", fill: "accent/soft", radius: 999 }, component);
    applySize(avatar, 30, 30);
    await text(avatar, "AR", "Android/Label Small", { color: "accent/strong" });
  }
}

async function mSwitch(component: ComponentNode, platform: MPlatform, on: boolean) {
  applyLayout(component, { direction: "row", gap: 12, align: "center" });
  applySize(component, "hug", 44);
  const label = await text(component, "Send by email", "Kit/Body");
  label.name = "Label";
  const ios = platform === "iOS";
  const [width, height] = ios ? [51, 31] : [52, 32];
  const track = frame("Track", {
    direction: "row",
    align: "center",
    justify: on ? "end" : "start",
    padding: ios ? 2 : on ? 4 : 8,
    fill: on ? "accent/default" : ios ? "surface/subtle" : "surface/subtle",
    stroke: !ios && !on ? "border/control" : null,
    strokeWeight: 2,
    radius: 999,
  }, component);
  applySize(track, width, height);
  const thumbSize = ios ? 27 : on ? 24 : 16;
  const thumb = frame("Thumb", { direction: "none", fill: ios ? "surface/raised" : on ? "accent/on-accent" : "text/muted", radius: 999 }, track);
  applySize(thumb, thumbSize, thumbSize);
  if (ios) thumb.effects = [shadow(2, 6, 0, 0.18)];
}

async function mCheck(component: ComponentNode, checked: string, state: string) {
  applyLayout(component, { direction: "row", gap: 10, align: "center" });
  applySize(component, "hug", 44);
  if (state === "Disabled") component.opacity = 0.5;
  const on = checked !== "False";
  const box = frame("Box", {
    direction: "row",
    justify: "center",
    align: "center",
    fill: on ? "accent/default" : "surface/input",
    stroke: state === "Error" ? "status/danger" : on ? "accent/default" : "border/control",
    strokeWeight: state === "Error" ? 2 : 1.5,
    radius: 5,
  }, component);
  applySize(box, 20, 20);
  if (on) icon(box, checked === "Mixed" ? "minus" : "check", "accent/on-accent", 14);
  const label = await text(component, "SMS", "Kit/Body");
  label.name = "Label";
}

async function mRadio(component: ComponentNode, selected: boolean, state: string) {
  applyLayout(component, { direction: "row", gap: 10, align: "center" });
  applySize(component, "hug", 44);
  if (state === "Disabled") component.opacity = 0.5;
  const ring = frame("Ring", {
    direction: "row",
    justify: "center",
    align: "center",
    fill: "surface/input",
    stroke: selected ? "accent/default" : "border/control",
    strokeWeight: selected ? 2 : 1.5,
    radius: 999,
  }, component);
  applySize(ring, 20, 20);
  if (selected) {
    const dot = frame("Dot", { direction: "none", fill: "accent/default", radius: 999 }, ring);
    applySize(dot, 10, 10);
  }
  const label = await text(component, "Net 15", "Kit/Body");
  label.name = "Label";
}

/* ============================================================== overlays */

async function buildMobileOverlays(page: PageNode) {
  // BottomSheet
  let section = await docSection(
    page,
    "BottomSheet",
    "source/native/bottom-sheet · <BottomSheet title trigger footer> (on shared Sheet). Drag the handle down, tap outside or press back to dismiss. iOS: a grabber and rounded top corners; Android (Material 3): a drag handle and 28dp corners. Kit's own sheet uses 2 × radius (16).",
  );
  const sheets: Variant[] = M_PLATFORMS.map((platform) => ({ props: { Platform: platform }, build: (c) => mSheet(c, platform) }));
  let set = await mVariantSet(section, "BottomSheet", "Secondary content and actions from the bottom. Code: <BottomSheet>.", sheets, 2);
  textProperty(set, "Title", "Title", "Share invoice");

  // Dialog
  section = await docSection(
    page,
    "Dialog",
    "source/components/dialog/native · dialog.confirm({ title, message, intent }). iOS: a 270pt alert, centred text and stacked or side-by-side buttons. Android (Material 3): a 312dp dialog with 28dp corners and text buttons at the end.",
  );
  const dialogs: Variant[] = [];
  for (const platform of M_PLATFORMS) {
    for (const kind of ["Confirm", "Destructive"]) {
      dialogs.push({ props: { Platform: platform, Kind: kind }, build: (c) => mDialog(c, platform, kind === "Destructive") });
    }
  }
  set = await mVariantSet(section, "Dialog", "Confirm or alert. Code: dialog.confirm().", dialogs, 4);
  textProperty(set, "Title", "Title", "Mark invoice as paid?");
  textProperty(set, "Message", "Message", "INV-2041 · ₹12,500 will move to Paid.");

  // Toast
  section = await docSection(
    page,
    "Toast",
    "source/components/toaster/native · toast.success(…). Kit shows toasts at the top on both platforms by default (position prop). iOS banner style shown first; the Android variant is the Material snackbar, for apps that place toasts at the bottom.",
  );
  const toasts: Variant[] = [];
  for (const intent of ["Info", "Success", "Error"]) {
    toasts.push({ props: { Platform: "iOS", Intent: intent }, build: (c) => mToast(c, "iOS", intent) });
  }
  toasts.push({ props: { Platform: "Android", Intent: "Info" }, build: (c) => mToast(c, "Android", "Info") });
  set = await mVariantSet(section, "Toast", "Brief, non-blocking feedback. Code: toast().", toasts, 2);
  textProperty(set, "Message", "Message", "Invoice saved");

  // Menu
  section = await docSection(
    page,
    "Menu",
    "source/components/menu/native · <Menu presentation=\"auto\">. On a phone Kit opens a menu as an action sheet; on a tablet as an anchored menu. iOS: context menu (250pt, 13pt corners) and action sheet with Cancel. Android (Material 3): a 4dp-corner menu and a sheet list.",
  );
  const menus: Variant[] = [];
  for (const platform of M_PLATFORMS) {
    for (const kind of ["Menu", "Sheet"]) {
      menus.push({ props: { Platform: platform, Kind: kind }, build: (c) => mMenu(c, platform, kind === "Sheet") });
    }
  }
  await mVariantSet(section, "Menu", "Actions on an item. Code: <Menu>.", menus, 4);
}

async function mSheetRow(parent: FrameNode | ComponentNode, label: string, glyph: IconName, platform: MPlatform, danger = false) {
  const row = frame(label, { direction: "row", gap: platform === "iOS" ? 12 : 16, align: "center", padding: [0, platform === "iOS" ? 16 : 24] }, parent);
  applySize(row, "fill", platform === "iOS" ? 48 : 56);
  icon(row, glyph, danger ? "status/danger" : platform === "iOS" ? "accent/default" : "text/muted", 22);
  await text(row, label, platform === "iOS" ? "iOS/Body" : "Android/Body Large", { color: danger ? "status/danger" : "text/primary", width: "fill" });
}

async function mSheet(component: ComponentNode, platform: MPlatform) {
  const ios = platform === "iOS";
  applyLayout(component, { direction: "column", gap: 0, padding: [0, 0, ios ? 34 : 24, 0], fill: "surface/raised" });
  applySize(component, M_DEVICE[platform].width, "hug");
  mTopRadius(component, ios ? 12 : 28);
  component.effects = M_SHADOW();
  const grip = frame("Handle", { direction: "row", justify: "center", padding: ios ? [5, 0, 6, 0] : [22, 0, 16, 0] }, component);
  applySize(grip, "fill", "hug");
  const handle = frame("Bar", { direction: "none", fill: "border/control", radius: 999 }, grip);
  applySize(handle, ios ? 36 : 32, ios ? 5 : 4);
  const head = frame("Header", { direction: "row", padding: [4, ios ? 16 : 24, 12, ios ? 16 : 24] }, component);
  applySize(head, "fill", "hug");
  const title = await text(head, "Share invoice", ios ? "iOS/Headline" : "Android/Title Large", { width: "fill", align: ios ? "CENTER" : "LEFT" });
  title.name = "Title";
  await mSheetRow(component, "Send on WhatsApp", "share", platform);
  await mSheetRow(component, "Copy link", "file", platform);
  await mSheetRow(component, "Download PDF", "download", platform);
  await mSheetRow(component, "Delete", "trash", platform, true);
}

async function mDialog(component: ComponentNode, platform: MPlatform, destructive: boolean) {
  if (platform === "iOS") {
    applyLayout(component, { direction: "column", fill: "surface/raised", radius: 14, clip: true });
    applySize(component, 270, "hug");
    const body = frame("Body", { direction: "column", gap: 2, align: "center", padding: [19, 16, 18, 16] }, component);
    applySize(body, "fill", "hug");
    const title = await text(body, "Mark invoice as paid?", "iOS/Headline", { width: "fill", align: "CENTER" });
    title.name = "Title";
    const message = await text(body, "INV-2041 · ₹12,500 will move to Paid.", "iOS/Footnote", { width: "fill", align: "CENTER" });
    message.name = "Message";
    const actions = frame("Actions", { direction: "row", stroke: "border/default", strokeWeight: 0.5 }, component);
    applySize(actions, "fill", 44);
    actions.strokeBottomWeight = 0;
    actions.strokeLeftWeight = 0;
    actions.strokeRightWeight = 0;
    for (const [index, label] of ["Cancel", destructive ? "Delete" : "Mark paid"].entries()) {
      const button = frame(label, { direction: "row", justify: "center", align: "center", stroke: index === 1 ? "border/default" : null, strokeWeight: 0.5 }, actions);
      if (index === 1) {
        button.strokeTopWeight = 0;
        button.strokeRightWeight = 0;
        button.strokeBottomWeight = 0;
      }
      applySize(button, "fill", "fill");
      await text(button, label, index === 1 ? "iOS/Headline" : "iOS/Body", {
        color: index === 1 && destructive ? "status/danger" : "accent/default",
      });
    }
    return;
  }
  applyLayout(component, { direction: "column", gap: 16, padding: 24, fill: "surface/raised", radius: 28 });
  applySize(component, 312, "hug");
  if (destructive) icon(component, "trash", "status/danger", 24);
  const title = await text(component, "Mark invoice as paid?", "Android/Headline Small", { width: "fill" });
  title.name = "Title";
  const message = await text(component, "INV-2041 · ₹12,500 will move to Paid.", "Android/Body Medium", { color: "text/muted", width: "fill" });
  message.name = "Message";
  const actions = frame("Actions", { direction: "row", justify: "end", gap: 8, padding: [8, 0, 0, 0] }, component);
  applySize(actions, "fill", "hug");
  for (const [index, label] of ["Cancel", destructive ? "Delete" : "Mark paid"].entries()) {
    const button = frame(label, { direction: "row", justify: "center", align: "center", padding: [0, 12], radius: 999 }, actions);
    applySize(button, "hug", 40);
    await text(button, label, "Android/Label Large", { color: index === 1 && destructive ? "status/danger" : "accent/default" });
  }
}

const M_INTENT: Record<string, [string, IconName]> = {
  Info: ["status/info", "info"],
  Success: ["status/success", "success"],
  Error: ["status/danger", "danger"],
};

async function mToast(component: ComponentNode, platform: MPlatform, intent: string) {
  if (platform === "iOS") {
    const [colour, glyph] = M_INTENT[intent];
    applyLayout(component, { direction: "row", gap: 12, align: "center", padding: [12, 16], fill: "surface/raised", radius: 14 });
    applySize(component, 361, "hug");
    component.effects = M_SHADOW();
    icon(component, glyph, colour, 22);
    const copy = frame("Text", { direction: "column", gap: 2 }, component);
    applySize(copy, "fill", "hug");
    const message = await text(copy, "Invoice saved", "iOS/Headline", { width: "fill" });
    message.name = "Message";
    await text(copy, "INV-2041 was sent to Anand.", "iOS/Subhead", { color: "text/muted", width: "fill" });
    return;
  }
  applyLayout(component, { direction: "row", gap: 12, align: "center", padding: [14, 8, 14, 16], fill: "surface/tooltip", radius: 4 });
  applySize(component, 380, "hug");
  component.effects = M_SHADOW();
  const message = await text(component, "Invoice saved", "Android/Body Medium", { color: "text/on-tooltip", width: "fill" });
  message.name = "Message";
  const action = frame("Action", { direction: "row", padding: [0, 12], align: "center" }, component);
  applySize(action, "hug", 36);
  await text(action, "Undo", "Android/Label Large", { color: "accent/soft" });
}

async function mMenu(component: ComponentNode, platform: MPlatform, sheet: boolean) {
  const items: [string, IconName, boolean][] = [
    ["Edit", "file", false],
    ["Share", "share", false],
    ["Download PDF", "download", false],
    ["Delete", "trash", true],
  ];
  if (platform === "iOS" && !sheet) {
    applyLayout(component, { direction: "column", fill: "surface/raised", radius: 13, clip: true });
    applySize(component, 250, "hug");
    component.effects = M_SHADOW();
    for (const [index, [label, glyph, danger]] of items.entries()) {
      const row = frame(label, { direction: "row", justify: "between", align: "center", padding: [0, 16], stroke: index > 0 ? "border/default" : null, strokeWeight: 0.5 }, component);
      if (index > 0) {
        row.strokeBottomWeight = 0;
        row.strokeLeftWeight = 0;
        row.strokeRightWeight = 0;
      }
      applySize(row, "fill", 44);
      await text(row, label, "iOS/Body", { color: danger ? "status/danger" : "text/primary" });
      icon(row, glyph, danger ? "status/danger" : "text/primary", 20);
    }
    return;
  }
  if (platform === "iOS") {
    applyLayout(component, { direction: "column", gap: 8, padding: [0, 0, 0, 0] });
    applySize(component, 361, "hug");
    const group = frame("Actions", { direction: "column", fill: "surface/raised", radius: 14, clip: true }, component);
    applySize(group, "fill", "hug");
    const head = frame("Header", { direction: "row", justify: "center", padding: [14, 16] }, group);
    applySize(head, "fill", "hug");
    await text(head, "INV-2041", "iOS/Footnote", { color: "text/muted" });
    for (const [label, , danger] of items) {
      const row = frame(label, { direction: "row", justify: "center", align: "center", stroke: "border/default", strokeWeight: 0.5 }, group);
      row.strokeBottomWeight = 0;
      row.strokeLeftWeight = 0;
      row.strokeRightWeight = 0;
      applySize(row, "fill", 57);
      await text(row, label, "iOS/Body", { color: danger ? "status/danger" : "accent/default" });
    }
    const cancel = frame("Cancel", { direction: "row", justify: "center", align: "center", fill: "surface/raised", radius: 14 }, component);
    applySize(cancel, "fill", 57);
    await text(cancel, "Cancel", "iOS/Headline", { color: "accent/default" });
    return;
  }
  if (!sheet) {
    applyLayout(component, { direction: "column", padding: [8, 0], fill: "surface/raised", radius: 4 });
    applySize(component, 200, "hug");
    component.effects = M_SHADOW();
    for (const [label, glyph, danger] of items) {
      const row = frame(label, { direction: "row", gap: 12, align: "center", padding: [0, 12] }, component);
      applySize(row, "fill", 48);
      icon(row, glyph, danger ? "status/danger" : "text/muted", 24);
      await text(row, label, "Android/Body Large", { color: danger ? "status/danger" : "text/primary" });
    }
    return;
  }
  applyLayout(component, { direction: "column", padding: [0, 0, 24, 0], fill: "surface/raised" });
  applySize(component, 412, "hug");
  mTopRadius(component, 28);
  const grip = frame("Handle", { direction: "row", justify: "center", padding: [22, 0, 16, 0] }, component);
  applySize(grip, "fill", "hug");
  const handle = frame("Bar", { direction: "none", fill: "border/control", radius: 999 }, grip);
  applySize(handle, 32, 4);
  for (const [label, glyph, danger] of items) await mSheetRow(component, label, glyph, "Android", danger);
}

/* =============================================================== display */

const M_TONES: Record<string, string> = {
  Neutral: "text/muted",
  Accent: "accent/default",
  Success: "status/success",
  Warning: "status/warning",
  Danger: "status/danger",
};

async function buildMobileDisplay(page: PageNode) {
  // ListItem
  let section = await docSection(
    page,
    "ListItem and List",
    "source/native/list-item · <List variant=\"inset\"|\"plain\"><ListSection header><ListItem title description leading trailing value chevron onPress/></ListSection></List>. iOS: inset grouped rows on a grouped background, a value and a chevron at the end. Android (Material 3): full-width rows 56 / 72dp, a leading icon or avatar.",
  );
  const rows: Variant[] = [];
  for (const platform of M_PLATFORMS) {
    for (const kind of ["Navigation", "Value", "Two-line"]) {
      rows.push({ props: { Platform: platform, Kind: kind }, build: (c) => mListItem(c, platform, kind) });
    }
  }
  const set = await mVariantSet(section, "ListItem", "A row in a list. Code: <ListItem>.", rows, 3);
  textProperty(set, "Title", "Title", "Currency");
  textProperty(set, "Value", "Value", "INR (₹)");
  textProperty(set, "Supporting", "Supporting", "Invoice INV-2041 is ready for review.");

  const example = await exampleRow(section, "Examples — iOS inset grouped (settings) and Android list (inbox)");
  const ios = frame("iOS settings", { direction: "column", gap: 8, padding: [16, 16], fill: "surface/grouped", radius: 16 }, example);
  applySize(ios, 393, "hug");
  await text(ios, "ACCOUNT", "iOS/Footnote", { color: "text/muted" });
  const group = frame("Group", { direction: "column", fill: "surface/raised", radius: 10, clip: true }, ios);
  applySize(group, "fill", "hug");
  for (const [title, value] of [["Business name", "Grampro Books"], ["Currency", "INR (₹)"], ["Theme", "System"]]) {
    const row = instance(group, set, { Platform: "iOS", Kind: "Value" });
    applySize(row, "fill");
    setInstanceText(row, "Title", title);
    setInstanceText(row, "Value", value);
  }
  const android = frame("Android inbox", { direction: "column", fill: "surface/bg", radius: 16, clip: true }, example);
  applySize(android, 412, "hug");
  for (const [title, line] of [["Anand Remanan", "Invoice INV-2041 is ready for review."], ["Gita Hari", "Shared the Q3 ledger with you."], ["Ledger bot", "3 payments matched automatically."]]) {
    const row = instance(android, set, { Platform: "Android", Kind: "Two-line" });
    applySize(row, "fill");
    setInstanceText(row, "Title", title);
    setInstanceText(row, "Supporting", line);
  }

  // Card, Stat
  section = await docSection(
    page,
    "Card and Stat",
    "source/components/card/native · <Card variant><CardHeader/><CardBody/><CardFooter/></Card> and <Stat label value trend>. Elevated cards use the raised surface, which is lighter than the page in dark mode where a shadow barely shows.",
  );
  await mVariantSet(section, "Card", "Grouped content. Code: <Card>.", ["Outlined", "Elevated", "Plain"].map((variant) => ({
    props: { Variant: variant },
    build: (c) => mCard(c, variant),
  })), 3);
  const stats = await mVariantSet(section, "Stat", "A number and its trend. Code: <Stat>.", ["Up", "Down", "Flat"].map((trend) => ({
    props: { Trend: trend },
    build: (c) => mStat(c, trend),
  })), 3);
  textProperty(stats, "Label", "Label", "Revenue");
  textProperty(stats, "Value", "Value", "₹12.4L");

  // Badge, Avatar
  section = await docSection(
    page,
    "Badge and Avatar",
    "Badge: soft and solid, five tones. Avatar: initials coloured from the name (or an image), with an optional status dot. One look on both platforms.",
  );
  const badges: Variant[] = [];
  for (const style of ["Soft", "Solid"]) {
    for (const tone of Object.keys(M_TONES)) {
      badges.push({ props: { Style: style, Tone: tone }, build: (c) => mBadge(c, style, tone) });
    }
  }
  const badgeSet = await mVariantSet(section, "Badge", "Status and counts. Code: <Badge>.", badges, 5);
  textProperty(badgeSet, "Label", "Label", "Unpaid");
  const avatars: Variant[] = [];
  for (const size of ["sm", "md", "lg"] as SizeName[]) {
    for (const status of ["None", "Online"]) {
      avatars.push({ props: { Size: size, Status: status }, build: (c) => mAvatar(c, size, status === "Online") });
    }
  }
  const avatarSet = await mVariantSet(section, "Avatar", "A person or business. Code: <Avatar name>.", avatars, 6);
  textProperty(avatarSet, "Initials", "Initials", "AR");

  // Feedback
  section = await docSection(
    page,
    "Alert, Progress, Spinner and Skeleton",
    "Feedback, one look on both platforms. Progress and Spinner animate on the native driver; under Reduce Motion they stop moving.",
  );
  const alerts = await mVariantSet(section, "Alert", "An inline message. Code: <Alert intent>.", ["Info", "Success", "Warning", "Danger"].map((tone) => ({
    props: { Intent: tone },
    build: (c) => mAlert(c, tone),
  })), 2);
  textProperty(alerts, "Title", "Title", "3 invoices are overdue");
  await mVariantSet(section, "Progress", "Determinate or indeterminate. Code: <Progress>, <CircularProgress>.", [
    { props: { Kind: "Linear", Value: "35%" }, build: (c) => mProgress(c, false, 0.35) },
    { props: { Kind: "Linear", Value: "100%" }, build: (c) => mProgress(c, false, 1) },
    { props: { Kind: "Circular", Value: "35%" }, build: (c) => mProgress(c, true, 0.35) },
    { props: { Kind: "Circular", Value: "88%" }, build: (c) => mProgress(c, true, 0.88) },
  ], 4);
  await mVariantSet(section, "Spinner", "Code: <Spinner size>.", (["sm", "md", "lg"] as SizeName[]).map((size) => ({
    props: { Size: size },
    build: (c) => mSpinner(c, size),
  })), 3);
  await mVariantSet(section, "Skeleton", "Loading placeholders. Code: <Skeleton>.", ["List row", "Card"].map((kind) => ({
    props: { Kind: kind },
    build: (c) => mSkeleton(c, kind),
  })), 2);
}

async function mListItem(component: ComponentNode, platform: MPlatform, kind: string) {
  const ios = platform === "iOS";
  const two = kind === "Two-line";
  applyLayout(component, { direction: "row", gap: ios ? 12 : 16, align: "center", padding: ios ? [two ? 10 : 0, 16] : [8, 16, 8, 16], fill: ios ? "surface/raised" : "surface/bg" });
  applySize(component, M_DEVICE[platform].width, ios ? (two ? "hug" : 44) : two ? 72 : 56);
  const lead = frame("Leading", { direction: "row", justify: "center", align: "center", fill: ios ? "accent/default" : two ? "accent/soft" : null, radius: ios ? 7 : 999 }, component);
  if (ios) {
    applySize(lead, 29, 29);
    icon(lead, two ? "user" : "settings", "accent/on-accent", 18);
  } else if (two) {
    applySize(lead, 40, 40);
    await text(lead, "AR", "Android/Title Medium", { color: "accent/strong" });
  } else {
    applySize(lead, 24, 24);
    icon(lead, "settings", "text/muted", 24);
  }
  const copy = frame("Text", { direction: "column", gap: 2 }, component);
  applySize(copy, "fill", "hug");
  const title = await text(copy, two ? "Anand Remanan" : "Currency", ios ? "iOS/Body" : "Android/Body Large", { width: "fill", truncate: true });
  title.name = "Title";
  if (two) {
    const supporting = await text(copy, "Invoice INV-2041 is ready for review.", ios ? "iOS/Subhead" : "Android/Body Medium", { color: "text/muted", width: "fill" });
    supporting.name = "Supporting";
  }
  if (kind === "Value") {
    const value = await text(component, "INR (₹)", ios ? "iOS/Body" : "Android/Body Medium", { color: "text/muted" });
    value.name = "Value";
  }
  if (kind !== "Two-line" || ios) icon(component, "chevronRight", "text/muted", ios ? 16 : 24);
  if (two && !ios) await text(component, "09:41", "Android/Label Small", { color: "text/muted" });
}

async function mCard(component: ComponentNode, variant: string) {
  applyLayout(component, {
    direction: "column",
    gap: 12,
    padding: 16,
    fill: variant === "Elevated" ? "surface/raised" : variant === "Plain" ? null : "surface/bg",
    stroke: variant === "Outlined" ? "border/default" : null,
    radius: "radius/md",
  });
  applySize(component, 361, "hug");
  if (variant === "Elevated") component.effects = M_SHADOW();
  const head = frame("Header", { direction: "row", gap: 12, align: "start" }, component);
  applySize(head, "fill", "hug");
  const copy = frame("Heading", { direction: "column", gap: 2 }, head);
  applySize(copy, "fill", "hug");
  await text(copy, `${variant} card`, "Kit/Title", { width: "fill" });
  await text(copy, "Header, body and footer share the card's padding.", "Kit/Small", { color: "text/muted", width: "fill" });
  await text(component, "The body is where the content goes.", "Kit/Body", { width: "fill" });
  const footer = frame("Footer", { direction: "row", gap: 8, justify: "end" }, component);
  applySize(footer, "fill", "hug");
  for (const [label, primary] of [["Cancel", false], ["Save", true]] as [string, boolean][]) {
    const button = frame(label, { direction: "row", justify: "center", align: "center", padding: [0, 14], fill: primary ? "accent/default" : null, stroke: primary ? null : "border/default", radius: "radius/md" }, footer);
    applySize(button, "hug", 36);
    await text(button, label, "Kit/Label Small", { color: primary ? "accent/on-accent" : "text/primary" });
  }
}

async function mStat(component: ComponentNode, trend: string) {
  applyLayout(component, { direction: "column", gap: 6, padding: 16, fill: "surface/bg", stroke: "border/default", radius: "radius/md" });
  applySize(component, 172, "hug");
  const label = await text(component, "Revenue", "Kit/Small", { color: "text/muted" });
  label.name = "Label";
  const value = await text(component, "₹12.4L", "Kit/Stat");
  value.name = "Value";
  const colour = trend === "Up" ? "status/success" : trend === "Down" ? "status/danger" : "text/muted";
  const row = frame("Trend", { direction: "row", gap: 4, align: "center" }, component);
  icon(row, trend === "Up" ? "arrowUp" : trend === "Down" ? "arrowDown" : "arrowFlat", colour, 14);
  await text(row, trend === "Flat" ? "0%" : "12.4%", "Kit/Label Small", { color: colour });
  await text(component, "vs last month", "Kit/Small", { color: "text/muted" });
}

async function mBadge(component: ComponentNode, style: string, tone: string) {
  const colour = M_TONES[tone];
  const solid = style === "Solid";
  applyLayout(component, { direction: "row", padding: [3, 10], align: "center", radius: 999 });
  applySize(component, "hug", "hug");
  if (solid) setFill(component, tone === "Neutral" ? "text/primary" : colour);
  else if (tone === "Neutral") setFill(component, "surface/subtle");
  else setTint(component, colour, 0.14);
  const label = await text(component, "Unpaid", "Kit/Label Small", {
    color: solid ? (tone === "Neutral" ? "surface/bg" : "accent/on-accent") : tone === "Neutral" ? "text/primary" : colour,
  });
  label.name = "Label";
}

async function mAvatar(component: ComponentNode, size: SizeName, online: boolean) {
  const side = { sm: 32, md: 40, lg: 56 }[size];
  applyLayout(component, { direction: "row", justify: "center", align: "center", radius: 999 });
  applySize(component, side, side);
  setTint(component, "status/warning", 0.18);
  const initials = await text(component, "AR", size === "lg" ? "Kit/Title" : "Kit/Label Small", { color: "status/warning" });
  initials.name = "Initials";
  if (online) {
    const dot = frame("Status", { direction: "none", fill: "status/success", stroke: "surface/bg", strokeWeight: 2, radius: 999 }, component);
    dot.layoutPositioning = "ABSOLUTE";
    const d = Math.round(side / 4);
    dot.resize(d, d);
    dot.x = side - d;
    dot.y = side - d;
  }
}

async function mAlert(component: ComponentNode, tone: string) {
  const colour = tone === "Info" ? "status/info" : tone === "Success" ? "status/success" : tone === "Warning" ? "status/warning" : "status/danger";
  const glyph: IconName = tone === "Info" ? "info" : tone === "Success" ? "success" : tone === "Warning" ? "warning" : "danger";
  applyLayout(component, { direction: "row", gap: 12, align: "start", padding: [12, 14, 12, 16], stroke: "border/default", radius: "radius/md" });
  setTint(component, colour, 0.08);
  applySize(component, 361, "hug");
  icon(component, glyph, colour, 20);
  const copy = frame("Text", { direction: "column", gap: 2 }, component);
  applySize(copy, "fill", "hug");
  const title = await text(copy, "3 invoices are overdue", "Kit/Label", { width: "fill" });
  title.name = "Title";
  await text(copy, "Send a reminder or mark them paid.", "Kit/Small", { color: "text/muted", width: "fill" });
  edgeBar(component, colour, 3);
}

async function mProgress(component: ComponentNode, circular: boolean, value: number) {
  if (!circular) {
    applyLayout(component, { direction: "column", gap: 8 });
    applySize(component, 300, "hug");
    const head = frame("Head", { direction: "row", justify: "between" }, component);
    applySize(head, "fill", "hug");
    await text(head, "Collection target", "Kit/Body");
    await text(head, `${Math.round(value * 100)}%`, "Kit/Small", { color: "text/muted" });
    const track = frame("Track", { direction: "row", fill: "surface/subtle", radius: 999, clip: true }, component);
    applySize(track, "fill", 6);
    const bar = frame("Bar", { direction: "none", fill: value >= 1 ? "status/success" : "accent/default", radius: 999 }, track);
    applySize(bar, Math.max(1, Math.round(300 * value)), 6);
    return;
  }
  applyLayout(component, { direction: "row", justify: "center", align: "center" });
  applySize(component, 64, 64);
  const ring = figma.createEllipse();
  ring.name = "Track";
  component.appendChild(ring);
  ring.resize(64, 64);
  ring.arcData = { startingAngle: 0, endingAngle: Math.PI * 2, innerRadius: 0.82 };
  setFill(ring, "surface/subtle");
  ring.layoutPositioning = "ABSOLUTE";
  const arc = figma.createEllipse();
  arc.name = "Value";
  component.appendChild(arc);
  arc.resize(64, 64);
  arc.arcData = { startingAngle: -Math.PI / 2, endingAngle: -Math.PI / 2 + Math.PI * 2 * value, innerRadius: 0.82 };
  setFill(arc, "accent/default");
  arc.layoutPositioning = "ABSOLUTE";
  await text(component, `${Math.round(value * 100)}%`, "Kit/Label Small");
}

async function mSpinner(component: ComponentNode, size: SizeName) {
  const side = { sm: 16, md: 24, lg: 40 }[size];
  applyLayout(component, { direction: "row", justify: "center", align: "center" });
  applySize(component, side, side);
  for (const [name, start, end, opacity] of [["Track", 0, Math.PI * 2, 0.25], ["Arc", -Math.PI / 2, 0, 1]] as [string, number, number, number][]) {
    const ellipse = figma.createEllipse();
    ellipse.name = name;
    component.appendChild(ellipse);
    ellipse.resize(side, side);
    ellipse.arcData = { startingAngle: start, endingAngle: end, innerRadius: 0.78 };
    setFill(ellipse, "accent/default");
    ellipse.opacity = opacity;
    ellipse.layoutPositioning = "ABSOLUTE";
  }
}

async function mSkeleton(component: ComponentNode, kind: string) {
  if (kind === "List row") {
    applyLayout(component, { direction: "row", gap: 12, align: "center", padding: [8, 0] });
    applySize(component, 361, "hug");
    const avatar = frame("Avatar", { direction: "none", fill: "surface/skeleton", radius: 999 }, component);
    applySize(avatar, 40, 40);
    const lines = frame("Lines", { direction: "column", gap: 8 }, component);
    applySize(lines, "fill", "hug");
    for (const width of [220, 140]) {
      const line = frame("Line", { direction: "none", fill: "surface/skeleton", radius: "radius/xs" }, lines);
      applySize(line, width, 12);
    }
    return;
  }
  applyLayout(component, { direction: "column", gap: 10, padding: 16, stroke: "border/default", radius: "radius/md" });
  applySize(component, 361, "hug");
  const block = frame("Media", { direction: "none", fill: "surface/skeleton", radius: "radius/md" }, component);
  applySize(block, "fill", 120);
  for (const width of [300, 260, 180]) {
    const line = frame("Line", { direction: "none", fill: "surface/skeleton", radius: "radius/xs" }, component);
    applySize(line, width, 12);
  }
}
