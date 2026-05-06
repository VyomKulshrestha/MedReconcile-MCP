/**
 * MedReconcile MCP — Synthetic Patient Fixtures
 * Medication-heavy synthetic FHIR data for demo/testing.
 */

import type {
  MedicationRequest, MedicationStatement, AllergyIntolerance,
  Condition, Patient, NormalizedMedication,
} from "./types.js";

// --- Patient: Maria Santos (complex polypharmacy case) ---
const patientMaria: Patient = {
  resourceType: "Patient", id: "patient-maria-001",
  name: [{ use: "official", family: "Santos", given: ["Maria"] }],
  gender: "female", birthDate: "1958-03-15",
};

const mariaMedRequests: MedicationRequest[] = [
  {
    resourceType: "MedicationRequest", id: "medrx-maria-001",
    status: "active", intent: "order",
    medicationCodeableConcept: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "860975", display: "Metformin 500 MG Oral Tablet" }],
      text: "Metformin 500mg",
    },
    subject: { reference: "Patient/patient-maria-001" },
    authoredOn: "2025-01-10",
    requester: { display: "Dr. Chen (Endocrinology)" },
    dosageInstruction: [{ text: "Take 1 tablet twice daily with meals" }],
    reasonCode: [{ text: "Type 2 Diabetes Mellitus" }],
  },
  {
    resourceType: "MedicationRequest", id: "medrx-maria-002",
    status: "active", intent: "order",
    medicationCodeableConcept: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "314076", display: "Lisinopril 10 MG Oral Tablet" }],
      text: "Lisinopril 10mg",
    },
    subject: { reference: "Patient/patient-maria-001" },
    authoredOn: "2025-02-05",
    requester: { display: "Dr. Patel (Cardiology)" },
    dosageInstruction: [{ text: "Take 1 tablet once daily" }],
    reasonCode: [{ text: "Hypertension" }],
  },
  {
    resourceType: "MedicationRequest", id: "medrx-maria-003",
    status: "active", intent: "order",
    medicationCodeableConcept: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "197361", display: "Amlodipine 5 MG Oral Tablet" }],
      text: "Amlodipine 5mg",
    },
    subject: { reference: "Patient/patient-maria-001" },
    authoredOn: "2025-03-12",
    requester: { display: "Dr. Patel (Cardiology)" },
    dosageInstruction: [{ text: "Take 1 tablet once daily" }],
    reasonCode: [{ text: "Hypertension" }],
  },
  {
    resourceType: "MedicationRequest", id: "medrx-maria-004",
    status: "active", intent: "order",
    medicationCodeableConcept: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "259255", display: "Atorvastatin 20 MG Oral Tablet" }],
      text: "Atorvastatin 20mg",
    },
    subject: { reference: "Patient/patient-maria-001" },
    authoredOn: "2025-01-10",
    requester: { display: "Dr. Chen (Endocrinology)" },
    dosageInstruction: [{ text: "Take 1 tablet at bedtime" }],
    reasonCode: [{ text: "Hyperlipidemia" }],
  },
  {
    resourceType: "MedicationRequest", id: "medrx-maria-005",
    status: "active", intent: "order",
    medicationCodeableConcept: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "310798", display: "Warfarin 5 MG Oral Tablet" }],
      text: "Warfarin 5mg",
    },
    subject: { reference: "Patient/patient-maria-001" },
    authoredOn: "2025-06-01",
    requester: { display: "Dr. Patel (Cardiology)" },
    dosageInstruction: [{ text: "Take 1 tablet once daily" }],
    reasonCode: [{ text: "Atrial Fibrillation" }],
  },
];

