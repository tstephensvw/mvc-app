/**
 * HTML-era export contracts, preserved byte-compatible in shape (arch doc D10, §9).
 *
 * RULES (handoff brief §3.6 — enforced by CI golden tests):
 *  - Widen-only: fields are never renamed or removed; new fields only append.
 *  - Every schema uses .passthrough() so unknown fields from any prior or future
 *    export version survive import → re-export round trips.
 *  - Tool identity strings are load-bearing: importers dispatch on `tool`.
 *
 * Sources: BO1/BO2 export functions read from the verified demo builds; BO3 shape
 * from BO4's hardened importer + handoff brief §4; BO4 is the NEW full-parity feed
 * (brief §8.3) under a new tool id — additive, nothing renamed.
 */
import { z } from "zod";

/* ---------------- shared fragments ---------------- */

export const Confirmed = z.enum(["yes", "no", "unreviewed"]);
export const LensCodeSchema = z.enum(["people", "process", "tech", "facilities", "thirdparty"]);
export const TierCodeSchema = z.enum(["t1", "t2", "t3", "t4", "t5"]);
export const RiskBand = z.enum(["critical", "high", "moderate", "low", "unrated"]);

const ActivityEvent = z
  .object({
    seq: z.number(),
    ts: z.string(), // ISO timestamp
    type: z.string(),
  })
  .passthrough();

/* ---------------- BO1 — CBS Prioritization ---------------- */

export const BO1_TOOL_ID = "BO1-CBS";

export const Bo1FinalStateRow = z
  .object({
    id: z.string(),
    cbs: z.string(),
    service: z.string(),
    group: z.string(), // group code (G1..)
    group_label: z.string(),
    functional_area: z.string(),
    description: z.string(),
    tier: z.string(), // tier label (legacy duplicate of tier_label)
    tier_code: TierCodeSchema,
    tier_label: z.string(),
    notes: z.string(),
    origin: z.enum(["workshop", "client-inventory"]),
  })
  .passthrough();

export const Bo1Export = z
  .object({
    tool: z.literal(BO1_TOOL_ID),
    version: z.union([z.number(), z.string()]),
    session_id: z.string(),
    session_start: z.string(),
    exported_at: z.string(),
    facilitator: z.string(),
    groups: z.array(z.object({ id: z.string(), label: z.string() }).passthrough()),
    tiers: z.array(z.object({ id: z.string(), label: z.string() }).passthrough()),
    activity_log: z.array(ActivityEvent),
    final_state: z.array(Bo1FinalStateRow),
  })
  .passthrough();

export type Bo1Export = z.infer<typeof Bo1Export>;

/* ---------------- BO2 — Dependency Mapping ---------------- */

export const BO2_TOOL_ID = "BO2-CBS-DEPENDENCY-MAPPING";

export const Bo2Cell = z
  .object({
    dep_id: z.string(), // svc_<slug>::<lens>_<slug>[ _n]
    cbs_id: z.string(), // svc_<slug>
    cbs: z.string(),
    group: z.string(), // group LABEL in the HTML-era export
    tier: z.string(), // tier label ('' when unknown)
    functional_area: z.string(),
    lens: z.string(), // lens label
    lens_code: LensCodeSchema,
    dependency: z.string(),
    origin: z.enum(["prepopulated", "manual"]),
    confirmed: Confirmed,
    rank: z.number().nullable(),
    facilitator_notes: z.string(),
  })
  .passthrough();

export const Bo2Export = z
  .object({
    tool: z.literal(BO2_TOOL_ID),
    version: z.union([z.number(), z.string()]),
    session_id: z.string(),
    session_start: z.string(),
    exported_at: z.string(),
    facilitator: z.string(),
    groups: z.array(z.object({ id: z.string(), label: z.string(), color: z.string().optional() }).passthrough()),
    lenses: z.array(z.object({ code: z.string(), label: z.string() }).passthrough()),
    activity_log: z.array(ActivityEvent),
    final_state: z.array(Bo2Cell),
  })
  .passthrough();

export type Bo2Export = z.infer<typeof Bo2Export>;

/* ---------------- BO3 — Dependency Risk & SPoF ---------------- */

export const BO3_TOOL_ID = "BO3-RISK";

/** One deduplicated dependency cluster with its risk attributes (BO4's importer contract). */
export const Bo3RiskCluster = z
  .object({
    dependency: z.string(),
    lens_code: LensCodeSchema,
    risk_band: RiskBand.or(z.string()), // tolerate future bands (widen-only)
    is_spof: z.boolean(),
    spof_auto: z.boolean().optional(),
    service_halting_in: z.number().optional(), // count of services this halts
    concentration: z.number().optional(),
    concentration_potential: z.number().optional(),
    is_primary_system: z.boolean().optional(),
    cbs_confirmed: z.array(z.string()).optional(),
    cbs_unreviewed: z.array(z.string()).optional(),
    groups: z.array(z.string()).optional(),
    cascade: z.string().optional(),
    dep_ids: z.array(z.string()).optional(), // the instance dep_ids folded into this cluster
    note: z.string().optional(),
  })
  .passthrough();

