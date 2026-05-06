/**
 * MedReconcile MCP — LLM Service (Google Gemini)
 * Handles AI-powered medication analysis with DRY_RUN fixture support.
 */

import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";
import { logger } from "../logger.js";
import type { NormalizedMedication, AllergyIntolerance } from "../fhir/types.js";

let genai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!genai) {
    if (!config.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is required when DRY_RUN=false");
    }
    genai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }
  return genai;
}

async function callLLM(prompt: string, retries = 4, delayMs = 2000): Promise<string> {
  const client = getClient();
  let currentModel = config.llmModel;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: { maxOutputTokens: config.llmMaxTokens, temperature: 0.2 },
      });
      return response.text ?? "";
    } catch (error: any) {
      if (error.status === 429 || error.status === 503 || error.message?.includes("429") || error.message?.includes("503") || error.message?.includes("Quota exceeded") || error.message?.includes("high demand")) {
        logger.warn(`Rate limit or high demand hit (attempt ${attempt}/${retries}) for model ${currentModel}`, { error: error.message });
        if (attempt < retries) {
          // If we've tried the main model a couple times, fallback to a different one if possible
          if (attempt === 2 && currentModel === "gemini-2.5-flash") {
             logger.info("Falling back to gemini-2.5-pro due to rate limits or demand");
             currentModel = "gemini-2.5-pro";
          } else if (attempt === 3 && currentModel === "gemini-2.5-pro") {
             logger.info("Falling back to gemini-2.5-flash-lite due to rate limits or demand");
             currentModel = "gemini-2.5-flash-lite";
          }
          await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
          continue;
        }
      }
      logger.error("LLM call failed", { error: error.message, attempt, currentModel });
      throw error;
    }
  }
  throw new Error("Max retries reached for LLM call");
}

// --- DRY_RUN fixtures ---
const DRY_RUN_INTERACTIONS = JSON.stringify({
  interactions: [
    { severity: "high", type: "drug-drug", drug1: "Warfarin 5mg", drug2: "Aspirin 81mg", description: "Concurrent use of Warfarin and Aspirin significantly increases bleeding risk.", clinicalSignificance: "Both agents affect hemostasis through different mechanisms. Combined use increases risk of GI bleeding by 2-3x.", recommendation: "Verify clinical necessity of dual therapy. If both required for AF + cardiac protection, ensure INR monitoring frequency is increased and GI prophylaxis is in place." },
    { severity: "high", type: "drug-drug", drug1: "Warfarin 5mg", drug2: "Ibuprofen 400mg", description: "NSAIDs potentiate Warfarin anticoagulant effect and independently increase bleeding risk.", clinicalSignificance: "Ibuprofen inhibits platelet function and can displace Warfarin from protein binding, leading to supratherapeutic INR.", recommendation: "DISCONTINUE Ibuprofen. Consider Acetaminophen for pain management or topical NSAIDs with close INR monitoring." },
    { severity: "moderate", type: "therapeutic-duplicate", drug1: "Atorvastatin 20mg", drug2: "Simvastatin 20mg", description: "Two HMG-CoA reductase inhibitors (statins) prescribed concurrently from different providers.", clinicalSignificance: "Therapeutic duplication increases risk of myopathy and rhabdomyolysis without additional lipid-lowering benefit.", recommendation: "Reconcile with prescribers. Discontinue one statin — recommend continuing Atorvastatin 20mg (current provider) and discontinuing Simvastatin 20mg (previous pharmacy)." },
    { severity: "low", type: "therapeutic-duplicate", drug1: "Metformin 500mg (prescribed)", drug2: "Glucophage 500mg (home med)", description: "Metformin and Glucophage are the same medication (generic vs brand name).", clinicalSignificance: "Not a safety concern — these are identical. Risk is double-dosing if patient takes both.", recommendation: "Confirm patient understands these are the same medication. Update records to reflect single medication." },
  ],
});

const DRY_RUN_ALLERGY_CHECK = JSON.stringify({
  conflicts: [
    { severity: "low", medication: "Ibuprofen 400mg", allergen: "NSAIDs (not listed but related)", allergyType: "cross-reactivity", reaction: "GI bleeding noted in allergy for James; for Maria no NSAID allergy listed but caution with Warfarin", recommendation: "No direct allergy conflict for Maria, but combination with anticoagulant is contraindicated." },
  ],
  safe: ["Metformin 500mg", "Lisinopril 10mg", "Amlodipine 5mg", "Atorvastatin 20mg", "Warfarin 5mg"],
});

