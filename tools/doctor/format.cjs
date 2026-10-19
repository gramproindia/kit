/*
 * The doctor report, for a person. Agents get the same data as --json.
 *
 * Ordered by what someone has to act on: conflicts and broken call sites
 * first, then edits, then updates available, then everything that is fine —
 * summarised in a single line, because a list of twenty-four "up to date"
 * rows buries the three that matter.
 */

const SIGN = { breaking: "!", changed: "~", added: "+" };
const RANK = { conflict: 0, "update-breaks-callers": 1, unverified: 2, edited: 3, "update-available": 4, "up-to-date": 5 };

function describeChange(change) {
  const sign = SIGN[change.severity] || " ";
  // "+ prop tone  "info" | "warn"" reads as what it is; "added" repeated would not.
  if (change.change === "added") {
    return `${sign} ${change.kind} ${change.name}${change.type ? `  ${short(change.type)}` : ""}${change.required ? " (required)" : ""}`;
  }
  let text = `${sign} ${change.kind} ${change.name}: ${change.change}`;
  if (change.values) text += ` ${change.values.map((v) => JSON.stringify(v)).join(", ")}`;
  if (change.from !== undefined && change.to !== undefined) {
    text += ` (${short(change.from)} → ${short(change.to)})`;
  }
  return text;
}

const short = (value) => {
  const text = value === null ? "none" : String(value);
  return text.length > 48 ? `${text.slice(0, 45)}...` : text;
};

function headline(row) {
  switch (row.verdict.status) {
    case "up-to-date":
      return `up to date · ${row.kitVersion}`;
    case "update-available":
      return `untouched · ${row.installedVersion || "older version"} → ${row.kitVersion} available, safe to update`;
    case "update-breaks-callers":
      if (row.state === "pristine") return `untouched · ${row.kitVersion} available, but it breaks call sites below`;
      return row.behind
        ? `your changes · taking ${row.kitVersion} would break call sites below`
        : `your changes · reverting to ${row.kitVersion} would break call sites below`;
    case "conflict":
      return `your changes · conflict with ${row.kitVersion}`;
    case "unverified":
      return "may contain your changes · installed before 2.7.2, so there is no record to compare against";
    default:
      return row.behind
        ? `your changes · installed ${row.installedVersion || "?"}, ${row.kitVersion} available`
        : `your changes · on ${row.installedVersion || row.kitVersion}`;
  }
}

function formatReport(report) {
  const lines = [];
  const pad = (label) => label.padEnd(12);
  lines.push(`Doctor · ${report.dest} · kit ${report.kitVersion}`);
  lines.push("");

  const rows = [...report.rows].sort(
    (a, b) => RANK[a.verdict.status] - RANK[b.verdict.status] || a.component.localeCompare(b.component),
  );
  const quiet = rows.filter((row) => row.verdict.status === "up-to-date");
  const loud = rows.filter((row) => row.verdict.status !== "up-to-date");

  for (const row of loud) {
    lines.push(`  ${row.component.padEnd(14)}${headline(row)}`);

    const files = [];
    if (row.changed.length) files.push(`changed ${row.changed.join(", ")}`);
    if (row.missing.length) files.push(`deleted ${row.missing.join(", ")}`);
    if (row.added.length) files.push(`added ${row.added.join(", ")}`);
    if (files.length) {
      const label = row.state === "unknown" ? "vs current" : "files";
      lines.push(`    ${pad(label)}${files.join(" · ")}`);
    }

    const cmp = row.comparison;
    if (cmp?.mode === "three-way") {
      if (row.state !== "pristine") {
        lines.push(`    ${pad("yours")}${cmp.yours.length ? describeChange(cmp.yours[0]) : "no contract changes (implementation only)"}`);
        for (const change of cmp.yours.slice(1)) lines.push(`    ${pad("")}${describeChange(change)}`);
      }
      if (row.behind) {
        lines.push(`    ${pad("upstream")}${cmp.upstream.length ? describeChange(cmp.upstream[0]) : "no contract changes"}`);
        for (const change of cmp.upstream.slice(1)) lines.push(`    ${pad("")}${describeChange(change)}`);
      }
      for (const [i, c] of cmp.conflicts.entries()) {
        lines.push(`    ${pad(i === 0 ? "conflict" : "")}${c.kind} ${c.name}: you ${c.yours}; upstream ${c.upstream}`);
      }
      // Both sides changed it, compatibly: say what the combination is.
      for (const [i, m] of (cmp.merges || []).entries()) {
        const values = m.values ? m.values.map((v) => JSON.stringify(v)).join(" | ") : "";
        lines.push(`    ${pad(i === 0 ? "merges" : "")}${m.kind} ${m.name} → ${values}  (both edits combine)`);
      }
    } else if (cmp?.mode === "two-way") {
      lines.push(`    ${pad("contract")}${cmp.differences.length ? describeChange(cmp.differences[0]) : "same as current"}`);
      for (const change of cmp.differences.slice(1)) lines.push(`    ${pad("")}${describeChange(change)}`);
    }

    if (row.breaks?.length) {
      for (const [i, use] of row.breaks.slice(0, 8).entries()) {
        const what = use.lostExport ? `<${use.component}> (no longer exported)` : `<${use.component} ${use.props.join(" ")}>`;
        lines.push(`    ${pad(i === 0 ? "would break" : "")}${use.file}:${use.line}  ${what}`);
      }
      if (row.breaks.length > 8) lines.push(`    ${pad("")}…and ${row.breaks.length - 8} more`);
    }

    if (row.verdict.action) {
      lines.push(`    ${pad("update")}${row.verdict.action}`);
    } else if (row.verdict.force && row.behind) {
      lines.push(`    ${pad("choices")}keep your copy (nothing to do), or replace it with ${row.kitVersion}`);
      lines.push(`    ${pad("")}and lose your changes: ${row.verdict.force}`);
    }
    lines.push("");
  }

  if (quiet.length) {
    lines.push(`  Up to date: ${quiet.map((row) => row.component).join(", ")}`);
    lines.push("");
  }

  for (const name of report.notInstalled) lines.push(`  ${name}: not installed here`);
  if (report.contractNote) lines.push(`  Note: ${report.contractNote}`);
  if (!report.reactTypes) {
    lines.push("  Note: @types/react was not found, so inherited DOM props were left out of the comparison.");
  }
  if (report.truncated) lines.push("  Note: stopped scanning after 20,000 source files; call sites past that were not checked.");

  const edited = rows.filter((row) => row.state !== "pristine").length;
  const conflicts = rows.reduce((n, row) => n + (row.comparison?.conflicts?.length || 0), 0);
  const breaks = rows.reduce((n, row) => n + (row.breaks?.length || 0), 0);
  lines.push(
    `${rows.length} component(s) · ${edited} with your changes · ${conflicts} conflict(s) · ${breaks} call site(s) at risk`,
  );
  return lines.join("\n");
}

/* JSON for agents and CI: the report minus Sets and the bulky contracts. */
function toJson(report) {
  return {
    kitVersion: report.kitVersion,
    notInstalled: report.notInstalled,
    note: report.contractNote,
    components: report.rows.map((row) => ({
      component: row.component,
      folder: row.folder,
      state: row.state,
      baseline: row.baseline,
      installedVersion: row.installedVersion,
      behind: row.behind,
      files: { changed: row.changed, deleted: row.missing, added: row.added },
      comparison: row.comparison || null,
      breaks: row.breaks || [],
      verdict: row.verdict,
    })),
  };
}

module.exports = { formatReport, toJson };
