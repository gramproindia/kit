// Mobile · Foundations and Mobile · Screens. The screens are built from
// instances of the Mobile/ component sets, so they update when a component
// does, and each is drawn in Light and Dark through the color collection's
// variable modes. BETA.

/* =========================================================== foundations */

async function buildMobileFoundations(page: PageNode) {
  await docSection(
    page,
    "GramproKit Mobile — foundations (BETA)",
    [
      "The design system for the GramproKit React Native components (npx @grampro/kit@native add …). BETA: the native kit is in prerelease and may change or break between prereleases.",
      "Mobile shares every colour variable with the web kit, so one Light/Dark mode switch restyles both. The tokens below exist only on mobile: the raised surface, touch targets, control heights, safe areas and the iOS and Android type ramps. Kit components render one look on both platforms unless their set has a Platform property.",
    ].join("\n\n"),
  );
  await mFoundationColors(page);
  await mFoundationType(page);
  await mFoundationSizes(page);
  await mFoundationSafeAreas(page);
}

async function mFoundationColors(page: PageNode) {
  const section = await docSection(
    page,
    "Mobile colour tokens",
    "Added to “Grampro Kit · Color”. surface/raised is what sheets, menus and elevated cards sit on: in dark mode it is lighter than the page, because a shadow on near-black barely shows. surface/grouped is the iOS grouped-list background.",
  );
  const row = frame("Modes", { direction: "row", gap: 24, align: "start" }, section);
  for (const [label, mode] of [["Light", KIT.lightMode], ["Dark", KIT.darkMode]] as [string, string | null][]) {
    if (!mode) continue;
    const panel = frame(`${label} mode`, { direction: "row", gap: 16, padding: 24, fill: "surface/bg", stroke: "border/default", radius: "radius/lg" }, row);
    panel.setExplicitVariableModeForCollection(KIT.colorCollection, mode);
    for (const token of MOBILE_COLOR_TOKENS) {
      const swatch = frame(token.name, { direction: "column", gap: 4 }, panel);
      applySize(swatch, 160, "hug");
      const chip = frame("chip", { direction: "none", fill: token.name, stroke: "border/default", radius: "radius/md" }, swatch);
      applySize(chip, 160, 64);
      await text(swatch, token.name, "Label/Small", { width: "fill" });
      await text(swatch, label === "Light" ? token.light : token.dark, "Body/Small", { color: "text/muted" });
    }
  }
}

async function mFoundationType(page: PageNode) {
  const section = await docSection(
    page,
    "Type — iOS, Android and Kit",
    "Text styles under “Grampro Kit Mobile/”. iOS uses SF Pro (Text below 20pt, Display above) and Android uses Roboto, matching what the OS renders. Where a font is not installed on this machine the style falls back to Inter; install SF Pro from Apple's developer site and run the command again to replace it. Kit/ styles are what the Kit components themselves use (tokens.fontSize 15).",
  );
  for (const platform of ["iOS", "Android", "Kit"] as MobilePlatform[]) {
    await text(section, platform, "Label/Strong", { color: "text/muted" });
    const list = frame(`${platform} type`, { direction: "column", gap: 8 }, section);
    applySize(list, "fill", "hug");
    for (const type of MOBILE_TYPE.filter((item) => item.platform === platform)) {
      const row = frame(type.key, { direction: "row", gap: 24, padding: [10, 16], fill: "surface/bg", stroke: "border/subtle", radius: "radius/md" }, list);
      applySize(row, "fill", "hug");
      const name = await text(row, type.key, "Label/Default", { color: "text/muted" });
      applySize(name, 200);
      const sample = await text(row, "Grampro Books ₹12,500", type.key);
      applySize(sample, "fill");
      const font = KIT.text[type.key].fontName as FontName;
      await text(row, `${type.size}/${type.lineHeight} · ${font.family} ${font.style}`, "Body/Small", { color: "text/muted" });
    }
  }
}

