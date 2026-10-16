"use strict";
// Design tokens, copied from the components' styles.css files. The components
// resolve every value through the shared --gbs-* palette (set it on :root to
// theme the whole kit), which falls back to the grid's --dg-* and then to these
// built-in defaults. Keep these in step with the CSS: the Figma variables are
// generated from this file.
const COLOR_TOKENS = [
    { name: "surface/bg", light: "#ffffff", dark: "#0b0b0e", description: "Page, cards, menus, popovers, modals (--gbs-bg)" },
    { name: "surface/header", light: "#fafafa", dark: "#111114", description: "Grid header, modal and dialog footers (--gbs-header-bg)" },
    { name: "surface/input", light: "#ffffff", dark: "#121216", description: "Fields, drop zones, OTP cells (--gbs-input-bg)" },
    { name: "surface/readonly", light: "#fafafa", dark: "#0e0e12", description: "Read-only fields (--gbs-readonly-bg)" },
    { name: "surface/subtle", light: "#f4f4f5", dark: "#1c1c20", description: "Secondary button, segmented tab track (--gbs-subtle)" },
    { name: "surface/hover", light: "#f4f4f5", dark: "#1f1f23", description: "Hover backgrounds, menu and card hover (--gbs-hover)" },
    { name: "surface/skeleton", light: "#ececee", dark: "#232329", description: "Skeleton placeholder bars (--gbs-skeleton)" },
    { name: "surface/tooltip", light: "#18181b", dark: "#f4f4f5", description: "Tooltip bubble, inverted against the page (--gbs-tooltip-bg)" },
    { name: "surface/row-alt", light: "#fcfcfd", dark: "#0e0e12", description: "Striped grid rows (--gbs-row-alt)" },
    { name: "surface/row-selected", light: "#eef4ff", dark: "#14213d", description: "Selected grid rows (--gbs-row-selected)" },
    { name: "surface/backdrop", light: "#09090b73", dark: "#000000a6", description: "Behind modals and dialogs (--gbs-backdrop)" },
    { name: "text/primary", light: "#18181b", dark: "#f4f4f5", description: "Body text (--gbs-fg)" },
    { name: "text/muted", light: "#71717a", dark: "#a1a1aa", description: "Hints, placeholders, icons, stat labels (--gbs-muted)" },
    { name: "text/header", light: "#3f3f46", dark: "#d4d4d8", description: "Grid header text (--gbs-header-fg)" },
    { name: "text/tab", light: "#5b5b64", dark: "#a1a1aa", description: "Unselected tab labels: darker than muted, since a tab is a control (--gbs-tab-fg)" },
    { name: "text/on-tooltip", light: "#fafafa", dark: "#18181b", description: "Tooltip text (--gbs-tooltip-fg)" },
    { name: "border/default", light: "#e4e4e7", dark: "#27272a", description: "Borders, dividers, menu separators (--gbs-border)" },
    { name: "border/subtle", light: "#f0f0f2", dark: "#1c1c20", description: "Grid cell lines (--gbs-border-subtle)" },
    { name: "border/control", light: "#a1a1aa", dark: "#52525b", description: "Unchecked checkbox (--gbs-border-control)" },
    { name: "accent/default", light: "#2563eb", dark: "#60a5fa", description: "Primary actions, selection, links (--gbs-accent)" },
    { name: "accent/on-accent", light: "#ffffff", dark: "#0b1220", description: "Text on accent (--gbs-accent-fg)" },
    { name: "accent/soft", light: "#eff6ff", dark: "#172554", description: "Tags, pills, range bands (--gbs-accent-soft)" },
    { name: "accent/strong", light: "#1d4ed8", dark: "#bfdbfe", description: "Text on soft accent (--gbs-accent-strong)" },
    { name: "accent/focus", light: "#2563eb", dark: "#60a5fa", description: "Focus rings (--gbs-focus)" },
    { name: "status/danger", light: "#dc2626", dark: "#f87171", description: "Errors, destructive actions and menu items (--gbs-danger)" },
    { name: "status/on-danger", light: "#ffffff", dark: "#1c0606", description: "Text on danger (--gbs-danger-fg)" },
    { name: "status/success", light: "#15803d", dark: "#4ade80", description: "Success, upward stat trends (--gbs-success)" },
    { name: "status/warning", light: "#d97706", dark: "#fbbf24", description: "Warnings (--gbs-warning)" },
    { name: "status/info", light: "#2563eb", dark: "#60a5fa", description: "Information (--gbs-info)" },
    { name: "file/image", light: "#2563eb", dark: "#60a5fa", description: "Uploader thumbnail: image" },
    { name: "file/video", light: "#9333ea", dark: "#c084fc", description: "Uploader thumbnail: video" },
    { name: "file/audio", light: "#d97706", dark: "#fbbf24", description: "Uploader thumbnail: audio" },
    { name: "file/pdf", light: "#dc2626", dark: "#f87171", description: "Uploader thumbnail: PDF" },
    { name: "file/spreadsheet", light: "#16a34a", dark: "#4ade80", description: "Uploader thumbnail: spreadsheet" },
    { name: "file/document", light: "#0891b2", dark: "#22d3ee", description: "Uploader thumbnail: document" },
];
const NUMBER_TOKENS = [
    { name: "radius/xs", value: 4, description: "Checkbox, skeleton text bars" },
    { name: "radius/item", value: 5, description: "Menu items (--mn-item-radius)" },
    { name: "radius/sm", value: 6, description: "Icon buttons, tabs" },
    { name: "radius/md", value: 8, description: "Fields, buttons, cards, menus, popovers (--gbs-radius)" },
    { name: "radius/lg", value: 12, description: "Modals and dialogs" },
    { name: "radius/full", value: 999, description: "Tags, badges, avatars" },
    { name: "control/height-sm", value: 30, description: "size=sm fields and buttons" },
    { name: "control/height-md", value: 36, description: "size=md fields and buttons" },
    { name: "control/height-lg", value: 44, description: "size=lg fields and buttons" },
    { name: "space/2xs", value: 2, description: "" },
    { name: "space/xs", value: 4, description: "Label to field, rows inside a stat" },
    { name: "space/sm", value: 6, description: "Menu item padding" },
    { name: "space/md", value: 8, description: "Icon to text, between fields in a row" },
    { name: "space/lg", value: 10, description: "Field padding (md)" },
    { name: "space/xl", value: 12, description: "Popover padding (--pv-px)" },
    { name: "space/2xl", value: 16, description: "Card padding (--cd-px)" },
    { name: "space/3xl", value: 20, description: "Modal padding" },
    { name: "space/4xl", value: 24, description: "Card padding at lg, empty-state sides" },
];
/** Inter stands in for the components' system-ui stack, which Figma can't reference. */
const TYPE_FAMILY = "Inter";
const TYPE_TOKENS = [
    { name: "Body/Default", size: 13, weight: "Regular", lineHeight: 18, description: "--gbs-font-size; fields, cells, menus" },
    { name: "Body/Small", size: 12, weight: "Regular", lineHeight: 16, description: "size=sm controls, hints, errors, tooltips, shortcuts" },
    { name: "Body/Large", size: 14, weight: "Regular", lineHeight: 20, description: "size=lg controls" },
    { name: "Label/Default", size: 13, weight: "Medium", lineHeight: 18, description: "Field labels, buttons, tabs, stat labels" },
    { name: "Label/Small", size: 12, weight: "Medium", lineHeight: 16, description: "Small buttons, tags" },
    { name: "Label/Large", size: 14, weight: "Medium", lineHeight: 20, description: "Large buttons and tabs" },
    { name: "Label/Strong", size: 13, weight: "Semi Bold", lineHeight: 18, description: "Grid headers, selected items" },
    { name: "Label/Group", size: 11, weight: "Semi Bold", lineHeight: 14, description: "Menu group headings (set in capitals, +2% letter spacing)" },
    { name: "Title/Card", size: 14, weight: "Semi Bold", lineHeight: 19, description: "Card and empty-state titles (1.05em)" },
    { name: "Title/Dialog", size: 15, weight: "Semi Bold", lineHeight: 20, description: "Modal and dialog titles" },
    { name: "Title/Section", size: 18, weight: "Semi Bold", lineHeight: 24, description: "Page sections" },
    { name: "Numeric/Stat", size: 25, weight: "Semi Bold", lineHeight: 29, description: "Stat values, 1.9em (tabular figures)" },
    { name: "Numeric/OTP", size: 18, weight: "Semi Bold", lineHeight: 24, description: "OTP cells (tabular figures)" },
];
// Helpers shared by every generator: tokens → Figma variables and styles, and
// small builders that keep auto layout and variable bindings consistent.
let KIT;
const FONT_WEIGHTS = ["Regular", "Medium", "Semi Bold"];
function hexToRgba(hex) {
    const value = hex.replace("#", "");
    const channel = (index) => parseInt(value.slice(index, index + 2), 16) / 255;
    return { r: channel(0), g: channel(2), b: channel(4), a: value.length === 8 ? channel(6) : 1 };
}
function colorScopes(name) {
    if (name.startsWith("text/"))
        return ["TEXT_FILL"];
    if (name.startsWith("border/"))
        return ["STROKE_COLOR"];
    return ["ALL_FILLS", "STROKE_COLOR", "EFFECT_COLOR"];
}
function numberScopes(name) {
    if (name.startsWith("radius/"))
        return ["CORNER_RADIUS"];
    if (name.startsWith("control/"))
        return ["WIDTH_HEIGHT"];
    return ["GAP"];
}
/** Creates the variables and text styles, or updates them when the plugin runs again. */
async function buildKit() {
    var _a, _b, _c;
    await Promise.all(FONT_WEIGHTS.map((style) => figma.loadFontAsync({ family: TYPE_FAMILY, style })));
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const variables = await figma.variables.getLocalVariablesAsync();
    const findOrCreateCollection = (name) => { var _a; return (_a = collections.find((collection) => collection.name === name)) !== null && _a !== void 0 ? _a : figma.variables.createVariableCollection(name); };
    const upsert = (collection, name, type) => {
        var _a;
        return (_a = variables.find((variable) => variable.name === name && variable.variableCollectionId === collection.id)) !== null && _a !== void 0 ? _a : figma.variables.createVariable(name, collection, type);
    };
    // Colors: one collection with Light and Dark modes.
    const colorCollection = findOrCreateCollection("Grampro Kit · Color");
    const lightMode = colorCollection.modes[0].modeId;
    colorCollection.renameMode(lightMode, "Light");
    let darkMode = (_b = (_a = colorCollection.modes.find((mode) => mode.name === "Dark")) === null || _a === void 0 ? void 0 : _a.modeId) !== null && _b !== void 0 ? _b : null;
    if (!darkMode) {
        try {
            darkMode = colorCollection.addMode("Dark");
        }
        catch (_d) {
            darkMode = null; // Starter plans allow one mode; dark values are then skipped.
        }
    }
    const colors = {};
    for (const token of COLOR_TOKENS) {
        const variable = upsert(colorCollection, token.name, "COLOR");
        variable.description = token.description;
        variable.scopes = colorScopes(token.name);
        variable.setValueForMode(lightMode, hexToRgba(token.light));
        if (darkMode)
            variable.setValueForMode(darkMode, hexToRgba(token.dark));
        colors[token.name] = variable;
    }
    // Sizes: radius, control heights, spacing.
    const sizeCollection = findOrCreateCollection("Grampro Kit · Size");
    const sizeMode = sizeCollection.modes[0].modeId;
    sizeCollection.renameMode(sizeMode, "Default");
    const numbers = {};
    for (const token of NUMBER_TOKENS) {
        const variable = upsert(sizeCollection, token.name, "FLOAT");
        variable.description = token.description;
        variable.scopes = numberScopes(token.name);
        variable.setValueForMode(sizeMode, token.value);
        numbers[token.name] = variable;
    }
    // Text styles.
    const existingStyles = await figma.getLocalTextStylesAsync();
    const text = {};
    for (const token of TYPE_TOKENS) {
        const name = `Grampro Kit/${token.name}`;
        const style = (_c = existingStyles.find((item) => item.name === name)) !== null && _c !== void 0 ? _c : figma.createTextStyle();
        style.name = name;
        style.fontName = { family: TYPE_FAMILY, style: token.weight };
        style.fontSize = token.size;
        style.lineHeight = { unit: "PIXELS", value: token.lineHeight };
        style.description = token.description;
        text[token.name] = style;
    }
    return { colorCollection, lightMode, darkMode, colors, numbers, text };
}
/* ------------------------------------------------------------------ paint */
function paintOf(token) {
    const variable = KIT.colors[token];
    if (!variable)
        throw new Error(`Unknown color token: ${token}`);
    const base = { type: "SOLID", color: { r: 0, g: 0, b: 0 } };
    return figma.variables.setBoundVariableForPaint(base, "color", variable);
}
/**
 * Fill a node with a token colour carried at a fraction of its strength.
 *
 * The fill is assigned, read back, and only then given its opacity. The
 * readback matters: Figma normalises a paint on the way in, and the
 * normalised object takes an opacity where the raw return of
 * setBoundVariableForPaint does not. Setting the opacity on the paint
 * before binding does not work either — that silently produced solid
 * badges. This is the one order observed to hold.
 */
function setTint(node, token, opacity) {
    node.fills = [paintOf(token)];
    const [applied] = node.fills;
    node.fills = [Object.assign(Object.assign({}, applied), { opacity })];
}
function setFill(node, token) {
    node.fills = token ? [paintOf(token)] : [];
}
function setStroke(node, token, weight = 1) {
    node.strokes = token ? [paintOf(token)] : [];
    if (token)
        node.strokeWeight = weight;
}
function bindNumber(node, field, token) {
    const variable = KIT.numbers[token];
    if (!variable)
        throw new Error(`Unknown size token: ${token}`);
    node.setBoundVariable(field, variable);
}
function shadow(offsetY, blur, spread, alpha) {
    return {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: alpha },
        offset: { x: 0, y: offsetY },
        radius: blur,
        spread,
        visible: true,
        blendMode: "NORMAL",
    };
}
/*
 * Section and variant-grid geometry, in one place because they constrain
 * each other: a variant grid is laid out to fit the section that will hold
 * it, and when the two were written apart the grids overflowed the cards.
 */
/** Every documentation section is this wide, padding included. */
const SECTION_WIDTH = 1400;
const SECTION_PADDING = 40;
/** A variant set's own inset, and the space between variants. */
const SET_PADDING = 24;
const SET_GAP = 24;
/** How much width a variant grid actually has to lay out in. */
const SET_CONTENT_WIDTH = SECTION_WIDTH - SECTION_PADDING * 2 - SET_PADDING * 2;
const JUSTIFY = {
    start: "MIN",
    center: "CENTER",
    end: "MAX",
    between: "SPACE_BETWEEN",
};
const ALIGN = {
    start: "MIN",
    center: "CENTER",
    end: "MAX",
};
function applyLayout(node, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const direction = (_a = options.direction) !== null && _a !== void 0 ? _a : "row";
    if (direction !== "none") {
        node.layoutMode = direction === "row" ? "HORIZONTAL" : "VERTICAL";
        node.itemSpacing = (_b = options.gap) !== null && _b !== void 0 ? _b : 0;
        node.primaryAxisAlignItems = JUSTIFY[(_c = options.justify) !== null && _c !== void 0 ? _c : "start"];
        node.counterAxisAlignItems = ALIGN[(_d = options.align) !== null && _d !== void 0 ? _d : (direction === "row" ? "center" : "start")];
        if (options.wrap)
            node.layoutWrap = "WRAP";
        const padding = (_e = options.padding) !== null && _e !== void 0 ? _e : 0;
        const [top, right, bottom, left] = typeof padding === "number"
            ? [padding, padding, padding, padding]
            : padding.length === 2
                ? [padding[0], padding[1], padding[0], padding[1]]
                : padding;
        node.paddingTop = top;
        node.paddingRight = right;
        node.paddingBottom = bottom;
        node.paddingLeft = left;
    }
    setFill(node, (_f = options.fill) !== null && _f !== void 0 ? _f : null);
    if (options.stroke)
        setStroke(node, options.stroke, (_g = options.strokeWeight) !== null && _g !== void 0 ? _g : 1);
    if (options.radius !== undefined) {
        if (typeof options.radius === "number")
            node.cornerRadius = options.radius;
        else
            bindNumber(node, "cornerRadius", options.radius);
    }
    node.clipsContent = (_h = options.clip) !== null && _h !== void 0 ? _h : false;
}
/** Sizing only takes effect once a node is inside its parent, so call this after appending. */
function applySize(node, width, height) {
    /*
     * A text node will not take a width while it is auto-width.
     *
     * Figma creates text as WIDTH_AND_HEIGHT, which means the node measures
     * itself from its characters; FILL and FIXED are then quietly ignored, and
     * the node keeps whatever width its own text wants. The failures look
     * nothing like a sizing problem: a label created empty and filled in later
     * through a component property is ~0px wide and wraps one character per
     * line, and a label longer than its container simply runs out of it.
     *
     * So anything other than a hug switches the node to HEIGHT first - wrap
     * inside the width you are given - and a hug asks for auto-width outright.
     */
    if (node.type === "TEXT" && width !== undefined) {
        node.textAutoResize = width === "hug" ? "WIDTH_AND_HEIGHT" : "HEIGHT";
    }
    const set = (axis, size) => {
        if (size === undefined)
            return;
        const key = axis === "Horizontal" ? "layoutSizingHorizontal" : "layoutSizingVertical";
        if (size === "hug") {
            if (node.type !== "INSTANCE" && "layoutMode" in node && node.layoutMode === "NONE")
                return;
            node[key] = "HUG";
        }
        else if (size === "fill") {
            if (node.parent && "layoutMode" in node.parent && node.parent.layoutMode !== "NONE")
                node[key] = "FILL";
        }
        else {
            if (axis === "Horizontal")
                node.resize(size, node.height);
            else
                node.resize(node.width, size);
            node[key] = "FIXED";
        }
    };
    set("Horizontal", width);
    set("Vertical", height);
}
function frame(name, options = {}, parent) {
    var _a, _b;
    const node = figma.createFrame();
    node.name = name;
    applyLayout(node, options);
    if (parent)
        parent.appendChild(node);
    applySize(node, (_a = options.width) !== null && _a !== void 0 ? _a : "hug", (_b = options.height) !== null && _b !== void 0 ? _b : "hug");
    return node;
}
async function text(parent, characters, style, options = {}) {
    var _a;
    const node = figma.createText();
    const textStyle = KIT.text[style];
    if (!textStyle)
        throw new Error(`Unknown text style: ${style}`);
    await node.setTextStyleIdAsync(textStyle.id);
    node.characters = characters;
    setFill(node, (_a = options.color) !== null && _a !== void 0 ? _a : "text/primary");
    if (options.align)
        node.textAlignHorizontal = options.align;
    parent.appendChild(node);
    if (options.width !== undefined) {
        node.textAutoResize = options.width === "hug" ? "WIDTH_AND_HEIGHT" : "HEIGHT";
        applySize(node, options.width);
    }
    if (options.truncate) {
        node.textAutoResize = "HEIGHT";
        node.textTruncation = "ENDING";
        node.maxLines = 1;
    }
    return node;
}
/**
 * A coloured edge down the left of a card, as Alert and Toast both use.
 *
 * Call it AFTER the card's content exists. The bar is absolutely positioned
 * so the card's padding does not inset it, and an absolute child is not
 * sized by auto-layout — it keeps the height it was given, adjusted by its
 * constraints against whatever the parent measured at the time. Created
 * before the content, when the card is only its own padding tall, no
 * guessed height and no constraint can arrive at the right answer.
 */
