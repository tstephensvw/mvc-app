/**
 * HealthCo (fictional) prepopulated dependency matrices — the BO2 "EY hypothesis".
 * Transcribed verbatim from BO2dependencymapping_2.html PREPOP (verified generic demo build).
 * Rank 1 = primary / most-central. Only tech and thirdparty are prepopulated;
 * people / process / facilities start empty and are captured live in the room.
 * Keys MUST match service names in services.ts exactly (integrity-tested).
 */

export interface PrepopDep {
  name: string;
  rank: number;
}

export interface PrepopEntry {
  tech: PrepopDep[];
  thirdparty: PrepopDep[];
}

export const PREPOP: Record<string, PrepopEntry> = {
  "Emergency Department & Trauma": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "VitalWatch Patient Monitoring", rank: 2 },
      { name: "IntegraLink Interface Engine", rank: 3 },
      { name: "DictaNote Speech Recognition", rank: 4 },
      { name: "LabLine LIS", rank: 5 },
      { name: "RadView PACS", rank: 6 },
    ],
    thirdparty: [
      { name: "MediCore Systems Inc. (EHR vendor)", rank: 1 },
      { name: "Vantage Medical Devices", rank: 2 },
      { name: "Reliant Staffing Group", rank: 3 },
      { name: "LinguaCall Interpretation Services", rank: 4 },
    ],
  },
  "ICU / Critical Care": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "VitalWatch Patient Monitoring", rank: 2 },
      { name: "PharmaTrack Dispensing Cabinets", rank: 3 },
      { name: "IntegraLink Interface Engine", rank: 4 },
      { name: "DictaNote Speech Recognition", rank: 5 },
      { name: "LabLine LIS", rank: 6 },
    ],
    thirdparty: [
      { name: "MediCore Systems Inc. (EHR vendor)", rank: 1 },
      { name: "Vantage Medical Devices", rank: 2 },
      { name: "RxDirect Pharmaceutical Distribution", rank: 3 },
      { name: "Reliant Staffing Group", rank: 4 },
    ],
  },
  "Labor & Delivery": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "VitalWatch Patient Monitoring", rank: 2 },
      { name: "IntegraLink Interface Engine", rank: 3 },
      { name: "LabLine LIS", rank: 4 },
      { name: "DictaNote Speech Recognition", rank: 5 },
    ],
    thirdparty: [
      { name: "MediCore Systems Inc. (EHR vendor)", rank: 1 },
      { name: "Vantage Medical Devices", rank: 2 },
      { name: "Reliant Staffing Group", rank: 3 },
    ],
  },
  "Operating Room (emergent cases)": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "SterileTrack Instrument Management", rank: 2 },
      { name: "PharmaTrack Dispensing Cabinets", rank: 3 },
      { name: "VitalWatch Patient Monitoring", rank: 4 },
      { name: "DictaNote Speech Recognition", rank: 5 },
      { name: "IntegraLink Interface Engine", rank: 6 },
    ],
    thirdparty: [
      { name: "SteriPro Sterilization Services", rank: 1 },
      { name: "MediCore Systems Inc. (EHR vendor)", rank: 2 },
      { name: "Vantage Medical Devices", rank: 3 },
      { name: "MedSupply Logistics", rank: 4 },
    ],
  },
  "Blood Bank & Transfusion": {
    tech: [
      { name: "LabLine LIS", rank: 1 },
      { name: "MediCore EHR", rank: 2 },
      { name: "IntegraLink Interface Engine", rank: 3 },
    ],
    thirdparty: [
      { name: "Crestline Reference Laboratories", rank: 1 },
      { name: "MedSupply Logistics", rank: 2 },
    ],
  },
  "Respiratory Therapy": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "VitalWatch Patient Monitoring", rank: 2 },
      { name: "IntegraLink Interface Engine", rank: 3 },
      { name: "DictaNote Speech Recognition", rank: 4 },
    ],
    thirdparty: [
      { name: "Vantage Medical Devices", rank: 1 },
      { name: "MedSupply Logistics", rank: 2 },
    ],
  },
  "Acute Stroke Response": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "RadView PACS", rank: 2 },
      { name: "VitalWatch Patient Monitoring", rank: 3 },
      { name: "IntegraLink Interface Engine", rank: 4 },
      { name: "DictaNote Speech Recognition", rank: 5 },
    ],
    thirdparty: [
      { name: "MediCore Systems Inc. (EHR vendor)", rank: 1 },
      { name: "Vantage Medical Devices", rank: 2 },
    ],
  },
  "Inpatient Nursing Units": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "VitalWatch Patient Monitoring", rank: 2 },
      { name: "PharmaTrack Dispensing Cabinets", rank: 3 },
      { name: "IntegraLink Interface Engine", rank: 4 },
      { name: "DictaNote Speech Recognition", rank: 5 },
    ],
    thirdparty: [
      { name: "MediCore Systems Inc. (EHR vendor)", rank: 1 },
      { name: "Reliant Staffing Group", rank: 2 },
      { name: "Vantage Medical Devices", rank: 3 },
    ],
  },
  "Clinical Laboratory": {
    tech: [
      { name: "LabLine LIS", rank: 1 },
      { name: "MediCore EHR", rank: 2 },
      { name: "IntegraLink Interface Engine", rank: 3 },
      { name: "InsightBI Analytics", rank: 4 },
    ],
    thirdparty: [
      { name: "Crestline Reference Laboratories", rank: 1 },
      { name: "MedSupply Logistics", rank: 2 },
      { name: "Vantage Medical Devices", rank: 3 },
    ],
  },
  "Inpatient Pharmacy": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "PharmaTrack Dispensing Cabinets", rank: 2 },
      { name: "IntegraLink Interface Engine", rank: 3 },
      { name: "LabLine LIS", rank: 4 },
    ],
    thirdparty: [
      { name: "RxDirect Pharmaceutical Distribution", rank: 1 },
      { name: "NationalRx PBM", rank: 2 },
      { name: "MedSupply Logistics", rank: 3 },
    ],
  },
  "Diagnostic Imaging": {
    tech: [
      { name: "RadView PACS", rank: 1 },
      { name: "MediCore EHR", rank: 2 },
      { name: "IntegraLink Interface Engine", rank: 3 },
      { name: "DictaNote Speech Recognition", rank: 4 },
    ],
    thirdparty: [
      { name: "Vantage Medical Devices", rank: 1 },
      { name: "MediCore Systems Inc. (EHR vendor)", rank: 2 },
    ],
  },
  "Case Management & Discharge Planning": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "CareLink Patient Portal", rank: 2 },
      { name: "IntegraLink Interface Engine", rank: 3 },
    ],
    thirdparty: [
      { name: "MediCore Systems Inc. (EHR vendor)", rank: 1 },
      { name: "LinguaCall Interpretation Services", rank: 2 },
    ],
  },
  "Ambulatory Surgery Centers": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "SterileTrack Instrument Management", rank: 2 },
      { name: "PharmaTrack Dispensing Cabinets", rank: 3 },
      { name: "DictaNote Speech Recognition", rank: 4 },
    ],
    thirdparty: [
      { name: "SteriPro Sterilization Services", rank: 1 },
      { name: "MedSupply Logistics", rank: 2 },
      { name: "Vantage Medical Devices", rank: 3 },
    ],
  },
  "Virtual Care / Telehealth": {
    tech: [
      { name: "TeleVisit Platform", rank: 1 },
      { name: "MediCore EHR", rank: 2 },
      { name: "CareLink Patient Portal", rank: 3 },
      { name: "OneID SSO & MFA", rank: 4 },
    ],
    thirdparty: [
      { name: "MetroNet Communications", rank: 1 },
      { name: "MediCore Systems Inc. (EHR vendor)", rank: 2 },
    ],
  },
  "Infection Prevention & Control": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "LabLine LIS", rank: 2 },
      { name: "InsightBI Analytics", rank: 3 },
    ],
    thirdparty: [{ name: "Crestline Reference Laboratories", rank: 1 }],
  },
  "Home Health Services": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "CareLink Patient Portal", rank: 2 },
      { name: "TeleVisit Platform", rank: 3 },
    ],
    thirdparty: [
      { name: "MedSupply Logistics", rank: 1 },
      { name: "Reliant Staffing Group", rank: 2 },
    ],
  },
  "Elective Surgery": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "SterileTrack Instrument Management", rank: 2 },
      { name: "PharmaTrack Dispensing Cabinets", rank: 3 },
      { name: "DictaNote Speech Recognition", rank: 4 },
    ],
    thirdparty: [
      { name: "SteriPro Sterilization Services", rank: 1 },
      { name: "MedSupply Logistics", rank: 2 },
    ],
  },
  "Behavioral Health (routine)": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "CareLink Patient Portal", rank: 2 },
      { name: "TeleVisit Platform", rank: 3 },
      { name: "DictaNote Speech Recognition", rank: 4 },
    ],
    thirdparty: [{ name: "Reliant Staffing Group", rank: 1 }],
  },
  "Clinical Research Programs": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "InsightBI Analytics", rank: 2 },
    ],
    thirdparty: [{ name: "Crestline Reference Laboratories", rank: 1 }],
  },
  "Enterprise Command Center": {
    tech: [
      { name: "ReachAll Mass Notification", rank: 1 },
      { name: "DeskFlow ITSM", rank: 2 },
      { name: "NetPulse Network Monitoring", rank: 3 },
      { name: "MediCore EHR", rank: 4 },
    ],
    thirdparty: [
      { name: "MetroNet Communications", rank: 1 },
      { name: "Sentinel Managed Security", rank: 2 },
    ],
  },
  "EHR Platform Operations": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "IntegraLink Interface Engine", rank: 2 },
      { name: "OneID SSO & MFA", rank: 3 },
      { name: "SkyVault Cloud Hosting", rank: 4 },
      { name: "DeskFlow ITSM", rank: 5 },
    ],
    thirdparty: [
      { name: "MediCore Systems Inc. (EHR vendor)", rank: 1 },
      { name: "SkyVault Cloud Inc.", rank: 2 },
    ],
  },
  "Network & Connectivity": {
    tech: [
      { name: "NetPulse Network Monitoring", rank: 1 },
      { name: "OneID SSO & MFA", rank: 2 },
      { name: "DeskFlow ITSM", rank: 3 },
    ],
    thirdparty: [
      { name: "MetroNet Communications", rank: 1 },
      { name: "SkyVault Cloud Inc.", rank: 2 },
    ],
  },
  "Identity & Access Management": {
    tech: [
      { name: "OneID SSO & MFA", rank: 1 },
      { name: "DeskFlow ITSM", rank: 2 },
      { name: "ShieldSIEM Security Analytics", rank: 3 },
    ],
    thirdparty: [
      { name: "Sentinel Managed Security", rank: 1 },
      { name: "SkyVault Cloud Inc.", rank: 2 },
    ],
  },
  "Data Center & Cloud Hosting": {
    tech: [
      { name: "SkyVault Cloud Hosting", rank: 1 },
      { name: "VaultSync Backup & Restore", rank: 2 },
      { name: "NetPulse Network Monitoring", rank: 3 },
      { name: "OneID SSO & MFA", rank: 4 },
    ],
    thirdparty: [
      { name: "SkyVault Cloud Inc.", rank: 1 },
      { name: "Commonwealth Power & Light", rank: 2 },
      { name: "MetroNet Communications", rank: 3 },
    ],
  },
  "Clinical Communications & Paging": {
    tech: [
      { name: "ReachAll Mass Notification", rank: 1 },
      { name: "OneID SSO & MFA", rank: 2 },
      { name: "NetPulse Network Monitoring", rank: 3 },
    ],
    thirdparty: [
      { name: "MetroNet Communications", rank: 1 },
      { name: "Vantage Medical Devices", rank: 2 },
    ],
  },
  "Cybersecurity Operations": {
    tech: [
      { name: "ShieldSIEM Security Analytics", rank: 1 },
      { name: "OneID SSO & MFA", rank: 2 },
      { name: "DeskFlow ITSM", rank: 3 },
      { name: "NetPulse Network Monitoring", rank: 4 },
    ],
    thirdparty: [{ name: "Sentinel Managed Security", rank: 1 }],
  },
  "IT Service Desk & End-User Computing": {
    tech: [
      { name: "DeskFlow ITSM", rank: 1 },
      { name: "OneID SSO & MFA", rank: 2 },
    ],
    thirdparty: [{ name: "Reliant Staffing Group", rank: 1 }],
  },
  "Data Backup & Recovery": {
    tech: [
      { name: "VaultSync Backup & Restore", rank: 1 },
      { name: "SkyVault Cloud Hosting", rank: 2 },
      { name: "DeskFlow ITSM", rank: 3 },
    ],
    thirdparty: [{ name: "SkyVault Cloud Inc.", rank: 1 }],
  },
  "Enterprise Applications (ERP / HCM)": {
    tech: [
      { name: "CoreERP Finance & HR", rank: 1 },
      { name: "OneID SSO & MFA", rank: 2 },
      { name: "SkyVault Cloud Hosting", rank: 3 },
      { name: "IntegraLink Interface Engine", rank: 4 },
    ],
    thirdparty: [{ name: "SkyVault Cloud Inc.", rank: 1 }],
  },
  "IT Asset & Configuration Management": {
    tech: [
      { name: "DeskFlow ITSM", rank: 1 },
      { name: "CoreERP Finance & HR", rank: 2 },
    ],
    thirdparty: [],
  },
  "IT Architecture & Strategy": {
    tech: [
      { name: "InsightBI Analytics", rank: 1 },
      { name: "DeskFlow ITSM", rank: 2 },
    ],
    thirdparty: [],
  },
  "Emergent Care Authorization": {
    tech: [
      { name: "ClaimBridge Core Admin", rank: 1 },
      { name: "AuthPoint UM Platform", rank: 2 },
      { name: "ContactOne Call Center Platform", rank: 3 },
      { name: "IntegraLink Interface Engine", rank: 4 },
    ],
    thirdparty: [
      { name: "ClearPath Clearinghouse", rank: 1 },
      { name: "PayerLink EDI Services", rank: 2 },
    ],
  },
  "Urgent Pharmacy Prior Authorization": {
    tech: [
      { name: "ClaimBridge Core Admin", rank: 1 },
      { name: "AuthPoint UM Platform", rank: 2 },
      { name: "ContactOne Call Center Platform", rank: 3 },
    ],
    thirdparty: [
      { name: "NationalRx PBM", rank: 1 },
      { name: "ClearPath Clearinghouse", rank: 2 },
    ],
  },
  "Member Services (urgent inquiries)": {
    tech: [
      { name: "ContactOne Call Center Platform", rank: 1 },
      { name: "ClaimBridge Core Admin", rank: 2 },
      { name: "CareLink Patient Portal", rank: 3 },
    ],
    thirdparty: [
      { name: "LinguaCall Interpretation Services", rank: 1 },
      { name: "PayerLink EDI Services", rank: 2 },
    ],
  },
  "Utilization Management": {
    tech: [
      { name: "AuthPoint UM Platform", rank: 1 },
      { name: "ClaimBridge Core Admin", rank: 2 },
      { name: "ContactOne Call Center Platform", rank: 3 },
      { name: "InsightBI Analytics", rank: 4 },
    ],
    thirdparty: [{ name: "ClearPath Clearinghouse", rank: 1 }],
  },
  "Claims Intake & Initial Processing": {
    tech: [
      { name: "ClaimBridge Core Admin", rank: 1 },
      { name: "IntegraLink Interface Engine", rank: 2 },
      { name: "InsightBI Analytics", rank: 3 },
    ],
    thirdparty: [
      { name: "ClearPath Clearinghouse", rank: 1 },
      { name: "PayerLink EDI Services", rank: 2 },
    ],
  },
  "Care Coordination (high-risk members)": {
    tech: [
      { name: "AuthPoint UM Platform", rank: 1 },
      { name: "CareLink Patient Portal", rank: 2 },
      { name: "MediCore EHR", rank: 3 },
    ],
    thirdparty: [{ name: "LinguaCall Interpretation Services", rank: 1 }],
  },
  "Full Claims Adjudication": {
    tech: [
      { name: "ClaimBridge Core Admin", rank: 1 },
      { name: "InsightBI Analytics", rank: 2 },
      { name: "IntegraLink Interface Engine", rank: 3 },
    ],
    thirdparty: [
      { name: "ClearPath Clearinghouse", rank: 1 },
      { name: "PayerLink EDI Services", rank: 2 },
    ],
  },
  "Appeals & Grievances": {
    tech: [
      { name: "ClaimBridge Core Admin", rank: 1 },
      { name: "AuthPoint UM Platform", rank: 2 },
      { name: "ContactOne Call Center Platform", rank: 3 },
    ],
    thirdparty: [{ name: "ClearPath Clearinghouse", rank: 1 }],
  },
  "Actuarial & Product Pricing": {
    tech: [
      { name: "InsightBI Analytics", rank: 1 },
      { name: "ClaimBridge Core Admin", rank: 2 },
      { name: "CoreERP Finance & HR", rank: 3 },
    ],
    thirdparty: [],
  },
  "Crisis Communications & Media Relations": {
    tech: [
      { name: "ReachAll Mass Notification", rank: 1 },
      { name: "CareLink Patient Portal", rank: 2 },
    ],
    thirdparty: [{ name: "MetroNet Communications", rank: 1 }],
  },
  "Facilities & Utilities Management": {
    tech: [
      { name: "BuildingOps Building Management", rank: 1 },
      { name: "DeskFlow ITSM", rank: 2 },
      { name: "ReachAll Mass Notification", rank: 3 },
    ],
    thirdparty: [
      { name: "Commonwealth Power & Light", rank: 1 },
      { name: "BeaconFM Facilities Services", rank: 2 },
    ],
  },
  "Patient Access (registration & scheduling)": {
    tech: [
      { name: "MediCore EHR", rank: 1 },
      { name: "CareLink Patient Portal", rank: 2 },
      { name: "ContactOne Call Center Platform", rank: 3 },
      { name: "IntegraLink Interface Engine", rank: 4 },
    ],
    thirdparty: [
      { name: "LinguaCall Interpretation Services", rank: 1 },
      { name: "ClearPath Clearinghouse", rank: 2 },
    ],
  },
  "Clinical Supply Distribution": {
    tech: [
      { name: "StockRoom Inventory Management", rank: 1 },
      { name: "CoreERP Finance & HR", rank: 2 },
      { name: "MediCore EHR", rank: 3 },
    ],
    thirdparty: [
      { name: "MedSupply Logistics", rank: 1 },
      { name: "RxDirect Pharmaceutical Distribution", rank: 2 },
    ],
  },
  "Payroll & Benefits Administration": {
    tech: [
      { name: "CoreERP Finance & HR", rank: 1 },
      { name: "OneID SSO & MFA", rank: 2 },
    ],
    thirdparty: [{ name: "Reliant Staffing Group", rank: 1 }],
  },
  "Supply Chain Ordering & Replenishment": {
    tech: [
      { name: "CoreERP Finance & HR", rank: 1 },
      { name: "StockRoom Inventory Management", rank: 2 },
      { name: "InsightBI Analytics", rank: 3 },
    ],
    thirdparty: [
      { name: "MedSupply Logistics", rank: 1 },
      { name: "RxDirect Pharmaceutical Distribution", rank: 2 },
    ],
  },
  "Finance Operations (AP / AR)": {
    tech: [
      { name: "CoreERP Finance & HR", rank: 1 },
      { name: "InsightBI Analytics", rank: 2 },
      { name: "ClaimBridge Core Admin", rank: 3 },
    ],
    thirdparty: [{ name: "PayerLink EDI Services", rank: 1 }],
  },
  "Regulatory & Compliance Reporting": {
    tech: [
      { name: "InsightBI Analytics", rank: 1 },
      { name: "MediCore EHR", rank: 2 },
      { name: "CoreERP Finance & HR", rank: 3 },
    ],
    thirdparty: [{ name: "Crestline Reference Laboratories", rank: 1 }],
  },
  "Credentialing & Privileging": {
    tech: [
      { name: "CredentialPro", rank: 1 },
      { name: "MediCore EHR", rank: 2 },
    ],
    thirdparty: [{ name: "Reliant Staffing Group", rank: 1 }],
  },
  "Financial Close & Reporting": {
    tech: [
      { name: "CoreERP Finance & HR", rank: 1 },
      { name: "InsightBI Analytics", rank: 2 },
    ],
    thirdparty: [],
  },
  "Marketing & Communications": {
    tech: [
      { name: "CareLink Patient Portal", rank: 1 },
      { name: "InsightBI Analytics", rank: 2 },
    ],
    thirdparty: [{ name: "MetroNet Communications", rank: 1 }],
  },
  "Strategy & Transformation Office": {
    tech: [
      { name: "InsightBI Analytics", rank: 1 },
      { name: "DeskFlow ITSM", rank: 2 },
      { name: "CoreERP Finance & HR", rank: 3 },
    ],
    thirdparty: [],
  },
};
