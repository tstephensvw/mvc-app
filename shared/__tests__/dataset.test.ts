import { describe, it, expect } from "vitest";
import {
  SERVICES,
  PREPOP,
  SOLAR_DEMO,
  GROUPS,
  TIERS,
  GENERIC_GROUPS,
  GENERIC_TIERS,
  LENSES,
  WALKTHROUGH_SERVICE,
  PREFILLED_LENSES,
} from "../dataset/index.js";

describe("HealthCo dataset integrity (single-source rule)", () => {
  it("has exactly 52 services with unique names", () => {
    expect(SERVICES.length).toBe(52);
    expect(new Set(SERVICES.map((s) => s.name)).size).toBe(52);
  });

  it("locked taxonomy shapes: 4 groups, 5 tiers, 5 lenses", () => {
    expect(GROUPS.map((g) => g.code)).toEqual(["G1", "G2", "G3", "G4"]);
    expect(TIERS.map((t) => t.code)).toEqual(["t1", "t2", "t3", "t4", "t5"]);
    expect(LENSES.map((l) => l.code)).toEqual(["people", "process", "tech", "facilities", "thirdparty"]);
    expect(PREFILLED_LENSES).toEqual(["tech", "thirdparty"]);
  });

  it("sector-agnostic: generic engagement defaults share the locked codes/colors, with no sector-specific labels", () => {
    expect(GENERIC_GROUPS.map((g) => g.code)).toEqual(GROUPS.map((g) => g.code));
    GENERIC_GROUPS.forEach((g, i) => {
      expect(g.color).toBe(GROUPS[i]!.color); // cross-tool color consistency holds from session one
      expect(g.colorDark).toBe(GROUPS[i]!.colorDark);
    });
    expect(GENERIC_TIERS.map((t) => t.code)).toEqual(TIERS.map((t) => t.code)); // tier semantics locked
    const sectorTerms = /clinical|health|patient|hospital|payer|member|pharma|medical/i;
    for (const g of GENERIC_GROUPS) expect(sectorTerms.test(g.label + " " + g.desc), `sector term in group: ${g.label}`).toBe(false);
    for (const t of GENERIC_TIERS) expect(sectorTerms.test(t.label + " " + t.desc), `sector term in tier: ${t.label}`).toBe(false);
  });

  it("PREPOP keys are exactly the 52 service names (BO1/BO2 cannot drift)", () => {
    const svcNames = new Set(SERVICES.map((s) => s.name));
    const prepopNames = Object.keys(PREPOP);
    expect(prepopNames.length).toBe(52);
    for (const n of prepopNames) expect(svcNames.has(n), `PREPOP key not in SERVICES: ${n}`).toBe(true);
  });

  it("PREPOP ranks are contiguous starting at 1 within each lens", () => {
    for (const [name, entry] of Object.entries(PREPOP)) {
      for (const lens of ["tech", "thirdparty"] as const) {
        const ranks = entry[lens].map((d) => d.rank).sort((a, b) => a - b);
        ranks.forEach((r, i) => expect(r, `${name}/${lens} rank sequence`).toBe(i + 1));
      }
    }
  });

  it("every SOLAR_DEMO service exists in SERVICES with a matching group", () => {
    const byName = new Map(SERVICES.map((s) => [s.name, s]));
    for (const [name, svc] of Object.entries(SOLAR_DEMO)) {
      const s = byName.get(name);
      expect(s, `SOLAR_DEMO service not in SERVICES: ${name}`).toBeDefined();
      expect(s!.group, `group mismatch for ${name}`).toBe(svc.group);
    }
  });

  it("walkthrough service flows end to end: BO1 inventory → BO2 prepop → BO4/Solar demo (fixes brief §8.1)", () => {
    expect(SERVICES.some((s) => s.name === WALKTHROUGH_SERVICE)).toBe(true);
    expect(PREPOP[WALKTHROUGH_SERVICE]).toBeDefined();
    expect(PREPOP[WALKTHROUGH_SERVICE]!.tech.length).toBeGreaterThan(0);
    expect(SOLAR_DEMO[WALKTHROUGH_SERVICE]).toBeDefined();
    // BO2's prepopulated tech/thirdparty deps for the walkthrough service appear in its Solar view
    const solarNames = new Set(SOLAR_DEMO[WALKTHROUGH_SERVICE]!.deps.map((d) => d.name));
    expect(solarNames.has("MediCore EHR")).toBe(true);
    expect(solarNames.has("Reliant Staffing Group")).toBe(true);
  });

  it("solar demo statuses are valid and every service has all five lens groups represented or a documented N/A", () => {
    for (const [name, svc] of Object.entries(SOLAR_DEMO)) {
      expect(svc.deps.length, name).toBeGreaterThan(0);
      for (const d of svc.deps) expect(["crit", "atrisk", "res", "na"]).toContain(d.status);
    }
  });
});