function edgeBar(component, colour, width = 3) {
    /*
     * Measured before the bar exists. Appending a frame puts a 100px child
     * into the flow, and a card that hugs grows to fit it, so reading the
     * height afterwards sizes the bar against a card inflated by the bar.
     */
    const height = component.height;
    const bar = frame("Variant bar", { direction: "none", fill: colour }, component);
    bar.layoutPositioning = "ABSOLUTE";
    bar.x = 0;
    bar.y = 0;
    bar.resize(width, height);
    // Kept so the bar still tracks the card if anyone resizes it by hand.
    bar.constraints = { horizontal: "MIN", vertical: "STRETCH" };
    return bar;
}
/* ------------------------------------------------------------------ icons */
const ICONS = {
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M20 15v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    retry: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    home: '<path d="M3 11 12 4l9 7M5 10v10h14V10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>',
    success: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.5 2.5L16 9.5"/>',
    warning: '<path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    danger: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
    sort: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
    filter: '<path d="M4 5h16l-6 8v5l-4 2v-7Z"/>',
    more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    chevronUp: '<path d="m6 15 6-6 6 6"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    arrowFlat: '<path d="M5 12h14"/>',
    inbox: '<path d="M5 4h14l2 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z"/><path d="M3 12h5l1.5 3h5L21 12"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M17.5 14.2A6.5 6.5 0 0 1 21.5 20"/>',
    spinnerArc: '<path d="M12 3a9 9 0 1 0 9 9"/>',
};
/** A 24-unit stroke icon, recolored with a color variable and scaled to `size`. */
function icon(parent, name, colorToken, size = 16) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
    const node = figma.createNodeFromSvg(svg);
    node.name = `icon/${name}`;
    node.fills = [];
    for (const child of node.findAll((item) => "strokes" in item)) {
        const shape = child;
        if (shape.strokes.length > 0)
            shape.strokes = [paintOf(colorToken)];
    }
    parent.appendChild(node);
    node.rescale(size / 24);
    node.constrainProportions = true;
    return node;
}
/**
 * Builds each variant as a component, combines them into a component set and
 * lays the set out as a wrapping grid, the way designers expect to browse it.
 */
