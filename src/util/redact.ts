/**
 * MedReconcile MCP — PHI Redaction Utility
 * Strips SSNs, DOBs, MRNs, emails, phone numbers, and other PII patterns from strings.
 * All log output MUST pass through this function.
 */

const PATTERNS: [RegExp, string][] = [
  // SSN: 123-45-6789 or 123456789
  [/\b\d{3}-?\d{2}-?\d{4}\b/g, "[REDACTED-SSN]"],
  // Email addresses
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[REDACTED-EMAIL]"],
  // Phone numbers (US formats)
  [/\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[REDACTED-PHONE]"],
  // MRN patterns (common formats: MRN-12345, MRN:12345)
  [/\bMRN[-:\s]?\d{4,}\b/gi, "[REDACTED-MRN]"],
  // Date of birth patterns (MM/DD/YYYY, YYYY-MM-DD)
  [/\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}\b/g, "[REDACTED-DOB]"],
];

/**
 * Redact potential PHI from a string.
 */
export function redact(input: string): string {
  let result = input;
  for (const [pattern, replacement] of PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
