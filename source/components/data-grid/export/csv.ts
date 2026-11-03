import type { ExportTable } from "./table";

/** Spreadsheet apps execute cells starting with these characters as formulas. */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * A plain number such as "-5", "+1,234.50" or "-12 %". Intl group separators
 * include the no-break spaces. Nothing here can form a formula.
 */
const NUMERIC_LITERAL = /^[-+]?[   ]*[\d.,][\d.,   ]*%?$/;

/**
 * Prefixes `'` to text a spreadsheet would run as a formula. Decided on the
 * text itself, not the column type: a number column with a custom `format`
 * can still produce "=HYPERLINK(...)".
 */
export function neutralizeFormula(text: string): string {
  return FORMULA_PREFIX.test(text) && !NUMERIC_LITERAL.test(text) ? `'${text}` : text;
}

function escapeField(text: string, delimiter: string): string {
  const safe = neutralizeFormula(text);
  const needsQuotes =
    safe.includes(delimiter) || safe.includes('"') || safe.includes("\n") || safe.includes("\r");
  return needsQuotes ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function serialize(table: ExportTable, delimiter: string): string {
  const lines = [table.columns.map((c) => escapeField(c.header, delimiter)).join(delimiter)];
  for (const row of table.text) {
    lines.push(row.map((text) => escapeField(text, delimiter)).join(delimiter));
  }
  return lines.join("\r\n");
}

export const toCsv = (table: ExportTable) => serialize(table, ",");

export const toTsv = (table: ExportTable) => serialize(table, "\t");

export function createCsvBlob(table: ExportTable): Blob {
  // The BOM makes Excel read the file as UTF-8.
  return new Blob(["﻿", toCsv(table)], { type: "text/csv;charset=utf-8" });
}
