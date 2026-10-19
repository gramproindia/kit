/*
 * What a component promises, reduced to what a caller depends on, and how two
 * of those promises differ.
 *
 * A text diff of two versions of Button.tsx says which lines moved. It cannot
 * say that `variant` stopped accepting "ghost", or that a prop became
 * required, or that the agent runtime lost an operation — and those are the
 * only differences that break someone. The passport already records each of
 * them, so the comparison is done there.
 *
 * Pure: no filesystem, no TypeScript. Everything here takes passports, or the
 * compact contracts made from them, and returns plain data.
 */

/** The parts of a passport a caller can depend on. */
function compactContract(passport) {
  if (!passport || typeof passport !== "object") return null;
  const props = {};
  for (const prop of passport.props || []) {
    if (!prop || typeof prop.name !== "string") continue;
    props[prop.name] = {
      type: prop.type || "",
      typeText: normaliseType(prop.typeText || ""),
      required: Boolean(prop.required),
      origin: prop.origin || "derived",
      ...(prop.default !== undefined ? { default: String(prop.default) } : {}),
      ...(Array.isArray(prop.values) && prop.values.length
        ? { values: prop.values.map(String).sort() }
        : {}),
    };
  }
  const events = {};
  for (const event of passport.events || []) {
    if (event && typeof event.name === "string") events[event.name] = normaliseType(event.signature || "");
  }
  return {
    component: passport.identity?.component || null,
    version: passport.source?.libraryVersion || null,
    exports: [...(passport.identity?.exports || [])].map(String).sort(),
    props,
    events,
    operations: Object.keys(passport.operations || {}).sort(),
  };
}

/** Whitespace is not a type change. */
const normaliseType = (text) => String(text).replace(/\s+/g, " ").trim();

/*
 * Inherited props come from React's DOM types, and whether they appear at all
 * depends on whether @types/react was found when the passport was made. A
 * project without it would report every one of them as "removed" — so when
 * one side has inherited props and the other has none, only the component's
 * own props are compared, and the report says so.
 */
function comparableProps(before, after) {
  const has = (c) => Object.values(c.props).some((p) => p.origin === "inherited");
  const ownOnly = has(before) !== has(after);
  const pick = (c) =>
    Object.fromEntries(Object.entries(c.props).filter(([, p]) => !ownOnly || p.origin !== "inherited"));
  return { before: pick(before), after: pick(after), ownOnly };
}

/**
 * Every difference between two contracts, oldest first.
 *
 * `severity` is what a caller should take from it:
 *   breaking  code that worked against `before` may not compile or behave against `after`
 *   changed   the promise moved, but existing callers keep working
 *   added     something new, which nobody can be depending on yet
 */
function diffContracts(before, after) {
  if (!before || !after) return { changes: [], ownPropsOnly: false };
  const changes = [];
  const add = (kind, name, change, severity, detail = {}) =>
    changes.push({ kind, name, change, severity, ...detail });

  const { before: bp, after: ap, ownOnly } = comparableProps(before, after);

  for (const [name, was] of Object.entries(bp)) {
    const now = ap[name];
    if (!now) {
      add("prop", name, "removed", "breaking", { from: was.typeText });
      continue;
    }
    if (!was.required && now.required) add("prop", name, "now required", "breaking");
    if (was.required && !now.required) add("prop", name, "now optional", "changed");

    if (was.values || now.values) {
      const gone = (was.values || []).filter((v) => !(now.values || []).includes(v));
      const fresh = (now.values || []).filter((v) => !(was.values || []).includes(v));
      if (gone.length) add("prop", name, "values removed", "breaking", { values: gone });
      if (fresh.length) add("prop", name, "values added", "added", { values: fresh });
    } else if (was.typeText !== now.typeText) {
      // Without enumerated values there is no telling a widening from a
      // narrowing, so it is reported without claiming either.
      add("prop", name, "type changed", "changed", { from: was.typeText, to: now.typeText });
    }

    if ((was.default ?? null) !== (now.default ?? null)) {
      add("prop", name, "default changed", "changed", { from: was.default ?? null, to: now.default ?? null });
    }
  }
  for (const [name, now] of Object.entries(ap)) {
    if (bp[name]) continue;
    const type = now.values ? now.values.map((v) => JSON.stringify(v)).join(" | ") : now.typeText.replace(/ \| undefined$/, "");
    add("prop", name, "added", now.required ? "breaking" : "added", { type, ...(now.required ? { required: true } : {}) });
  }

  for (const [name, signature] of Object.entries(before.events)) {
    if (!(name in after.events)) add("event", name, "removed", "breaking");
    else if (after.events[name] !== signature) {
      add("event", name, "signature changed", "changed", { from: signature, to: after.events[name] });
    }
  }
  for (const name of Object.keys(after.events)) {
    if (!(name in before.events)) add("event", name, "added", "added");
  }

  for (const name of before.exports) if (!after.exports.includes(name)) add("export", name, "removed", "breaking");
  for (const name of after.exports) if (!before.exports.includes(name)) add("export", name, "added", "added");

  // An agent that drove this operation yesterday is refused it today.
  for (const name of before.operations) {
    if (!after.operations.includes(name)) add("operation", name, "removed", "breaking");
  }
  for (const name of after.operations) if (!before.operations.includes(name)) add("operation", name, "added", "added");

  return { changes, ownPropsOnly: ownOnly };
}

