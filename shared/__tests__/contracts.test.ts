import { describe, it, expect } from "vitest";
import { Bo1Export, Bo2Export, Bo3Export, dispatchLegacyImport } from "../contracts/exports.js";
import { LENS_Q, ANS_KEYS, answersSchema, isFlagged } from "../contracts/question-banks.js";

/** Minimal fixtures mirroring the HTML-era export functions' exact field names. */
const bo1Fixture = {
  tool: "BO1-CBS",
  version: 1,
  session_id: "2026-08-19T10-00-00-000Z_unnamed",
  session_start: "2026-08-19T10:00:00.000Z",
  exported_at: "2026-08-19T11:00:00.000Z",
  facilitator: "unnamed",
  groups: [{ id: "G1", label: "Clinical", desc: "Clinical, Ambulatory, Acute, Post", added: false }],
  tiers: [{ id: "t1", label: "< 4 Hours", desc: "Life / safety · immediate" }],
  activity_log: [{ seq: 1, ts: "2026-08-19T10:05:00.000Z", type: "move", service: "X", from: "< 4 Hours", to: "4 – 24 Hours" }],
  final_state: [
    {
      id: "svc0",
      cbs: "Inpatient Nursing Units",
      service: "Inpatient Nursing Units",
      group: "G1",
      group_label: "Clinical",
      functional_area: "Hospital",
      description: "Providing continuous bedside nursing care and monitoring for admitted patients.",
      tier: "4 – 24 Hours",
      tier_code: "t2",
      tier_label: "4 – 24 Hours",
      notes: "",
      origin: "client-inventory",
    },
  ],
};

const bo2Fixture = {
  tool: "BO2-CBS-DEPENDENCY-MAPPING",
  version: "1",
  session_id: "sid",
  session_start: "2026-08-19T10:00:00.000Z",
  exported_at: "2026-08-19T11:00:00.000Z",
  facilitator: "unnamed",
  groups: [{ id: "G1", label: "Clinical", color: "#3a8d3f" }],
  lenses: [{ code: "tech", label: "Technology" }],
  activity_log: [{ seq: 1, ts: "2026-08-19T10:05:00.000Z", type: "confirm", cbs: "Inpatient Nursing Units", lens: "tech", dependency: "MediCore EHR", detail: "" }],
  final_state: [
    {
      dep_id: "svc_inpatient_nursing_units::tech_medicore_ehr",
      cbs_id: "svc_inpatient_nursing_units",
      cbs: "Inpatient Nursing Units",
      group: "Clinical",
      tier: "4 – 24 Hours",
      functional_area: "Hospital",
      lens: "Technology",
      lens_code: "tech",
      dependency: "MediCore EHR",
      origin: "prepopulated",
      confirmed: "yes",
      rank: 1,
      facilitator_notes: "",
    },
  ],
};

const bo3Fixture = {
  tool: "BO3-RISK",
  groups: [{ id: "G1", label: "Clinical" }],
  lenses: [{ code: "tech", label: "Technology" }],
  dependency_risk: [
    {
      dependency: "MediCore EHR",
      lens_code: "tech",
      risk_band: "critical",
      is_spof: true,
      spof_auto: true,
      service_halting_in: 4,
      concentration: 6,
      cbs_confirmed: ["Inpatient Nursing Units", "Emergency Department & Trauma"],
      dep_ids: ["svc_inpatient_nursing_units::tech_medicore_ehr"],
      cascade: "Loss of MediCore EHR cascades across 6 critical services.",
    },
  ],
};

describe("export contracts parse the HTML-era shapes", () => {
  it("BO1", () => {
    expect(() => Bo1Export.parse(bo1Fixture)).not.toThrow();
  });
  it("BO2", () => {
    expect(() => Bo2Export.parse(bo2Fixture)).not.toThrow();
  });
  it("BO3", () => {
    expect(() => Bo3Export.parse(bo3Fixture)).not.toThrow();
  });

  it("unknown fields survive parse (widen-only round-trips)", () => {
    const parsed = Bo2Export.parse({ ...bo2Fixture, some_future_field: 42 });
    expect((parsed as Record<string, unknown>)["some_future_field"]).toBe(42);
    const cell = { ...bo2Fixture.final_state[0], future_cell_field: "x" };
    const parsed2 = Bo2Export.parse({ ...bo2Fixture, final_state: [cell] });
    expect((parsed2.final_state[0] as Record<string, unknown>)["future_cell_field"]).toBe("x");
  });

  it("dispatch validates tool identity and fails loud on junk", () => {
    expect(dispatchLegacyImport(bo1Fixture).kind).toBe("bo1");
    expect(dispatchLegacyImport(bo2Fixture).kind).toBe("bo2");
    expect(dispatchLegacyImport(bo3Fixture).kind).toBe("bo3");
    expect(() => dispatchLegacyImport({ tool: "SOMETHING-ELSE" })).toThrow(/Unrecognized tool identity/);
    expect(() => dispatchLegacyImport("not json object")).toThrow();
  });
});

describe("BO3 question banks", () => {
  it("all five lenses have banks; keys are within the ANS_KEYS superset", () => {
    const superset = new Set(ANS_KEYS);
    for (const lens of ["people", "process", "tech", "facilities", "thirdparty"] as const) {
      expect(LENS_Q[lens].length).toBeGreaterThan(0);
      for (const q of LENS_Q[lens]) expect(superset.has(q.key), `${lens}.${q.key} missing from ANS_KEYS`).toBe(true);
    }
  });

  it("answers validate per lens; blanks stay blank", () => {
    const techSchema = answersSchema("tech");
    expect(() => techSchema.parse({ service_halting: true, impact: "stops order entry" })).not.toThrow();
    expect(() => techSchema.parse({})).not.toThrow(); // nothing invented to fill a gap
  });

  it("flag logic: tech flags on YES answers, people/facilities flag on NO", () => {
    expect(isFlagged("tech", { service_halting: true })).toBe(true);
    expect(isFlagged("tech", { service_halting: false })).toBe(false);
    expect(isFlagged("people", { workforce_resilience: false })).toBe(true);
    expect(isFlagged("people", { workforce_resilience: true })).toBe(false);
    expect(isFlagged("facilities", { alternate_location: false })).toBe(true);
  });
});
