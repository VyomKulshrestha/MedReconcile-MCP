/**
 * MedReconcile MCP — Tool Definitions
 * All 7 MCP tools exposed by the server.
 */

import { z } from "zod";
import { DataProvider } from "../fhir/dataProvider.js";
import { normalizeAll, normalizeMedicationRequest, normalizeMedicationStatement } from "../fhir/normalizer.js";
import { analyzeInteractions, analyzeAllergyConflicts, reconcileMedications, suggestAlternatives, generateReport } from "../llm/service.js";
import { logger } from "../logger.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerTools(server: McpServer, dataProvider: DataProvider): void {

  // Tool 1: get_current_medications
  server.tool(
    "get_current_medications",
    "Fetch all active medications for a patient from FHIR (MedicationRequests + MedicationStatements). Returns normalized medication list with source, dose, prescriber, and indication.",
    { patientId: z.string().describe("The FHIR patient ID (e.g., 'patient-maria-001')") },
    async ({ patientId }) => {
      logger.info("Tool: get_current_medications", { patientId });
      const requests = await dataProvider.getMedicationRequests(patientId);
      const statements = await dataProvider.getMedicationStatements(patientId);
      const normalized = normalizeAll(requests, statements);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            patientId,
            totalMedications: normalized.length,
            ehrOrders: normalized.filter(m => m.source === "request").length,
            homeReported: normalized.filter(m => m.source === "statement").length,
            medications: normalized.map(m => ({
              id: m.id, name: m.name, dose: m.dose, source: m.source,
              status: m.status, prescriber: m.prescriber, indication: m.indication,
              startDate: m.startDate, rxnormCode: m.rxnormCode,
            })),
            availablePatients: dataProvider.getAvailablePatients(),
          }, null, 2),
        }],
      };
    }
  );

  // Tool 2: reconcile_medication_list
  server.tool(
    "reconcile_medication_list",
    "Compare EHR medication orders against patient-reported home medications using AI semantic matching. Identifies duplicates (brand/generic), missing meds, dose mismatches, and unreported medications.",
    { patientId: z.string().describe("The FHIR patient ID") },
    async ({ patientId }) => {
      logger.info("Tool: reconcile_medication_list", { patientId });
      const requests = await dataProvider.getMedicationRequests(patientId);
      const statements = await dataProvider.getMedicationStatements(patientId);
      const ehrMeds = requests.map(normalizeMedicationRequest);
      const homeMeds = statements.map(normalizeMedicationStatement);
      const result = await reconcileMedications(ehrMeds, homeMeds);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  // Tool 3: detect_drug_interactions
  server.tool(
    "detect_drug_interactions",
    "Analyze a patient's complete medication list for drug-drug interactions, therapeutic duplications, and contraindications using AI. Goes beyond simple lookups to understand clinical context.",
    { patientId: z.string().describe("The FHIR patient ID") },
    async ({ patientId }) => {
      logger.info("Tool: detect_drug_interactions", { patientId });
      const requests = await dataProvider.getMedicationRequests(patientId);
      const statements = await dataProvider.getMedicationStatements(patientId);
      const allMeds = normalizeAll(requests, statements);
      const result = await analyzeInteractions(allMeds);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  // Tool 4: check_allergy_conflicts
  server.tool(
    "check_allergy_conflicts",
    "Cross-reference a patient's medications against their AllergyIntolerance records, including cross-reactivity and drug class relationships.",
    { patientId: z.string().describe("The FHIR patient ID") },
    async ({ patientId }) => {
      logger.info("Tool: check_allergy_conflicts", { patientId });
      const requests = await dataProvider.getMedicationRequests(patientId);
      const statements = await dataProvider.getMedicationStatements(patientId);
      const allergies = await dataProvider.getAllergyIntolerances(patientId);
      const allMeds = normalizeAll(requests, statements);
      const result = await analyzeAllergyConflicts(allMeds, allergies);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  // Tool 5: suggest_alternatives
  server.tool(
    "suggest_alternatives",
    "When a medication conflict is identified, suggest safe therapeutic alternatives based on the patient's conditions and other medications.",
    {
      medication: z.string().describe("The conflicting medication name"),
      reason: z.string().describe("Why the medication is problematic"),
      patientId: z.string().describe("The FHIR patient ID (to fetch conditions)"),
    },
    async ({ medication, reason, patientId }) => {
      logger.info("Tool: suggest_alternatives", { medication, patientId });
      const conditions = await dataProvider.getConditions(patientId);
      const conditionNames = conditions.map(c => c.code?.text ?? "Unknown").filter(Boolean);
      const result = await suggestAlternatives(medication, reason, conditionNames);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  // Tool 6: generate_reconciliation_report
  server.tool(
    "generate_reconciliation_report",
    "Generate a comprehensive, clinician-ready medication reconciliation report with risk stratification, critical actions, and recommendations. Combines interaction analysis, allergy checks, and reconciliation findings.",
    { patientId: z.string().describe("The FHIR patient ID") },
    async ({ patientId }) => {
      logger.info("Tool: generate_reconciliation_report", { patientId });
      const requests = await dataProvider.getMedicationRequests(patientId);
      const statements = await dataProvider.getMedicationStatements(patientId);
      const allergies = await dataProvider.getAllergyIntolerances(patientId);
      const allMeds = normalizeAll(requests, statements);

      const [interactions, allergyCheck, reconciliation] = await Promise.all([
        analyzeInteractions(allMeds),
        analyzeAllergyConflicts(allMeds, allergies),
        reconcileMedications(
          requests.map(normalizeMedicationRequest),
          statements.map(normalizeMedicationStatement)
        ),
      ]);

      const report = await generateReport(patientId, allMeds, interactions, allergyCheck, reconciliation);
      return { content: [{ type: "text" as const, text: report }] };
    }
  );

  // Tool 7: list_patients (utility)
  server.tool(
    "list_patients",
    "List available patient IDs in the system. In fixture mode, returns synthetic patient IDs for testing.",
    {},
    async () => {
      logger.info("Tool: list_patients");
      const ids = dataProvider.getAvailablePatients();
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ availablePatients: ids, mode: "fixture", note: "Use these patient IDs with other tools." }, null, 2),
        }],
      };
    }
  );

  logger.info("Registered 7 MCP tools");
}