export const Bo3Export = z
  .object({
    tool: z.literal(BO3_TOOL_ID),
    version: z.union([z.number(), z.string()]).optional(),
    session_id: z.string().optional(),
    exported_at: z.string().optional(),
    facilitator: z.string().optional(),
    groups: z.array(z.object({ id: z.string(), label: z.string() }).passthrough()).optional(),
    lenses: z.array(z.object({ code: z.string(), label: z.string() }).passthrough()).optional(),
    dependency_risk: z.array(Bo3RiskCluster),
    /** Per-instance rows with risk_* namespace alongside pass-through BO2 fields (brief §4/BO3). */
    final_state: z.array(z.object({}).passthrough()).optional(),
    activity_log: z.array(ActivityEvent).optional(),
  })
  .passthrough();

export type Bo3Export = z.infer<typeof Bo3Export>;

/* ---------------- BO4 — Workaround & Recovery (NEW full-parity feed, brief §8.3) ---------------- */

export const BO4_TOOL_ID = "BO4-WORKAROUND";

const AssessmentFields = z.object({
  workaround_exists: z.boolean().nullable(),
  documented: z.boolean().nullable(),
  tested: z.boolean().nullable(),
  sustain_code: TierCodeSchema.nullable(), // time band the workaround holds for
  sustain_label: z.string().nullable(),
  notes: z.string(),
});

export const Bo4ClusterRow = AssessmentFields.extend({
  dependency: z.string(),
  lens_code: LensCodeSchema,
  lens: z.string(),
  /** Services this dependency supports, each with its read-only recovery tier for the sustain-vs-tier judgment. */
  cbs_supported: z.array(
    z
      .object({
        cbs_id: z.string(),
        cbs: z.string(),
        tier_code: TierCodeSchema.nullable(),
        tier_label: z.string(),
        dep_id: z.string(),
      })
      .passthrough(),
  ),
  /** Carried BO3 lineage (read-only). */
  risk_band: z.string().nullable(),
  is_spof: z.boolean().nullable(),
  service_halting_in: z.number().nullable(),
  /** Derived traffic light — computed, never stored (arch doc D5). */
  derived_status: z.enum(["Critical gap", "At risk", "Resilient", "Not assessed"]),
  derived_reason: z.string(),
  /** Per-service overrides, when a service's situation genuinely differs (§15-A4). */
  overrides: z.array(
    AssessmentFields.extend({
      cbs_id: z.string(),
      dep_id: z.string(),
      derived_status: z.enum(["Critical gap", "At risk", "Resilient", "Not assessed"]),
    }).passthrough(),
  ),
}).passthrough();

export const Bo4Export = z
  .object({
    tool: z.literal(BO4_TOOL_ID),
    version: z.union([z.number(), z.string()]),
    session_id: z.string(),
    session_start: z.string(),
    exported_at: z.string(),
    facilitator: z.string(),
    groups: z.array(z.object({ id: z.string(), label: z.string() }).passthrough()),
    lenses: z.array(z.object({ code: z.string(), label: z.string() }).passthrough()),
    activity_log: z.array(ActivityEvent),
    final_state: z.array(Bo4ClusterRow),
  })
  .passthrough();

export type Bo4Export = z.infer<typeof Bo4Export>;

/* ---------------- Solar Map JSON (round-trips with the slide generator) ---------------- */

export const SolarJson = z
  .object({
    cbs: z.string(),
    rto: z.string(), // display string, e.g. "RTO  < 4 Hours"
    pillar: z.string(),
    deps: z.array(
      z
        .object({
          lens: z.string(), // legacy uppercase labels: TECHNOLOGY / THIRD PARTIES / PEOPLE / PROCESS / FACILITIES
          name: z.string(),
          status: z.enum(["crit", "atrisk", "res", "na"]),
        })
        .passthrough(),
    ),
  })
  .passthrough();

export type SolarJson = z.infer<typeof SolarJson>;

/* ---------------- import dispatch (fail loud — brief §5) ---------------- */

export type AnyLegacyExport =
  | { kind: "bo1"; data: Bo1Export }
  | { kind: "bo2"; data: Bo2Export }
  | { kind: "bo3"; data: Bo3Export }
  | { kind: "bo4"; data: Bo4Export };

/**
 * Validates tool identity BEFORE ingesting; malformed input is rejected with a
 * clear message, never partially applied. Mirrors BO4's hardened dispatcher.
 */
export function dispatchLegacyImport(raw: unknown): AnyLegacyExport {
  if (typeof raw !== "object" || raw === null) throw new Error("Not a JSON object — expected a BO1–BO4 export.");
  const tool = (raw as Record<string, unknown>)["tool"];
  switch (tool) {
    case BO1_TOOL_ID:
      return { kind: "bo1", data: Bo1Export.parse(raw) };
    case BO2_TOOL_ID:
      return { kind: "bo2", data: Bo2Export.parse(raw) };
    case BO3_TOOL_ID:
      return { kind: "bo3", data: Bo3Export.parse(raw) };
    case BO4_TOOL_ID:
      return { kind: "bo4", data: Bo4Export.parse(raw) };
    default:
      throw new Error(
        `Unrecognized tool identity ${JSON.stringify(tool)} — expected one of ${BO1_TOOL_ID}, ${BO2_TOOL_ID}, ${BO3_TOOL_ID}, ${BO4_TOOL_ID}.`,
      );
  }
}
