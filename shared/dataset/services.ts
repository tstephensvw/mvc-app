/**
 * HealthCo (fictional) service inventory — 52 services across 4 groups.
 * Transcribed verbatim from BO1prioritization_2.html SERVICES (verified generic demo build).
 * `tier` is the EY starting-hypothesis tier (seeded_tier in the DB); the room re-tiers in BO1.
 */
import type { GroupCode, TierCode } from "./constants.js";

export interface ServiceSeed {
  name: string;
  group: GroupCode;
  tier: TierCode;
  functionalArea: string;
  description: string;
}

export const SERVICES: readonly ServiceSeed[] = [
  { name: "Emergency Department & Trauma", group: "G1", tier: "t1", functionalArea: "Hospital", description: "Receiving, stabilizing, and treating emergent and trauma patients around the clock." },
  { name: "ICU / Critical Care", group: "G1", tier: "t1", functionalArea: "Hospital", description: "Sustaining continuous monitoring and life support for the most critically ill patients." },
  { name: "Labor & Delivery", group: "G1", tier: "t1", functionalArea: "Hospital", description: "Managing obstetric care, delivery, and immediate maternal-newborn stabilization." },
  { name: "Operating Room (emergent cases)", group: "G1", tier: "t1", functionalArea: "Hospital", description: "Enabling unscheduled, time-critical surgical intervention with full perioperative support." },
  { name: "Blood Bank & Transfusion", group: "G1", tier: "t1", functionalArea: "Hospital", description: "Maintaining safe blood product inventory, crossmatching, and transfusion support." },
  { name: "Respiratory Therapy", group: "G1", tier: "t1", functionalArea: "Hospital", description: "Delivering ventilator management, oxygen therapy, and airway support." },
  { name: "Acute Stroke Response", group: "G1", tier: "t1", functionalArea: "Hospital", description: "Providing rapid stroke assessment, intervention, and acute neurological care." },
  { name: "Inpatient Nursing Units", group: "G1", tier: "t2", functionalArea: "Hospital", description: "Providing continuous bedside nursing care and monitoring for admitted patients." },
  { name: "Clinical Laboratory", group: "G1", tier: "t2", functionalArea: "Hospital", description: "Performing and resulting diagnostic testing that informs clinical decisions." },
  { name: "Inpatient Pharmacy", group: "G1", tier: "t2", functionalArea: "Hospital", description: "Dispensing, compounding, and managing medications for admitted patients." },
  { name: "Diagnostic Imaging", group: "G1", tier: "t2", functionalArea: "Hospital", description: "Performing and interpreting imaging studies for inpatient and emergent care." },
  { name: "Case Management & Discharge Planning", group: "G1", tier: "t2", functionalArea: "Hospital", description: "Coordinating care transitions and safe discharge across the continuum." },
  { name: "Ambulatory Surgery Centers", group: "G1", tier: "t3", functionalArea: "Ambulatory", description: "Delivering same-day procedural and surgical care in outpatient settings." },
  { name: "Virtual Care / Telehealth", group: "G1", tier: "t3", functionalArea: "Ambulatory", description: "Enabling remote clinical consultation and monitoring by video and phone." },
  { name: "Infection Prevention & Control", group: "G1", tier: "t3", functionalArea: "Hospital", description: "Detecting and containing healthcare-associated infection risk enterprise-wide." },
  { name: "Home Health Services", group: "G1", tier: "t3", functionalArea: "Post-Acute", description: "Delivering skilled clinical care to patients in the home setting." },
  { name: "Elective Surgery", group: "G1", tier: "t4", functionalArea: "Hospital", description: "Managing planned, non-urgent surgical procedures and perioperative care." },
  { name: "Behavioral Health (routine)", group: "G1", tier: "t4", functionalArea: "Ambulatory", description: "Delivering scheduled mental health and behavioral care services." },
  { name: "Clinical Research Programs", group: "G1", tier: "t5", functionalArea: "Hospital", description: "Conducting clinical research operations, enrollment, and compliance." },
  { name: "Enterprise Command Center", group: "G2", tier: "t1", functionalArea: "Corporate", description: "Monitoring and directing enterprise response during disruptions and incidents." },
  { name: "EHR Platform Operations", group: "G2", tier: "t1", functionalArea: "Corporate", description: "Sustaining availability of the electronic health record and its interfaces." },
  { name: "Network & Connectivity", group: "G2", tier: "t1", functionalArea: "Corporate", description: "Operating the wired, wireless, and wide-area networks every digital service rides on." },
  { name: "Identity & Access Management", group: "G2", tier: "t1", functionalArea: "Corporate", description: "Running single sign-on, MFA, and directory services; without authentication, uptime is irrelevant." },
  { name: "Data Center & Cloud Hosting", group: "G2", tier: "t1", functionalArea: "Corporate", description: "Providing the compute, storage, and hosting that underpin every clinical and business system." },
  { name: "Clinical Communications & Paging", group: "G2", tier: "t2", functionalArea: "Corporate", description: "Operating secure messaging, paging, and nurse-call so clinicians can coordinate in real time." },
  { name: "Cybersecurity Operations", group: "G2", tier: "t2", functionalArea: "Corporate", description: "Monitoring, detecting, and responding to security threats across the enterprise." },
  { name: "IT Service Desk & End-User Computing", group: "G2", tier: "t2", functionalArea: "Corporate", description: "Supporting workstations, mobile devices, and break-fix before the next shift change." },
  { name: "Data Backup & Recovery", group: "G2", tier: "t2", functionalArea: "Corporate", description: "Executing backups and restores that protect against data loss." },
  { name: "Enterprise Applications (ERP / HCM)", group: "G2", tier: "t3", functionalArea: "Corporate", description: "Supporting the finance, HR, and supply chain platform behind corporate operations." },
  { name: "IT Asset & Configuration Management", group: "G2", tier: "t4", functionalArea: "Corporate", description: "Maintaining the CMDB, licensing, and hardware inventory that recovery planning relies on." },
  { name: "IT Architecture & Strategy", group: "G2", tier: "t5", functionalArea: "Corporate", description: "Managing technology roadmaps, standards, and architecture reviews." },
  { name: "Emergent Care Authorization", group: "G3", tier: "t1", functionalArea: "Health Plan", description: "Providing immediate coverage determinations that enable emergent treatment." },
  { name: "Urgent Pharmacy Prior Authorization", group: "G3", tier: "t1", functionalArea: "Health Plan", description: "Adjudicating time-sensitive medication coverage approvals for urgent therapies." },
  { name: "Member Services (urgent inquiries)", group: "G3", tier: "t2", functionalArea: "Health Plan", description: "Responding to time-sensitive member questions on coverage and access." },
  { name: "Utilization Management", group: "G3", tier: "t2", functionalArea: "Health Plan", description: "Reviewing medical necessity and managing appropriate use of services." },
  { name: "Claims Intake & Initial Processing", group: "G3", tier: "t3", functionalArea: "Health Plan", description: "Receiving, validating, and initiating adjudication of submitted claims." },
  { name: "Care Coordination (high-risk members)", group: "G3", tier: "t3", functionalArea: "Health Plan", description: "Coordinating care for members with complex, high-risk needs." },
  { name: "Full Claims Adjudication", group: "G3", tier: "t4", functionalArea: "Health Plan", description: "Processing claims through complete determination, pricing, and payment." },
  { name: "Appeals & Grievances", group: "G3", tier: "t4", functionalArea: "Health Plan", description: "Adjudicating member and provider appeals within regulatory timelines." },
  { name: "Actuarial & Product Pricing", group: "G3", tier: "t5", functionalArea: "Health Plan", description: "Modeling risk and setting rates that keep plan products financially sound." },
  { name: "Crisis Communications & Media Relations", group: "G4", tier: "t1", functionalArea: "Corporate", description: "Managing public information and media engagement during events." },
  { name: "Facilities & Utilities Management", group: "G4", tier: "t2", functionalArea: "Corporate", description: "Keeping power, utilities, and environmental systems running across sites." },
  { name: "Patient Access (registration & scheduling)", group: "G4", tier: "t2", functionalArea: "Corporate", description: "Managing registration, scheduling, and access to care across entry points." },
  { name: "Clinical Supply Distribution", group: "G4", tier: "t2", functionalArea: "Corporate", description: "Receiving, storing, and distributing clinical supplies to points of care." },
  { name: "Payroll & Benefits Administration", group: "G4", tier: "t3", functionalArea: "Corporate", description: "Administering compensation, benefits, and payroll continuity." },
  { name: "Supply Chain Ordering & Replenishment", group: "G4", tier: "t3", functionalArea: "Corporate", description: "Ordering and replenishing enterprise inventory to prevent shortages." },
  { name: "Finance Operations (AP / AR)", group: "G4", tier: "t3", functionalArea: "Corporate", description: "Processing payables and receivables to sustain financial operations." },
  { name: "Regulatory & Compliance Reporting", group: "G4", tier: "t4", functionalArea: "Corporate", description: "Preparing and submitting required regulatory and compliance reporting." },
  { name: "Credentialing & Privileging", group: "G4", tier: "t4", functionalArea: "Corporate", description: "Verifying provider qualifications and managing clinical privileges." },
  { name: "Financial Close & Reporting", group: "G4", tier: "t4", functionalArea: "Corporate", description: "Executing periodic accounting close, consolidation, and reporting." },
  { name: "Marketing & Communications", group: "G4", tier: "t5", functionalArea: "Corporate", description: "Managing brand, campaigns, and consumer communications." },
  { name: "Strategy & Transformation Office", group: "G4", tier: "t5", functionalArea: "Corporate", description: "Developing enterprise strategy and governing the transformation portfolio." },
] as const;