async function mFoundationSizes(page: PageNode) {
  const section = await docSection(
    page,
    "Touch targets, control heights and radius",
    "Variables in “Grampro Kit · Size”. Anything tappable is at least 44 × 44 (mobile/touch-target): a 34-high small button keeps a 44 hit area through hitSlop. Sheets round their top corners; dialogs follow the platform.",
  );
  const targets = frame("Touch targets", { direction: "row", gap: 32, align: "end" }, section);
  const target = frame("Touch target", { direction: "column", gap: 6, align: "center" }, targets);
  const square = frame("44 × 44", { direction: "row", justify: "center", align: "center", stroke: "accent/default", radius: "radius/md" }, target);
  square.dashPattern = [4, 3];
  applySize(square, 44, 44);
  bindNumber(square, "width", "mobile/touch-target");
  bindNumber(square, "height", "mobile/touch-target");
  icon(square, "plus", "text/primary", 24);
  await text(target, "mobile/touch-target · 44", "Body/Small", { color: "text/muted" });

  for (const token of MOBILE_NUMBER_TOKENS.filter((item) => item.name.startsWith("mobile/control-"))) {
    const cell = frame(token.name, { direction: "column", gap: 6, align: "center" }, targets);
    const bar = frame("height", { direction: "row", justify: "center", align: "center", fill: "accent/default", radius: "radius/md" }, cell);
    applySize(bar, 140, token.value);
    bindNumber(bar, "height", token.name);
    await text(bar, "Button", "Kit/Label", { color: "accent/on-accent" });
    await text(cell, `${token.name} · ${token.value}`, "Body/Small", { color: "text/muted" });
  }

  const radii = frame("Radius", { direction: "row", gap: 32, align: "end" }, section);
  for (const token of MOBILE_NUMBER_TOKENS.filter((item) => item.name.startsWith("radius/"))) {
    const cell = frame(token.name, { direction: "column", gap: 6, align: "center" }, radii);
    const shape = frame("shape", { direction: "none", fill: "accent/soft", stroke: "accent/default", radius: token.name }, cell);
    applySize(shape, 96, 72);
    await text(cell, `${token.name} · ${token.value}`, "Body/Small", { color: "text/muted" });
  }
}

async function mFoundationSafeAreas(page: PageNode) {
  const section = await docSection(
    page,
    "Safe areas",
    "Kit reads insets from KitProvider (insets={useSafeAreaInsets()}), so sheets, toasts, app bars and bottom navigation keep clear of the status bar, Dynamic Island, home indicator and gesture bar. iPhone 16: status bar 54, home indicator 34. Pixel 9 (edge-to-edge): status bar 48, gesture bar 24.",
  );
  const row = frame("Devices", { direction: "row", gap: 48, align: "start" }, section);
  for (const platform of M_PLATFORMS) {
    const device = M_DEVICE[platform];
    const outline = frame(device.name, { direction: "column", fill: "surface/bg", stroke: "border/control", strokeWeight: 2, radius: platform === "iOS" ? 48 : 32, clip: true }, row);
    applySize(outline, device.width, device.height);
    const top = frame("Status bar", { direction: "row", justify: "center", align: "center" }, outline);
    applySize(top, "fill", device.status);
    setTint(top, "status/warning", 0.25);
    bindNumber(top, "height", platform === "iOS" ? "mobile/status-bar-ios" : "mobile/status-bar-android");
    await text(top, `Status bar · ${device.status}`, "Kit/Label Small", { color: "text/primary" });
    const body = frame("Content", { direction: "column", justify: "center", align: "center", gap: 6 }, outline);
    applySize(body, "fill", "fill");
    await text(body, device.name, "Kit/Title");
    await text(body, `${device.width} × ${device.height}`, "Kit/Small", { color: "text/muted" });
    const bottom = frame(platform === "iOS" ? "Home indicator" : "Gesture bar", { direction: "row", justify: "center", align: "center" }, outline);
    applySize(bottom, "fill", device.bottom);
    setTint(bottom, "status/warning", 0.25);
    bindNumber(bottom, "height", platform === "iOS" ? "mobile/home-indicator" : "mobile/gesture-bar");
    await text(bottom, `${platform === "iOS" ? "Home indicator" : "Gesture bar"} · ${device.bottom}`, "Kit/Label Small", { color: "text/primary" });
  }
}