async function variantSet(parent, name, description, variants, columns = 4) {
    const components = [];
    for (const variant of variants) {
        const component = figma.createComponent();
        component.name = Object.entries(variant.props)
            .map(([key, value]) => `${key}=${value}`)
            .join(", ");
        parent.appendChild(component);
        await variant.build(component);
        components.push(component);
    }
    const set = figma.combineAsVariants(components, parent);
    set.name = name;
    set.description = description;
    /*
     * A grid, `columns` per row — but `columns` is a maximum, not an
     * instruction. A row also breaks when the next variant would not fit the
     * width a section can give it. Counting alone let wide variants run off
     * the card: Alert is five 460px components, which is 2444px of grid in a
     * section that offers SET_CONTENT_WIDTH.
     */
    let x = SET_PADDING;
    let y = SET_PADDING;
    let rowHeight = 0;
    let inRow = 0;
    set.children.forEach((child) => {
        const width = Math.max(child.width, 120);
        const tooMany = inRow >= columns;
        const tooWide = inRow > 0 && x + width > SET_PADDING + SET_CONTENT_WIDTH;
        if (tooMany || tooWide) {
            x = SET_PADDING;
            y += rowHeight + SET_GAP;
            rowHeight = 0;
            inRow = 0;
        }
        child.x = x;
        child.y = y;
        x += width + SET_GAP;
        rowHeight = Math.max(rowHeight, child.height);
        inRow += 1;
    });
    const right = Math.max(...set.children.map((child) => child.x + child.width));
    const bottom = Math.max(...set.children.map((child) => child.y + child.height));
    set.resizeWithoutConstraints(right + SET_PADDING, bottom + SET_PADDING);
    setStroke(set, "accent/default");
    set.dashPattern = [6, 4];
    set.cornerRadius = 8;
    return set;
}
/** Adds a text component property to a set and wires it to the named layer in every variant. */
function textProperty(set, property, layerName, defaultValue) {
    const key = set.addComponentProperty(property, "TEXT", defaultValue);
    for (const variant of set.children) {
        for (const layer of variant.findAll((node) => node.type === "TEXT" && node.name === layerName)) {
            layer.componentPropertyReferences = { characters: key };
        }
    }
}
/** Adds a boolean property that shows or hides the named layers in every variant. */
function booleanProperty(set, property, layerName, defaultValue) {
    const key = set.addComponentProperty(property, "BOOLEAN", defaultValue);
    for (const variant of set.children) {
        for (const layer of variant.findAll((node) => node.name === layerName)) {
            layer.componentPropertyReferences = Object.assign(Object.assign({}, layer.componentPropertyReferences), { visible: key });
        }
    }
}
/* ------------------------------------------------------ documentation layout */
/** A documented section on a page: title, description, then the content. */
async function docSection(page, title, description) {
    const section = frame(title, {
        direction: "column",
        gap: 16,
        padding: SECTION_PADDING,
        fill: "surface/bg",
        radius: 16,
        width: SECTION_WIDTH,
    });
    page.appendChild(section);
    applySize(section, SECTION_WIDTH, "hug");
    await text(section, title, "Title/Section");
    await text(section, description, "Body/Default", { color: "text/muted", width: "fill" });
    return section;
}
/** Stacks page children vertically, since pages have no auto layout. */
function stackPage(page, gap = 80) {
    let y = 0;
    for (const child of page.children) {
        child.x = 0;
        child.y = y;
        y += child.height + gap;
    }
}
/** The variant of a set matching every given property, for building examples from instances. */
function variantOf(set, props) {
    const match = set.children.find((component) => Object.entries(props).every(([key, value]) => component.name.split(", ").includes(`${key}=${value}`)));
    if (!match)
        throw new Error(`${set.name} has no variant ${JSON.stringify(props)}`);
    return match;
}
function instance(parent, set, props) {
    const node = variantOf(set, props).createInstance();
    parent.appendChild(node);
    return node;
}
/** Sets a text property on an instance by the property's display name. */
function setInstanceText(node, property, value) {
    const key = Object.keys(node.componentProperties).find((name) => name.split("#")[0] === property);
    if (key)
        node.setProperties({ [key]: value });
}
/** A focus ring: a 2 px halo in the focus color, as :focus-visible draws it. */
function focusRing() {
    return figma.variables.setBoundVariableForEffect(shadow(0, 0, 2, 1), "color", KIT.colors["accent/focus"]);
}
/** A labelled row of examples inside a section. */
async function exampleRow(section, label) {
    await text(section, label, "Label/Strong", { color: "text/muted" });
    const row = frame(label, { direction: "row", gap: 16, wrap: true, align: "start" }, section);
    applySize(row, "fill", "hug");
    row.counterAxisSpacing = 16;
    return row;
}
function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
// The Foundations page: colors in both modes, type, radius and spacing.
async function buildFoundations(page) {
    await docSection(page, "Grampro Kit — design system", [
        "Generated from the React component library (component-lib). Every color, radius and size here is a variable, and every component is bound to them, so switching a frame between Light and Dark (Appearance → variable mode) restyles it the way data-theme does in code.",
        "Tokens map one-to-one to the CSS variables in each component's styles.css; each variable's description names its CSS counterpart. When the code changes, update src/tokens.ts and run the plugin again: it updates variables and styles in place.",
    ].join("\n\n"));
    await buildColorSection(page);
    await buildTypeSection(page);
    await buildShapeSection(page);
}
async function buildColorSection(page) {
    var _a;
    const section = await docSection(page, "Color", "Variables in the “Grampro Kit · Color” collection, shown in each mode. Surface and accent tokens can fill anything; text tokens apply to text only and border tokens to strokes only, so the picker offers the right ones.");
    const row = frame("Modes", { direction: "row", gap: 24, align: "start" }, section);
    const modes = [
        ["Light", KIT.lightMode, "light"],
        ["Dark", KIT.darkMode, "dark"],
    ];
    for (const [label, modeId, key] of modes) {
        if (!modeId)
            continue;
        const panel = frame(`${label} mode`, {
            direction: "column",
            gap: 20,
            padding: 24,
            fill: "surface/bg",
            stroke: "border/default",
            radius: "radius/lg",
        }, row);
        panel.setExplicitVariableModeForCollection(KIT.colorCollection, modeId);
        applySize(panel, 652, "hug");
        await text(panel, `${label} mode`, "Title/Dialog");
        const groups = new Map();
        for (const token of COLOR_TOKENS) {
            const group = token.name.split("/")[0];
            groups.set(group, [...((_a = groups.get(group)) !== null && _a !== void 0 ? _a : []), token]);
        }
        for (const [group, tokens] of groups) {
            await text(panel, capitalize(group), "Label/Strong", { color: "text/muted" });
            const grid = frame(group, { direction: "row", gap: 12, wrap: true }, panel);
            applySize(grid, "fill", "hug");
            grid.counterAxisSpacing = 12;
            for (const token of tokens) {
                const swatch = frame(token.name, { direction: "column", gap: 4 }, grid);
                applySize(swatch, 140, "hug");
                const chip = frame("chip", { direction: "none", fill: token.name, stroke: "border/default", radius: "radius/md" }, swatch);
                applySize(chip, 140, 48);
                await text(swatch, token.name, "Label/Small", { width: "fill" });
                await text(swatch, key === "light" ? token.light : token.dark, "Body/Small", { color: "text/muted" });
            }
        }
    }
}
async function buildTypeSection(page) {
    const section = await docSection(page, "Type", `Text styles under “Grampro Kit/”. ${TYPE_FAMILY} stands in for the system-ui stack the components use in browsers. Turn on tabular figures (Type settings → Details) for numbers that line up: counters, cells, OTP codes.`);
    const list = frame("Styles", { direction: "column", gap: 12 }, section);
    applySize(list, "fill", "hug");
    for (const token of TYPE_TOKENS) {
        const row = frame(token.name, {
            direction: "row",
            gap: 24,
            padding: [12, 16],
            fill: "surface/bg",
            stroke: "border/subtle",
            radius: "radius/md",
        }, list);
        applySize(row, "fill", "hug");
        const name = await text(row, token.name, "Label/Default", { color: "text/muted" });
        applySize(name, 180);
        const sample = await text(row, "The quick brown fox jumps over 1,234 lazy dogs", token.name);
        applySize(sample, "fill");
        await text(row, `${token.size}/${token.lineHeight} · ${token.weight} — ${token.description}`, "Body/Small", {
            color: "text/muted",
        });
    }
}
async function buildShapeSection(page) {
    const section = await docSection(page, "Radius, control heights and spacing", "Variables in the “Grampro Kit · Size” collection. Bind corner radius, height and gaps to them instead of typing numbers, so a future change to the scale flows through.");
    const radii = frame("Radius", { direction: "row", gap: 24, align: "end" }, section);
    for (const token of NUMBER_TOKENS.filter((item) => item.name.startsWith("radius/"))) {
        const cell = frame(token.name, { direction: "column", gap: 6, align: "center" }, radii);
        const square = frame("shape", { direction: "none", fill: "accent/soft", stroke: "accent/default", radius: token.name }, cell);
        applySize(square, 72, 72);
        await text(cell, `${token.name} · ${token.value}`, "Body/Small", { color: "text/muted" });
    }
    const heights = frame("Control heights", { direction: "row", gap: 24, align: "end" }, section);
    for (const token of NUMBER_TOKENS.filter((item) => item.name.startsWith("control/"))) {
        const cell = frame(token.name, { direction: "column", gap: 6, align: "center" }, heights);
        const bar = frame("height", { direction: "none", fill: "surface/subtle", stroke: "border/default", radius: "radius/md" }, cell);
        applySize(bar, 120, token.value);
        bindNumber(bar, "height", token.name);
        await text(cell, `${token.name} · ${token.value}px`, "Body/Small", { color: "text/muted" });
    }
    const spacing = frame("Spacing", { direction: "column", gap: 8 }, section);
    for (const token of NUMBER_TOKENS.filter((item) => item.name.startsWith("space/"))) {
        const row = frame(token.name, { direction: "row", gap: 12 }, spacing);
        const label = await text(row, `${token.name} · ${token.value}`, "Body/Small", { color: "text/muted" });
        applySize(label, 140);
        const bar = frame("size", { direction: "none", fill: "accent/default", radius: 2 }, row);
        applySize(bar, Math.max(2, token.value * 4), 8);
        if (token.description)
            await text(row, token.description, "Body/Small", { color: "text/muted" });
    }
}
// Actions and navigation: Button, Icon button, Spinner, Checkbox, Tabs, Breadcrumb.
const BUTTON_LOOK = {
    Primary: { fill: "accent/default", hover: "accent/strong", ink: "accent/on-accent", line: null },
    Secondary: { fill: "surface/subtle", hover: "surface/hover", ink: "text/primary", line: null },
    Outline: { fill: "surface/bg", hover: "surface/hover", ink: "text/primary", line: "border/default" },
    Ghost: { fill: null, hover: "surface/hover", ink: "text/primary", line: null },
    Danger: { fill: "status/danger", hover: "status/danger", ink: "status/on-danger", line: null },
    Link: { fill: null, hover: null, ink: "accent/default", line: null },
};
const CONTROL_SIZES = {
    sm: { height: "control/height-sm", px: 10, gap: 6, label: "Label/Small", body: "Body/Small", icon: 14 },
    md: { height: "control/height-md", px: 14, gap: 8, label: "Label/Default", body: "Body/Default", icon: 16 },
    lg: { height: "control/height-lg", px: 18, gap: 10, label: "Label/Large", body: "Body/Large", icon: 18 },
};
/** Auto-width, token-height component: the usual shape of a control. */
const CONTROL_HEIGHT = { sm: 30, md: 36, lg: 44 };
function controlShape(node, size, width = "hug") {
    applySize(node, width, CONTROL_HEIGHT[size]);
    bindNumber(node, "height", CONTROL_SIZES[size].height);
}
async function buildActions(page) {
    await buildButtons(page);
    await buildSpinners(page);
    await buildCheckboxes(page);
    await buildTabs(page);
    await buildBreadcrumbs(page);
}
/* ------------------------------------------------------------------ Button */
async function buildButtons(page) {
    const section = await docSection(page, "Button", "component-lib/button · <Button variant size loading leading trailing icon fullWidth>. States mirror the CSS: Hover, Focus (keyboard focus ring), Disabled (50% opacity) and Loading (spinner; in code the label keeps its width). Link renders without padding. Use the Label text property and the Leading/Trailing icon toggles; swap the icons for your own.");
    const variants = [];
    const names = Object.keys(BUTTON_LOOK);
    const add = (variant, size, state) => variants.push({
        props: { Variant: variant, Size: size, State: state },
        build: (component) => buildButtonComponent(component, variant, size, state),
    });
    for (const variant of names) {
        for (const state of ["Default", "Hover", "Focus", "Disabled", "Loading"])
            add(variant, "md", state);
    }
    for (const variant of names) {
        add(variant, "sm", "Default");
        add(variant, "lg", "Default");
    }
    const set = await variantSet(section, "Button", "Actions. Code: <Button variant size loading>.", variants, 5);
    textProperty(set, "Label", "Label", "Button");
    booleanProperty(set, "Leading icon", "Leading icon", false);
    booleanProperty(set, "Trailing icon", "Trailing icon", false);
    const icons = [];
    for (const variant of ["Primary", "Secondary", "Outline", "Ghost", "Danger"]) {
        for (const size of ["sm", "md", "lg"]) {
            icons.push({
                props: { Variant: variant, Size: size },
                build: async (component) => {
                    const look = BUTTON_LOOK[variant];
                    applyLayout(component, { direction: "row", justify: "center", align: "center", fill: look.fill, stroke: look.line, radius: "radius/md" });
                    const side = { sm: 30, md: 36, lg: 44 }[size];
                    applySize(component, side, side);
                    icon(component, "plus", look.ink, CONTROL_SIZES[size].icon).name = "Icon";
                },
            });
        }
    }
    await variantSet(section, "Icon button", "Icon-only button. Code: <Button icon={…} aria-label=\"…\"> — always give it an accessible name.", icons, 3);
}
async function buildButtonComponent(component, variant, size, state) {
    var _a;
    const look = BUTTON_LOOK[variant];
    const dims = CONTROL_SIZES[size];
    const link = variant === "Link";
    const fill = state === "Hover" ? ((_a = look.hover) !== null && _a !== void 0 ? _a : look.fill) : look.fill;
    applyLayout(component, {
        direction: "row",
        gap: dims.gap,
        padding: link ? 0 : [0, dims.px],
        justify: "center",
        align: "center",
        fill,
        stroke: look.line,
        radius: "radius/md",
    });
    if (link)
        applySize(component, "hug", "hug");
    else
        controlShape(component, size);
    if (state === "Loading")
        icon(component, "spinnerArc", look.ink, dims.icon).name = "Spinner";
    icon(component, "plus", look.ink, dims.icon).name = "Leading icon";
    const label = await text(component, "Button", dims.label, { color: look.ink });
    label.name = "Label";
    if (link && state === "Hover")
        label.textDecoration = "UNDERLINE";
    icon(component, "chevronRight", look.ink, dims.icon).name = "Trailing icon";
    if (state === "Focus")
        component.effects = [focusRing()];
    if (state === "Disabled")
        component.opacity = 0.5;
}
/* ----------------------------------------------------------------- Spinner */
async function buildSpinners(page) {
    const section = await docSection(page, "Spinner", "component-lib/spinner · <Spinner size variant label delay minDuration>. In code the spinner takes the current text color; here it uses accent/default — override the stroke to match. Wrapping content in <Spinner loading> covers it with surface/bg at 72% and makes it inert.");
    const sizes = [["xs", 12], ["sm", 16], ["md", 24], ["lg", 32], ["xl", 48]];
    const variants = [];
    for (const kind of ["Ring", "Dots"]) {
        for (const [name, px] of sizes) {
            variants.push({
                props: { Variant: kind, Size: name },
                build: async (component) => {
                    applyLayout(component, { direction: "none" });
                    component.resizeWithoutConstraints(px, px);
                    if (kind === "Ring") {
                        const track = figma.createEllipse();
                        track.name = "Track";
                        component.appendChild(track);
                        track.resize(px * (19 / 24), px * (19 / 24));
                        track.x = px * (2.5 / 24);
                        track.y = px * (2.5 / 24);
                        track.fills = [];
                        setStroke(track, "border/default", Math.max(1, px * (2.5 / 24)));
                        const arc = icon(component, "spinnerArc", "accent/default", px);
                        arc.name = "Arc";
                    }
                    else {
                        const dot = px * 0.22;
                        const gap = (px - dot * 3) / 2;
                        [0.3, 0.65, 1].forEach((opacity, index) => {
                            const circle = figma.createEllipse();
                            circle.name = `Dot ${index + 1}`;
                            component.appendChild(circle);
                            circle.resize(dot, dot);
                            circle.x = index * (dot + gap);
                            circle.y = (px - dot) / 2;
                            setFill(circle, "accent/default");
                            circle.opacity = opacity;
                        });
                    }
                },
            });
        }
    }
    await variantSet(section, "Spinner", "Loading indicator. Code: <Spinner size variant>.", variants, 5);
}
/* ---------------------------------------------------------------- Checkbox */
async function buildCheckboxes(page) {
    const section = await docSection(page, "Checkbox", "component-lib/checkbox · <Checkbox checked=\"true | false | indeterminate\" label description error size> and <CheckboxGroup options selectAll orientation>. The box is a native input in code, so Focus is the keyboard focus ring. Toggle the Description layer with its property.");
    const variants = [];
    const add = (checked, interaction, size) => variants.push({
        props: { Checked: checked, State: interaction, Size: size },
        build: (component) => buildCheckboxComponent(component, checked, interaction, size),
    });
    for (const checked of ["False", "True", "Indeterminate"]) {
        for (const interaction of ["Default", "Hover", "Focus", "Disabled", "Invalid"])
            add(checked, interaction, "md");
    }
    for (const size of ["sm", "lg"]) {
        add("False", "Default", size);
        add("True", "Default", size);
    }
    const set = await variantSet(section, "Checkbox", "Single checkbox with label. Code: <Checkbox>.", variants, 5);
    textProperty(set, "Label", "Label", "Email me about new features");
    textProperty(set, "Description", "Description", "About once a month.");
    booleanProperty(set, "Show description", "Description", false);
    // A group, built from instances.
    const row = await exampleRow(section, "Example — CheckboxGroup with select all");
    const group = frame("CheckboxGroup", { direction: "column", gap: 8 }, row);
    await text(group, "Notify me by", "Label/Default");
    const all = instance(group, set, { Checked: "Indeterminate", State: "Default", Size: "md" });
    setInstanceText(all, "Label", "Select all");
    const items = frame("Items", { direction: "column", gap: 8, padding: [0, 0, 0, 24] }, group);
    for (const [label, checked, state] of [["Email", "True", "Default"], ["SMS", "False", "Default"], ["Push", "True", "Default"], ["Slack (needs an admin)", "False", "Disabled"]]) {
        const item = instance(items, set, { Checked: checked, State: state, Size: "md" });
        setInstanceText(item, "Label", label);
    }
}
async function buildCheckboxComponent(component, checked, interaction, size) {
    const box = { sm: 14, md: 16, lg: 20 }[size];
    const on = checked !== "False";
    applyLayout(component, { direction: "row", gap: 8, align: "start" });
    applySize(component, "hug", "hug");
    const control = frame("Box", {
        direction: "row",
        justify: "center",
        align: "center",
        fill: on ? "accent/default" : "surface/input",
        stroke: on ? "accent/default" : interaction === "Invalid" ? "status/danger" : interaction === "Hover" ? "text/muted" : "border/control",
        strokeWeight: 1.5,
        radius: "radius/xs",
    }, component);
    applySize(control, box, box);
    control.strokeAlign = "INSIDE";
    if (checked === "True")
        icon(control, "check", "accent/on-accent", box * 0.75).name = "Check";
    if (checked === "Indeterminate")
        icon(control, "minus", "accent/on-accent", box * 0.75).name = "Dash";
    if (interaction === "Focus")
        control.effects = [focusRing()];
    const copy = frame("Text", { direction: "column", gap: 1 }, component);
    const label = await text(copy, "Email me about new features", CONTROL_SIZES[size].body, {
        color: interaction === "Disabled" ? "text/muted" : "text/primary",
    });
    label.name = "Label";
    const description = await text(copy, "About once a month.", "Body/Small", { color: "text/muted" });
    description.name = "Description";
    if (interaction === "Invalid") {
        (await text(copy, "Please accept to continue.", "Body/Small", { color: "status/danger" })).name = "Error";
    }
    if (interaction === "Disabled")
        control.opacity = 0.5;
}
/* -------------------------------------------------------------------- Tabs */
async function buildTabs(page) {
    const section = await docSection(page, "Tabs", "component-lib/tabs · <Tabs variant orientation><TabList><Tab value badge icon/></TabList><TabPanel/></Tabs>. Three looks: Line (sliding underline), Pills and Enclosed (segmented control). Build a tab list from instances as in the examples; in code the indicator slides between tabs.");
    const variants = [];
    for (const look of ["Line", "Pills", "Enclosed"]) {
        for (const state of ["Default", "Hover", "Selected", "Focus", "Disabled"]) {
            variants.push({ props: { Variant: look, State: state }, build: (component) => buildTabComponent(component, look, state) });
        }
    }
    const set = await variantSet(section, "Tab", "One tab. Code: <Tab value badge>.", variants, 5);
    textProperty(set, "Label", "Label", "Overview");
    textProperty(set, "Badge", "Badge text", "3");
    booleanProperty(set, "Show badge", "Badge", false);
    const row = await exampleRow(section, "Examples — tab lists");
    const labels = ["Overview", "Activity", "Settings", "Billing"];
    const states = ["Selected", "Default", "Default", "Disabled"];
    for (const look of ["Line", "Pills", "Enclosed"]) {
        const list = frame(`${look} tab list`, {
            direction: "row",
            gap: look === "Line" ? 0 : 2,
            padding: look === "Enclosed" ? 3 : 0,
            fill: look === "Enclosed" ? "surface/subtle" : null,
            radius: look === "Enclosed" ? "radius/md" : 0,
            align: "end",
        }, row);
        if (look === "Line") {
            setStroke(list, "border/default");
            list.strokeTopWeight = 0;
            list.strokeLeftWeight = 0;
            list.strokeRightWeight = 0;
            list.strokeBottomWeight = 1;
        }
        labels.forEach((label, index) => {
            const tab = instance(list, set, { Variant: look, State: states[index] });
            setInstanceText(tab, "Label", label);
        });
    }
}
async function buildTabComponent(component, look, state) {
    const selected = state === "Selected";
    // Unselected tabs use text/tab, not text/muted: a tab is a control, and the
    // strip usually sits on the page background rather than on a white card.
    const ink = look === "Pills" && selected ? "accent/default" : selected || state === "Hover" ? "text/primary" : "text/tab";
    if (look === "Line") {
        applyLayout(component, { direction: "column", align: "center" });
        applySize(component, "hug", "hug");
        const content = frame("Content", { direction: "row", gap: 6, padding: [0, 12], align: "center" }, component);
        applySize(content, "hug", 36);
        await tabContent(content, ink, selected);
        const indicator = frame("Indicator", { direction: "none", fill: selected ? "accent/default" : null, radius: 2 }, component);
        applySize(indicator, "fill", 2);
    }
    else {
        applyLayout(component, {
            direction: "row",
            gap: 6,
            padding: [0, 12],
            align: "center",
            radius: "radius/sm",
            fill: look === "Pills"
                ? selected ? "accent/soft" : state === "Hover" ? "surface/hover" : null
                : selected ? "surface/bg" : null,
        });
        applySize(component, "hug", look === "Enclosed" ? 30 : 36);
        if (look === "Enclosed" && selected)
            component.effects = [shadow(1, 3, 0, 0.12)];
        await tabContent(component, ink, selected);
    }
    if (state === "Focus")
        component.effects = [...component.effects, focusRing()];
    if (state === "Disabled")
        component.opacity = 0.45;
}
async function tabContent(parent, ink, selected) {
    (await text(parent, "Overview", "Label/Default", { color: ink })).name = "Label";
    const badge = frame("Badge", { direction: "row", padding: [1, 6], radius: "radius/full", fill: selected ? "accent/soft" : "surface/hover" }, parent);
    (await text(badge, "3", "Label/Small", { color: selected ? "accent/default" : "text/muted" })).name = "Badge text";
}
/* -------------------------------------------------------------- Breadcrumb */
async function buildBreadcrumbs(page) {
    const section = await docSection(page, "Breadcrumb", "component-lib/breadcrumb · <Breadcrumb items maxItems renderLink structuredData>. The last item is the current page (not a link). Long trails collapse behind the Ellipsis item; labels longer than 24 characters are cut with an ellipsis.");
    const variants = [];
    for (const kind of ["Link", "Current", "Ellipsis"]) {
        for (const state of kind === "Current" ? ["Default"] : ["Default", "Hover", "Focus"]) {
            variants.push({
                props: { Type: kind, State: state },
                build: async (component) => {
                    if (kind === "Ellipsis") {
                        applyLayout(component, { direction: "row", justify: "center", align: "center", radius: "radius/xs", fill: state === "Hover" ? "surface/hover" : null });
                        applySize(component, 24, 22);
                        await text(component, "…", "Label/Default", { color: state === "Hover" ? "text/primary" : "text/muted" });
                    }
                    else {
                        applyLayout(component, { direction: "row", gap: 5, padding: [2, 4], align: "center", radius: "radius/xs" });
                        applySize(component, "hug", "hug");
                        const current = kind === "Current";
                        const color = current || state === "Hover" ? "text/primary" : "text/muted";
                        icon(component, "home", color, 14).name = "Icon";
                        const label = await text(component, current ? "INV-2026-0042" : "Invoices", current ? "Label/Default" : "Body/Default", { color });
                        label.name = "Label";
                        if (state === "Hover")
                            label.textDecoration = "UNDERLINE";
                    }
                    if (state === "Focus")
                        component.effects = [focusRing()];
                },
            });
        }
    }
    const set = await variantSet(section, "Breadcrumb item", "One crumb. Code: an item in <Breadcrumb items>.", variants, 3);
    textProperty(set, "Label", "Label", "Invoices");
    booleanProperty(set, "Show icon", "Icon", false);
    const separator = figma.createComponent();
    separator.name = "Breadcrumb separator";
    section.appendChild(separator);
    applyLayout(separator, { direction: "row", align: "center" });
    applySize(separator, "hug", "hug");
    icon(separator, "chevronRight", "text/muted", 14);
    separator.opacity = 0.7;
    for (const [label, crumbs] of [
        ["Example — full trail", ["Home", "Workspaces", "Finance", "Invoices", "INV-2026-0042"]],
        ["Example — collapsed (maxItems={3})", ["Home", "…", "Invoices", "INV-2026-0042"]],
    ]) {
        const row = await exampleRow(section, label);
        const trail = frame("Breadcrumb", { direction: "row", gap: 6, align: "center" }, row);
        crumbs.forEach((crumb, index) => {
            if (index > 0)
                trail.appendChild(separator.createInstance());
            const last = index === crumbs.length - 1;
            const node = instance(trail, set, crumb === "…" ? { Type: "Ellipsis", State: "Default" } : { Type: last ? "Current" : "Link", State: "Default" });
            if (crumb !== "…")
                setInstanceText(node, "Label", crumb);
        });
    }
}
// Form fields: Input, OtpInput, Textarea, Select and MultiSelect, DatePicker.
/** Label above, control, hint or error below — the layout every field shares. */
async function fieldShell(component, width, state, label = "Label") {
    applyLayout(component, { direction: "column", gap: 4 });
    applySize(component, width, "hug");
    (await text(component, label, "Label/Default")).name = "Label";
    const control = frame("Control", {
        direction: "row",
        gap: 6,
        padding: [0, 10],
        align: "center",
        fill: state === "Read-only" ? "surface/readonly" : "surface/input",
        stroke: state === "Invalid" ? "status/danger" : state === "Hover" ? "text/muted" : "border/default",
        radius: "radius/md",
    }, component);
    if (state === "Focus")
        control.effects = [focusRing()];
    if (state === "Invalid")
        control.effects = [];
    return control;
}
async function fieldFooter(component, state, hint = "Hint text") {
    if (state === "Invalid") {
        (await text(component, "Error message", "Body/Small", { color: "status/danger", width: "fill" })).name = "Error";
    }
    else {
        (await text(component, hint, "Body/Small", { color: "text/muted", width: "fill" })).name = "Hint";
    }
    if (state === "Disabled")
        component.opacity = 0.55;
}
const FIELD_STATES = ["Default", "Hover", "Focus", "Filled", "Invalid", "Disabled", "Read-only"];
async function buildForms(page) {
    await buildInputs(page);
    await buildOtp(page);
    await buildTextareas(page);
    await buildSelects(page);
    await buildDatePickers(page);
}
/* ------------------------------------------------------------------- Input */
async function buildInputs(page) {
    const section = await docSection(page, "Input", "component-lib/input · <Input label description error leading trailing clearable showCount size type>. Filled shows a value; Focus shows the 2 px focus ring; Invalid swaps the hint for the error. Toggle leading/trailing adornments, the clear button and the counter with properties. type=\"password\" adds a show/hide button (Password variant).");
    const variants = [];
    for (const kind of ["Text", "Password"]) {
        for (const state of FIELD_STATES) {
            variants.push({ props: { Type: kind, State: state, Size: "md" }, build: (component) => buildInputComponent(component, kind, state, "md") });
        }
    }
    for (const size of ["sm", "lg"]) {
        variants.push({ props: { Type: "Text", State: "Default", Size: size }, build: (component) => buildInputComponent(component, "Text", "Default", size) });
    }
    const set = await variantSet(section, "Input", "Text field. Code: <Input>.", variants, 7);
    textProperty(set, "Label", "Label", "Email");
    textProperty(set, "Value", "Value", "ada@example.com");
    textProperty(set, "Hint", "Hint", "We'll send the receipt here.");
    booleanProperty(set, "Leading", "Leading", false);
    booleanProperty(set, "Trailing", "Trailing", false);
    booleanProperty(set, "Clear button", "Clear", false);
    booleanProperty(set, "Counter", "Count", false);
}
async function buildInputComponent(component, kind, state, size) {
    const control = await fieldShell(component, 280, state, kind === "Password" ? "Password" : "Email");
    controlShape(control, size, "fill");
    const filled = state !== "Default" && state !== "Hover" && state !== "Focus";
    (await text(control, "@", CONTROL_SIZES[size].body, { color: "text/muted" })).name = "Leading";
    const value = await text(control, kind === "Password" ? (filled ? "••••••••••" : "Enter password") : filled ? "ada@example.com" : "name@company.com", CONTROL_SIZES[size].body, {
        color: filled ? "text/primary" : "text/muted",
        width: "fill",
    });
    value.name = "Value";
    if (state === "Focus") {
        const caret = frame("Caret", { direction: "none", fill: "text/primary" }, control);
        applySize(caret, 1, 16);
    }
    icon(control, "x", "text/muted", 14).name = "Clear";
    if (kind === "Password")
        icon(control, "eye", "text/muted", 16).name = "Reveal";
    (await text(control, "kg", CONTROL_SIZES[size].body, { color: "text/muted" })).name = "Trailing";
    const footer = frame("Footer", { direction: "row", gap: 8, justify: "between" }, component);
    applySize(footer, "fill", "hug");
    if (state === "Invalid") {
        (await text(footer, "Enter a valid email address", "Body/Small", { color: "status/danger", width: "fill" })).name = "Error";
    }
    else {
        (await text(footer, "We'll send the receipt here.", "Body/Small", { color: "text/muted", width: "fill" })).name = "Hint";
    }
    (await text(footer, "15 / 40", "Body/Small", { color: "text/muted" })).name = "Count";
    if (state === "Disabled")
        component.opacity = 0.55;
}
/* --------------------------------------------------------------------- OTP */
async function buildOtp(page) {
    const section = await docSection(page, "OtpInput", "component-lib/input · <OtpInput length mode groups mask onComplete>. In code it is one real input drawn as cells, so SMS autofill and paste work. Compose a code from Cell instances; Active shows the caret, Filled shows a character.");
    const variants = [];
    for (const state of ["Empty", "Active", "Filled", "Filled active", "Invalid", "Disabled"]) {
        for (const size of ["sm", "md", "lg"]) {
            variants.push({
                props: { State: state, Size: size },
                build: async (component) => {
                    const cell = { sm: 34, md: 42, lg: 50 }[size];
                    const active = state.includes("Active") || state === "Filled active";
                    applyLayout(component, {
                        direction: "row",
                        justify: "center",
                        align: "center",
                        fill: "surface/input",
                        stroke: state === "Invalid" ? "status/danger" : state.startsWith("Filled") ? "text/muted" : "border/default",
                        radius: "radius/md",
                    });
                    applySize(component, cell, Math.round(cell * 1.15));
                    if (active)
                        component.effects = [focusRing()];
                    if (state.startsWith("Filled") || state === "Invalid") {
                        (await text(component, "4", "Numeric/OTP")).name = "Character";
                    }
                    else if (state === "Active") {
                        const caret = frame("Caret", { direction: "none", fill: "text/primary" }, component);
                        applySize(caret, 1.5, 20);
                    }
                    if (state === "Disabled")
                        component.opacity = 0.55;
                },
            });
        }
    }
    const set = await variantSet(section, "OTP cell", "One character of a code. Code: <OtpInput>.", variants, 3);
    textProperty(set, "Character", "Character", "4");
    const row = await exampleRow(section, "Example — 6 digits, groups={[3, 3]}");
    const field = frame("OtpInput", { direction: "column", gap: 4 }, row);
    await text(field, "Verification code", "Label/Default");
    const cells = frame("Cells", { direction: "row", gap: 8, align: "center" }, field);
    ["1", "2", "3", "", "", ""].forEach((digit, index) => {
        if (index === 3) {
            const dash = frame("Separator", { direction: "none", fill: "text/muted", radius: 1 }, cells);
            applySize(dash, 10, 2);
        }
        const node = instance(cells, set, { State: digit ? "Filled" : index === 3 ? "Active" : "Empty", Size: "md" });
        if (digit)
            setInstanceText(node, "Character", digit);
    });
    await text(field, "Type or paste the code from the SMS.", "Body/Small", { color: "text/muted" });
}
/* ---------------------------------------------------------------- Textarea */
async function buildTextareas(page) {
    const section = await docSection(page, "Textarea", "component-lib/textarea · <Textarea autoResize minRows maxRows showCount resize>. The field grows with its text between minRows and maxRows; resize the component's height to show more lines.");
    const variants = [];
    for (const state of FIELD_STATES) {
        variants.push({
            props: { State: state },
            build: async (component) => {
                applyLayout(component, { direction: "column", gap: 4 });
                applySize(component, 320, "hug");
                (await text(component, "Delivery notes", "Label/Default")).name = "Label";
                const box = frame("Field", {
                    direction: "column",
                    padding: [8, 10],
                    fill: state === "Read-only" ? "surface/readonly" : "surface/input",
                    stroke: state === "Invalid" ? "status/danger" : state === "Hover" ? "text/muted" : "border/default",
                    radius: "radius/md",
                }, component);
                applySize(box, "fill", 96);
                if (state === "Focus")
                    box.effects = [focusRing()];
                const filled = !["Default", "Hover", "Focus"].includes(state);
                (await text(box, filled ? "Leave the parcel with the neighbour at number 12 if nobody answers." : "Grows as you type, up to six lines", "Body/Default", {
                    color: filled ? "text/primary" : "text/muted",
                    width: "fill",
                })).name = "Value";
                const footer = frame("Footer", { direction: "row", gap: 8, justify: "between" }, component);
                applySize(footer, "fill", "hug");
                (await text(footer, state === "Invalid" ? "Write at least 20 characters." : "Shown to the courier.", "Body/Small", {
                    color: state === "Invalid" ? "status/danger" : "text/muted",
                    width: "fill",
                })).name = "Hint";
                (await text(footer, "68 / 280", "Body/Small", { color: "text/muted" })).name = "Count";
                if (state === "Disabled")
                    component.opacity = 0.55;
            },
        });
    }
    const set = await variantSet(section, "Textarea", "Multi-line field. Code: <Textarea>.", variants, 4);
    textProperty(set, "Label", "Label", "Delivery notes");
    textProperty(set, "Value", "Value", "Leave the parcel with the neighbour.");
    booleanProperty(set, "Counter", "Count", true);
}
/* ------------------------------------------------------ Select / MultiSelect */
async function buildSelects(page) {
    const section = await docSection(page, "Select & MultiSelect", "component-lib/combobox · <Select> and <MultiSelect maxVisibleTags>. The trigger, the popover list and its options are separate components so you can compose open states. Options can show a group heading, a description, a check mark (selected) and the active highlight (keyboard).");
    const triggers = [];
    for (const kind of ["Single", "Multiple"]) {
        for (const state of ["Default", "Hover", "Open", "Filled", "Invalid", "Disabled"]) {
            triggers.push({
                props: { Type: kind, State: state },
                build: async (component) => {
                    const control = await fieldShell(component, 300, state === "Open" ? "Focus" : state, kind === "Single" ? "Country" : "Departments");
                    controlShape(control, "md", "fill");
                    const filled = state === "Filled" || state === "Open" || state === "Invalid" || state === "Disabled";
                    if (kind === "Multiple" && filled) {
                        const tags = frame("Tags", { direction: "row", gap: 4 }, control);
                        applySize(tags, "fill", "hug");
                        for (const tag of ["Engineering", "Design"])
                            await tagChip(tags, tag);
                        (await text(tags, "+2 more", "Body/Small", { color: "text/muted" })).name = "Overflow";
                    }
                    else {
                        (await text(control, filled ? "Germany" : "Select…", "Body/Default", { color: filled ? "text/primary" : "text/muted", width: "fill" })).name = "Value";
                    }
                    if (filled)
                        icon(control, "x", "text/muted", 14).name = "Clear";
                    const chevron = icon(control, "chevronDown", "text/muted", 16);
                    chevron.name = "Chevron";
                    if (state === "Open")
                        chevron.rotation = 180;
                    await fieldFooter(component, state, "Grouped, with search");
                },
            });
        }
    }
    const triggerSet = await variantSet(section, "Select trigger", "Closed control. Code: <Select> / <MultiSelect>.", triggers, 6);
    textProperty(triggerSet, "Label", "Label", "Country");
    const options = [];
    for (const state of ["Default", "Active", "Selected", "Active selected", "Disabled"]) {
        options.push({
            props: { State: state },
            build: async (component) => {
                applyLayout(component, { direction: "row", gap: 8, padding: [6, 8], radius: "radius/sm", fill: state.startsWith("Active") ? "surface/hover" : null });
                applySize(component, 260, "hug");
                const check = icon(component, "check", "accent/default", 16);
                check.name = "Check";
                check.opacity = state.includes("elected") ? 1 : 0;
                const body = frame("Body", { direction: "column" }, component);
                applySize(body, "fill", "hug");
                (await text(body, "Germany", state.includes("elected") ? "Label/Default" : "Body/Default", {
                    color: state.includes("elected") ? "accent/strong" : "text/primary",
                })).name = "Label";
                (await text(body, "Berlin", "Body/Small", { color: "text/muted" })).name = "Description";
                if (state === "Disabled")
                    component.opacity = 0.45;
            },
        });
    }
    const optionSet = await variantSet(section, "Select option", "A list row. Toggle the description.", options, 5);
    textProperty(optionSet, "Label", "Label", "Germany");
    textProperty(optionSet, "Description", "Description", "Berlin");
    booleanProperty(optionSet, "Show description", "Description", false);
    const row = await exampleRow(section, "Example — open Select");
    const stack = frame("Open select", { direction: "column", gap: 4 }, row);
    instance(stack, triggerSet, { Type: "Single", State: "Open" });
    const popover = frame("Popover", { direction: "column", fill: "surface/bg", stroke: "border/default", radius: "radius/md", clip: true }, stack);
    popover.effects = [shadow(10, 30, -8, 0.18)];
    applySize(popover, 300, "hug");
    const search = frame("Search", { direction: "row", gap: 6, padding: [6, 10] }, popover);
    applySize(search, "fill", "hug");
    setStroke(search, "border/default");
    search.strokeTopWeight = 0;
    search.strokeLeftWeight = 0;
    search.strokeRightWeight = 0;
    icon(search, "search", "text/muted", 14);
    await text(search, "Search…", "Body/Default", { color: "text/muted" });
    const list = frame("List", { direction: "column", padding: 4 }, popover);
    applySize(list, "fill", "hug");
    await text(list, "EUROPE", "Label/Small", { color: "text/muted" });
    for (const [label, state] of [["France", "Default"], ["Germany", "Active selected"], ["Spain", "Default"]]) {
        const option = instance(list, optionSet, { State: state });
        setInstanceText(option, "Label", label);
        applySize(option, "fill");
    }
}
async function tagChip(parent, label) {
    const tag = frame("Tag", { direction: "row", gap: 2, padding: [2, 3, 2, 8], radius: "radius/full", fill: "accent/soft" }, parent);
    await text(tag, label, "Label/Small", { color: "accent/strong" });
    icon(tag, "x", "accent/strong", 12);
}
/* -------------------------------------------------------------- DatePicker */
async function buildDatePickers(page) {
    const section = await docSection(page, "DatePicker & DateRangePicker", "component-lib/date-picker · <DatePicker> and <DateRangePicker presets numberOfMonths>. People can type the date or pick it. Build calendars from Day cells: Today has an accent outline, Selected is filled, In range shows the soft band with rounded Range start / Range end caps.");
    const fields = [];
    for (const kind of ["Single", "Range"]) {
        for (const state of ["Default", "Focus", "Filled", "Invalid", "Disabled"]) {
            fields.push({
                props: { Type: kind, State: state },
                build: async (component) => {
                    const control = await fieldShell(component, kind === "Range" ? 340 : 260, state, kind === "Range" ? "Reporting period" : "Delivery date");
                    controlShape(control, "md", "fill");
                    const filled = state !== "Default" && state !== "Focus";
                    const color = filled ? "text/primary" : "text/muted";
                    if (kind === "Range") {
                        (await text(control, filled ? "1 Mar 2026" : "dd/mm/yyyy", "Body/Default", { color, width: "fill" })).name = "Start";
                        await text(control, "–", "Body/Default", { color: "text/muted" });
                        (await text(control, filled ? "31 Mar 2026" : "dd/mm/yyyy", "Body/Default", { color, width: "fill" })).name = "End";
                    }
                    else {
                        (await text(control, filled ? "12 Mar 2026" : "dd/mm/yyyy", "Body/Default", { color, width: "fill" })).name = "Value";
                    }
                    if (filled)
                        icon(control, "x", "text/muted", 14).name = "Clear";
                    icon(control, "calendar", "text/muted", 16).name = "Calendar";
                    await fieldFooter(component, state, kind === "Range" ? "Two months, with shortcuts" : "Type a date or pick one");
                },
            });
        }
    }
    await variantSet(section, "Date field", "Closed control. Code: <DatePicker> / <DateRangePicker>.", fields, 5);
    const days = [];
    for (const state of ["Default", "Hover", "Focus", "Today", "Selected", "Outside", "Disabled", "In range", "Range start", "Range end"]) {
        days.push({
            props: { State: state },
            build: async (component) => {
                const band = state.startsWith("Range") || state === "In range";
                applyLayout(component, { direction: "row", justify: "center", align: "center", fill: band ? "accent/soft" : null });
                applySize(component, 34, 36);
                if (state === "Range start") {
                    component.topLeftRadius = 6;
                    component.bottomLeftRadius = 6;
                }
                if (state === "Range end") {
                    component.topRightRadius = 6;
                    component.bottomRightRadius = 6;
                }
                const filled = state === "Selected" || state === "Range start" || state === "Range end";
                const day = frame("Day", {
                    direction: "row",
                    justify: "center",
                    align: "center",
                    radius: "radius/sm",
                    fill: filled ? "accent/default" : state === "Hover" ? "surface/hover" : null,
                    stroke: state === "Today" ? "accent/default" : null,
                }, component);
                applySize(day, 34, 34);
                if (state === "Focus")
                    day.effects = [focusRing()];
                (await text(day, "12", filled || state === "Today" ? "Label/Strong" : "Body/Default", {
                    color: filled ? "accent/on-accent" : state === "Outside" ? "text/muted" : "text/primary",
                })).name = "Number";
                if (state === "Disabled")
                    day.opacity = 0.35;
            },
        });
    }
    const daySet = await variantSet(section, "Day cell", "One day in the calendar grid.", days, 5);
    textProperty(daySet, "Day", "Number", "12");
    // An open calendar for March 2026 (starts on a Sunday; Monday-first grid).
    const row = await exampleRow(section, "Example — calendar popover (range 9–13 March)");
    const panel = frame("Calendar", { direction: "column", gap: 4, padding: 8, fill: "surface/bg", stroke: "border/default", radius: "radius/md" }, row);
    panel.effects = [shadow(10, 30, -8, 0.18)];
    const nav = frame("Navigation", { direction: "row", justify: "between", align: "center" }, panel);
    applySize(nav, 238, "hug");
    icon(nav, "chevronLeft", "text/primary", 16);
    const title = frame("Title", { direction: "row", gap: 4, align: "center" }, nav);
    await text(title, "March 2026", "Label/Strong");
    icon(title, "chevronDown", "text/muted", 14);
    icon(nav, "chevronRight", "text/primary", 16);
    const weekdays = frame("Weekdays", { direction: "row" }, panel);
    for (const name of ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]) {
        const cell = frame(name, { direction: "row", justify: "center" }, weekdays);
        applySize(cell, 34, "hug");
        await text(cell, name, "Label/Small", { color: "text/muted" });
    }
    // 23 Feb … 5 Apr: six Monday-first weeks.
    const numbers = [23, 24, 25, 26, 27, 28, ...Array.from({ length: 31 }, (_, index) => index + 1), 1, 2, 3, 4, 5];
    for (let week = 0; week < 6; week++) {
        const line = frame(`Week ${week + 1}`, { direction: "row" }, panel);
        for (let column = 0; column < 7; column++) {
            const position = week * 7 + column;
            const value = numbers[position];
            const outside = position < 6 || position >= 37;
            const state = outside ? "Outside" : value === 9 ? "Range start" : value === 13 ? "Range end" : value > 9 && value < 13 ? "In range" : value === 16 ? "Today" : "Default";
            const cell = instance(line, daySet, { State: state });
            setInstanceText(cell, "Day", String(value));
        }
    }
    const footer = frame("Footer", { direction: "row", justify: "between", padding: [6, 0, 0, 0] }, panel);
    applySize(footer, 238, "hug");
    await text(footer, "Today", "Label/Default", { color: "accent/default" });
    await text(footer, "Clear", "Label/Default", { color: "accent/default" });
}
// Choice and quantity controls: Switch, Radio and RadioGroup, NumberInput.
async function buildControls(page) {
    await buildSwitches(page);
    await buildRadios(page);
    await buildNumberInputs(page);
}
/* ------------------------------------------------------------------ Switch */
const SWITCH_SIZES = {
    sm: { width: 28, height: 16, gap: 2 },
    md: { width: 36, height: 20, gap: 3 },
    lg: { width: 44, height: 24, gap: 3 },
};
async function buildSwitches(page) {
    const section = await docSection(page, "Switch", "component-lib/switch · <Switch checked label description size labelPosition loading readOnly>. A setting that takes effect as it is flipped, so there is no Save button under it — use a Checkbox when there is. Saving is the state after a press while the change is still in flight: the switch shows the new setting at once and puts itself back if the save fails.");
    const variants = [];
    const add = (on, state, size) => variants.push({
        props: { On: on, State: state, Size: size },
        build: (component) => buildSwitchComponent(component, on === "True", state, size),
    });
    for (const on of ["False", "True"]) {
        for (const state of ["Default", "Hover", "Focus", "Disabled", "Saving"])
            add(on, state, "md");
    }
    for (const size of ["sm", "lg"]) {
        add("False", "Default", size);
        add("True", "Default", size);
    }
    const set = await variantSet(section, "Switch", "A setting that applies at once. Code: <Switch>.", variants, 5);
    textProperty(set, "Label", "Label", "Email notifications");
    textProperty(set, "Description", "Description", "About once a month.");
    booleanProperty(set, "Show description", "Description", false);
    const row = await exampleRow(section, "Example — a settings list (labelPosition=\"start\")");
    const list = frame("Settings", {
        direction: "column",
        gap: 12,
        padding: 16,
        fill: "surface/bg",
        stroke: "border/default",
        radius: "radius/md",
    }, row);
    applySize(list, 360, "hug");
    for (const [label, on] of [["Email notifications", "True"], ["Weekly digest", "True"], ["Product research invitations", "False"]]) {
        const line = frame(label, { direction: "row", justify: "between", align: "center" }, list);
        applySize(line, "fill", "hug");
        await text(line, label, "Body/Default");
        instance(line, set, { On: on, State: "Default", Size: "md" });
    }
}
async function buildSwitchComponent(component, on, state, size) {
    const { width, height, gap } = SWITCH_SIZES[size];
    applyLayout(component, { direction: "row", gap: 8, align: "start" });
    applySize(component, "hug", "hug");
    const track = frame("Track", {
        direction: "row",
        align: "center",
        justify: on ? "end" : "start",
        padding: gap,
        fill: on ? "accent/default" : "surface/subtle",
        radius: 999,
    }, component);
    applySize(track, width, height);
    if (state === "Focus")
        track.effects = [focusRing()];
    if (state === "Disabled")
        track.opacity = 0.5;
    const thumb = frame("Thumb", { direction: "none", fill: "surface/bg", radius: 999 }, track);
    applySize(thumb, height - gap * 2, height - gap * 2);
    thumb.effects = [shadow(1, 2, 0, 0.25)];
    // Saving: the thumb is a turning arc rather than a disc.
    if (state === "Saving") {
        setFill(thumb, null);
        icon(thumb, "spinnerArc", "accent/on-accent", height - gap * 2).name = "Spinner";
    }
    const copy = frame("Text", { direction: "column", gap: 1 }, component);
    const label = await text(copy, "Email notifications", CONTROL_SIZES[size].body, {
        color: state === "Disabled" ? "text/muted" : "text/primary",
    });
    label.name = "Label";
    (await text(copy, "About once a month.", "Body/Small", { color: "text/muted" })).name = "Description";
}
/* ------------------------------------------------------------------- Radio */
async function buildRadios(page) {
    const section = await docSection(page, "Radio and RadioGroup", "component-lib/radio-group · <RadioGroup label options value orientation variant clearable> with <Radio value label description>. Native radios in code, so the group is one tab stop and the arrow keys move between the choices. A radio cannot be unselected, so an optional question needs either the clear button or a choice of its own.");
    const variants = [];
    const add = (selected, state, size) => variants.push({
        props: { Selected: selected, State: state, Size: size },
        build: (component) => buildRadioComponent(component, selected === "True", state, size),
    });
    for (const selected of ["False", "True"]) {
        for (const state of ["Default", "Hover", "Focus", "Disabled", "Invalid"])
            add(selected, state, "md");
    }
    for (const size of ["sm", "lg"]) {
        add("False", "Default", size);
        add("True", "Default", size);
    }
    const set = await variantSet(section, "Radio", "One choice. Code: <Radio value label>.", variants, 5);
    textProperty(set, "Label", "Label", "Weekly");
    textProperty(set, "Description", "Description", "Every Monday morning.");
    booleanProperty(set, "Show description", "Description", false);
    const row = await exampleRow(section, "Example — a group, and the card variant");
    const group = frame("RadioGroup", { direction: "column", gap: 8 }, row);
    await text(group, "Send the report", "Label/Default");
    for (const [label, selected, state] of [["Daily", "False", "Default"], ["Weekly", "True", "Default"], ["Monthly", "False", "Default"], ["Hourly (needs an admin)", "False", "Disabled"]]) {
        const item = instance(group, set, { Selected: selected, State: state, Size: "md" });
        setInstanceText(item, "Label", label);
    }
    const cards = await variantSet(section, "Radio card", "A choice as a tile, for choices that need explaining. Code: <RadioGroup variant=\"card\">.", ["False", "True"].flatMap((selected) => ["Default", "Hover", "Focus"].map((state) => ({
        props: { Selected: selected, State: state },
        build: (component) => buildRadioCard(component, selected === "True", state),
    }))), 3);
    textProperty(cards, "Label", "Label", "Team");
    textProperty(cards, "Description", "Description", "Unlimited projects and members");
    const tiles = frame("Plans", { direction: "row", gap: 8 }, row);
    for (const [label, description, selected] of [
        ["Starter", "Up to 3 projects", "False"],
        ["Team", "Unlimited projects and members", "True"],
    ]) {
        const tile = instance(tiles, cards, { Selected: selected, State: "Default" });
        setInstanceText(tile, "Label", label);
        setInstanceText(tile, "Description", description);
    }
}
async function buildRadioComponent(component, selected, state, size) {
    const box = { sm: 14, md: 16, lg: 20 }[size];
    applyLayout(component, { direction: "row", gap: 8, align: "start" });
    applySize(component, "hug", "hug");
    const control = frame("Button", {
        direction: "row",
        justify: "center",
        align: "center",
        fill: "surface/input",
        stroke: selected ? "accent/default" : state === "Invalid" ? "status/danger" : state === "Hover" ? "accent/default" : "border/control",
        strokeWeight: selected ? 2 : 1,
        radius: 999,
    }, component);
    applySize(control, box, box);
    control.strokeAlign = "INSIDE";
    if (selected) {
        const dot = frame("Dot", { direction: "none", fill: "accent/default", radius: 999 }, control);
        applySize(dot, box / 2, box / 2);
    }
    if (state === "Focus")
        control.effects = [focusRing()];
    if (state === "Disabled")
        control.opacity = 0.5;
    const copy = frame("Text", { direction: "column", gap: 1 }, component);
    const label = await text(copy, "Weekly", CONTROL_SIZES[size].body, {
        color: state === "Disabled" ? "text/muted" : "text/primary",
    });
    label.name = "Label";
    (await text(copy, "Every Monday morning.", "Body/Small", { color: "text/muted" })).name = "Description";
}
async function buildRadioCard(component, selected, state) {
    applyLayout(component, {
        direction: "row",
        gap: 8,
        padding: 12,
        align: "start",
        fill: selected ? "accent/soft" : state === "Hover" ? "surface/hover" : "surface/input",
        stroke: selected ? "accent/default" : "border/default",
        radius: "radius/md",
    });
    applySize(component, 240, "hug");
    if (state === "Focus")
        component.effects = [focusRing()];
    const control = frame("Button", {
        direction: "row",
        justify: "center",
        align: "center",
        fill: "surface/input",
        stroke: selected ? "accent/default" : "border/control",
        strokeWeight: selected ? 2 : 1,
        radius: 999,
    }, component);
    applySize(control, 16, 16);
    control.strokeAlign = "INSIDE";
    if (selected) {
        const dot = frame("Dot", { direction: "none", fill: "accent/default", radius: 999 }, control);
        applySize(dot, 8, 8);
    }
    const copy = frame("Text", { direction: "column", gap: 1 }, component);
    applySize(copy, "fill", "hug");
    (await text(copy, "Team", "Label/Default", { width: "fill" })).name = "Label";
    // On the tinted background of a selected card, muted grey misses 4.5:1, so
    // the description sits a step darker there — as the stylesheet does.
    (await text(copy, "Unlimited projects and members", "Body/Small", {
        color: selected ? "text/primary" : "text/muted",
        width: "fill",
    })).name = "Description";
}
/* ------------------------------------------------------------- NumberInput */
async function buildNumberInputs(page) {
    const section = await docSection(page, "NumberInput", "component-lib/number-input · <NumberInput value min max step decimals locale format currency stepper clearable>. A text field with role=\"spinbutton\", not <input type=\"number\">: the wheel cannot edit it by accident, a half-typed entry is still readable, and 1.234,56 and 1,234.56 are the same number in their own locales. Grouped and formatted at rest, plain while it has focus.");
    const variants = [];
    for (const state of FIELD_STATES) {
        variants.push({
            props: { State: state, Size: "md" },
            build: (component) => buildNumberComponent(component, state, "md"),
        });
    }
    for (const size of ["sm", "lg"]) {
        variants.push({ props: { State: "Default", Size: size }, build: (component) => buildNumberComponent(component, "Default", size) });
    }
    const set = await variantSet(section, "NumberInput", "Numeric field. Code: <NumberInput>.", variants, 5);
    textProperty(set, "Label", "Label", "Quantity");
    textProperty(set, "Value", "Value", "1,234.56");
    textProperty(set, "Hint", "Hint", "Between 1 and 99.");
    booleanProperty(set, "Stepper", "Stepper", true);
    booleanProperty(set, "Unit", "Unit", false);
    const row = await exampleRow(section, "Example — one amount, three locales (en-US, de-DE, fr-FR)");
    for (const [label, value] of [["Amount", "$1,234.56"], ["Betrag", "1.234,56 €"], ["Montant", "1 234,56"]]) {
        const field = instance(row, set, { State: "Filled", Size: "md" });
        setInstanceText(field, "Label", label);
        setInstanceText(field, "Value", value);
    }
}
async function buildNumberComponent(component, state, size) {
    const control = await fieldShell(component, 240, state, "Quantity");
    control.paddingRight = 0;
    applySize(control, "fill", CONTROL_HEIGHT[size]);
    /*
     * `width` goes through the helper rather than a later applySize, so the
     * layer wraps inside the field rather than keeping its own width.
     *
     * The unfilled state carries a placeholder rather than "", as every other
     * field in the kit does. An empty text node has no width, and the Value
     * component property writes "1,234.56" into it afterwards — a layer laid
     * out at zero width and filled in later is exactly the case that broke.
     */
    const value = await text(control, "1,234.56", CONTROL_SIZES[size].body, {
        color: state === "Default" ? "text/muted" : "text/primary",
        width: "fill",
    });
    value.name = "Value";
    const unit = await text(control, "kg", "Body/Small", { color: "text/muted" });
    unit.name = "Unit";
    // The spinner: two buttons in a column, divided from the field by a rule.
    const stepper = frame("Stepper", { direction: "column", stroke: "border/default" }, control);
    applySize(stepper, 22, "fill");
    stepper.strokeWeight = 0;
    stepper.strokeLeftWeight = 1;
    for (const [name, glyph] of [["Up", "chevronUp"], ["Down", "chevronDown"]]) {
        const button = frame(name, { direction: "row", justify: "center", align: "center" }, stepper);
        applySize(button, "fill", "fill");
        icon(button, glyph, "text/muted", 12);
    }
    await fieldFooter(component, state, "Between 1 and 99.");
}
// Overlays, feedback and data: Modal, Dialog, Toast, FileUploader, DataGrid.
async function buildOverlays(page) {
    await buildModal(page);
    await buildDialog(page);
    await buildToast(page);
    await buildUploader(page);
    await buildDataGrid(page);
}
/** A placeholder slot for the modal body, meant to be swapped for real content. */
async function slot(parent, label, height) {
    const area = frame("Content slot", {
        direction: "row",
        justify: "center",
        align: "center",
        fill: "surface/subtle",
        stroke: "border/default",
        radius: "radius/md",
    }, parent);
    area.dashPattern = [4, 4];
    applySize(area, "fill", height);
    await text(area, label, "Body/Small", { color: "text/muted" });
}
/* ------------------------------------------------------------------- Modal */
async function buildModal(page) {
    const section = await docSection(page, "Modal", "component-lib/modal · <Modal title description footer size placement closeOnBackdrop onBeforeClose>. Sizes set the width (sm 400, md 520, lg 720, xl 960). Left/Right/Bottom placements are drawers. The body scrolls between a fixed header and footer. Replace the content slot with your layout; detach nothing — the header and footer are toggles.");
    const variants = [];
    const widths = { sm: 400, md: 520, lg: 720 };
    for (const placement of ["Center", "Right", "Bottom"]) {
        const sizes = placement === "Center" ? ["sm", "md", "lg"] : ["md"];
        for (const size of sizes) {
            variants.push({
                props: { Placement: placement, Size: size },
                build: async (component) => {
                    const drawer = placement !== "Center";
                    applyLayout(component, {
                        direction: "column",
                        fill: "surface/bg",
                        stroke: "border/default",
                        radius: drawer ? 0 : "radius/lg",
                        clip: true,
                    });
                    component.effects = [shadow(24, 64, -16, 0.3)];
                    if (placement === "Right")
                        applySize(component, widths[size], 560);
                    else if (placement === "Bottom")
                        applySize(component, 720, "hug");
                    else
                        applySize(component, widths[size], "hug");
                    if (placement === "Bottom") {
                        component.topLeftRadius = 12;
                        component.topRightRadius = 12;
                        component.bottomLeftRadius = 0;
                        component.bottomRightRadius = 0;
                    }
                    const header = frame("Header", { direction: "row", gap: 12, padding: [16, 12, 12, 20], align: "start" }, component);
                    applySize(header, "fill", "hug");
                    const heading = frame("Heading", { direction: "column", gap: 4 }, header);
                    applySize(heading, "fill", "hug");
                    (await text(heading, "Edit profile", "Title/Dialog", { width: "fill" })).name = "Title";
                    (await text(heading, "Changes are saved when you press Save.", "Body/Default", { color: "text/muted", width: "fill" })).name = "Description";
                    const close = frame("Close", { direction: "row", justify: "center", align: "center", radius: "radius/sm" }, header);
                    applySize(close, 30, 30);
                    icon(close, "x", "text/muted", 16);
                    const body = frame("Body", { direction: "column", gap: 12, padding: [0, 20, 20, 20] }, component);
                    applySize(body, "fill", placement === "Right" ? "fill" : "hug");
                    await slot(body, "Content", placement === "Right" ? 360 : 140);
                    const footer = frame("Footer", { direction: "row", gap: 8, justify: "end", padding: [12, 20], fill: "surface/header" }, component);
                    applySize(footer, "fill", "hug");
                    setStroke(footer, "border/default");
                    footer.strokeBottomWeight = 0;
                    footer.strokeLeftWeight = 0;
                    footer.strokeRightWeight = 0;
                    await footerButton(footer, "Cancel", false);
                    await footerButton(footer, "Save", true);
                },
            });
        }
    }
    const set = await variantSet(section, "Modal", "Dialog or drawer shell. Code: <Modal>.", variants, 3);
    textProperty(set, "Title", "Title", "Edit profile");
    textProperty(set, "Description", "Description", "Changes are saved when you press Save.");
    booleanProperty(set, "Show description", "Description", true);
    booleanProperty(set, "Show footer", "Footer", true);
    booleanProperty(set, "Close button", "Close", true);
    const row = await exampleRow(section, "Backdrop — place a modal over a frame filled with surface/backdrop");
    const backdrop = frame("Backdrop", { direction: "row", justify: "center", align: "center", fill: "surface/backdrop", radius: 8 }, row);
    applySize(backdrop, 720, 380);
    instance(backdrop, set, { Placement: "Center", Size: "sm" });
}
/** A plain button look for compositions (instances of Button work too). */
async function footerButton(parent, label, primary, danger = false) {
    const button = frame(label, {
        direction: "row",
        padding: [0, 14],
        justify: "center",
        align: "center",
        radius: "radius/md",
        fill: danger ? "status/danger" : primary ? "accent/default" : "surface/bg",
        stroke: primary || danger ? null : "border/default",
    }, parent);
    applySize(button, "hug", 34);
    await text(button, label, "Label/Default", { color: danger ? "status/on-danger" : primary ? "accent/on-accent" : "text/primary" });
    return button;
}
/* ------------------------------------------------------------------ Dialog */
async function buildDialog(page) {
    const section = await docSection(page, "Dialog", "component-lib/dialog · await dialog.alert / confirm / prompt({ title, description, intent, confirmLabel }). Intent sets the icon and the confirm color; Danger focuses Cancel first in code. Pending shows the async onConfirm state; Error shows a failed onConfirm in place.");
    const INTENT_ICON = { Default: null, Info: "info", Success: "success", Warning: "warning", Danger: "danger" };
    const INTENT_COLOR = { Default: "text/muted", Info: "status/info", Success: "status/success", Warning: "status/warning", Danger: "status/danger" };
    const variants = [];
    const add = (kind, intent, state) => variants.push({
        props: { Kind: kind, Intent: intent, State: state },
        build: async (component) => {
            applyLayout(component, { direction: "column", fill: "surface/bg", stroke: "border/default", radius: "radius/lg", clip: true });
            component.effects = [shadow(24, 64, -16, 0.3)];
            applySize(component, 420, "hug");
            const body = frame("Body", { direction: "row", gap: 14, padding: [20, 20, 16, 20], align: "start" }, component);
            applySize(body, "fill", "hug");
            const glyph = INTENT_ICON[intent];
            if (glyph) {
                const badge = frame("Icon", { direction: "row", justify: "center", align: "center", radius: "radius/full" }, body);
                applySize(badge, 38, 38);
                setTint(badge, INTENT_COLOR[intent], 0.14);
                icon(badge, glyph, INTENT_COLOR[intent], 20);
            }
            const copy = frame("Text", { direction: "column", gap: 6 }, body);
            applySize(copy, "fill", "hug");
            const titles = { alert: "Export finished", confirm: "Delete 3 invoices?", prompt: "Rename file" };
            (await text(copy, titles[kind.toLowerCase()], "Title/Dialog", { width: "fill" })).name = "Title";
            (await text(copy, kind === "Prompt" ? "Keep the .pdf extension." : "This can't be undone.", "Body/Default", { color: "text/muted", width: "fill" })).name = "Description";
            if (kind === "Prompt") {
                const input = frame("Input", { direction: "row", padding: [0, 10], align: "center", fill: "surface/input", stroke: state === "Error" ? "status/danger" : "border/default", radius: "radius/md" }, copy);
                applySize(input, "fill", 36);
                input.effects = [focusRing()];
                await text(input, "report.pdf", "Body/Default");
            }
            if (state === "Error") {
                (await text(copy, "The server didn't respond. Try again.", "Body/Small", { color: "status/danger", width: "fill" })).name = "Error";
            }
            const actions = frame("Actions", { direction: "row", gap: 8, justify: "end", padding: [12, 20], fill: "surface/header" }, component);
            applySize(actions, "fill", "hug");
            setStroke(actions, "border/default");
            actions.strokeBottomWeight = 0;
            actions.strokeLeftWeight = 0;
            actions.strokeRightWeight = 0;
            if (kind !== "Alert")
                await footerButton(actions, "Cancel", false);
            const confirm = await footerButton(actions, kind === "Alert" ? "OK" : intent === "Danger" ? "Delete" : "Confirm", true, intent === "Danger");
            confirm.name = "Confirm";
            if (state === "Pending") {
                confirm.opacity = 0.65;
                const spinner = icon(confirm, "spinnerArc", intent === "Danger" ? "status/on-danger" : "accent/on-accent", 14);
                confirm.insertChild(0, spinner);
            }
        },
    });
    for (const intent of Object.keys(INTENT_ICON))
        add("Confirm", intent, "Default");
    add("Confirm", "Danger", "Pending");
    add("Confirm", "Danger", "Error");
    add("Alert", "Success", "Default");
    add("Alert", "Info", "Default");
    add("Prompt", "Default", "Default");
    add("Prompt", "Default", "Error");
    const set = await variantSet(section, "Dialog", "Alert, confirm or prompt. Code: dialog.confirm({ … }).", variants, 4);
    textProperty(set, "Title", "Title", "Delete 3 invoices?");
    textProperty(set, "Description", "Description", "This can't be undone.");
}
/* ------------------------------------------------------------------- Toast */
async function buildToast(page) {
    const section = await docSection(page, "Toast", "component-lib/toaster · toast.success / error / warning / info / loading / promise. Stacks in a corner (default top-right), 356 px wide, 3 visible at once. The colored bar and icon follow the type; Action and Cancel buttons are toggles.");
    const TYPE = {
        Default: { bar: null, icon: null, iconColor: "text/muted", title: "Event created" },
        Success: { bar: "status/success", icon: "success", iconColor: "status/success", title: "Settings saved" },
        Error: { bar: "status/danger", icon: "danger", iconColor: "status/danger", title: "Upload failed" },
        Warning: { bar: "status/warning", icon: "warning", iconColor: "status/warning", title: "Storage almost full" },
        Info: { bar: "status/info", icon: "info", iconColor: "status/info", title: "A new version is available" },
        Loading: { bar: null, icon: "spinnerArc", iconColor: "text/muted", title: "Saving changes…" },
    };
    const variants = [];
    for (const [type, look] of Object.entries(TYPE)) {
        variants.push({
            props: { Type: type },
            build: async (component) => {
                applyLayout(component, { direction: "row", gap: 10, padding: [12, 10, 12, 14], align: "start", fill: "surface/bg", stroke: "border/default", radius: "radius/md", clip: true });
                component.effects = [shadow(10, 30, -8, 0.18)];
                applySize(component, 356, "hug");
                if (look.icon)
                    icon(component, look.icon, look.iconColor, 18).name = "Icon";
                const content = frame("Content", { direction: "column", gap: 2 }, component);
                applySize(content, "fill", "hug");
                (await text(content, look.title, "Label/Strong", { width: "fill" })).name = "Title";
                (await text(content, "report.pdf could not be sent.", "Body/Default", { color: "text/muted", width: "fill" })).name = "Description";
                const actions = frame("Actions", { direction: "row", gap: 6, align: "center" }, component);
                const retry = frame("Action", { direction: "row", padding: [0, 10], align: "center", radius: "radius/sm", fill: "accent/default" }, actions);
                applySize(retry, "hug", 28);
                await text(retry, "Retry", "Label/Small", { color: "accent/on-accent" });
                icon(component, "x", "text/muted", 14).name = "Close";
                // Last, so it is sized to the toast rather than to a guessed height.
                edgeBar(component, look.bar).name = "Type bar";
            },
        });
    }
    const set = await variantSet(section, "Toast", "One notification. Code: toast.success(title, { description, action }).", variants, 3);
    textProperty(set, "Title", "Title", "Settings saved");
    textProperty(set, "Description", "Description", "report.pdf could not be sent.");
    booleanProperty(set, "Show description", "Description", true);
    booleanProperty(set, "Show action", "Actions", false);
    booleanProperty(set, "Close button", "Close", true);
    const row = await exampleRow(section, "Example — stack (top-right, newest first, 8 px apart)");
    const stack = frame("Toaster", { direction: "column", gap: 8 }, row);
    for (const type of ["Success", "Error", "Info"])
        instance(stack, set, { Type: type });
}
/* ------------------------------------------------------------ FileUploader */
async function buildUploader(page) {
    const section = await docSection(page, "FileUploader", "component-lib/file-uploader · <FileUploader multiple accept maxSize endpoint chunkSize preview existingFiles>. The drop zone, file rows and footer are separate components. File rows cover every upload status; the thumbnail color follows the file kind (image, video, audio, PDF, spreadsheet, document).");
    const zones = [];
    for (const state of ["Default", "Hover", "Dragging", "Focus", "Invalid", "Disabled"]) {
        zones.push({
            props: { State: state },
            build: async (component) => {
                const dragging = state === "Dragging";
                applyLayout(component, {
                    direction: "column",
                    gap: 4,
                    padding: [20, 16],
                    align: "center",
                    fill: dragging ? "accent/soft" : "surface/input",
                    stroke: dragging ? "accent/default" : state === "Invalid" ? "status/danger" : state === "Hover" ? "text/muted" : "border/control",
                    strokeWeight: 1.5,
                    radius: "radius/md",
                });
                component.dashPattern = [6, 4];
                applySize(component, 460, "hug");
                icon(component, "upload", dragging ? "accent/default" : "text/muted", 28);
                const line = frame("Call to action", { direction: "row", gap: 4 }, component);
                if (dragging) {
                    await text(line, "Drop to add files", "Body/Default");
                }
                else {
                    await text(line, "Drag files here or", "Body/Default");
                    const browse = await text(line, "browse", "Label/Default", { color: "accent/default" });
                    browse.textDecoration = "UNDERLINE";
                }
                (await text(component, "PDF, image/* · Up to 20 MB each · 5 files max", "Body/Small", { color: "text/muted" })).name = "Hint";
                if (state === "Focus")
                    component.effects = [focusRing()];
                if (state === "Disabled")
                    component.opacity = 0.55;
            },
        });
    }
    const zoneSet = await variantSet(section, "Upload drop zone", "Code: <FileUploader> drop zone.", zones, 3);
    textProperty(zoneSet, "Hint", "Hint", "PDF, image/* · Up to 20 MB each");
    const STATUS = {
        Idle: { meta: "2.4 MB", color: "text/muted", progress: null, actions: ["x"] },
        Queued: { meta: "2.4 MB · Waiting", color: "text/muted", progress: null, actions: ["x"] },
        Uploading: { meta: "1.1 MB of 2.4 MB · 46%", color: "text/muted", progress: 0.46, actions: ["pause", "x"] },
        Paused: { meta: "2.4 MB · Paused · 46%", color: "text/muted", progress: 0.46, actions: ["retry", "x"] },
        Success: { meta: "2.4 MB · Uploaded", color: "status/success", progress: null, actions: ["x"] },
        Error: { meta: "2.4 MB · Failed", color: "status/danger", progress: 0.3, actions: ["retry", "x"] },
        Existing: { meta: "248 KB · Uploaded", color: "text/muted", progress: null, actions: ["download", "x"] },
    };
    const rows = [];
    for (const [status, look] of Object.entries(STATUS)) {
        for (const kind of status === "Uploading" ? ["pdf", "image", "spreadsheet", "video", "audio", "document"] : ["pdf"]) {
            rows.push({
                props: { Status: status, Kind: capitalize(kind) },
                build: async (component) => {
                    applyLayout(component, {
                        direction: "row",
                        gap: 10,
                        padding: [8, 8, 8, 10],
                        align: "center",
                        fill: "surface/bg",
                        stroke: status === "Error" ? "status/danger" : "border/default",
                        radius: "radius/md",
                    });
                    applySize(component, 460, "hug");
                    const thumb = frame("Thumbnail", { direction: "row", justify: "center", align: "center", radius: "radius/sm" }, component);
                    applySize(thumb, 40, 40);
                    setTint(thumb, `file/${kind}`, 0.12);
                    icon(thumb, kind === "image" ? "image" : "file", `file/${kind}`, 20);
                    const body = frame("Body", { direction: "column", gap: 1 }, component);
                    applySize(body, "fill", "hug");
                    const names = { pdf: "contract-signed.pdf", image: "site-photo.jpg", spreadsheet: "q3-revenue.xlsx", video: "walkthrough.mp4", audio: "interview.m4a", document: "notes.docx" };
                    (await text(body, names[kind], "Label/Default", { width: "fill", truncate: true })).name = "File name";
                    (await text(body, look.meta, "Body/Small", { color: look.color, width: "fill" })).name = "Meta";
                    if (status === "Error")
                        (await text(body, "Upload failed with status 503", "Body/Small", { color: "status/danger" })).name = "Error";
                    if (look.progress !== null) {
                        const track = frame("Progress", { direction: "row", fill: "surface/hover", radius: "radius/full", clip: true }, body);
                        applySize(track, "fill", 4);
                        const bar = frame("Bar", { direction: "none", fill: status === "Error" ? "status/danger" : status === "Paused" ? "text/muted" : "accent/default" }, track);
                        applySize(bar, Math.round(360 * look.progress), 4);
                    }
                    const actions = frame("Actions", { direction: "row", gap: 2, align: "center" }, component);
                    for (const action of look.actions) {
                        const button = frame(action, { direction: "row", justify: "center", align: "center", radius: "radius/sm" }, actions);
                        applySize(button, 28, 28);
                        icon(button, action, "text/muted", 14);
                    }
                },
            });
        }
    }
    const rowSet = await variantSet(section, "Upload file row", "One file with its status. Code: a row in <FileUploader>.", rows, 3);
    textProperty(rowSet, "File name", "File name", "contract-signed.pdf");
    textProperty(rowSet, "Meta", "Meta", "2.4 MB · Uploaded");
    const example = await exampleRow(section, "Example — uploader with files");
    const uploader = frame("FileUploader", { direction: "column", gap: 8 }, example);
    await text(uploader, "Attachments", "Label/Default");
    instance(uploader, zoneSet, { State: "Default" });
    for (const status of ["Success", "Uploading", "Error"]) {
        instance(uploader, rowSet, { Status: status, Kind: "Pdf" });
    }
    const footer = frame("Footer", { direction: "row", gap: 8, justify: "end" }, uploader);
    applySize(footer, 460, "hug");
    await footerButton(footer, "Clear", false);
    await footerButton(footer, "Upload 2 files", true);
}
/* ---------------------------------------------------------------- DataGrid */
async function buildDataGrid(page) {
    const section = await docSection(page, "DataGrid", "component-lib/data-grid · <DataGrid data columns enableRowSelection pagination toolbar>. Compose tables from Header cell, Cell and the checkbox column; rows are 36 px (standard density). Sorted headers show the direction; Selected and Hover rows tint every cell in the row; Editing shows an inline field; Pinned cells cast a shadow on the scrolling side.");
    const headers = [];
    for (const sort of ["None", "Ascending", "Descending"]) {
        for (const align of ["Start", "End"]) {
            headers.push({
                props: { Sort: sort, Align: align },
                build: async (component) => {
                    applyLayout(component, { direction: "row", gap: 6, padding: [0, 12], align: "center", justify: align === "End" ? "end" : "start", fill: "surface/header" });
                    applySize(component, 160, 36);
                    setStroke(component, "border/default");
                    component.strokeTopWeight = 0;
                    component.strokeLeftWeight = 0;
                    component.strokeRightWeight = 0;
                    (await text(component, align === "End" ? "Salary" : "Name", "Label/Strong", { color: "text/header" })).name = "Label";
                    if (sort !== "None")
                        icon(component, sort === "Ascending" ? "chevronDown" : "chevronDown", "accent/default", 14).rotation = sort === "Ascending" ? 180 : 0;
                    icon(component, "more", "text/muted", 14).name = "Menu";
                },
            });
        }
    }
    const headerSet = await variantSet(section, "Grid header cell", "Column header. Code: column header.", headers, 6);
    textProperty(headerSet, "Label", "Label", "Name");
    const cells = [];
    for (const row of ["Default", "Striped", "Hover", "Selected"]) {
        for (const state of ["Default", "Focus", "Editing"]) {
            if (state !== "Default" && row !== "Default")
                continue;
            cells.push({
                props: { Row: row, State: state },
                build: async (component) => {
                    const fill = { Default: "surface/bg", Striped: "surface/row-alt", Hover: "surface/hover", Selected: "surface/row-selected" };
                    applyLayout(component, { direction: "row", padding: [0, 12], align: "center", fill: fill[row] });
                    applySize(component, 160, 36);
                    setStroke(component, "border/subtle");
                    component.strokeTopWeight = 0;
                    component.strokeLeftWeight = 0;
                    component.strokeRightWeight = 0;
                    if (state === "Editing") {
                        component.paddingLeft = 4;
                        component.paddingRight = 4;
                        const input = frame("Editor", { direction: "row", padding: [0, 8], align: "center", fill: "surface/input", stroke: "accent/focus", strokeWeight: 2, radius: "radius/xs" }, component);
                        applySize(input, "fill", 28);
                        (await text(input, "Ada Lovelace", "Body/Default", { width: "fill" })).name = "Value";
                    }
                    else {
                        (await text(component, "Ada Lovelace", "Body/Default", { width: "fill", truncate: true })).name = "Value";
                    }
                    if (state === "Focus") {
                        component.strokes = [paintOf("accent/focus")];
                        component.strokeWeight = 2;
                        component.strokeAlign = "INSIDE";
                    }
                },
            });
        }
    }
    const cellSet = await variantSet(section, "Grid cell", "Body cell. Code: a cell in <DataGrid>.", cells, 6);
    textProperty(cellSet, "Value", "Value", "Ada Lovelace");
    const selects = [];
    for (const checked of ["False", "True", "Indeterminate"]) {
        for (const where of ["Header", "Row"]) {
            selects.push({
                props: { Checked: checked, In: where },
                build: async (component) => {
                    applyLayout(component, { direction: "row", justify: "center", align: "center", fill: where === "Header" ? "surface/header" : checked === "True" ? "surface/row-selected" : "surface/bg" });
                    applySize(component, 44, 36);
                    setStroke(component, where === "Header" ? "border/default" : "border/subtle");
                    component.strokeTopWeight = 0;
                    component.strokeLeftWeight = 0;
                    component.strokeRightWeight = 0;
                    const on = checked !== "False";
                    const box = frame("Box", { direction: "row", justify: "center", align: "center", fill: on ? "accent/default" : "surface/input", stroke: on ? "accent/default" : "border/control", strokeWeight: 1.5, radius: "radius/xs" }, component);
                    applySize(box, 16, 16);
                    if (checked === "True")
                        icon(box, "check", "accent/on-accent", 12);
                    if (checked === "Indeterminate")
                        icon(box, "minus", "accent/on-accent", 12);
                },
            });
        }
    }
    const selectSet = await variantSet(section, "Grid selection cell", "Checkbox column.", selects, 6);
    // A composed grid: toolbar, header, five rows, pagination.
    const example = await exampleRow(section, "Example — grid with toolbar, selection and pagination");
    const grid = frame("DataGrid", { direction: "column", fill: "surface/bg", stroke: "border/default", radius: "radius/md", clip: true }, example);
    const toolbar = frame("Toolbar", { direction: "row", gap: 8, padding: [8, 12], align: "center" }, grid);
    applySize(toolbar, 44 + 160 * 4, "hug");
    const search = frame("Search", { direction: "row", gap: 6, padding: [0, 10], align: "center", fill: "surface/input", stroke: "border/default", radius: "radius/md" }, toolbar);
    applySize(search, 240, 32);
    icon(search, "search", "text/muted", 14);
    await text(search, "Search…", "Body/Default", { color: "text/muted" });
    const spacer = frame("Spacer", { direction: "none" }, toolbar);
    applySize(spacer, "fill", 1);
    await footerButton(toolbar, "Columns", false);
    await footerButton(toolbar, "Export", false);
    const columns = [["Name", "Start"], ["Department", "Start"], ["Start date", "Start"], ["Salary", "End"]];
    const header = frame("Header row", { direction: "row" }, grid);
    instance(header, selectSet, { Checked: "Indeterminate", In: "Header" });
    columns.forEach(([label, align], index) => {
        const cell = instance(header, headerSet, { Sort: index === 0 ? "Ascending" : "None", Align: align });
        setInstanceText(cell, "Label", label);
    });
    const data = [
        ["Aarav Patel", "Engineering", "12 Jan 2021", "$128,400"],
        ["Ada Lovelace", "Design", "3 Mar 2019", "$142,000"],
        ["Emma Garcia", "Finance", "22 Aug 2022", "$96,250"],
        ["Liam Nguyen", "Sales", "9 May 2020", "$88,900"],
        ["Sofia Rossi", "Support", "1 Feb 2023", "$71,300"],
    ];
    data.forEach((values, rowIndex) => {
        const selected = rowIndex === 1 || rowIndex === 3;
        const rowLook = selected ? "Selected" : rowIndex === 2 ? "Hover" : rowIndex % 2 === 1 ? "Striped" : "Default";
        const line = frame(`Row ${rowIndex + 1}`, { direction: "row" }, grid);
        instance(line, selectSet, { Checked: selected ? "True" : "False", In: "Row" });
        values.forEach((value) => {
            const cell = instance(line, cellSet, { Row: rowLook, State: "Default" });
            setInstanceText(cell, "Value", value);
        });
    });
    const pagination = frame("Pagination", { direction: "row", gap: 12, padding: [8, 12], align: "center", fill: "surface/header" }, grid);
    applySize(pagination, 44 + 160 * 4, "hug");
    await text(pagination, "2 selected", "Body/Default", { color: "text/muted" });
    const fill = frame("Spacer", { direction: "none" }, pagination);
    applySize(fill, "fill", 1);
    await text(pagination, "1–5 of 100,000", "Body/Default", { color: "text/muted" });
    for (const glyph of ["chevronLeft", "chevronRight"]) {
        const button = frame(glyph, { direction: "row", justify: "center", align: "center", radius: "radius/sm" }, pagination);
        applySize(button, 28, 28);
        icon(button, glyph, "text/primary", 16);
    }
}
// Menus and surfaces: Menu, Popover, Tooltip, Card, Stat, Skeleton, Empty state.
async function buildSurfaces(page) {
    await buildMenu(page);
    await buildPopover(page);
    await buildTooltip(page);
    await buildCard(page);
    await buildStat(page);
    await buildSkeleton(page);
    await buildEmptyState(page);
}
/** A dashed placeholder for content a designer replaces, like the modal's. */
async function surfaceSlot(parent, label, height) {
    const area = frame("Content slot", {
        direction: "row",
        justify: "center",
        align: "center",
        fill: "surface/subtle",
        stroke: "border/default",
        radius: "radius/md",
    }, parent);
    area.dashPattern = [4, 4];
    applySize(area, "fill", height);
    // Centred and filling the slot: the label is longer than a popover is
    // wide, and unsized it grew past the card instead of wrapping inside it.
    await text(area, label, "Body/Small", { color: "text/muted", width: "fill", align: "CENTER" });
}
/* -------------------------------------------------------------------- Menu */
async function buildMenu(page) {
    const section = await docSection(page, "Menu", "component-lib/menu · <Menu trigger> with <MenuItem>, <MenuCheckboxItem>, <MenuRadioGroup>, <MenuGroup>, <MenuSeparator> and <MenuSub>. The panel is a native popover in the top layer, so it escapes overflow without a portal. Items are 6/8 px with a 5 px radius; the focused item is the highlighted one, so Hover and keyboard focus look the same. Checkbox and radio items keep a 14 px indicator column, which is why labels stay aligned as things are toggled.");
    const KIND_ICON = {
        Default: "eye",
        Submenu: "download",
        Destructive: "trash",
    };
    const variants = [];
    for (const kind of ["Default", "Checkbox", "Radio", "Submenu", "Destructive"]) {
        for (const state of ["Default", "Hover", "Disabled"]) {
            variants.push({
                props: { Kind: kind, State: state },
                build: async (component) => {
                    applyLayout(component, {
                        direction: "row",
                        gap: 8,
                        padding: [6, 8],
                        align: "center",
                        fill: state === "Hover" ? "surface/hover" : null,
                        radius: "radius/item",
                    });
                    applySize(component, 240, "hug");
                    const disabled = state === "Disabled";
                    const destructive = kind === "Destructive" && !disabled;
                    const ink = disabled ? "text/muted" : destructive ? "status/danger" : "text/primary";
                    if (kind === "Checkbox" || kind === "Radio") {
                        const indicator = frame("Indicator", { direction: "row", justify: "center", align: "center" }, component);
                        applySize(indicator, 14, 14);
                        if (kind === "Checkbox") {
                            icon(indicator, "check", disabled ? "text/muted" : "accent/default", 14);
                        }
                        else {
                            const dot = frame("Dot", { direction: "none", fill: disabled ? "text/muted" : "accent/default", radius: 999 }, indicator);
                            applySize(dot, 6, 6);
                        }
                    }
                    else {
                        // The icon inherits the item's color when the item is destructive.
                        icon(component, KIND_ICON[kind], destructive ? "status/danger" : "text/muted", 16).name = "Icon";
                    }
                    const label = await text(component, "Duplicate", "Body/Default", { color: ink, truncate: true });
                    label.name = "Label";
                    applySize(label, "fill");
                    if (kind === "Submenu") {
                        icon(component, "chevronRight", "text/muted", 14).name = "Submenu arrow";
                    }
                    else {
                        const shortcut = await text(component, "⌘D", "Body/Small", { color: "text/muted" });
                        shortcut.name = "Shortcut";
                    }
                },
            });
        }
    }
    const set = await variantSet(section, "Menu item", "One row of a menu. Code: <MenuItem icon shortcut destructive disabled>, <MenuCheckboxItem>, <MenuRadioItem>, <MenuSub>.", variants, 5);
    textProperty(set, "Label", "Label", "Duplicate");
    textProperty(set, "Shortcut", "Shortcut", "⌘D");
    booleanProperty(set, "Show icon", "Icon", true);
    booleanProperty(set, "Show shortcut", "Shortcut", false);
    const row = await exampleRow(section, "Example — a panel (min-width 180, 4 px padding, separators bleed to the edges)");
    const panel = frame("Menu", {
        direction: "column",
        padding: 4,
        fill: "surface/bg",
        stroke: "border/default",
        radius: "radius/md",
    }, row);
    panel.effects = [shadow(10, 30, -8, 0.18)];
    const groupLabel = await text(panel, "ACTIONS", "Label/Group", { color: "text/muted" });
    groupLabel.name = "Group label";
    const open = instance(panel, set, { Kind: "Default", State: "Default" });
    setInstanceText(open, "Label", "Open");
    const duplicate = instance(panel, set, { Kind: "Default", State: "Hover" });
    setInstanceText(duplicate, "Label", "Duplicate");
    const share = instance(panel, set, { Kind: "Submenu", State: "Default" });
    setInstanceText(share, "Label", "Share with…");
    const separator = frame("Separator", { direction: "none", fill: "border/default" }, panel);
    applySize(separator, "fill", 1);
    const remove = instance(panel, set, { Kind: "Destructive", State: "Default" });
    setInstanceText(remove, "Label", "Delete");
}
/* ----------------------------------------------------------------- Popover */
async function buildPopover(page) {
    const section = await docSection(page, "Popover", "component-lib/popover · <Popover trigger title description side align width>. A native popover with light dismiss, 280 px wide by default, anchored to its trigger and flipped when it would leave the viewport. Unlike a tooltip it can hold focusable content: fields, links, buttons.");
    const variants = [];
    for (const header of ["Title", "Title + description", "None"]) {
        variants.push({
            props: { Header: header },
            build: async (component) => {
                applyLayout(component, {
                    direction: "column",
                    fill: "surface/bg",
                    stroke: "border/default",
                    radius: "radius/md",
                    clip: true,
                });
                component.effects = [shadow(10, 30, -8, 0.18)];
                applySize(component, 280, "hug");
                const panel = frame("Panel", { direction: "column", gap: 8, padding: 12 }, component);
                applySize(panel, "fill", "hug");
                if (header !== "None") {
                    const head = frame("Header", { direction: "column", gap: 2 }, panel);
                    applySize(head, "fill", "hug");
                    (await text(head, "Filter results", "Label/Strong", { width: "fill" })).name = "Title";
                    if (header === "Title + description") {
                        (await text(head, "Narrow the list down to what you need.", "Body/Default", { color: "text/muted", width: "fill" })).name = "Description";
                    }
                }
                const body = frame("Body", { direction: "column", gap: 8 }, panel);
                applySize(body, "fill", "hug");
                await surfaceSlot(body, "Popover content — swap for fields, links or a small form", 96);
            },
        });
    }
    const set = await variantSet(section, "Popover", "Anchored panel. Code: <Popover trigger title description>.", variants, 3);
    textProperty(set, "Title", "Title", "Filter results");
    textProperty(set, "Description", "Description", "Narrow the list down to what you need.");
}
/* ----------------------------------------------------------------- Tooltip */
async function buildTooltip(page) {
    const section = await docSection(page, "Tooltip", "component-lib/tooltip · <Tooltip content side align delay>. A short label on hover or keyboard focus, inverted against the page, 5/8 px padding and at most 240 px wide. It holds no controls and is never the only place information appears — touch users never see it.");
    const variants = [];
    for (const width of ["Auto", "Wrapped"]) {
        variants.push({
            props: { Width: width },
            build: async (component) => {
                applyLayout(component, {
                    direction: "row",
                    padding: [5, 8],
                    align: "center",
                    fill: "surface/tooltip",
                    radius: "radius/md",
                });
                component.effects = [shadow(10, 30, -8, 0.18)];
                const body = width === "Auto"
                    ? "Copy link"
                    : "Only members with the Admin role can change billing details.";
                const label = await text(component, body, "Body/Small", { color: "text/on-tooltip" });
                label.name = "Label";
                if (width === "Wrapped") {
                    applySize(component, 240, "hug");
                    applySize(label, "fill");
                }
                else {
                    applySize(component, "hug", "hug");
                }
            },
        });
    }
    const set = await variantSet(section, "Tooltip", "Hover or focus label. Code: <Tooltip content>.", variants, 2);
    textProperty(set, "Label", "Label", "Copy link");
}
/* -------------------------------------------------------------------- Card */
async function buildCard(page) {
    const section = await docSection(page, "Card", "component-lib/card · <Card variant padding interactive> with <CardHeader title description actions>, <CardBody> and <CardFooter>. Outlined is the default; Elevated trades the border for a shadow and lifts 1 px on hover; Plain drops the background for a card inside a card. Padding sets --cd-px (sm 12, md 16, lg 24) and the header, body and footer all follow it.");
    const PADDING = { sm: 12, md: 16, lg: 24 };
    const variants = [];
    for (const variant of ["Outlined", "Elevated", "Plain"]) {
        for (const padding of ["sm", "md", "lg"]) {
            variants.push({
                props: { Variant: variant, Padding: padding },
                build: async (component) => {
                    const px = PADDING[padding];
                    applyLayout(component, {
                        direction: "column",
                        fill: variant === "Plain" ? null : "surface/bg",
                        stroke: variant === "Outlined" ? "border/default" : null,
                        radius: "radius/md",
                    });
                    if (variant === "Elevated")
                        component.effects = [shadow(10, 30, -8, 0.18)];
                    applySize(component, 340, "hug");
                    const header = frame("Header", { direction: "row", gap: 12, padding: [px, px, 0, px], align: "start" }, component);
                    applySize(header, "fill", "hug");
                    const heading = frame("Heading", { direction: "column", gap: 2 }, header);
                    applySize(heading, "fill", "hug");
                    (await text(heading, "Monthly revenue", "Title/Card", { width: "fill" })).name = "Title";
                    (await text(heading, "Net of refunds and credits.", "Body/Default", { color: "text/muted", width: "fill" })).name = "Description";
                    const actions = frame("Actions", { direction: "row", gap: 4, align: "center" }, header);
                    icon(actions, "more", "text/muted", 16);
                    // The header already spaces the top, so the body does not double it.
                    const body = frame("Body", { direction: "column", gap: 8, padding: [12, px, px, px] }, component);
                    applySize(body, "fill", "hug");
                    await surfaceSlot(body, "Card content", 96);
                    const footer = frame("Footer", { direction: "column" }, component);
                    applySize(footer, "fill", "hug");
                    const divider = frame("Divider", { direction: "none", fill: "border/default" }, footer);
                    applySize(divider, "fill", 1);
                    const footerRow = frame("Footer row", { direction: "row", gap: 8, padding: [12, px], align: "center" }, footer);
                    applySize(footerRow, "fill", "hug");
                    await text(footerRow, "Updated 2 minutes ago", "Body/Small", { color: "text/muted" });
                },
            });
        }
    }
    const set = await variantSet(section, "Card", "Surface for grouped content. Code: <Card variant padding interactive>.", variants, 3);
    textProperty(set, "Title", "Title", "Monthly revenue");
    textProperty(set, "Description", "Description", "Net of refunds and credits.");
    booleanProperty(set, "Show header", "Header", true);
    booleanProperty(set, "Show description", "Description", true);
    booleanProperty(set, "Show actions", "Actions", false);
    booleanProperty(set, "Show footer", "Footer", false);
    const row = await exampleRow(section, "Example — interactive card (hover fills with surface/hover, focus draws a 2 px ring offset 2 px)");
    const hover = instance(row, set, { Variant: "Outlined", Padding: "md" });
    setInstanceText(hover, "Title", "Interactive card");
    const focused = instance(row, set, { Variant: "Elevated", Padding: "md" });
    setInstanceText(focused, "Title", "Focused card");
    focused.effects = [shadow(10, 30, -8, 0.18), focusRing()];
}
/* -------------------------------------------------------------------- Stat */
async function buildStat(page) {
    const section = await docSection(page, "Stat", "component-lib/card · <Stat label value trend help icon>. A single figure for a dashboard tile, usually inside a Card. The value is 1.9em with tabular figures so a row of tiles lines up. Color is a second signal only: the arrow and a visually hidden “Up” / “Down” carry the direction for anyone who cannot see the green or the red.");
    const TREND = {
        Up: { icon: "arrowUp", color: "status/success", change: "+12.5%" },
        Down: { icon: "arrowDown", color: "status/danger", change: "−3.8%" },
        Flat: { icon: "arrowFlat", color: "text/muted", change: "0.0%" },
    };
    const variants = [];
    for (const trend of ["Up", "Down", "Flat", "None"]) {
        variants.push({
            props: { Trend: trend },
            build: async (component) => {
                applyLayout(component, { direction: "column", gap: 4 });
                applySize(component, 240, "hug");
                const head = frame("Head", { direction: "row", gap: 8, align: "center" }, component);
                applySize(head, "fill", "hug");
                const label = await text(head, "Active users", "Label/Default", { color: "text/muted", truncate: true });
                label.name = "Label";
                applySize(label, "fill");
                icon(head, "users", "text/muted", 16).name = "Icon";
                (await text(component, "12,480", "Numeric/Stat", { width: "fill" })).name = "Value";
                if (trend !== "None") {
                    const look = TREND[trend];
                    const trendRow = frame("Trend", { direction: "row", gap: 4, align: "center" }, component);
                    icon(trendRow, look.icon, look.color, 14);
                    (await text(trendRow, look.change, "Label/Default", { color: look.color })).name = "Change";
                    (await text(trendRow, "vs last month", "Body/Default", { color: "text/muted" })).name = "Trend description";
                }
                (await text(component, "Signed in at least once in the last 30 days", "Body/Small", { color: "text/muted", width: "fill" })).name = "Help";
            },
        });
    }
    const set = await variantSet(section, "Stat", "Dashboard figure. Code: <Stat label value trend help icon>.", variants, 4);
    textProperty(set, "Label", "Label", "Active users");
    textProperty(set, "Value", "Value", "12,480");
    textProperty(set, "Change", "Change", "+12.5%");
    textProperty(set, "Help", "Help", "Signed in at least once in the last 30 days");
    booleanProperty(set, "Show icon", "Icon", false);
    booleanProperty(set, "Show help", "Help", false);
    const row = await exampleRow(section, "Example — a row of tiles (each Stat inside a Card, padding md)");
    for (const [trend, label, value] of [
        ["Up", "Revenue", "$48,320"],
        ["Down", "Churn", "2.4%"],
        ["Flat", "Open tickets", "31"],
    ]) {
        const tile = frame(`Tile — ${label}`, {
            direction: "column",
            padding: 16,
            fill: "surface/bg",
            stroke: "border/default",
            radius: "radius/md",
        }, row);
        applySize(tile, 240, "hug");
        const stat = instance(tile, set, { Trend: trend });
        applySize(stat, "fill");
        setInstanceText(stat, "Label", label);
        setInstanceText(stat, "Value", value);
    }
}
/* ---------------------------------------------------------------- Skeleton */
async function buildSkeleton(page) {
    const section = await docSection(page, "Skeleton", "component-lib/skeleton · <Skeleton variant lines lastLineWidth width height animation>. A placeholder shaped like the content it stands in for, so nothing jumps when the data lands. Text bars are sized from the font (0.85em, 4 px radius); circle and rect take the sizes you give them. The wave sheen and the pulse both stop under prefers-reduced-motion, which Figma cannot show — treat these as the resting state.");
    const variants = [];
    for (const variant of ["Text", "Circle", "Rect"]) {
        variants.push({
            props: { Variant: variant },
            build: async (component) => {
                applyLayout(component, { direction: "column", gap: 8 });
                if (variant === "Text") {
                    applySize(component, 240, "hug");
                    for (const width of [240, 240, 144]) {
                        const bar = frame("Bar", { direction: "none", fill: "surface/skeleton", radius: "radius/xs" }, component);
                        applySize(bar, width, 11);
                    }
                }
                else if (variant === "Circle") {
                    applySize(component, 40, "hug");
                    const bar = frame("Bar", { direction: "none", fill: "surface/skeleton", radius: 999 }, component);
                    applySize(bar, 40, 40);
                }
                else {
                    applySize(component, 240, "hug");
                    const bar = frame("Bar", { direction: "none", fill: "surface/skeleton", radius: "radius/md" }, component);
                    applySize(bar, 240, 80);
                }
            },
        });
    }
    const set = await variantSet(section, "Skeleton", "Loading placeholder. Code: <Skeleton variant lines>.", variants, 3);
    const row = await exampleRow(section, "Example — a loading card (one skeleton per real element, same sizes)");
    const card = frame("Loading card", {
        direction: "column",
        gap: 12,
        padding: 16,
        fill: "surface/bg",
        stroke: "border/default",
        radius: "radius/md",
    }, row);
    applySize(card, 340, "hug");
    const head = frame("Head", { direction: "row", gap: 12, align: "center" }, card);
    applySize(head, "fill", "hug");
    instance(head, set, { Variant: "Circle" });
    const lines = instance(head, set, { Variant: "Text" });
    applySize(lines, "fill");
    instance(card, set, { Variant: "Rect" });
}
/* ------------------------------------------------------------- Empty state */
async function buildEmptyState(page) {
    const section = await docSection(page, "Empty state", "component-lib/skeleton · <Empty title description icon actions size>. What a list shows when it has nothing to show: say what would be here and give one way forward. Sizes set the padding (sm 24/16, md 40/24, lg 64/24) — sm sits inside a card or a panel, lg fills a page.");
    const SIZE = {
        sm: { padding: [24, 16], icon: 24, title: "Title/Card" },
        md: { padding: [40, 24], icon: 32, title: "Title/Card" },
        lg: { padding: [64, 24], icon: 40, title: "Title/Dialog" },
    };
    const variants = [];
    for (const size of ["sm", "md", "lg"]) {
        variants.push({
            props: { Size: size },
            build: async (component) => {
                const look = SIZE[size];
                applyLayout(component, { direction: "column", gap: 6, padding: look.padding, align: "center" });
                applySize(component, 460, "hug");
                const iconWrap = frame("Icon", { direction: "row", justify: "center", align: "center" }, component);
                applySize(iconWrap, look.icon, look.icon);
                icon(iconWrap, "inbox", "text/muted", look.icon);
                const title = await text(component, "No invoices yet", look.title, { align: "CENTER", width: "fill" });
                title.name = "Title";
                const description = await text(component, "Invoices appear here once you send your first one. They stay for seven years.", "Body/Default", { color: "text/muted", align: "CENTER", width: "fill" });
                description.name = "Description";
                const actions = frame("Actions", { direction: "row", gap: 8, justify: "center", align: "center" }, component);
                applySize(actions, "fill", "hug");
                const primary = frame("Primary action", { direction: "row", padding: [0, 14], align: "center", fill: "accent/default", radius: "radius/md" }, actions);
                applySize(primary, "hug", 36);
                bindNumber(primary, "height", "control/height-md");
                await text(primary, "New invoice", "Label/Default", { color: "accent/on-accent" });
            },
        });
    }
    const set = await variantSet(section, "Empty state", "Nothing-here state. Code: <Empty title description icon actions size>.", variants, 3);
    textProperty(set, "Title", "Title", "No invoices yet");
    textProperty(set, "Description", "Description", "Invoices appear here once you send your first one. They stay for seven years.");
    booleanProperty(set, "Show icon", "Icon", true);
    booleanProperty(set, "Show actions", "Actions", true);
}
// Status and identity: Alert, Badge and Tag, Avatar, Progress, Accordion.
async function buildDisplay(page) {
    await buildAlerts(page);
    await buildBadges(page);
    await buildAvatars(page);
    await buildProgress(page);
    await buildAccordions(page);
}
/* ------------------------------------------------------------------- Alert */
const ALERT_VARIANTS = {
    Info: {
        color: "status/info",
        icon: "info",
        title: "Read-only workspace",
        body: "You have view access to this project. Ask an owner for edit rights.",
    },
    Success: {
        color: "status/success",
        icon: "success",
        title: "Import finished",
        body: "240 rows were added to Customers.",
    },
    Warning: {
        color: "status/warning",
        icon: "warning",
        title: "Your trial ends in 3 days",
        body: "After that the workspace becomes read-only.",
    },
    Danger: {
        color: "status/danger",
        icon: "danger",
        title: "We could not save your changes",
        body: "The connection dropped. Your edits are still here.",
    },
    Neutral: {
        color: "text/muted",
        icon: "info",
        title: "Scheduled maintenance",
        body: "Sunday 02:00–04:00 UTC.",
    },
};
async function buildAlerts(page) {
    const section = await docSection(page, "Alert", "component-lib/alert · <Alert variant size title description actions onDismiss icon>. A message that stays in the page, unlike a Dialog (which blocks) and a Toast (which leaves). Danger and Warning interrupt a screen reader; the rest wait their turn. The tint is the variant colour mixed 7% into the surface, so a themed accent carries through without a second token.");
    const variants = [];
    for (const [name, look] of Object.entries(ALERT_VARIANTS)) {
        for (const size of ["md", "sm"]) {
            variants.push({
                props: { Variant: name, Size: size },
                build: async (component) => {
                    const small = size === "sm";
                    applyLayout(component, {
                        direction: "row",
                        gap: small ? 8 : 10,
                        padding: small ? [8, 10] : [12, 14],
                        align: "start",
                        fill: "surface/bg",
                        stroke: "border/default",
                        radius: "radius/md",
                        // The coloured edge is square and the card is rounded, so without
                        // this the bar's corners sit outside the card. Toast already clips.
                        clip: true,
                    });
                    applySize(component, 460, "hug");
                    icon(component, look.icon, look.color, small ? 14 : 16).name = "Icon";
                    const content = frame("Content", { direction: "column", gap: 2 }, component);
                    applySize(content, "fill", "hug");
                    (await text(content, look.title, small ? "Label/Small" : "Label/Strong", { width: "fill" })).name = "Title";
                    (await text(content, look.body, small ? "Body/Small" : "Body/Default", { width: "fill" })).name = "Description";
                    const actions = frame("Actions", { direction: "row", gap: 8, align: "center" }, content);
                    const button = frame("Action", { direction: "row", padding: [0, 10], align: "center", radius: "radius/sm", stroke: "border/default" }, actions);
                    applySize(button, "hug", 28);
                    await text(button, "Add a card", "Label/Small");
                    icon(component, "x", "text/muted", 14).name = "Dismiss";
                    // A 3px edge rather than a border on all sides. Last, so it can be
                    // sized to the card instead of to a guess.
                    edgeBar(component, look.color);
                },
            });
        }
    }
    const set = await variantSet(section, "Alert", "In-page message. Code: <Alert variant title>.", variants, 5);
    textProperty(set, "Title", "Title", "Your trial ends in 3 days");
    textProperty(set, "Description", "Description", "After that the workspace becomes read-only.");
    booleanProperty(set, "Show description", "Description", true);
    booleanProperty(set, "Show icon", "Icon", true);
    booleanProperty(set, "Show actions", "Actions", false);
    booleanProperty(set, "Dismissible", "Dismiss", false);
}
/* ------------------------------------------------------------- Badge & Tag */
const BADGE_VARIANTS = {
    Neutral: "text/primary",
    Accent: "accent/default",
    Success: "status/success",
    Warning: "status/warning",
    Danger: "status/danger",
};
async function buildBadges(page) {
    const section = await docSection(page, "Badge and Tag", "component-lib/badge · <Badge variant appearance size count dot icon> and <Tag onRemove>. A Badge is static text; a Tag comes off. A count stops at 99+ and reads aloud as “more than 99”, and a count of zero is left off the page entirely unless showZero asks for it.");
    const variants = [];
    for (const [name, color] of Object.entries(BADGE_VARIANTS)) {
        for (const appearance of ["Soft", "Solid", "Outline"]) {
            variants.push({
                props: { Variant: name, Appearance: appearance },
                build: (component) => buildBadgeComponent(component, name, color, appearance),
            });
        }
    }
    const set = await variantSet(section, "Badge", "Static label or count. Code: <Badge variant appearance>.", variants, 5);
    textProperty(set, "Label", "Label", "Active");
    booleanProperty(set, "Status dot", "Dot", false);
    const tags = await variantSet(section, "Tag", "A chip the user can take off. Code: <Tag onRemove>.", ["Neutral", "Accent", "Danger"].map((name) => ({
        props: { Variant: name },
        build: (component) => buildTagComponent(component, BADGE_VARIANTS[name]),
    })), 3);
    textProperty(tags, "Label", "Label", "Berlin");
    const row = await exampleRow(section, "Example — a row of filters, and a counter on a tab");
    const chips = frame("Filters", { direction: "row", gap: 6 }, row);
    for (const city of ["Berlin", "Paris", "Rome"]) {
        const tag = instance(chips, tags, { Variant: "Neutral" });
        setInstanceText(tag, "Label", city);
    }
}
async function buildBadgeComponent(component, variant, color, appearance) {
    const solid = appearance === "Solid";
    const outline = appearance === "Outline";
    applyLayout(component, {
        direction: "row",
        gap: 4,
        padding: [0, 8],
        align: "center",
        justify: "center",
        fill: solid ? color : outline ? null : "accent/soft",
        stroke: outline ? "border/default" : null,
        radius: 999,
    });
    applySize(component, "hug", 20);
    const dot = frame("Dot", { direction: "none", fill: solid ? "accent/on-accent" : color, radius: 999 }, component);
    applySize(dot, 6, 6);
    const ink = solid ? "accent/on-accent" : variant === "Neutral" ? "text/primary" : color;
    (await text(component, "Active", "Label/Small", { color: ink })).name = "Label";
}
async function buildTagComponent(component, color) {
    applyLayout(component, {
        direction: "row",
        gap: 4,
        padding: [0, 4, 0, 8],
        align: "center",
        fill: "accent/soft",
        radius: 999,
    });
    applySize(component, "hug", 20);
    (await text(component, "Berlin", "Label/Small", { color })).name = "Label";
    const remove = frame("Remove", { direction: "row", justify: "center", align: "center", radius: 999 }, component);
    applySize(remove, 16, 16);
    icon(remove, "x", "text/muted", 12);
}
/* ------------------------------------------------------------------ Avatar */
const AVATAR_SIZES = { xs: 20, sm: 24, md: 32, lg: 40, xl: 56 };
async function buildAvatars(page) {
    const section = await docSection(page, "Avatar", "component-lib/avatar · <Avatar name src size shape status> and <AvatarGroup max>. Without a picture the initials sit on a colour hashed from the name, so the same person is the same colour everywhere — in Figma, pick the swatch that matches. A group counts the overflow into one of its slots, so five people with max 4 show three faces and a +2.");
    const variants = [];
    for (const kind of ["Initials", "Image", "Icon"]) {
        for (const size of Object.keys(AVATAR_SIZES)) {
            variants.push({
                props: { Content: kind, Size: size },
                build: (component) => buildAvatarComponent(component, kind, size, "circle"),
            });
        }
    }
    for (const kind of ["Initials", "Image"]) {
        variants.push({
            props: { Content: kind, Size: "md-square" },
            build: (component) => buildAvatarComponent(component, kind, "md", "square"),
        });
    }
    const set = await variantSet(section, "Avatar", "A person. Code: <Avatar name src>.", variants, 5);
    textProperty(set, "Initials", "Initials", "AL");
    booleanProperty(set, "Status dot", "Status", false);
    const row = await exampleRow(section, "Example — a group of five with four slots");
    const group = frame("AvatarGroup", { direction: "row", gap: -8 }, row);
    for (let index = 0; index < 3; index++) {
        instance(group, set, { Content: "Initials", Size: "md" });
    }
    const overflow = frame("Overflow", {
        direction: "row",
        justify: "center",
        align: "center",
        fill: "surface/subtle",
        radius: 999,
    }, group);
    applySize(overflow, 32, 32);
    await text(overflow, "+2", "Label/Small", { color: "text/primary" });
}
async function buildAvatarComponent(component, kind, size, shape) {
    const px = AVATAR_SIZES[size];
    applyLayout(component, {
        direction: "row",
        justify: "center",
        align: "center",
        fill: kind === "Image" ? "surface/subtle" : "accent/soft",
        radius: shape === "square" ? "radius/md" : 999,
    });
    applySize(component, px, px);
    if (kind === "Icon") {
        icon(component, "users", "text/muted", px * 0.55).name = "Glyph";
    }
    else if (kind === "Image") {
        // A placeholder rectangle: designers swap in a real fill.
        const image = frame("Image", { direction: "row", justify: "center", align: "center" }, component);
        applySize(image, px, px);
        setFill(image, "surface/subtle");
        icon(image, "image", "text/muted", px * 0.5);
    }
    else {
        const style = px <= 24 ? "Label/Small" : px >= 56 ? "Title/Section" : "Label/Strong";
        (await text(component, "AL", style, { color: "accent/strong" })).name = "Initials";
    }
    const status = frame("Status", { direction: "none", fill: "status/success", radius: 999, stroke: "surface/bg", strokeWeight: 2 }, component);
    status.layoutPositioning = "ABSOLUTE";
    const dot = Math.max(8, Math.round(px * 0.3));
    status.resize(dot, dot);
    status.x = px - dot;
    status.y = px - dot;
    status.constraints = { horizontal: "MAX", vertical: "MAX" };
}
/* ---------------------------------------------------------------- Progress */
async function buildProgress(page) {
    const section = await docSection(page, "Progress", "component-lib/progress · <Progress value max label showValue variant size> and <CircularProgress>. For work with a known end; a Spinner is the right thing when there is nothing to measure. A value of null means the length is unknown, which is not the same as zero: the bar sweeps and aria-valuenow is left off, which is what makes a screen reader say “busy”.");
    const variants = [];
    for (const variant of ["Accent", "Success", "Warning", "Danger"]) {
        for (const fill of ["25", "60", "100"]) {
            variants.push({
                props: { Variant: variant, Value: fill },
                build: (component) => buildProgressComponent(component, variant, Number(fill) / 100, "md"),
            });
        }
    }
    for (const size of ["sm", "lg"]) {
        variants.push({
            props: { Variant: "Accent", Value: `60-${size}` },
            build: (component) => buildProgressComponent(component, "Accent", 0.6, size),
        });
    }
    const set = await variantSet(section, "Progress", "A bar for work with a known end. Code: <Progress value>.", variants, 3);
    textProperty(set, "Label", "Label", "Uploading report.pdf");
    textProperty(set, "Value", "Value", "62%");
    booleanProperty(set, "Show header", "Header", true);
    const row = await exampleRow(section, "Example — the ring, at three sizes");
    for (const [diameter, thickness] of [[28, 3], [44, 4], [56, 6]]) {
        const ring = frame(`Ring ${diameter}`, { direction: "row", justify: "center", align: "center" }, row);
        applySize(ring, diameter, diameter);
        const track = figma.createEllipse();
        track.resize(diameter, diameter);
        setFill(track, null);
        setStroke(track, "surface/subtle", thickness);
        track.name = "Track";
        ring.appendChild(track);
        track.layoutPositioning = "ABSOLUTE";
        track.x = 0;
        track.y = 0;
        await text(ring, "62%", "Label/Small");
    }
}
async function buildProgressComponent(component, variant, fraction, size) {
    const height = size === "sm" ? 4 : size === "lg" ? 12 : 8;
    const color = variant === "Success"
        ? "status/success"
        : variant === "Warning"
            ? "status/warning"
            : variant === "Danger"
                ? "status/danger"
                : "accent/default";
    applyLayout(component, { direction: "column", gap: 6 });
    applySize(component, 280, "hug");
    const header = frame("Header", { direction: "row", justify: "between", align: "center", gap: 12 }, component);
    applySize(header, "fill", "hug");
    (await text(header, "Uploading report.pdf", "Label/Default")).name = "Label";
    (await text(header, `${Math.round(fraction * 100)}%`, "Body/Small", { color: "text/muted" })).name = "Value";
    const track = frame("Track", { direction: "row", fill: "surface/subtle", radius: 999, clip: true }, component);
    applySize(track, "fill", height);
    const bar = frame("Bar", { direction: "none", fill: color, radius: 999 }, track);
    applySize(bar, Math.max(2, Math.round(280 * fraction)), height);
}
/* --------------------------------------------------------------- Accordion */
async function buildAccordions(page) {
    const section = await docSection(page, "Accordion", "component-lib/accordion · <Accordion items multiple collapsible variant size iconPosition> with <AccordionItem title description meta>. Each section is a native <details>, so the header is focusable, Enter and Space work, and Ctrl+F finds text inside a closed panel. The chevron turns 180° when open.");
    const variants = [];
    for (const state of ["Closed", "Open", "Hover", "Disabled"]) {
        variants.push({
            props: { State: state },
            build: (component) => buildAccordionItem(component, state),
        });
    }
    const set = await variantSet(section, "Accordion item", "One section. Code: <AccordionItem title>.", variants, 4);
    textProperty(set, "Title", "Title", "Shipping");
    textProperty(set, "Description", "Description", "Two to five working days");
    booleanProperty(set, "Show description", "Description", false);
    const row = await exampleRow(section, "Example — a group with one section open");
    const stack = frame("Accordion", { direction: "column", gap: 8 }, row);
    applySize(stack, 460, "hug");
    const open = instance(stack, set, { State: "Open" });
    applySize(open, "fill");
    setInstanceText(open, "Title", "Shipping");
    for (const title of ["Returns", "Support"]) {
        const item = instance(stack, set, { State: "Closed" });
        applySize(item, "fill");
        setInstanceText(item, "Title", title);
    }
}
async function buildAccordionItem(component, state) {
    const open = state === "Open";
    applyLayout(component, {
        direction: "column",
        fill: "surface/bg",
        stroke: "border/default",
        radius: "radius/md",
        clip: true,
    });
    applySize(component, 460, "hug");
    const header = frame("Header", {
        direction: "row",
        gap: 10,
        padding: [12, 14],
        align: "center",
        fill: state === "Hover" ? "surface/hover" : null,
    }, component);
    applySize(header, "fill", "hug");
    const heading = frame("Heading", { direction: "column", gap: 1 }, header);
    applySize(heading, "fill", "hug");
    (await text(heading, "Shipping", "Label/Strong", {
        color: state === "Disabled" ? "text/muted" : "text/primary",
        width: "fill",
    })).name = "Title";
    (await text(heading, "Two to five working days", "Body/Small", { color: "text/muted", width: "fill" })).name = "Description";
    const chevron = icon(header, "chevronDown", "text/muted", 16);
    chevron.name = "Chevron";
    if (open)
        chevron.rotation = 180;
    if (open) {
        const body = frame("Body", { direction: "column", padding: [0, 14, 12, 14] }, component);
        applySize(body, "fill", "hug");
        await text(body, "Orders leave the warehouse the next working day.", "Body/Default", { width: "fill" });
    }
}
/*
 * Export the selection as something a coding agent can act on.
 *
 * A Figma node carries far more than an agent can use — vector geometry,
 * every inherited style, absolute coordinates for things that will be laid
 * out by flexbox anyway. Handing that over buries the useful part. What is
 * useful is the structure, which of the nodes are kit components, the text,
 * and the handful of values worth turning into theme variables.
 *
 * So this condenses. It reads the scene graph through the plugin API, where
 * the field names are typed and the compiler checks them, rather than
 * guessing at the shape of a REST response.
 */
