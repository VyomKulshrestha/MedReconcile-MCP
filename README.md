# 🏥 MedReconcile MCP — AI-Powered Medication Reconciliation

> **SHARP-on-MCP compliant MCP server** that uses GenAI to detect drug interactions, therapeutic duplicates, and medication discrepancies that rule-based systems miss.

[![SHARP-on-MCP](https://img.shields.io/badge/SHARP--on--MCP-Compliant-blue)](https://sharponmcp.com)
[![MCP](https://img.shields.io/badge/MCP-v2025--03--26-green)](https://modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache%202.0-orange)](LICENSE)

## The Problem

Medication reconciliation — comparing a patient's orders to what they actually take — is one of healthcare's most dangerous bottlenecks:

- **~1.3M injuries/year** from medication errors (FDA)
- **50% of hospital med errors** occur at transitions of care
- Clinicians spend **12-17 min/patient** on manual reconciliation
- Rule-based systems miss **30-40% of conflicts** (brand/generic matching, therapeutic duplicates across specialties, OTC interactions)

## What This Does

MedReconcile MCP exposes 7 tools that any AI agent can invoke:

| Tool | Description |
|------|-------------|
| `get_current_medications` | Fetch active meds from FHIR (MedicationRequests + Statements) |
| `reconcile_medication_list` | AI semantic matching of EHR orders vs home meds |
| `detect_drug_interactions` | Drug-drug interactions, therapeutic duplicates, contraindications |
| `check_allergy_conflicts` | Cross-reference meds against AllergyIntolerance records |
| `suggest_alternatives` | Safe therapeutic alternatives when conflicts are found |
| `generate_reconciliation_report` | Clinician-ready report with risk stratification |
| `list_patients` | Available patient IDs (fixture mode) |

## Quick Start

```bash
git clone <repo-url> && cd medreconcile-mcp
npm install
cp .env.example .env  # defaults to fixture mode — no external setup needed
npm run dev            # starts on http://localhost:3333

# Test with MCP Inspector:
npx @modelcontextprotocol/inspector http://localhost:3333/mcp
```

Ships with **2 synthetic patients** (FHIR R4) and `DRY_RUN` mode — **zero external dependencies** for the demo.

## SHARP-on-MCP Compliance

| Requirement | Implementation |
|-------------|---------------|
| FHIR context discovery | `capabilities.experimental.fhir_context_required = true` |
| Context headers | `X-FHIR-Server-URL`, `X-FHIR-Access-Token`, `X-Patient-ID` |
| Authentication | API-key based (`Authorization: Bearer <key>`) |
| Missing context | Returns `403 Forbidden` |

## Safety

- **Synthetic data only** — no real PHI in the repository
- **PHI redaction** — all log output stripped of SSNs, DOBs, MRNs, emails, phones
- **No persistence** — FHIR data in-memory only during requests
- **SSRF protection** — private/loopback FHIR URLs blocked by default
- **DRY_RUN mode** — LLM tools return deterministic fixtures without API calls

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_MODE` | `fixture` | `fixture` (synthetic) or `fhir` (live server) |
| `PORT` | `3333` | HTTP port |
| `MCP_API_KEYS` | `dev-test-key` | Comma-separated API keys |
| `GEMINI_API_KEY` | — | Required when `DRY_RUN=false` |
| `DRY_RUN` | `true` | Return fixture LLM responses |
| `DEFAULT_FHIR_SERVER_URL` | `https://hapi.fhir.org/baseR4` | Default FHIR server |

## License

Apache 2.0