const DRY_RUN_RECONCILIATION = JSON.stringify({
  discrepancies: [
    { type: "duplicate", medication: "Metformin/Glucophage 500mg", details: "Same medication appears as both a prescribed MedicationRequest (Metformin) and a patient-reported MedicationStatement (Glucophage brand name).", sourceList: "EHR orders vs. Home medications", recommendation: "Confirm single medication. Educate patient that Metformin = Glucophage." },
    { type: "duplicate", medication: "Atorvastatin/Simvastatin", details: "Two different statins from different sources — Atorvastatin from current endocrinologist, Simvastatin from previous pharmacy records.", sourceList: "EHR orders vs. Pharmacy records", recommendation: "Discontinue Simvastatin. Continue Atorvastatin per current provider." },
    { type: "new-addition", medication: "Ibuprofen 400mg", details: "Patient self-reports taking OTC Ibuprofen for arthritis. Not in EHR medication orders. Dangerous with Warfarin.", sourceList: "Home medications (not in EHR)", recommendation: "URGENT: Discontinue Ibuprofen due to Warfarin interaction. Prescribe Acetaminophen alternative." },
    { type: "new-addition", medication: "Aspirin 81mg", details: "Patient self-reports daily low-dose Aspirin. Not in EHR orders. Increases bleeding risk with Warfarin.", sourceList: "Home medications (not in EHR)", recommendation: "Evaluate necessity with cardiologist. If required for AF management alongside Warfarin, add GI prophylaxis." },
  ],
});

const DRY_RUN_ALTERNATIVES = JSON.stringify({
  alternatives: [
    { conflictingMed: "Ibuprofen 400mg", reason: "Dangerous interaction with Warfarin", alternatives: [
      { name: "Acetaminophen 500mg", rationale: "First-line for pain in anticoagulated patients. No effect on coagulation or platelets.", dosing: "500-1000mg every 6-8 hours, max 3g/day" },
      { name: "Topical Diclofenac 1% gel", rationale: "Minimal systemic absorption reduces interaction risk. Good for localized arthritis pain.", dosing: "Apply to affected joints 4 times daily" },
    ]},
    { conflictingMed: "Simvastatin 20mg (duplicate statin)", reason: "Therapeutic duplicate with Atorvastatin", alternatives: [
      { name: "Continue Atorvastatin 20mg alone", rationale: "Already prescribed by current provider. Atorvastatin has better evidence base and fewer drug interactions.", dosing: "1 tablet at bedtime (current regimen)" },
    ]},
  ],
});

export async function analyzeInteractions(medications: NormalizedMedication[]): Promise<string> {
  if (config.dryRun) {
    logger.info("DRY_RUN: Returning fixture interaction analysis");
    return DRY_RUN_INTERACTIONS;
  }

  const medList = medications.map((m) => `- ${m.name} (${m.dose ?? "dose unknown"}, ${m.source}, prescribed by ${m.prescriber ?? "unknown"}, for ${m.indication ?? "unknown indication"})`).join("\n");

  const prompt = `You are an expert clinical pharmacist AI assistant. Analyze the following medication list for a single patient and identify ALL drug-drug interactions, therapeutic duplications, and dose conflicts.

MEDICATION LIST:
${medList}

Respond in JSON format with this schema:
{
  "interactions": [
    {
      "severity": "high" | "moderate" | "low",
      "type": "drug-drug" | "therapeutic-duplicate" | "dose-conflict" | "contraindication",
      "drug1": "medication name",
      "drug2": "medication name",
      "description": "what the interaction is",
      "clinicalSignificance": "why it matters clinically",
      "recommendation": "what to do about it"
    }
  ]
}

Be thorough. Consider: brand/generic equivalence, therapeutic class overlap, pharmacokinetic interactions, pharmacodynamic interactions. Only return valid JSON.`;

  return callLLM(prompt);
}

export async function analyzeAllergyConflicts(
  medications: NormalizedMedication[],
  allergies: AllergyIntolerance[]
): Promise<string> {
  if (config.dryRun) {
    logger.info("DRY_RUN: Returning fixture allergy analysis");
    return DRY_RUN_ALLERGY_CHECK;
  }

  const medList = medications.map((m) => `- ${m.name}`).join("\n");
  const allergyList = allergies.map((a) => {
    const name = a.code?.text ?? a.code?.coding?.[0]?.display ?? "Unknown";
    const reaction = a.reaction?.[0]?.manifestation?.[0]?.text ?? "Unknown reaction";
    const severity = a.criticality ?? "unknown";
    return `- ${name} (reaction: ${reaction}, criticality: ${severity})`;
  }).join("\n");

  const prompt = `You are an expert clinical pharmacist. Check this patient's medications against their allergies, including cross-reactivity and drug class relationships.

MEDICATIONS:
${medList}

ALLERGIES:
${allergyList}

Respond in JSON:
{
  "conflicts": [{ "severity": "high"|"moderate"|"low", "medication": "", "allergen": "", "allergyType": "", "reaction": "", "recommendation": "" }],
  "safe": ["list of medications with no allergy concerns"]
}
Only return valid JSON.`;

  return callLLM(prompt);
}