const hex = (c) => Math.round(c * 255).toString(16).padStart(2, "0");
/** The first solid fill as a hex string; anything else is not a token. */
function solidFill(node) {
    if (!("fills" in node))
        return undefined;
    const fills = node.fills;
    if (fills === figma.mixed || !Array.isArray(fills))
        return undefined;
    const solid = fills.find((f) => f.type === "SOLID" && f.visible !== false);
    if (!solid || solid.type !== "SOLID")
        return undefined;
    return `#${hex(solid.color.r)}${hex(solid.color.g)}${hex(solid.color.b)}`;
}
function cornerRadius(node) {
    if (!("cornerRadius" in node))
        return undefined;
    const radius = node.cornerRadius;
    // Zero is the default and says nothing; reporting it put `radius: 0` on
    // every square frame in the file.
    if (typeof radius !== "number" || radius === 0)
        return undefined;
    return radius;
}
function layoutOf(node) {
    if (!("layoutMode" in node) || node.layoutMode === "NONE")
        return undefined;
    const padding = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft];
    return {
        direction: node.layoutMode === "HORIZONTAL" ? "row" : "column",
        gap: node.itemSpacing || undefined,
        // Omitted where they are Figma's defaults. A screen is mostly frames
        // with no padding aligned to the start, and saying so every time costs
        // more than it tells anyone.
        padding: padding.some((side) => side !== 0) ? padding : undefined,
        align: node.counterAxisAlignItems === "MIN" ? undefined : node.counterAxisAlignItems,
        justify: node.primaryAxisAlignItems === "MIN" ? undefined : node.primaryAxisAlignItems,
    };
}
function textOf(node) {
    if (node.type !== "TEXT")
        return undefined;
    const chars = node.characters;
    return chars && chars.trim() ? chars : undefined;
}
function typography(node) {
    if (node.type !== "TEXT")
        return {};
    const size = node.fontSize;
    const weight = node.fontWeight;
    return {
        fontSize: typeof size === "number" ? size : undefined,
        fontWeight: typeof weight === "number" ? weight : undefined,
    };
}
const colours = new Map();
const radii = new Map();
const fontSizes = new Map();
const tally = (map, key) => {
    var _a;
    if (key !== undefined)
        map.set(key, ((_a = map.get(key)) !== null && _a !== void 0 ? _a : 0) + 1);
};
/**
 * Nested instances are not walked into.
 *
 * Once a node is "this is a Button", what is inside it belongs to the
 * component, not the design — descending would produce a tree of spans the
 * agent would be tempted to rebuild by hand.
 */
