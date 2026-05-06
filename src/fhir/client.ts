/**
 * MedReconcile MCP — FHIR Client
 * Fetches FHIR resources from a FHIR R4 server.
 * Supports both live FHIR servers and fixture mode.
 */

import { config } from "../config.js";
import { logger } from "../logger.js";
import type {
  Bundle,
  MedicationRequest,
  MedicationStatement,
  AllergyIntolerance,
  Condition,
  Patient,
  FhirResource,
} from "./types.js";

export interface FhirClientOptions {
  serverUrl: string;
  accessToken?: string;
}

/**
 * FHIR R4 client for fetching patient data.
 */
export class FhirClient {
  private serverUrl: string;
  private accessToken?: string;

  constructor(options: FhirClientOptions) {
    this.serverUrl = options.serverUrl.replace(/\/+$/, "");
    this.accessToken = options.accessToken;

    // SSRF protection
    if (!config.allowPrivateFhir) {
      const url = new URL(this.serverUrl);
      const hostname = url.hostname.toLowerCase();
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("10.") ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("172.") ||
        hostname === "0.0.0.0" ||
        hostname === "::1"
      ) {
        throw new Error(
          "SSRF protection: Private/loopback FHIR URLs are blocked. " +
            "Set MCP_ALLOW_PRIVATE_FHIR=true to override."
        );
      }
    }
  }

  private async fetch<T extends FhirResource>(path: string): Promise<T> {
    const url = `${this.serverUrl}/${path}`;
    logger.debug("FHIR fetch", { url });

    const headers: Record<string, string> = {
      Accept: "application/fhir+json",
    };
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`FHIR request failed (${response.status}): ${body}`);
    }

    return (await response.json()) as T;
  }

  async getPatient(patientId: string): Promise<Patient> {
    return this.fetch<Patient>(`Patient/${patientId}`);
  }

  async getMedicationRequests(patientId: string): Promise<MedicationRequest[]> {
    const bundle = await this.fetch<Bundle>(
      `MedicationRequest?patient=${patientId}&_count=100`
    );
    return (
      bundle.entry
        ?.map((e) => e.resource as MedicationRequest)
        .filter((r) => r.resourceType === "MedicationRequest") ?? []
    );
  }

  async getMedicationStatements(patientId: string): Promise<MedicationStatement[]> {
    const bundle = await this.fetch<Bundle>(
      `MedicationStatement?patient=${patientId}&_count=100`
    );
    return (
      bundle.entry
        ?.map((e) => e.resource as MedicationStatement)
        .filter((r) => r.resourceType === "MedicationStatement") ?? []
    );
  }

  async getAllergyIntolerances(patientId: string): Promise<AllergyIntolerance[]> {
    const bundle = await this.fetch<Bundle>(
      `AllergyIntolerance?patient=${patientId}&_count=100`
    );
    return (
      bundle.entry
        ?.map((e) => e.resource as AllergyIntolerance)
        .filter((r) => r.resourceType === "AllergyIntolerance") ?? []
    );
  }

  async getConditions(patientId: string): Promise<Condition[]> {
    const bundle = await this.fetch<Bundle>(
      `Condition?patient=${patientId}&_count=100`
    );
    return (
      bundle.entry
        ?.map((e) => e.resource as Condition)
        .filter((r) => r.resourceType === "Condition") ?? []
    );
  }
}
