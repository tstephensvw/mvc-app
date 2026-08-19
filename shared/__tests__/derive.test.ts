import { describe, it, expect } from "vitest";
import {
  slug,
  serviceSlug,
  mintDepId,
  statusOf,
  effectiveAssessment,
  toSolarStatus,
  concentration,
  concentrationPotential,
  autoSpof,
  effectiveSpof,
  isPrimarySystem,
  type WorkaroundAnswers,
  type ClusterInstanceView,
} from "../derive/index.js";

const wa = (p: Partial<WorkaroundAnswers>): WorkaroundAnswers => ({
  exists: null,
  documented: null,
  tested: null,
  sustain: null,
  ...p,
});

describe("slug / dep_id minting (BO2 contract)", () => {
  it("matches BO2's slug rules", () => {
    expect(slug("MediCore EHR")).toBe("medicore_ehr");
    expect(slug("Operating Room (emergent cases)")).toBe("operating_room_emergent_cases");
    expect(slug("  ")).toBe("x");
    expect(serviceSlug("Emergency Department & Trauma")).toBe("svc_emergency_department_trauma");
  });

  it("mints the documented example dep_id", () => {
    expect(mintDepId("Emergency Department & Trauma", "tech", "MediCore EHR", new Set())).toBe(
      "svc_emergency_department_trauma::tech_medicore_ehr",
    );
  });

  it("suffixes on collision, exactly like BO2", () => {
    const existing = new Set(["svc_a::tech_x"]);
    expect(mintDepId("A", "tech", "X", existing)).toBe("svc_a::tech_x_2");
    existing.add("svc_a::tech_x_2");
    expect(mintDepId("A", "tech", "X", existing)).toBe("svc_a::tech_x_3");
  });
});

describe("statusOf — BO4 traffic light (exact port)", () => {
  it("no answer → Not assessed", () => {
    expect(statusOf(wa({})).key).toBe("slate");
  });
  it("exists=false → Critical gap regardless of other fields", () => {
    expect(statusOf(wa({ exists: false, documented: true, tested: true, sustain: "t5" })).key).toBe("red");
  });
  it("exists but undocumented → At risk with reason", () => {
    const s = statusOf(wa({ exists: true, documented: false, tested: true, sustain: "t4" }));
    expect(s.key).toBe("amber");
    expect(s.why).toContain("not documented");
  });
  it("sustains < 24 hrs (t1/t2) → At risk even when documented+tested", () => {
    expect(statusOf(wa({ exists: true, documented: true, tested: true, sustain: "t2" })).key).toBe("amber");
    expect(statusOf(wa({ exists: true, documented: true, tested: true, sustain: "t1" })).key).toBe("amber");
  });
  it("sustain unset → At risk", () => {
    expect(statusOf(wa({ exists: true, documented: true, tested: true, sustain: null })).key).toBe("amber");
  });
  it("exists + documented + tested + sustains > 24 hrs → Resilient", () => {
    for (const t of ["t3", "t4", "t5"] as const) {
      expect(statusOf(wa({ exists: true, documented: true, tested: true, sustain: t })).key).toBe("green");
    }
  });
  it("maps to solar codes", () => {
    expect(toSolarStatus("red")).toBe("crit");
    expect(toSolarStatus("amber")).toBe("atrisk");
    expect(toSolarStatus("green")).toBe("res");
    expect(toSolarStatus("slate")).toBe("na");
  });
});

describe("effectiveAssessment — cluster default + override (§15-A4)", () => {
  it("override wins over cluster default", () => {
    const cluster = wa({ exists: true, documented: true, tested: true, sustain: "t4" });
    const override = wa({ exists: false });
    expect(statusOf(effectiveAssessment(cluster, override)).key).toBe("red");
  });
  it("falls back to cluster default, then to empty", () => {
    const cluster = wa({ exists: true, documented: true, tested: true, sustain: "t4" });
    expect(statusOf(effectiveAssessment(cluster, null)).key).toBe("green");
    expect(statusOf(effectiveAssessment(null, null)).key).toBe("slate");
  });
});

describe("concentration / SPoF / primary-system (BO3 rules)", () => {
  const inst = (name: string, confirmed: ClusterInstanceView["confirmed"], rank: number | null = null): ClusterInstanceView => ({
    serviceName: name,
    confirmed,
    rank,
  });

  it("concentration counts confirmed only; potential includes unreviewed", () => {
    const xs = [inst("A", "yes"), inst("B", "unreviewed"), inst("C", "no"), inst("D", "yes")];
    expect(concentration(xs)).toBe(2);
    expect(concentrationPotential(xs)).toBe(3);
  });

  it("auto-SPoF at the engagement threshold (default 3)", () => {
    const two = [inst("A", "yes"), inst("B", "yes")];
    const three = [...two, inst("C", "yes")];
    expect(autoSpof(two, 3)).toBe(false);
    expect(autoSpof(three, 3)).toBe(true);
    expect(autoSpof(two, 2)).toBe(true); // configurable per engagement
  });

  it("manual override beats auto in both directions; null follows auto", () => {
    expect(effectiveSpof(null, true)).toBe(true);
    expect(effectiveSpof(false, true)).toBe(false);
    expect(effectiveSpof(true, false)).toBe(true);
  });

  it("primary-system heuristic: ≥3 confirmed, ≥2 rank-1, rank-1s ≥ half of confirmed", () => {
    const yes = [inst("A", "yes", 1), inst("B", "yes", 1), inst("C", "yes", 2)];
    expect(isPrimarySystem(yes)).toBe(true);
    const notEnoughRank1 = [inst("A", "yes", 1), inst("B", "yes", 2), inst("C", "yes", 2)];
    expect(isPrimarySystem(notEnoughRank1)).toBe(false);
    const diluted = [inst("A", "yes", 1), inst("B", "yes", 1), inst("C", "yes", 2), inst("D", "yes", 3), inst("E", "yes", 4)];
    expect(isPrimarySystem(diluted)).toBe(false); // 2 rank-1 of 5 confirmed < half
  });
});