/* =============================================================== screens */

const M_SCREENS: [string, (content: FrameNode, device: FrameNode, platform: MPlatform) => Promise<void>][] = [
  ["Home", mHomeScreen],
  ["New invoice", mNewInvoiceScreen],
  ["Settings · Theme", mSettingsScreen],
  ["Sheet open", mSheetScreen],
  ["Dialog open", mDialogScreen],
];

async function buildMobileScreens(page: PageNode) {
  await docSection(
    page,
    "Mobile screens (BETA)",
    "The GramproKit Demo app (native-playground) as designs: iPhone 16 (393 × 852) and Pixel 9 (412 × 915), each in Light and Dark. Built from instances of the Mobile/ sets, so editing a component updates every screen. Dark frames use the Dark mode of “Grampro Kit · Color”; nothing is duplicated.",
  );
  const modes: [string, string | null][] = [["Light", KIT.lightMode], ["Dark", KIT.darkMode]];
  for (const platform of M_PLATFORMS) {
    for (const [modeName, mode] of modes) {
      if (!mode) continue;
      const group = frame(`${M_DEVICE[platform].name} · ${modeName}`, { direction: "column", gap: 24 }, page);
      await text(group, `${M_DEVICE[platform].name} · ${platform} · ${modeName}`, "Title/Section");
      const row = frame("Screens", { direction: "row", gap: 48, align: "start" }, group);
      for (const [name, build] of M_SCREENS) {
        const device = await mDevice(row, platform, `${platform} · ${modeName} · ${name}`, mode);
        const content = device.findAll((node) => node.name === "Content")[0] as FrameNode;
        await build(content, device, platform);
      }
    }
  }
}

function mSetBool(node: InstanceNode, property: string, value: boolean) {
  const key = Object.keys(node.componentProperties).find((name) => name.split("#")[0] === property);
  if (key) node.setProperties({ [key]: value });
}

/** A device: status bar, app bar slot, content, bottom navigation slot, home indicator. */
async function mDevice(parent: FrameNode, platform: MPlatform, name: string, mode: string): Promise<FrameNode> {
  const spec = M_DEVICE[platform];
  const device = frame(name, { direction: "column", fill: "surface/bg", radius: platform === "iOS" ? 48 : 32, clip: true, stroke: "border/default" }, parent);
  applySize(device, spec.width, spec.height);
  device.setExplicitVariableModeForCollection(KIT.colorCollection, mode);
  device.effects = [shadow(20, 60, -20, 0.25)];

  const status = frame("Status bar", { direction: "row", justify: "between", align: "center", padding: [0, platform === "iOS" ? 32 : 24] }, device);
  applySize(status, "fill", spec.status);
  await text(status, "9:41", platform === "iOS" ? "iOS/Headline" : "Android/Body Medium");
  const indicators = frame("Indicators", { direction: "row", gap: 3, align: "end" }, status);
  for (const height of [4, 6, 8, 10]) {
    const bar = frame("Signal", { direction: "none", fill: "text/primary", radius: 1 }, indicators);
    applySize(bar, 3, height);
  }
  const battery = frame("Battery", { direction: "row", padding: 1.5, stroke: "text/primary", radius: 3 }, indicators);
  applySize(battery, 24, 12);
  const level = frame("Level", { direction: "none", fill: "text/primary", radius: 1.5 }, battery);
  applySize(level, 16, 9);

  const content = frame("Content", { direction: "column", gap: 16, padding: [8, 16, 16, 16], clip: true }, device);
  applySize(content, "fill", "fill");
  return device;
}

