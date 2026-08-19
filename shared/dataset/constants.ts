/**
 * Suite taxonomy and HealthCo demo defaults.
 *
 * SECTOR-AGNOSTIC RULE: the product serves any sector. Only two things are
 * locked suite-wide: the FIVE LENSES and the ordered TIER CODES (t1..t5 —
 * the semantics, not the labels). Everything else here — group labels,
 * tier labels/bylines, service content — is PER-ENGAGEMENT DATA. The GROUPS
 * and TIERS below are the HealthCo (healthcare) demo engagement's seed
 * values; GENERIC_GROUPS / GENERIC_TIERS are the sector-neutral starter set
 * for new engagements. Never treat the HealthCo labels as product constants.
 */

export type GroupCode = "G1" | "G2" | "G3" | "G4";
export type TierCode = "t1" | "t2" | "t3" | "t4" | "t5";
export type LensCode = "people" | "process" | "tech" | "facilities" | "thirdparty";

export interface GroupDef {
  code: GroupCode;
  label: string;
  desc: string;
  color: string;
  colorDark: string;
}

export interface TierDef {
  code: TierCode;
  label: string;
  desc: string;
}

export interface LensDef {
  code: LensCode;
  label: string;
  hint: string;
}

/** HealthCo DEMO engagement's breakout groups (healthcare-flavored labels — demo data, not product constants). */
export const GROUPS: readonly GroupDef[] = [
  { code: "G1", label: "Clinical", desc: "Clinical, Ambulatory, Acute, Post", color: "#3a8d3f", colorDark: "#2c6b30" },
  { code: "G2", label: "IT / Cyber", desc: "Technology & cyber operations", color: "#c77d2e", colorDark: "#9c6224" },
  { code: "G3", label: "Health Plan", desc: "Member & payer operations", color: "#a8568f", colorDark: "#7a3f6d" },
  { code: "G4", label: "Back Office / Supply Chain", desc: "Corporate, finance, supply", color: "#a96fd6", colorDark: "#7e52a0" },
] as const;

/**
 * Sector-neutral starter groups for NEW engagements (same locked color set so
 * cross-tool color consistency holds from the first session). Facilitators
 * rename/add groups per the client's inventory during engagement setup.
 */
export const GENERIC_GROUPS: readonly GroupDef[] = [
  { code: "G1", label: "Core Operations", desc: "The services the organization exists to deliver", color: "#3a8d3f", colorDark: "#2c6b30" },
  { code: "G2", label: "IT / Cyber", desc: "Technology & cyber operations", color: "#c77d2e", colorDark: "#9c6224" },
  { code: "G3", label: "Customer & Market", desc: "Customer-facing and revenue operations", color: "#a8568f", colorDark: "#7a3f6d" },
  { code: "G4", label: "Corporate & Supply Chain", desc: "Finance, HR, facilities, supply", color: "#a96fd6", colorDark: "#7e52a0" },
] as const;

/** Palette for groups added in-session (cycles if exhausted) — from BO1. */
export const GROUP_PALETTE: readonly { color: string; colorDark: string }[] = [
  { color: "#4a90a4", colorDark: "#356d7d" },
  { color: "#b5783a", colorDark: "#8a5a2b" },
  { color: "#7d8c3a", colorDark: "#5f6b2c" },
  { color: "#9a5a5a", colorDark: "#744444" },
  { color: "#5a6fa0", colorDark: "#43547a" },
  { color: "#8a6fb0", colorDark: "#6a5488" },
] as const;

/** HealthCo DEMO engagement's tier labels/bylines (bylines are healthcare-flavored demo data). */
export const TIERS: readonly TierDef[] = [
  { code: "t1", label: "< 4 Hours", desc: "Life / safety · immediate" },
  { code: "t2", label: "4 – 24 Hours", desc: "Same-day clinical ops" },
  { code: "t3", label: "1 – 3 Days", desc: "Near-term operations" },
  { code: "t4", label: "3 – 7 Days", desc: "Elective / routine" },
  { code: "t5", label: "> 1 Week", desc: "Strategic / deferrable" },
] as const;

/** Sector-neutral tier defaults for NEW engagements. Codes/ordering locked; labels & bylines editable in-session. */
export const GENERIC_TIERS: readonly TierDef[] = [
  { code: "t1", label: "< 4 Hours", desc: "Immediate · safety-critical or existential" },
  { code: "t2", label: "4 – 24 Hours", desc: "Same business day" },
  { code: "t3", label: "1 – 3 Days", desc: "Near-term operations" },
  { code: "t4", label: "3 – 7 Days", desc: "Routine · deferrable days" },
  { code: "t5", label: "> 1 Week", desc: "Strategic / deferrable" },
] as const;

export const LENSES: readonly LensDef[] = [
  { code: "people", label: "People", hint: "Roles, teams, skills, and key individuals the service depends on." },
  { code: "process", label: "Process", hint: "Workflows, procedures, and operational steps the service depends on." },
  { code: "tech", label: "Technology", hint: "Applications, systems, infrastructure — plus identity/access and clinical devices, which fold into this lens." },
  { code: "facilities", label: "Facilities", hint: "Physical sites, power, utilities, and environmental systems the service depends on." },
  { code: "thirdparty", label: "Third Parties", hint: "External vendors, suppliers, and service providers the service depends on." },
] as const;

/** Lenses whose dependencies arrive prepopulated from client matrices (BO2). */
export const PREFILLED_LENSES: readonly LensCode[] = ["tech", "thirdparty"] as const;

/** Suite walkthrough service — must flow BO1→BO2→BO3→BO4→Solar in the demo seed (brief §8.1). */
export const WALKTHROUGH_SERVICE = "Inpatient Nursing Units";

/** Default SPoF auto-flag threshold (confirmed-service count); engagement setting (arch doc §15-A6). */
export const SPOF_MIN_DEFAULT = 3;

export const tierLabel = (code: TierCode): string => TIERS.find((t) => t.code === code)!.label;
export const groupLabel = (code: GroupCode): string => GROUPS.find((g) => g.code === code)!.label;
export const lensLabel = (code: LensCode): string => LENSES.find((l) => l.code === code)!.label;