async function walk(node, depth) {
    var _a;
    const fill = solidFill(node);
    const radius = cornerRadius(node);
    const { fontSize, fontWeight } = typography(node);
    tally(colours, fill);
    tally(radii, radius);
    tally(fontSizes, fontSize);
    const out = { name: node.name, type: node.type };
    if (node.type === "INSTANCE") {
        const main = await node.getMainComponentAsync();
        if (main)
            out.component = (((_a = main.parent) === null || _a === void 0 ? void 0 : _a.type) === "COMPONENT_SET" ? main.parent.name : main.name);
        const props = node.componentProperties;
        if (props) {
            const simple = {};
            for (const key of Object.keys(props)) {
                const value = props[key].value;
                if (typeof value === "string" || typeof value === "boolean") {
                    simple[key.replace(/#\d+:\d+$/, "")] = value;
                }
            }
            if (Object.keys(simple).length)
                out.properties = simple;
        }
    }
    const layout = layoutOf(node);
    if (layout)
        out.layout = layout;
    const text = textOf(node);
    if (text)
        out.text = text;
    const style = {};
    if (fill)
        style.fill = fill;
    if (radius !== undefined)
        style.radius = radius;
    if (fontSize !== undefined)
        style.fontSize = fontSize;
    if (fontWeight !== undefined)
        style.fontWeight = fontWeight;
    if (Object.keys(style).length)
        out.style = style;
    /*
     * An icon is a frame wrapping vectors, and its name is the whole signal:
     * `search`, `chevrons-up-down`, `plus`. Walking in yields a child called
     * "Vector" and nothing an agent can act on — it cannot rebuild a path, and
     * should be reaching for the matching icon in its own set instead.
     */
    const vectorOnly = "children" in node &&
        node.children.length > 0 &&
        node.children.every((child) => ["VECTOR", "BOOLEAN_OPERATION", "ELLIPSE", "STAR", "POLYGON", "LINE"].includes(child.type));
    const descend = node.type !== "INSTANCE" && depth < 12 && "children" in node && !vectorOnly;
    if (descend) {
        const kids = [];
        for (const child of node.children) {
            if ("visible" in child && child.visible === false)
                continue;
            kids.push(await walk(child, depth + 1));
        }
        if (kids.length)
            out.children = kids;
    }
    return out;
}
const ranked = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]).map(([value, uses]) => ({ value, uses }));
async function exportSelection() {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.closePlugin("Select a frame first, then run the export.");
        return;
    }
    colours.clear();
    radii.clear();
    fontSizes.clear();
    const nodes = [];
    for (const node of selection)
        nodes.push(await walk(node, 0));
    const payload = {
        frame: selection.length === 1 ? selection[0].name : `${selection.length} selected nodes`,
        nodes,
        tokens: {
            colours: ranked(colours),
            radii: ranked(radii),
            fontSizes: ranked(fontSizes),
        },
    };
    const json = JSON.stringify(payload, null, 2);
    const size = (json.length / 1024).toFixed(1);
    /*
     * Shown rather than copied: a plugin cannot reach the clipboard without a
     * user gesture, and a textarea the author can select is less machinery
     * than a message channel for a one-off paste.
     */
    figma.showUI(`<style>
       body { font: 12px ui-sans-serif, system-ui; margin: 0; padding: 12px; }
       p { margin: 0 0 8px; color: #555; }
       textarea { width: 100%; height: 320px; font: 11px ui-monospace, monospace; }
       button { margin-top: 8px; padding: 6px 12px; }
     </style>
     <p><b>${payload.frame}</b> — ${size} KB. Paste this into your agent's <code>figma_frame</code> tool.</p>
     <textarea id="out" readonly></textarea>
     <button id="copy">Select all</button>
     <script>
       const out = document.getElementById("out");
       out.value = ${JSON.stringify(json)};
       document.getElementById("copy").onclick = () => { out.focus(); out.select(); };
     </script>`, { width: 560, height: 440, title: "Export for agent" });
}
// Entry point: builds the variables and styles, then one page per area.
const PAGES = [
    ["Foundations", buildFoundations],
    ["Components · Actions & navigation", buildActions],
    ["Components · Forms", buildForms],
    ["Components · Choice & quantity", buildControls],
    ["Components · Overlays & data", buildOverlays],
    ["Components · Menus & surfaces", buildSurfaces],
    ["Components · Status & identity", buildDisplay],
];
/**
 * Creates a fresh page. A page left by an earlier run is renamed, not deleted,
 * so nothing a designer added to it is lost; delete it once you've checked.
 */