export async function reconcileMedications(
  ehrMeds: NormalizedMedication[],
  homeMeds: NormalizedMedication[]
): Promise<string> {
  if (config.dryRun) {
    logger.info("DRY_RUN: Returning fixture reconciliation");
    return DRY_RUN_RECONCILIATION;
  }

  const ehrList = ehrMeds.map((m) => `- ${m.name} (${m.dose ?? "unknown dose"}, by ${m.prescriber ?? "unknown"})`).join("\n");
  const homeList = homeMeds.map((m) => `- ${m.name} (${m.dose ?? "unknown dose"}, source: ${m.prescriber ?? "unknown"})`).join("\n");

  const prompt = `You are an expert clinical pharmacist performing medication reconciliation. Compare the EHR medication orders against the patient's home/self-reported medications.

EHR MEDICATION ORDERS:
${ehrList}

HOME/SELF-REPORTED MEDICATIONS:
${homeList}

Identify ALL discrepancies including: duplicates (same drug different names), missing medications, dose mismatches, new additions not in EHR.

Respond in JSON:
{
  "discrepancies": [{ "type": "missing"|"duplicate"|"dose-mismatch"|"frequency-mismatch"|"new-addition", "medication": "", "details": "", "sourceList": "", "recommendation": "" }]
}
Only return valid JSON.`;

  return callLLM(prompt);
}

export async function suggestAlternatives(
  conflictingMed: string,
  reason: string,
  conditions: string[]
): Promise<string> {
  if (config.dryRun) {
    logger.info("DRY_RUN: Returning fixture alternatives");
    return DRY_RUN_ALTERNATIVES;
  }

  const prompt = `You are an expert clinical pharmacist. A medication conflict has been identified:

CONFLICTING MEDICATION: ${conflictingMed}
REASON FOR CONFLICT: ${reason}
PATIENT CONDITIONS: ${conditions.join(", ")}

Suggest safe therapeutic alternatives considering the patient's conditions.

Respond in JSON:
{
  "alternatives": [{ "conflictingMed": "", "reason": "", "alternatives": [{ "name": "", "rationale": "", "dosing": "" }] }]
}
Only return valid JSON.`;

  return callLLM(prompt);
}

export async function generateReport(
  patientId: string,
  medications: NormalizedMedication[],
  interactions: string,
  allergyCheck: string,
  reconciliation: string
): Promise<string> {
  if (config.dryRun) {
    logger.info("DRY_RUN: Returning fixture report");
    return JSON.stringify({
      patientId,
      generatedAt: new Date().toISOString(),
      summary: "HIGH RISK — 2 critical drug interactions identified (Warfarin+Ibuprofen, Warfarin+Aspirin), 2 therapeutic duplications (Metformin/Glucophage, Atorvastatin/Simvastatin). Immediate pharmacist review required.",
      riskLevel: "high",
      totalMedications: medications.length,
      criticalActions: [
        "STOP Ibuprofen immediately — dangerous interaction with Warfarin",
        "Evaluate Aspirin necessity with cardiology — bleeding risk with Warfarin",
        "Discontinue Simvastatin — duplicate statin therapy with Atorvastatin",
        "Confirm Metformin/Glucophage — educate patient these are the same drug",
      ],
      recommendations: [
        "Substitute Acetaminophen for Ibuprofen for arthritis pain",
        "Increase INR monitoring frequency if Aspirin+Warfarin therapy continues",
        "Add PPI for GI prophylaxis if dual antithrombotic therapy is maintained",
        "Schedule follow-up medication review in 2 weeks",
      ],
      clinicianNotes: "This patient has multiple prescribers (Endocrinology, Cardiology, self-managed OTC) with no shared medication visibility. Recommend centralizing medication management with primary care coordination.",
    });
  }

  const prompt = `You are an expert clinical pharmacist creating a medication reconciliation report. Synthesize all findings into a comprehensive clinician-ready report.

PATIENT: ${patientId}
TOTAL MEDICATIONS: ${medications.length}
INTERACTION ANALYSIS: ${interactions}
ALLERGY CHECK: ${allergyCheck}
RECONCILIATION: ${reconciliation}

Create a JSON report:
{
  "patientId": "${patientId}",
  "generatedAt": "${new Date().toISOString()}",
  "summary": "executive summary",
  "riskLevel": "high"|"moderate"|"low",
  "totalMedications": ${medications.length},
  "criticalActions": ["immediate actions needed"],
  "recommendations": ["non-urgent recommendations"],
  "clinicianNotes": "additional context for the reviewing clinician"
}
Only return valid JSON.`;

  return callLLM(prompt);
}
