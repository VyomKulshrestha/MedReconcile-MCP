/**
 * MedReconcile MCP — Data Provider
 * Abstracts between fixture mode (synthetic data) and live FHIR mode.
 */

import { config } from "../config.js";
import { logger } from "../logger.js";
import { FhirClient } from "./client.js";
import { fixtures, getFixturePatientIds } from "./fixtures.js";
import type {
  MedicationRequest, MedicationStatement,
  AllergyIntolerance, Condition, Patient,
} from "./types.js";

export interface DataProviderOptions {
  fhirServerUrl?: string;
  fhirAccessToken?: string;
}

export class DataProvider {
  private mode: "fixture" | "fhir";
  private fhirClient: FhirClient | null = null;

  constructor(options?: DataProviderOptions) {
    this.mode = config.mode;
    if (this.mode === "fhir") {
      const serverUrl = options?.fhirServerUrl ?? config.defaultFhirServerUrl;
      this.fhirClient = new FhirClient({
        serverUrl,
        accessToken: options?.fhirAccessToken,
      });
      logger.info("DataProvider initialized in FHIR mode", { serverUrl });
    } else {
      logger.info("DataProvider initialized in fixture mode", {
        patients: getFixturePatientIds(),
      });
    }
  }

  async getPatient(patientId: string): Promise<Patient> {
    if (this.mode === "fixture") {
      const f = fixtures[patientId];
      if (!f) throw new Error(`Fixture patient not found: ${patientId}. Available: ${getFixturePatientIds().join(", ")}`);
      return f.patient;
    }
    return this.fhirClient!.getPatient(patientId);
  }

  async getMedicationRequests(patientId: string): Promise<MedicationRequest[]> {
    if (this.mode === "fixture") {
      return fixtures[patientId]?.medicationRequests ?? [];
    }
    return this.fhirClient!.getMedicationRequests(patientId);
  }

  async getMedicationStatements(patientId: string): Promise<MedicationStatement[]> {
    if (this.mode === "fixture") {
      return fixtures[patientId]?.medicationStatements ?? [];
    }
    return this.fhirClient!.getMedicationStatements(patientId);
  }

  async getAllergyIntolerances(patientId: string): Promise<AllergyIntolerance[]> {
    if (this.mode === "fixture") {
      return fixtures[patientId]?.allergyIntolerances ?? [];
    }
    return this.fhirClient!.getAllergyIntolerances(patientId);
  }

  async getConditions(patientId: string): Promise<Condition[]> {
    if (this.mode === "fixture") {
      return fixtures[patientId]?.conditions ?? [];
    }
    return this.fhirClient!.getConditions(patientId);
  }

  getAvailablePatients(): string[] {
    if (this.mode === "fixture") return getFixturePatientIds();
    return [];
  }
}