/** App bar at the top of the content's parent, bottom nav and home indicator at the bottom. */
function mChrome(device: FrameNode, platform: MPlatform, appBar: Record<string, string>, title: string, back: boolean, nav = true) {
  const bar = mSet("AppBar");
  const node = variantOf(bar, { Platform: platform, ...appBar }).createInstance();
  device.insertChild(1, node);
  applySize(node, "fill");
  setInstanceText(node, "Title", title);
  mSetBool(node, "Back", back);
  if (nav) {
    const navigation = instance(device, mSet("BottomNavigation"), { Platform: platform, Badges: "On" });
    applySize(navigation, "fill");
  }
  const home = frame(platform === "iOS" ? "Home indicator" : "Gesture bar", { direction: "row", justify: "center", align: "center", fill: nav ? "surface/raised" : null }, device);
  applySize(home, "fill", M_DEVICE[platform].bottom);
  const pill = frame("Pill", { direction: "none", fill: "text/primary", radius: 999 }, home);
  applySize(pill, platform === "iOS" ? 134 : 108, platform === "iOS" ? 5 : 4);
}

function mFill(node: InstanceNode) {
  applySize(node, "fill");
  return node;
}

async function mHomeScreen(content: FrameNode, device: FrameNode, platform: MPlatform) {
  mChrome(device, platform, { Variant: "Large" }, "Grampro Books", false);
  mFill(instance(content, mSet("SegmentedControl"), { Platform: platform }));
  const stats = frame("Stats", { direction: "row", gap: 12, wrap: true }, content);
  applySize(stats, "fill", "hug");
  stats.counterAxisSpacing = 12;
  for (const [label, value, trend] of [["Revenue", "₹12.4L", "Up"], ["Unpaid", "₹3.1L", "Down"], ["Invoices", "1,204", "Flat"], ["Customers", "86", "Up"]]) {
    const stat = instance(stats, mSet("Stat"), { Trend: trend });
    setInstanceText(stat, "Label", label);
    setInstanceText(stat, "Value", value);
  }
  mFill(instance(content, mSet("Alert"), { Intent: "Warning" }));
  const list = frame("Recent invoices", { direction: "column", fill: platform === "iOS" ? "surface/raised" : null, radius: platform === "iOS" ? 10 : 0, clip: true }, content);
  applySize(list, "fill", "hug");
  for (const [who, line] of [["Anand Remanan", "INV-2041 · ₹12,500 · due in 2 days"], ["Gita Hari", "INV-2040 · ₹8,750 · paid"], ["Kerala Traders", "INV-2039 · ₹4,200 · overdue"]]) {
    const row = mFill(instance(list, mSet("ListItem"), { Platform: platform, Kind: "Two-line" }));
    setInstanceText(row, "Title", who);
    setInstanceText(row, "Supporting", line);
  }

  // The FAB floats over the content, above the bottom navigation.
  const fab = instance(device, mSet("Fab"), { Platform: platform, Size: "md", Style: "Primary", Extended: platform === "Android" ? "True" : "False" });
  fab.layoutPositioning = "ABSOLUTE";
  const spec = M_DEVICE[platform];
  const navHeight = platform === "iOS" ? 49 : 80;
  fab.x = spec.width - fab.width - 16;
  fab.y = spec.height - spec.bottom - navHeight - fab.height - 16;
}

async function mNewInvoiceScreen(content: FrameNode, device: FrameNode, platform: MPlatform) {
  mChrome(device, platform, { Variant: platform === "iOS" ? "Small" : "Small" }, "New invoice", true);
  const fields: [string, string, string, string][] = [
    ["Input", "Customer", "Anand Remanan", "As it appears on the invoice."],
    ["Select", "State", "Kerala", "Sets the GST place of supply."],
    ["Date", "Invoice date", "22 Nov 2024", "Due in 15 days (Net 15)."],
    ["Input", "Amount", "₹ 12,500.00", "Including 18% GST."],
  ];
  for (const [kind, label, value, hint] of fields) {
    const field = mFill(instance(content, mSet("Field"), { Kind: kind, State: label === "Amount" ? "Focused" : "Default" }));
    setInstanceText(field, "Label", label);
    setInstanceText(field, "Value", value);
    setInstanceText(field, "Hint", hint);
  }
  const sendVia = frame("Send via", { direction: "row", gap: 20 }, content);
  for (const [label, checked] of [["SMS", "True"], ["Email", "True"], ["WhatsApp", "False"]]) {
    const box = instance(sendVia, mSet("Checkbox"), { Checked: checked, State: "Default" });
    setInstanceText(box, "Label", label);
  }
  const recurring = instance(content, mSet("Switch"), { Platform: platform, On: "True" });
  setInstanceText(recurring, "Label", "Repeat every month");
  const save = mFill(instance(content, mSet("Button"), { Variant: "Primary", Size: "lg", State: "Default" }));
  setInstanceText(save, "Label", "Save invoice");
}

