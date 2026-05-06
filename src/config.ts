/**
 * MedReconcile MCP — Application Configuration
 * Loads environment variables with sensible defaults.
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env file manually (no dotenv dependency needed)
function loadEnv(): void {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

export const config = {
  /** Server mode: "fixture" or "fhir" */
  mode: (process.env.MCP_MODE ?? "fixture") as "fixture" | "fhir",

  /** HTTP port */
  port: parseInt(process.env.PORT ?? "3333", 10),

  /** API keys for MCP client authentication */
  apiKeys: (process.env.MCP_API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean),

  /** Google Gemini API key */
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",

  /** LLM model name */
  llmModel: process.env.LLM_MODEL ?? "gemini-2.0-flash",

  /** LLM max output tokens */
  llmMaxTokens: parseInt(process.env.LLM_MAX_TOKENS ?? "4096", 10),

  /** DRY_RUN mode — LLM tools return fixtures */
  dryRun: (process.env.DRY_RUN ?? "true").toLowerCase() === "true",

  /** Default FHIR server URL */
  defaultFhirServerUrl:
    process.env.DEFAULT_FHIR_SERVER_URL ?? "https://hapi.fhir.org/baseR4",

  /** Allow private/loopback FHIR URLs */
  allowPrivateFhir:
    (process.env.MCP_ALLOW_PRIVATE_FHIR ?? "false").toLowerCase() === "true",

  /** Log level */
  logLevel: process.env.LOG_LEVEL ?? "info",
} as const;
