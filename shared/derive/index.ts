/**
 * Derived values — the single implementation used by API responses, exports,
 * and tests. NOTHING here is ever stored as a writable field (arch doc D5):
 * BO4 status, SPoF, concentration, primary-system, and the Solar render model
 * are all recomputed from state.
 */
import type { LensCode, TierCode } from "../dataset/constants.js";

/* ---------------- identity: slugs & dep_id minting (ported from BO2) ---------------- */

/** Lowercase, non-alphanumerics → '_', trimmed; 'x' if empty. Exactly BO2's slug(). */
export function slug(s: string): string {
  return (
    String(s ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "x"
  );
}

export function serviceSlug(name: string): string {
  return "svc_" + slug(name);
}

/**
 * Mint a dep_id: `svc_<service>::<lens>_<dep>`, with `_2`, `_3`… suffix on
 * collision within the same service. Exactly BO2's mintDepId(). The minted id
 * is frozen at creation — renames never re-mint (export continuity).
 */
export function mintDepId(serviceName: string, lens: LensCode, depName: string, existing: ReadonlySet<string>): string {
  const base = serviceSlug(serviceName) + "::" + lens + "_" + slug(depName);
  let id = base;
  let n = 1;
  while (existing.has(id)) {
    n++;
    id = base + "_" + n;
  }
  return id;
}

/** Cluster key for dependency dedup — BO3 clusters by normalized name within a lens. */
export function clusterKey(lens: LensCode, depName: string): string {
  return lens + "::" + slug(depName);
}

/* ---------------- BO4 derived status (ported from BO4 statusOf) ---------------- */

export type Bool3 = boolean | null;

export interface WorkaroundAnswers {
  exists: Bool3;
  documented: Bool3;
  tested: Bool3;
  sustain: TierCode | null; // time band the workaround holds for; reuses tier band codes
}

export type StatusKey = "red" | "amber" | "green" | "slate";

export interface DerivedStatus {
  key: StatusKey;
  label: "Critical gap" | "At risk" | "Resilient" | "Not assessed";
  why: string;
}

/** Sustain bands under 24 hours flag "At risk" — BO4's WEAK set. */
export const WEAK_SUSTAIN: ReadonlySet<TierCode> = new Set<TierCode>(["t1", "t2"]);

/** Exact port of BO4's statusOf() — the deck-driving traffic light. */
export function statusOf(a: WorkaroundAnswers): DerivedStatus {
  if (a.exists === null) return { key: "slate", label: "Not assessed", why: "No workaround answer captured yet." };
  if (a.exists === false)
    return {
      key: "red",
      label: "Critical gap",
      why: "No workaround — single point of failure. Loss of this dependency stops the service with nothing to fall back on.",
    };
  const reasons: string[] = [];
  if (a.documented !== true) reasons.push("not documented");
  if (a.tested !== true) reasons.push("not tested");
  if (a.sustain === null) reasons.push("sustainability not set");
  else if (WEAK_SUSTAIN.has(a.sustain)) reasons.push("sustains < 24 hrs");
  if (reasons.length === 0)
    return { key: "green", label: "Resilient", why: "Workaround exists, documented, tested, and holds beyond 24 hrs." };
  return { key: "amber", label: "At risk", why: "Workaround exists but: " + reasons.join(", ") + "." };
}

/** Effective assessment for a service = per-service override if present, else cluster default (§15-A4). */
export function effectiveAssessment(clusterDefault: WorkaroundAnswers | null, override: WorkaroundAnswers | null): WorkaroundAnswers {
  const empty: WorkaroundAnswers = { exists: null, documented: null, tested: null, sustain: null };
  return override ?? clusterDefault ?? empty;
}

/* ---------------- Solar status mapping (BO4 status → Solar chip color) ---------------- */

export type SolarStatusCode = "crit" | "atrisk" | "res" | "na";

export const SOLAR_COLOR: Record<SolarStatusCode, string> = {
  crit: "#E0301E",
  atrisk: "#E8902A",
  res: "#2DB757",
  na: "#BFC4CC",
};

export const SOLAR_LABEL: Record<SolarStatusCode, string> = {
  crit: "Critical gap",
  atrisk: "At risk",
  res: "Resilient",
  na: "Not assessed",
};

/** Solar chips render BO4's derived status; no independent clickable state (brief §8.2). */
export function toSolarStatus(s: StatusKey): SolarStatusCode {
  return s === "red" ? "crit" : s === "amber" ? "atrisk" : s === "green" ? "res" : "na";
}

/* ---------------- BO3 concentration / SPoF / primary-system (ported from BO3 rules) ---------------- */

export interface ClusterInstanceView {
  serviceName: string;
  confirmed: "yes" | "no" | "unreviewed";
  rank: number | null;
}

/** Concentration = count of services where this dependency is a CONFIRMED instance. */
export function concentration(instances: readonly ClusterInstanceView[]): number {
  return instances.filter((i) => i.confirmed === "yes").length;
}

/** Potential concentration counts unreviewed instances too (the facilitation moment: validating raises the live count). */
export function concentrationPotential(instances: readonly ClusterInstanceView[]): number {
  return instances.filter((i) => i.confirmed !== "no").length;
}

/** Auto SPoF at >= spofMin confirmed services (engagement setting, default 3 — §15-A6). */
export function autoSpof(instances: readonly ClusterInstanceView[], spofMin: number): boolean {
  return concentration(instances) >= spofMin;
}

/** Manual override wins when set; otherwise the auto flag. */
export function effectiveSpof(manual: boolean | null, auto: boolean): boolean {
  return manual ?? auto;
}

/**
 * "Primary system" heuristic — BO3's rule verbatim (brief §4/BO3):
 * ≥3 confirmed services, ≥2 rank-1 positions, and rank-1 count ≥ half the confirmed count.
 */
export function isPrimarySystem(instances: readonly ClusterInstanceView[]): boolean {
  const confirmed = instances.filter((i) => i.confirmed === "yes");
  const rank1 = confirmed.filter((i) => i.rank === 1).length;
  return confirmed.length >= 3 && rank1 >= 2 && rank1 >= confirmed.length / 2;
}

/** Cascade consideration line, generated per cluster (BO3 pattern). */
export function cascadeLine(depName: string, instances: readonly ClusterInstanceView[]): string {
  const confirmed = instances.filter((i) => i.confirmed === "yes").map((i) => i.serviceName);
  if (confirmed.length < 2) return "";
  return `Loss of ${depName} cascades across ${confirmed.length} critical services: ${confirmed.join("; ")}.`;
}

/* ---------------- tier helpers (BO2/BO4 label maps) ---------------- */

export const TIER_LABEL_TO_CODE: Record<string, TierCode> = {
  "< 4 Hours": "t1",
  "4 – 24 Hours": "t2",
  "1 – 3 Days": "t3",
  "3 – 7 Days": "t4",
  "> 1 Week": "t5",
};

export const TIER_SHORT: Record<string, string> = {
  "< 4 Hours": "<4h",
  "4 – 24 Hours": "4–24h",
  "1 – 3 Days": "1–3d",
  "3 – 7 Days": "3–7d",
  "> 1 Week": ">1wk",
};