// Home meds (from patient/pharmacy — potential conflicts)
const mariaMedStatements: MedicationStatement[] = [
  {
    resourceType: "MedicationStatement", id: "medstmt-maria-001",
    status: "active",
    medicationCodeableConcept: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "861007", display: "Glucophage 500 MG Oral Tablet" }],
      text: "Glucophage 500mg",
    },
    subject: { reference: "Patient/patient-maria-001" },
    effectivePeriod: { start: "2024-06-01" },
    informationSource: { display: "Patient self-report" },
    dosage: [{ text: "1 tablet twice daily" }],
    note: [{ text: "Patient reports taking this from previous PCP" }],
  },
  {
    resourceType: "MedicationStatement", id: "medstmt-maria-002",
    status: "active",
    medicationCodeableConcept: { text: "Aspirin 81mg" },
    subject: { reference: "Patient/patient-maria-001" },
    effectivePeriod: { start: "2024-01-01" },
    informationSource: { display: "Patient self-report" },
    dosage: [{ text: "1 tablet daily" }],
    note: [{ text: "OTC, patient takes for heart health" }],
  },
  {
    resourceType: "MedicationStatement", id: "medstmt-maria-003",
    status: "active",
    medicationCodeableConcept: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "834101", display: "Ibuprofen 400 MG Oral Tablet" }],
      text: "Ibuprofen 400mg",
    },
    subject: { reference: "Patient/patient-maria-001" },
    informationSource: { display: "Patient self-report" },
    dosage: [{ text: "As needed for arthritis pain" }],
  },
  {
    resourceType: "MedicationStatement", id: "medstmt-maria-004",
    status: "active",
    medicationCodeableConcept: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "200031", display: "Simvastatin 20 MG Oral Tablet" }],
      text: "Simvastatin 20mg",
    },
    subject: { reference: "Patient/patient-maria-001" },
    effectivePeriod: { start: "2023-08-01" },
    informationSource: { display: "Previous pharmacy records" },
    dosage: [{ text: "1 tablet at bedtime" }],
  },
];

const mariaAllergies: AllergyIntolerance[] = [
  {
    resourceType: "AllergyIntolerance", id: "allergy-maria-001",
    clinicalStatus: { coding: [{ code: "active" }] },
    verificationStatus: { coding: [{ code: "confirmed" }] },
    type: "allergy", category: ["medication"], criticality: "high",
    code: { coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "7980", display: "Penicillin" }], text: "Penicillin" },
    patient: { reference: "Patient/patient-maria-001" },
    reaction: [{ manifestation: [{ text: "Anaphylaxis" }], severity: "severe" }],
  },
  {
    resourceType: "AllergyIntolerance", id: "allergy-maria-002",
    clinicalStatus: { coding: [{ code: "active" }] },
    verificationStatus: { coding: [{ code: "confirmed" }] },
    type: "intolerance", category: ["medication"], criticality: "low",
    code: { text: "Sulfa drugs" },
    patient: { reference: "Patient/patient-maria-001" },
    reaction: [{ manifestation: [{ text: "Rash" }], severity: "mild" }],
  },
];

const mariaConditions: Condition[] = [
  { resourceType: "Condition", id: "cond-maria-001", code: { text: "Type 2 Diabetes Mellitus" }, subject: { reference: "Patient/patient-maria-001" }, clinicalStatus: { coding: [{ code: "active" }] } },
  { resourceType: "Condition", id: "cond-maria-002", code: { text: "Essential Hypertension" }, subject: { reference: "Patient/patient-maria-001" }, clinicalStatus: { coding: [{ code: "active" }] } },
  { resourceType: "Condition", id: "cond-maria-003", code: { text: "Atrial Fibrillation" }, subject: { reference: "Patient/patient-maria-001" }, clinicalStatus: { coding: [{ code: "active" }] } },
  { resourceType: "Condition", id: "cond-maria-004", code: { text: "Osteoarthritis" }, subject: { reference: "Patient/patient-maria-001" }, clinicalStatus: { coding: [{ code: "active" }] } },
];

// --- Patient: James Wilson (transition of care case) ---
const patientJames: Patient = {
  resourceType: "Patient", id: "patient-james-002",
  name: [{ use: "official", family: "Wilson", given: ["James"] }],
  gender: "male", birthDate: "1972-11-22",
};