const keyOf = (change) => `${change.kind}:${change.name}`;

/**
 * Your edits and upstream's, measured from the version you installed, and the
 * places both of you changed the same thing.
 *
 * Without a base, only the difference between your copy and upstream can be
 * reported, with no telling who moved — so it is reported as that, not
 * dressed up as a three-way result.
 */
function threeWay(base, mine, theirs) {
  if (!base) {
    const differences = diffContracts(theirs, mine);
    return { mode: "two-way", differences: differences.changes, ownPropsOnly: differences.ownPropsOnly };
  }
  const yours = diffContracts(base, mine);
  const upstream = diffContracts(base, theirs);

  const group = (changes) => {
    const by = new Map();
    for (const change of changes) by.set(keyOf(change), [...(by.get(keyOf(change)) || []), change]);
    return by;
  };
  const ours = group(yours.changes);
  const conflicts = [];
  const merges = [];

  for (const [key, upstreamChanges] of group(upstream.changes)) {
    const ownChanges = ours.get(key);
    if (!ownChanges) continue;
    const { kind, name } = upstreamChanges[0];
    const verdict = reconcile(kind, name, ownChanges, upstreamChanges, { base, mine, theirs });
    if (verdict.conflict) conflicts.push({ kind, name, yours: verdict.yours, upstream: verdict.upstream });
    else if (verdict.merged) merges.push({ kind, name, ...verdict.merged });
  }

  return {
    mode: "three-way",
    yours: yours.changes,
    upstream: upstream.changes,
    conflicts,
    merges,
    ownPropsOnly: yours.ownPropsOnly || upstream.ownPropsOnly,
  };
}

const describeAll = (changes) => [...new Set(changes.map((c) => c.change))].join(", ");

/*
 * Two sides touched the same entry. Whether that is a conflict depends on
 * what each did to it, not merely on both having done something:
 *
 *   - you added "ghost"-less values while upstream added "link": value sets
 *     combine, so that merges, and the merged set is reported;
 *   - one side removed the prop while the other changed it: a conflict, since
 *     no combination keeps both intentions;
 *   - both changed the type, the default, or the required-ness, to different
 *     results: a conflict;
 *   - both made the identical change: agreement, not reported at all.
 */
function reconcile(kind, name, ownChanges, upstreamChanges, { base, mine, theirs }) {
  const kinds = (changes) => new Set(changes.map((c) => c.change));
  const own = kinds(ownChanges);
  const up = kinds(upstreamChanges);
  const conflict = () => ({ conflict: true, yours: describeAll(ownChanges), upstream: describeAll(upstreamChanges) });

  if (kind !== "prop") {
    // Exports and operations either exist or do not, so both sides changing one
    // means both made the same change. Events can diverge in signature.
    if (kind === "event" && own.has("signature changed") && up.has("signature changed")) {
      return mine.events[name] === theirs.events[name] ? {} : conflict();
    }
    if (own.has("removed") !== up.has("removed")) return conflict();
    return {};
  }

  const minePropNow = mine.props[name];
  const theirsPropNow = theirs.props[name];

  // One side deleted it, the other kept and changed it.
  if (own.has("removed") !== up.has("removed")) return conflict();
  if (own.has("removed") && up.has("removed")) return {};

  // Both added a prop of the same name: fine only if they agree on what it is.
  if (own.has("added") && up.has("added")) {
    return JSON.stringify(minePropNow) === JSON.stringify(theirsPropNow) ? {} : conflict();
  }

  if (minePropNow?.typeText !== theirsPropNow?.typeText && own.has("type changed") && up.has("type changed")) {
    return conflict();
  }
  if (own.has("default changed") && up.has("default changed") && minePropNow?.default !== theirsPropNow?.default) {
    return conflict();
  }
  if ((own.has("now required") && up.has("now optional")) || (own.has("now optional") && up.has("now required"))) {
    return conflict();
  }

  // Value sets merge: start from the base, apply both sides' removals and additions.
  const valueEdits = (s) => s.has("values added") || s.has("values removed");
  if (valueEdits(own) && valueEdits(up)) {
    const was = new Set(base.props[name]?.values || []);
    const mineValues = new Set(minePropNow?.values || []);
    const theirValues = new Set(theirsPropNow?.values || []);
    const merged = new Set(was);
    for (const v of was) if (!mineValues.has(v) || !theirValues.has(v)) merged.delete(v);
    for (const v of mineValues) if (!was.has(v)) merged.add(v);
    for (const v of theirValues) if (!was.has(v)) merged.add(v);
    return { merged: { values: [...merged].sort() } };
  }
  return {};
}

/**
 * Names a caller can write on this component's JSX: props and handlers. What
 * your copy accepts and upstream does not is exactly what replacing yours with
 * upstream would take away from your call sites.
 */
const acceptedNames = (contract) => new Set([...Object.keys(contract.props), ...Object.keys(contract.events)]);

module.exports = { compactContract, diffContracts, threeWay, acceptedNames };
