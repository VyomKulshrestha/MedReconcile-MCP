/**
 * MedReconcile MCP — Authentication Middleware
 * Validates API keys for MCP client connections.
 */

import type { IncomingMessage, ServerResponse } from "http";
import { config } from "../config.js";
import { logger } from "../logger.js";

/**
 * Validate the API key from the Authorization header.
 * Returns true if authenticated, false otherwise.
 */
export function authenticateRequest(req: IncomingMessage): boolean {
  // If no API keys configured, allow anonymous access (SHARP spec supports this)
  if (config.apiKeys.length === 0) {
    return true;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return false;
  }

  // Support "Bearer <key>" format
  if (authHeader.startsWith("Bearer ")) {
    const key = authHeader.slice(7).trim();
    return config.apiKeys.includes(key);
  }

  // Support "ApiKey <key>" format
  if (authHeader.startsWith("ApiKey ")) {
    const key = authHeader.slice(7).trim();
    return config.apiKeys.includes(key);
  }

  return false;
}

/**
 * Send a 401 Unauthorized response.
 */
export function sendUnauthorized(res: ServerResponse): void {
  logger.warn("Unauthorized request — invalid or missing API key");
  res.writeHead(401, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Unauthorized — provide a valid API key" }));
}

/**
 * Send a 403 Forbidden response (for missing SHARP context).
 */
export function sendForbidden(res: ServerResponse, message: string): void {
  logger.warn("Forbidden request — missing SHARP context", { message });
  res.writeHead(403, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: message }));
}
