/**
 * MedReconcile MCP — SHARP Context Middleware
 * 
 * Implements the SHARP-on-MCP specification for healthcare context propagation.
 * Extracts FHIR context from HTTP headers:
 *   - X-FHIR-Server-URL
 *   - X-FHIR-Access-Token
 *   - X-Patient-ID
 * 
 * @see https://sharponmcp.com/key-components.html
 */

import type { IncomingMessage } from "http";
import { logger } from "../logger.js";

/**
 * SHARP context extracted from HTTP headers.
 */
export interface SharpContext {
  /** The FHIR server base URL */
  fhirServerUrl: string | null;
  /** The FHIR access token (OAuth2 bearer token) */
  fhirAccessToken: string | null;
  /** The patient ID in context */
  patientId: string | null;
}

/**
 * Extract SHARP context from incoming HTTP request headers.
 */
export function extractSharpContext(req: IncomingMessage): SharpContext {
  const headers = req.headers;

  const ctx: SharpContext = {
    fhirServerUrl: (headers["x-fhir-server-url"] as string) ?? null,
    fhirAccessToken: (headers["x-fhir-access-token"] as string) ?? null,
    patientId: (headers["x-patient-id"] as string) ?? null,
  };

  logger.debug("Extracted SHARP context", {
    hasFhirServerUrl: !!ctx.fhirServerUrl,
    hasFhirAccessToken: !!ctx.fhirAccessToken,
    hasPatientId: !!ctx.patientId,
  });

  return ctx;
}

/**
 * Validate that required SHARP context fields are present.
 * Returns null if valid, or an error message if missing required fields.
 */
export function validateSharpContext(ctx: SharpContext): string | null {
  const missing: string[] = [];

  if (!ctx.fhirServerUrl) missing.push("X-FHIR-Server-URL");
  if (!ctx.fhirAccessToken) missing.push("X-FHIR-Access-Token");

  if (missing.length > 0) {
    return `Missing required SHARP headers: ${missing.join(", ")}`;
  }

  return null;
}

/**
 * Store for per-request SHARP context (simple async-local approach).
 * In a production system you'd use AsyncLocalStorage.
 */
let _currentContext: SharpContext | null = null;

export function setCurrentContext(ctx: SharpContext): void {
  _currentContext = ctx;
}

export function getCurrentContext(): SharpContext | null {
  return _currentContext;
}
