/**
 * MedReconcile MCP — Logger
 * Simple structured logger with PHI redaction.
 */

import { config } from "./config.js";
import { redact } from "./util/redact.js";

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

const currentLevel = LEVELS[config.logLevel as Level] ?? LEVELS.info;

function log(level: Level, message: string, data?: Record<string, unknown>): void {
  if (LEVELS[level] < currentLevel) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: redact(message),
    ...(data ? { data: JSON.parse(redact(JSON.stringify(data))) } : {}),
  };
  const output = JSON.stringify(entry);
  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => log("debug", msg, data),
  info: (msg: string, data?: Record<string, unknown>) => log("info", msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => log("warn", msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log("error", msg, data),
};
