/**
 * Export-boundary hygiene — ported verbatim from the BO2 hardening contract.
 * clean()/escapeMD() are applied AT THE EXPORT BOUNDARY ONLY, never on live
 * input. DOM escaping (esc) is a client concern and intentionally not here.
 */

/** Collapse whitespace, trim. */
export function norm(s: unknown): string {
  return String(s == null ? "" : s).trim().replace(/\s+/g, " ");
}

/** norm + straighten smart quotes + kill non-breaking spaces. */
export function clean(s: unknown): string {
  return norm(s)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/ /g, " ");
}

/** clean + escape Markdown table pipes. */
export function escapeMD(s: unknown): string {
  return clean(s).replace(/\|/g, "\\|");
}

/** Quote-escape one CSV row; values cleaned (data rows). */
export function csvRow(cells: readonly unknown[]): string {
  return cells.map((c) => '"' + clean(c).replace(/"/g, '""') + '"').join(",");
}

/** Quote-escape one CSV row; values raw (meta banner rows — version strings untouched). */
export function csvRowRaw(cells: readonly unknown[]): string {
  return cells.map((c) => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"').join(",");
}

export interface CsvMeta {
  tool: string;
  sessionId: string;
  sessionStart: string; // ISO
  facilitator: string;
  exportedAt: string; // ISO
  version?: string;
}

/**
 * The suite's two-block CSV layout: raw meta banner, blank line, log block,
 * blank line, "--- FINAL STATE … ---" banner, final-state block.
 */
export function twoBlockCsv(
  meta: CsvMeta,
  logHeader: readonly string[],
  logRows: readonly (readonly unknown[])[],
  finalStateBanner: string,
  finalHeader: readonly string[],
  finalRows: readonly (readonly unknown[])[],
): string {
  const out: string[] = [];
  out.push(csvRowRaw(["VERSION", meta.version ?? "1"]));
  out.push(csvRowRaw(["TOOL", meta.tool]));
  out.push(csvRowRaw(["SESSION_ID", meta.sessionId]));
  out.push(csvRowRaw(["SESSION_START", meta.sessionStart]));
  out.push(csvRowRaw(["FACILITATOR", clean(meta.facilitator) || "unnamed"]));
  out.push(csvRowRaw(["EXPORTED_AT", meta.exportedAt]));
  out.push(csvRowRaw([""]));
  out.push(csvRow(logHeader));
  for (const r of logRows) out.push(csvRow(r));
  out.push(csvRow([""]));
  out.push(csvRow([finalStateBanner]));
  out.push(csvRow(finalHeader));
  for (const r of finalRows) out.push(csvRow(r));
  return out.join("\n");
}

/** HTML-era SESSION_ID format: ISO start (: and . → -) + '_' + facilitator slug. */
export function makeExportSessionId(sessionStartIso: string, facilitator: string): string {
  const f = clean(facilitator).replace(/[^A-Za-z0-9_-]/g, "") || "unnamed";
  return sessionStartIso.replace(/[:.]/g, "-") + "_" + f;
}