async function mSettingsScreen(content: FrameNode, device: FrameNode, platform: MPlatform) {
  mChrome(device, platform, { Variant: "Large" }, "Theme", true);
  if (platform === "iOS") {
    setFill(device, "surface/grouped");
    setFill(content, "surface/grouped");
  }
  await text(content, "APPEARANCE", platform === "iOS" ? "iOS/Footnote" : "Android/Label Large", { color: "text/muted" });
  const group = frame("Appearance", { direction: "column", fill: platform === "iOS" ? "surface/raised" : null, radius: platform === "iOS" ? 10 : 0, clip: true }, content);
  applySize(group, "fill", "hug");
  for (const [title, value] of [["Mode", "System"], ["Palette", "Violet"], ["Radius", "10"], ["Font size", "15"]]) {
    const row = mFill(instance(group, mSet("ListItem"), { Platform: platform, Kind: "Value" }));
    setInstanceText(row, "Title", title);
    setInstanceText(row, "Value", value);
  }
  await text(content, "PALETTE", platform === "iOS" ? "iOS/Footnote" : "Android/Label Large", { color: "text/muted" });
  // The web playground's presets; plain colours, since they are choices, not tokens.
  const swatches = frame("Presets", { direction: "row", gap: 14, align: "center" }, content);
  for (const [index, hex] of ["#2563eb", "#7c3aed", "#0f766e", "#e11d48", "#18181b"].entries()) {
    const ring = frame(`Preset ${index + 1}`, { direction: "row", justify: "center", align: "center", stroke: index === 1 ? "text/primary" : null, strokeWeight: 2, radius: 999 }, swatches);
    applySize(ring, 44, 44);
    const dot = frame("Swatch", { direction: "none", radius: 999 }, ring);
    applySize(dot, 34, 34);
    mHexFill(dot, hex);
  }
  await text(content, "PREVIEW", platform === "iOS" ? "iOS/Footnote" : "Android/Label Large", { color: "text/muted" });
  mFill(instance(content, mSet("Card"), { Variant: "Elevated" }));
}

async function mOverlayBase(content: FrameNode, device: FrameNode, platform: MPlatform) {
  mChrome(device, platform, { Variant: "Small" }, "INV-2041", true, false);
  mFill(instance(content, mSet("Card"), { Variant: "Outlined" }));
  for (let index = 0; index < 3; index++) mFill(instance(content, mSet("Skeleton"), { Kind: "List row" }));
  // The scrim is the same variable as a modal backdrop.
  const scrim = frame("Scrim", { direction: "none", fill: "surface/backdrop" }, device);
  scrim.layoutPositioning = "ABSOLUTE";
  scrim.x = 0;
  scrim.y = 0;
  scrim.resize(M_DEVICE[platform].width, M_DEVICE[platform].height);
}

async function mSheetScreen(content: FrameNode, device: FrameNode, platform: MPlatform) {
  await mOverlayBase(content, device, platform);
  const sheet = instance(device, mSet("BottomSheet"), { Platform: platform });
  sheet.layoutPositioning = "ABSOLUTE";
  sheet.x = 0;
  sheet.y = M_DEVICE[platform].height - sheet.height;
}

async function mDialogScreen(content: FrameNode, device: FrameNode, platform: MPlatform) {
  await mOverlayBase(content, device, platform);
  const dialog = instance(device, mSet("Dialog"), { Platform: platform, Kind: "Confirm" });
  dialog.layoutPositioning = "ABSOLUTE";
  dialog.x = Math.round((M_DEVICE[platform].width - dialog.width) / 2);
  dialog.y = Math.round((M_DEVICE[platform].height - dialog.height) / 2);
}
