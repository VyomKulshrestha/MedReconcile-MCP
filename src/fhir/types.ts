/**
 * MedReconcile MCP — FHIR Type Definitions
 * Simplified FHIR R4 types for medication reconciliation.
 * These are intentionally minimal — not a full FHIR type library.
 */

/** Base FHIR resource */
export interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: {
    lastUpdated?: string;
    versionId?: string;
  };
}

/** FHIR CodeableConcept */
export interface CodeableConcept {
  coding?: Array<{
    system?: string;
    code?: string;
    display?: string;
  }>;
  text?: string;
}

/** FHIR Reference */
export interface Reference {
  reference?: string;
  display?: string;
}

/** FHIR Period */
export interface Period {
  start?: string;
  end?: string;
}

/** FHIR Dosage */
export interface Dosage {
  text?: string;
  timing?: {
    code?: CodeableConcept;
    repeat?: {
      frequency?: number;
      period?: number;
      periodUnit?: string;
    };
  };
  route?: CodeableConcept;
  doseAndRate?: Array<{
    doseQuantity?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
  }>;
}

/** FHIR MedicationRequest */
export interface MedicationRequest extends FhirResource {
  resourceType: "MedicationRequest";
  status: string;
  intent: string;
  medicationCodeableConcept?: CodeableConcept;
  medicationReference?: Reference;
  subject: Reference;
  authoredOn?: string;
  requester?: Reference;
  dosageInstruction?: Dosage[];
  reasonCode?: CodeableConcept[];
  note?: Array<{ text: string }>;
}

/** FHIR MedicationStatement */
export interface MedicationStatement extends FhirResource {
  resourceType: "MedicationStatement";
  status: string;
  medicationCodeableConcept?: CodeableConcept;
  medicationReference?: Reference;
  subject: Reference;
  effectivePeriod?: Period;
  dateAsserted?: string;
  informationSource?: Reference;
  dosage?: Dosage[];
  reasonCode?: CodeableConcept[];
  note?: Array<{ text: string }>;
}

/** FHIR AllergyIntolerance */
export interface AllergyIntolerance extends FhirResource {
  resourceType: "AllergyIntolerance";
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  type?: string;
  category?: string[];
  criticality?: string;
  code?: CodeableConcept;
  patient: Reference;
  recordedDate?: string;
  reaction?: Array<{
    substance?: CodeableConcept;
    manifestation: CodeableConcept[];
    severity?: string;
  }>;
}

/** FHIR Condition */
export interface Condition extends FhirResource {
  resourceType: "Condition";
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  code?: CodeableConcept;
  subject: Reference;
  onsetDateTime?: string;
  recordedDate?: string;
}

/** FHIR Patient */
export interface Patient extends FhirResource {
  resourceType: "Patient";
  name?: Array<{
    use?: string;
    family?: string;
    given?: string[];
  }>;
  gender?: string;
  birthDate?: string;
}

/** FHIR Bundle */
export interface Bundle extends FhirResource {
  resourceType: "Bundle";
  type: string;
  total?: number;
  entry?: Array<{
    resource: FhirResource;
    fullUrl?: string;
  }>;
}

/** Normalized medication for reconciliation */
export interface NormalizedMedication {
  id: string;
  source: "request" | "statement";
  name: string;
  genericName?: string;
  brandName?: string;
  rxnormCode?: string;
  ndc?: string;
  dose?: string;
  frequency?: string;
  route?: string;
  status: string;
  prescriber?: string;
  indication?: string;
  startDate?: string;
  raw: MedicationRequest | MedicationStatement;
}

/** Drug interaction result */
export interface DrugInteraction {
  severity: "high" | "moderate" | "low";
  type: "drug-drug" | "therapeutic-duplicate" | "dose-conflict" | "contraindication";
  drug1: string;
  drug2: string;
  description: string;
  clinicalSignificance: string;
  recommendation: string;
}

/** Allergy conflict result */
export interface AllergyConflict {
  severity: "high" | "moderate" | "low";
  medication: string;
  allergen: string;
  allergyType: string;
  reaction: string;
  recommendation: string;
}

/** Reconciliation discrepancy */
export interface ReconciliationDiscrepancy {
  type: "missing" | "duplicate" | "dose-mismatch" | "frequency-mismatch" | "new-addition";
  medication: string;
  details: string;
  sourceList: string;
  recommendation: string;
}

/** Full reconciliation report */
export interface ReconciliationReport {
  patientId: string;
  generatedAt: string;
  summary: string;
  riskLevel: "high" | "moderate" | "low";
  totalMedications: number;
  interactions: DrugInteraction[];
  allergyConflicts: AllergyConflict[];
  discrepancies: ReconciliationDiscrepancy[];
  recommendations: string[];
  clinicianNotes: string;
}
