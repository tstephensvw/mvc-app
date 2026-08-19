/**
 * HealthCo (fictional) workaround-readiness demo data — the 13 deep-dive services.
 * Transcribed from CBS_Solar_Map_Interactive_DEMO.html ALL_CBS (verified generic demo build),
 * normalized to suite codes: lens labels → LensCode, pillar → GroupCode, RTO label → TierCode.
 *
 * This is the seed source for demo BO4 assessments and the Solar Map default views.
 * NOTE: the source Solar demo file carried its own RTO strings and disagreed with
 * BO1/BO2 on the walkthrough service (Solar said '< 4 Hours'; BO1/BO2 say '4 - 24 Hours').
 * Tier truth lives ONLY in services.ts - the redundant tier field is dropped here
 * (single-source rule; Solar renders the tier from live service state).
 * The walkthrough service ("Inpatient Nursing Units") is present, fixing brief §8.1.
 *
 * Status → BO4 assessment mapping used by the seed runner (documented demo synthesis;
 * not client data — flag-don't-fabricate applies to client engagements, not demo fixtures):
 *   crit   → exists=false                                            (Critical gap)
 *   atrisk → exists=true, documented=false, tested=false, sustain=t2 (At risk)
 *   res    → exists=true, documented=true,  tested=true,  sustain=t4 (Resilient)
 *   na     → all fields null                                         (Not assessed)
 */
import type { GroupCode, LensCode } from "./constants.js";

export type SolarStatus = "crit" | "atrisk" | "res" | "na";

export interface SolarDep {
  lens: LensCode;
  name: string;
  status: SolarStatus;
}

export interface SolarService {
  group: GroupCode;
  deps: SolarDep[];
}