const jamesMedRequests: MedicationRequest[] = [
  {
    resourceType: "MedicationRequest", id: "medrx-james-001",
    status: "active", intent: "order",
    medicationCodeableConcept: { text: "Losartan 50mg" },
    subject: { reference: "Patient/patient-james-002" },
    authoredOn: "2025-09-01", requester: { display: "Dr. Kim (PCP)" },
    dosageInstruction: [{ text: "Take 1 tablet once daily" }],
    reasonCode: [{ text: "Hypertension" }],
  },
  {
    resourceType: "MedicationRequest", id: "medrx-james-002",
    status: "active", intent: "order",
    medicationCodeableConcept: { text: "Omeprazole 20mg" },
    subject: { reference: "Patient/patient-james-002" },
    authoredOn: "2025-09-01", requester: { display: "Dr. Kim (PCP)" },
    dosageInstruction: [{ text: "Take 1 capsule before breakfast" }],
    reasonCode: [{ text: "GERD" }],
  },
  {
    resourceType: "MedicationRequest", id: "medrx-james-003",
    status: "active", intent: "order",
    medicationCodeableConcept: { text: "Sertraline 100mg" },
    subject: { reference: "Patient/patient-james-002" },
    authoredOn: "2025-07-15", requester: { display: "Dr. Adams (Psychiatry)" },
    dosageInstruction: [{ text: "Take 1 tablet once daily in the morning" }],
    reasonCode: [{ text: "Major Depressive Disorder" }],
  },
];

const jamesMedStatements: MedicationStatement[] = [
  {
    resourceType: "MedicationStatement", id: "medstmt-james-001",
    status: "active",
    medicationCodeableConcept: { text: "Cozaar 50mg" },
    subject: { reference: "Patient/patient-james-002" },
    informationSource: { display: "Previous pharmacy" },
    dosage: [{ text: "1 tablet daily" }],
    note: [{ text: "Brand name equivalent of Losartan" }],
  },
  {
    resourceType: "MedicationStatement", id: "medstmt-james-002",
    status: "active",
    medicationCodeableConcept: { text: "St. John's Wort 300mg" },
    subject: { reference: "Patient/patient-james-002" },
    informationSource: { display: "Patient self-report" },
    dosage: [{ text: "1 capsule three times daily" }],
    note: [{ text: "Herbal supplement, patient takes for mood" }],
  },
  {
    resourceType: "MedicationStatement", id: "medstmt-james-003",
    status: "active",
    medicationCodeableConcept: { text: "Tramadol 50mg" },
    subject: { reference: "Patient/patient-james-002" },
    informationSource: { display: "ED discharge" },
    dosage: [{ text: "1 tablet every 6 hours as needed for pain" }],
    note: [{ text: "Prescribed after ER visit for back pain" }],
  },
];

const jamesAllergies: AllergyIntolerance[] = [
  {
    resourceType: "AllergyIntolerance", id: "allergy-james-001",
    clinicalStatus: { coding: [{ code: "active" }] },
    type: "allergy", category: ["medication"], criticality: "high",
    code: { text: "NSAIDs" },
    patient: { reference: "Patient/patient-james-002" },
    reaction: [{ manifestation: [{ text: "GI bleeding" }], severity: "severe" }],
  },
];

const jamesConditions: Condition[] = [
  { resourceType: "Condition", id: "cond-james-001", code: { text: "Hypertension" }, subject: { reference: "Patient/patient-james-002" }, clinicalStatus: { coding: [{ code: "active" }] } },
  { resourceType: "Condition", id: "cond-james-002", code: { text: "Major Depressive Disorder" }, subject: { reference: "Patient/patient-james-002" }, clinicalStatus: { coding: [{ code: "active" }] } },
  { resourceType: "Condition", id: "cond-james-003", code: { text: "Chronic Low Back Pain" }, subject: { reference: "Patient/patient-james-002" }, clinicalStatus: { coding: [{ code: "active" }] } },
];

// --- Fixture data map ---
export interface PatientFixture {
  patient: Patient;
  medicationRequests: MedicationRequest[];
  medicationStatements: MedicationStatement[];
  allergyIntolerances: AllergyIntolerance[];
  conditions: Condition[];
}

export const fixtures: Record<string, PatientFixture> = {
  "patient-maria-001": {
    patient: patientMaria,
    medicationRequests: mariaMedRequests,
    medicationStatements: mariaMedStatements,
    allergyIntolerances: mariaAllergies,
    conditions: mariaConditions,
  },
  "patient-james-002": {
    patient: patientJames,
    medicationRequests: jamesMedRequests,
    medicationStatements: jamesMedStatements,
    allergyIntolerances: jamesAllergies,
    conditions: jamesConditions,
  },
};

export function getFixturePatientIds(): string[] {
  return Object.keys(fixtures);
}
