/**
 * MedReconcile MCP — Medication Normalizer
 * Converts raw FHIR medication resources into a normalized format for analysis.
 */

import type {
  MedicationRequest, MedicationStatement, NormalizedMedication,
} from "./types.js";

function extractMedName(med: MedicationRequest | MedicationStatement): string {
  const concept =
    "medicationCodeableConcept" in med ? med.medicationCodeableConcept : undefined;
  if (concept?.text) return concept.text;
  if (concept?.coding?.[0]?.display) return concept.coding[0].display;
  return "Unknown medication";
}

function extractRxNorm(med: MedicationRequest | MedicationStatement): string | undefined {
  const concept =
    "medicationCodeableConcept" in med ? med.medicationCodeableConcept : undefined;
  return concept?.coding?.find(
    (c) => c.system === "http://www.nlm.nih.gov/research/umls/rxnorm"
  )?.code;
}

function extractDosage(med: MedicationRequest | MedicationStatement): string | undefined {
  if ("dosageInstruction" in med && med.dosageInstruction?.[0]?.text) {
    return med.dosageInstruction[0].text;
  }
  if ("dosage" in med && med.dosage?.[0]?.text) {
    return med.dosage[0].text;
  }
  return undefined;
}

export function normalizeMedicationRequest(med: MedicationRequest): NormalizedMedication {
  return {
    id: med.id ?? "unknown",
    source: "request",
    name: extractMedName(med),
    rxnormCode: extractRxNorm(med),
    dose: extractDosage(med),
    status: med.status,
    prescriber: med.requester?.display,
    indication: med.reasonCode?.[0]?.text,
    startDate: med.authoredOn,
    raw: med,
  };
}

export function normalizeMedicationStatement(med: MedicationStatement): NormalizedMedication {
  return {
    id: med.id ?? "unknown",
    source: "statement",
    name: extractMedName(med),
    rxnormCode: extractRxNorm(med),
    dose: extractDosage(med),
    status: med.status,
    prescriber: med.informationSource?.display,
    indication: med.reasonCode?.[0]?.text,
    startDate: med.effectivePeriod?.start ?? med.dateAsserted,
    raw: med,
  };
}

export function normalizeAll(
  requests: MedicationRequest[],
  statements: MedicationStatement[]
): NormalizedMedication[] {
  return [
    ...requests.map(normalizeMedicationRequest),
    ...statements.map(normalizeMedicationStatement),
  ];
}