async function preparePage(name, stamp) {
    const existing = figma.root.children.find((page) => page.name === name);
    if (existing)
        existing.name = `${name} (previous ${stamp})`;
    const page = figma.createPage();
    page.name = name;
    page.backgrounds = [{ type: "SOLID", color: { r: 0.957, g: 0.957, b: 0.961 } }];
    await figma.setCurrentPageAsync(page);
    return page;
}
async function run() {
    await figma.loadAllPagesAsync();
    figma.notify("Grampro Kit: creating variables and text styles…");
    KIT = await buildKit();
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    let first = null;
    for (const [name, build] of PAGES) {
        figma.notify(`Grampro Kit: building ${name}…`);
        const page = await preparePage(name, stamp);
        await build(page);
        stackPage(page);
        first !== null && first !== void 0 ? first : (first = page);
    }
    if (first) {
        await figma.setCurrentPageAsync(first);
        figma.viewport.scrollAndZoomIntoView(first.children);
    }
    const components = figma.root.children
        .filter((page) => PAGES.some(([name]) => name === page.name))
        .reduce((count, page) => count + page.findAllWithCriteria({ types: ["COMPONENT_SET"] }).length, 0);
    const darkNote = KIT.darkMode ? "Light + Dark modes" : "Light mode only (your plan allows one mode per collection)";
    figma.closePlugin(`Grampro Kit ready: ${COLOR_TOKENS.length + NUMBER_TOKENS.length} variables (${darkNote}), ${TYPE_TOKENS.length} text styles, ${components} component sets.`);
}
const command = figma.command || "generate";
if (command === "export") {
    exportSelection().catch((error) => {
        figma.closePlugin(error instanceof Error ? error.message : String(error));
    });
}
else {
    run().catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        figma.closePlugin(`Grampro Kit failed: ${message}`);
    });
}
