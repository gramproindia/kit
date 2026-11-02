// Mobile (React Native) additions to the kit: the tokens only the native
// components use, and the iOS and Android type ramps. They go into the same
// collections the web generator uses, so one file can hold both sets and a
// mode switch restyles web and mobile frames alike. Mirror of
// source/components/shared/native/theme.ts (KitTokens).

const MOBILE_COLOR_TOKENS: ColorToken[] = [
  { name: "surface/raised", light: "#ffffff", dark: "#18181c", description: "Raised surfaces on mobile: elevated cards, sheets, menus. Lighter than bg in dark mode, where shadows barely show (KitTokens.raised)" },
  { name: "surface/grouped", light: "#f2f2f7", dark: "#000000", description: "iOS grouped-list background behind inset sections (system grouped background)" },
];

interface MobileNumberToken extends NumberToken {
  scope: VariableScope;
}

const MOBILE_NUMBER_TOKENS: MobileNumberToken[] = [
  { name: "mobile/touch-target", value: 44, scope: "WIDTH_HEIGHT", description: "Smallest tappable size (KitTokens.touchTarget; 44 iOS, 48 Material)" },
  { name: "mobile/control-sm", value: 34, scope: "WIDTH_HEIGHT", description: "Button size=sm on mobile (hit area padded to 44)" },
  { name: "mobile/control-md", value: 44, scope: "WIDTH_HEIGHT", description: "Button and field height on mobile" },
  { name: "mobile/control-lg", value: 52, scope: "WIDTH_HEIGHT", description: "Button size=lg on mobile" },
  { name: "mobile/font-size", value: 15, scope: "FONT_SIZE", description: "Body text on mobile (KitTokens.fontSize); the web uses 13" },
  { name: "mobile/status-bar-ios", value: 54, scope: "WIDTH_HEIGHT", description: "iPhone status bar with Dynamic Island" },
  { name: "mobile/status-bar-android", value: 48, scope: "WIDTH_HEIGHT", description: "Android status bar (edge-to-edge)" },
  { name: "mobile/home-indicator", value: 34, scope: "WIDTH_HEIGHT", description: "iPhone home indicator safe area" },
  { name: "mobile/gesture-bar", value: 24, scope: "WIDTH_HEIGHT", description: "Android gesture navigation safe area" },
  { name: "radius/sheet", value: 16, scope: "CORNER_RADIUS", description: "Bottom sheet top corners (2 × radius)" },
  { name: "radius/dialog-ios", value: 14, scope: "CORNER_RADIUS", description: "iOS alert" },
  { name: "radius/dialog-android", value: 28, scope: "CORNER_RADIUS", description: "Material 3 dialog and sheet" },
];

type MobilePlatform = "iOS" | "Android" | "Kit";
type MobileWeight = "Regular" | "Medium" | "Semibold" | "Bold";

interface MobileType {
  /** Key in KIT.text and the style name under "Grampro Kit Mobile/". */
  key: string;
  platform: MobilePlatform;
  size: number;
  lineHeight: number;
  weight: MobileWeight;
  description: string;
}

const MOBILE_TYPE: MobileType[] = [
  // iOS (Human Interface Guidelines, default Dynamic Type size).
  { key: "iOS/Large Title", platform: "iOS", size: 34, lineHeight: 41, weight: "Bold", description: "Large navigation title" },
  { key: "iOS/Title 2", platform: "iOS", size: 22, lineHeight: 28, weight: "Bold", description: "Section and stat titles" },
  { key: "iOS/Headline", platform: "iOS", size: 17, lineHeight: 22, weight: "Semibold", description: "Navigation bar title, alert title" },
  { key: "iOS/Body", platform: "iOS", size: 17, lineHeight: 22, weight: "Regular", description: "Body, list rows, buttons" },
  { key: "iOS/Subhead", platform: "iOS", size: 15, lineHeight: 20, weight: "Regular", description: "Secondary text, search field" },
  { key: "iOS/Footnote", platform: "iOS", size: 13, lineHeight: 18, weight: "Regular", description: "Section headers and footers, alert message" },
  { key: "iOS/Caption", platform: "iOS", size: 12, lineHeight: 16, weight: "Regular", description: "Captions, timestamps" },
  { key: "iOS/Tab", platform: "iOS", size: 10, lineHeight: 12, weight: "Medium", description: "Tab bar labels" },
  // Android (Material 3 type scale).
  { key: "Android/Headline Medium", platform: "Android", size: 28, lineHeight: 36, weight: "Regular", description: "Large top app bar title" },
  { key: "Android/Headline Small", platform: "Android", size: 24, lineHeight: 32, weight: "Regular", description: "Dialog title, large app bar" },
  { key: "Android/Title Large", platform: "Android", size: 22, lineHeight: 28, weight: "Regular", description: "Top app bar title" },
  { key: "Android/Title Medium", platform: "Android", size: 16, lineHeight: 24, weight: "Medium", description: "List titles, card titles" },
  { key: "Android/Body Large", platform: "Android", size: 16, lineHeight: 24, weight: "Regular", description: "List rows, search bar" },
  { key: "Android/Body Medium", platform: "Android", size: 14, lineHeight: 20, weight: "Regular", description: "Supporting text, dialog text, snackbar" },
  { key: "Android/Label Large", platform: "Android", size: 14, lineHeight: 20, weight: "Medium", description: "Buttons, tabs, segmented buttons" },
  { key: "Android/Label Medium", platform: "Android", size: 12, lineHeight: 16, weight: "Medium", description: "Navigation bar labels" },
  { key: "Android/Label Small", platform: "Android", size: 11, lineHeight: 16, weight: "Medium", description: "Badges" },
  // Kit components as they render in React Native (fontSize token 15).
  { key: "Kit/Body", platform: "Kit", size: 15, lineHeight: 20, weight: "Regular", description: "Kit native body text (tokens.fontSize)" },
  { key: "Kit/Label", platform: "Kit", size: 15, lineHeight: 20, weight: "Semibold", description: "Kit native buttons and labels" },
  { key: "Kit/Label Small", platform: "Kit", size: 13, lineHeight: 18, weight: "Semibold", description: "Small buttons, badges" },
  { key: "Kit/Small", platform: "Kit", size: 13, lineHeight: 18, weight: "Regular", description: "Hints, descriptions, counters" },
  { key: "Kit/Title", platform: "Kit", size: 18, lineHeight: 24, weight: "Bold", description: "Card titles, sheet titles" },
  { key: "Kit/Stat", platform: "Kit", size: 28, lineHeight: 34, weight: "Bold", description: "Stat values (tabular figures)" },
];