export const SOLAR_DEMO: Record<string, SolarService> = {
  "Inpatient Nursing Units": {
    group: "G1",
    deps: [
      { lens: "people", name: "Charge Nurse Coverage (per unit, per shift)", status: "atrisk" },
      { lens: "people", name: "Float Pool & Agency Nurse Staffing", status: "na" },
      { lens: "process", name: "Shift Handoff & Bedside Report", status: "res" },
      { lens: "process", name: "Downtime Documentation Procedure (paper fallback)", status: "na" },
      { lens: "tech", name: "MediCore EHR", status: "crit" },
      { lens: "tech", name: "VitalWatch Patient Monitoring", status: "crit" },
      { lens: "tech", name: "PharmaTrack Dispensing Cabinets", status: "atrisk" },
      { lens: "tech", name: "IntegraLink Interface Engine", status: "na" },
      { lens: "facilities", name: "Med-Surg Unit Physical Access & Badge Control", status: "res" },
      { lens: "facilities", name: "Emergency Power to Patient Care Areas", status: "res" },
      { lens: "thirdparty", name: "MediCore Systems Inc. (EHR vendor)", status: "atrisk" },
      { lens: "thirdparty", name: "Reliant Staffing Group", status: "atrisk" },
    ],
  },
  "Emergency Department & Trauma": {
    group: "G1",
    deps: [
      { lens: "people", name: "Emergency Physician & Trauma Team Coverage", status: "atrisk" },
      { lens: "people", name: "Triage RN Staffing", status: "atrisk" },
      { lens: "process", name: "Diversion & Surge Escalation Protocol", status: "res" },
      { lens: "process", name: "Mass Casualty Activation", status: "atrisk" },
      { lens: "tech", name: "MediCore EHR", status: "crit" },
      { lens: "tech", name: "VitalWatch Patient Monitoring", status: "crit" },
      { lens: "tech", name: "RadView PACS", status: "atrisk" },
      { lens: "tech", name: "LabLine LIS", status: "atrisk" },
      { lens: "tech", name: "IntegraLink Interface Engine", status: "crit" },
      { lens: "facilities", name: "Ambulance Bay & Decontamination Suite", status: "res" },
      { lens: "facilities", name: "Emergency Power to Patient Care Areas", status: "res" },
      { lens: "thirdparty", name: "MediCore Systems Inc. (EHR vendor)", status: "atrisk" },
      { lens: "thirdparty", name: "Vantage Medical Devices", status: "atrisk" },
      { lens: "thirdparty", name: "LinguaCall Interpretation Services", status: "na" },
    ],
  },
  "Clinical Laboratory": {
    group: "G1",
    deps: [
      { lens: "people", name: "Medical Technologist Coverage (night shift)", status: "atrisk" },
      { lens: "process", name: "Specimen Chain of Custody", status: "res" },
      { lens: "process", name: "Manual Result Callback Procedure", status: "na" },
      { lens: "tech", name: "LabLine LIS", status: "crit" },
      { lens: "tech", name: "MediCore EHR", status: "atrisk" },
      { lens: "tech", name: "IntegraLink Interface Engine", status: "crit" },
      { lens: "tech", name: "InsightBI Analytics", status: "res" },
      { lens: "facilities", name: "Core Lab HVAC & Specimen Refrigeration", status: "atrisk" },
      { lens: "thirdparty", name: "Crestline Reference Laboratories", status: "atrisk" },
      { lens: "thirdparty", name: "MedSupply Logistics", status: "res" },
    ],
  },
  "Enterprise Command Center": {
    group: "G2",
    deps: [
      { lens: "people", name: "Incident Commander On Call", status: "atrisk" },
      { lens: "people", name: "Security Operations Lead", status: "atrisk" },
      { lens: "people", name: "Executive Communications Liaison", status: "res" },
      { lens: "process", name: "Incident Runbooks & Escalation Tree", status: "res" },
      { lens: "process", name: "Out-of-Band Communication Fallback", status: "na" },
      { lens: "tech", name: "ReachAll Mass Notification", status: "crit" },
      { lens: "tech", name: "DeskFlow ITSM", status: "atrisk" },
      { lens: "tech", name: "NetPulse Network Monitoring", status: "atrisk" },
      { lens: "facilities", name: "Primary Command Suite", status: "atrisk" },
      { lens: "facilities", name: "Alternate Command Site", status: "na" },
      { lens: "thirdparty", name: "MetroNet Communications", status: "atrisk" },
      { lens: "thirdparty", name: "Sentinel Managed Security", status: "crit" },
    ],
  },
  "Network & Connectivity": {
    group: "G2",
    deps: [
      { lens: "people", name: "Network Operations On Call", status: "atrisk" },
      { lens: "people", name: "Network Architect (single deep expert)", status: "crit" },
      { lens: "process", name: "Change Freeze & Emergency Change Path", status: "res" },
      { lens: "tech", name: "NetPulse Network Monitoring", status: "atrisk" },
      { lens: "tech", name: "OneID SSO & MFA", status: "crit" },
      { lens: "tech", name: "DeskFlow ITSM", status: "res" },
      { lens: "facilities", name: "Campus Communication Closets", status: "atrisk" },
      { lens: "facilities", name: "Carrier Entry Facility", status: "crit" },
      { lens: "thirdparty", name: "MetroNet Communications", status: "crit" },
      { lens: "thirdparty", name: "SkyVault Cloud Inc.", status: "atrisk" },
    ],
  },
  "Identity & Access Management": {
    group: "G2",
    deps: [
      { lens: "people", name: "IAM Engineering Coverage", status: "atrisk" },
      { lens: "process", name: "Emergency Access / Break-Glass Procedure", status: "atrisk" },
      { lens: "process", name: "Access Recertification", status: "na" },
      { lens: "tech", name: "OneID SSO & MFA", status: "crit" },
      { lens: "tech", name: "DeskFlow ITSM", status: "res" },
      { lens: "tech", name: "ShieldSIEM Security Analytics", status: "atrisk" },
      { lens: "facilities", name: "Primary Data Hall", status: "atrisk" },
      { lens: "thirdparty", name: "Sentinel Managed Security", status: "atrisk" },
      { lens: "thirdparty", name: "SkyVault Cloud Inc.", status: "atrisk" },
    ],
  },
  "Data Center & Cloud Hosting": {
    group: "G2",
    deps: [
      { lens: "people", name: "Platform & Hosting Operations", status: "atrisk" },
      { lens: "people", name: "Storage Engineering", status: "atrisk" },
      { lens: "process", name: "Failover Runbook & Restore Test Cadence", status: "na" },
      { lens: "tech", name: "SkyVault Cloud Hosting", status: "crit" },
      { lens: "tech", name: "VaultSync Backup & Restore", status: "atrisk" },
      { lens: "tech", name: "NetPulse Network Monitoring", status: "res" },
      { lens: "tech", name: "OneID SSO & MFA", status: "crit" },
      { lens: "facilities", name: "Primary Data Hall", status: "atrisk" },
      { lens: "facilities", name: "Generator & Battery Backup Plant", status: "res" },
      { lens: "thirdparty", name: "SkyVault Cloud Inc.", status: "crit" },
      { lens: "thirdparty", name: "Commonwealth Power & Light", status: "atrisk" },
      { lens: "thirdparty", name: "MetroNet Communications", status: "atrisk" },
    ],
  },
  "Emergent Care Authorization": {
    group: "G3",
    deps: [
      { lens: "people", name: "Medical Director On Call", status: "atrisk" },
      { lens: "people", name: "Authorization Nurse Reviewers", status: "atrisk" },
      { lens: "process", name: "Auto-Approval Fallback Under Outage", status: "na" },
      { lens: "tech", name: "ClaimBridge Core Admin", status: "crit" },
      { lens: "tech", name: "AuthPoint UM Platform", status: "crit" },
      { lens: "tech", name: "ContactOne Call Center Platform", status: "atrisk" },
      { lens: "tech", name: "IntegraLink Interface Engine", status: "atrisk" },
      { lens: "facilities", name: "N/A — infrastructure dependent", status: "na" },
      { lens: "thirdparty", name: "ClearPath Clearinghouse", status: "atrisk" },
      { lens: "thirdparty", name: "PayerLink EDI Services", status: "res" },
    ],
  },
  "Urgent Pharmacy Prior Authorization": {
    group: "G3",
    deps: [
      { lens: "people", name: "Clinical Pharmacist Reviewers", status: "atrisk" },
      { lens: "process", name: "Emergency Supply Override", status: "res" },
      { lens: "tech", name: "ClaimBridge Core Admin", status: "crit" },
      { lens: "tech", name: "AuthPoint UM Platform", status: "crit" },
      { lens: "tech", name: "ContactOne Call Center Platform", status: "atrisk" },
      { lens: "facilities", name: "N/A — infrastructure dependent", status: "na" },
      { lens: "thirdparty", name: "NationalRx PBM", status: "crit" },
      { lens: "thirdparty", name: "ClearPath Clearinghouse", status: "atrisk" },
    ],
  },
  "Member Services (urgent inquiries)": {
    group: "G3",
    deps: [
      { lens: "people", name: "Member Services Representatives", status: "res" },
      { lens: "people", name: "Bilingual Coverage", status: "atrisk" },
      { lens: "process", name: "Overflow & After-Hours Routing", status: "atrisk" },
      { lens: "tech", name: "ContactOne Call Center Platform", status: "crit" },
      { lens: "tech", name: "ClaimBridge Core Admin", status: "atrisk" },
      { lens: "tech", name: "CareLink Patient Portal", status: "res" },
      { lens: "facilities", name: "Contact Center Site", status: "atrisk" },
      { lens: "facilities", name: "Remote Agent Connectivity", status: "na" },
      { lens: "thirdparty", name: "LinguaCall Interpretation Services", status: "atrisk" },
      { lens: "thirdparty", name: "PayerLink EDI Services", status: "res" },
    ],
  },
  "Clinical Supply Distribution": {
    group: "G4",
    deps: [
      { lens: "people", name: "Distribution Center Staffing", status: "atrisk" },
      { lens: "people", name: "Courier & Transport Drivers", status: "atrisk" },
      { lens: "process", name: "Par Level Management & Emergency Pull", status: "res" },
      { lens: "process", name: "Substitution Approval Under Shortage", status: "na" },
      { lens: "tech", name: "StockRoom Inventory Management", status: "crit" },
      { lens: "tech", name: "CoreERP Finance & HR", status: "atrisk" },
      { lens: "tech", name: "MediCore EHR", status: "res" },
      { lens: "facilities", name: "Central Distribution Warehouse", status: "crit" },
      { lens: "facilities", name: "Loading Docks & Cold Chain Storage", status: "atrisk" },
      { lens: "thirdparty", name: "MedSupply Logistics", status: "crit" },
      { lens: "thirdparty", name: "RxDirect Pharmaceutical Distribution", status: "atrisk" },
    ],
  },
  "Payroll & Benefits Administration": {
    group: "G4",
    deps: [
      { lens: "people", name: "Payroll Operations (cross-trained)", status: "res" },
      { lens: "process", name: "Time & Attendance Capture", status: "atrisk" },
      { lens: "process", name: "Off-Cycle / Manual Pay Run", status: "na" },
      { lens: "tech", name: "CoreERP Finance & HR", status: "crit" },
      { lens: "tech", name: "OneID SSO & MFA", status: "atrisk" },
      { lens: "facilities", name: "N/A — no facility dependency", status: "na" },
      { lens: "thirdparty", name: "Reliant Staffing Group", status: "atrisk" },
    ],
  },
  "Crisis Communications & Media Relations": {
    group: "G4",
    deps: [
      { lens: "people", name: "Communications Duty Officer", status: "atrisk" },
      { lens: "people", name: "Executive Spokesperson", status: "res" },
      { lens: "process", name: "Holding Statement Library", status: "res" },
      { lens: "process", name: "Approval Chain Under Time Pressure", status: "na" },
      { lens: "tech", name: "ReachAll Mass Notification", status: "crit" },
      { lens: "tech", name: "CareLink Patient Portal", status: "atrisk" },
      { lens: "facilities", name: "Media Briefing Space", status: "na" },
      { lens: "thirdparty", name: "MetroNet Communications", status: "atrisk" },
    ],
  },
};