/** Font families to try, best first; Inter is always last and always loads. */
function fontCandidates(type: MobileType): FontName[] {
  const inter: Record<MobileWeight, string> = { Regular: "Regular", Medium: "Medium", Semibold: "Semi Bold", Bold: "Bold" };
  const fallback = { family: TYPE_FAMILY, style: inter[type.weight] };
  if (type.platform === "iOS") {
    const family = type.size >= 20 ? "SF Pro Display" : "SF Pro Text";
    return [{ family, style: type.weight }, { family: "SF Pro", style: type.weight }, fallback];
  }
  if (type.platform === "Android") {
    const roboto: Record<MobileWeight, string> = { Regular: "Regular", Medium: "Medium", Semibold: "Medium", Bold: "Bold" };
    return [{ family: "Roboto", style: roboto[type.weight] }, fallback];
  }
  return [fallback];
}

async function loadFirstFont(candidates: FontName[]): Promise<FontName> {
  for (const font of candidates) {
    try {
      await figma.loadFontAsync(font);
      return font;
    } catch {
      // Not installed here (SF Pro is not on Windows, nor in the browser): try the next.
    }
  }
  throw new Error(`None of these fonts loaded: ${candidates.map((font) => `${font.family} ${font.style}`).join(", ")}`);
}

/**
 * Adds the mobile tokens and text styles to the kit built by buildKit().
 * Returns notes for the closing summary, e.g. which fonts fell back to Inter.
 */
async function buildMobileKit(): Promise<string[]> {
  const notes: string[] = [];
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();
  const upsert = (collection: VariableCollection, name: string, type: VariableResolvedDataType) =>
    variables.find((variable) => variable.name === name && variable.variableCollectionId === collection.id) ??
    figma.variables.createVariable(name, collection, type);

  for (const token of MOBILE_COLOR_TOKENS) {
    const variable = upsert(KIT.colorCollection, token.name, "COLOR");
    variable.description = token.description;
    variable.scopes = colorScopes(token.name);
    variable.setValueForMode(KIT.lightMode, hexToRgba(token.light));
    if (KIT.darkMode) variable.setValueForMode(KIT.darkMode, hexToRgba(token.dark));
    KIT.colors[token.name] = variable;
  }

  const sizeCollection =
    collections.find((collection) => collection.name === "Grampro Kit · Size") ??
    figma.variables.createVariableCollection("Grampro Kit · Size");
  const sizeMode = sizeCollection.modes[0].modeId;
  for (const token of MOBILE_NUMBER_TOKENS) {
    const variable = upsert(sizeCollection, token.name, "FLOAT");
    variable.description = token.description;
    variable.scopes = [token.scope];
    variable.setValueForMode(sizeMode, token.value);
    KIT.numbers[token.name] = variable;
  }

  const existingStyles = await figma.getLocalTextStylesAsync();
  const fellBack = new Set<string>();
  for (const type of MOBILE_TYPE) {
    const candidates = fontCandidates(type);
    const font = await loadFirstFont(candidates);
    if (font.family !== candidates[0].family && type.platform !== "Kit") fellBack.add(`${candidates[0].family} → ${font.family}`);
    const name = `Grampro Kit Mobile/${type.key}`;
    const style = existingStyles.find((item) => item.name === name) ?? figma.createTextStyle();
    style.name = name;
    style.fontName = font;
    style.fontSize = type.size;
    style.lineHeight = { unit: "PIXELS", value: type.lineHeight };
    style.description = `${type.description} · ${type.size}/${type.lineHeight} ${type.weight}`;
    KIT.text[type.key] = style;
  }
  if (fellBack.size) notes.push(`fonts not installed, used ${[...fellBack].join(", ")}`);
  return notes;
}
