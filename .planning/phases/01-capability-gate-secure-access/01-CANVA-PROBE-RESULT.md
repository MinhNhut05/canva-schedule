# Canva Capability Probe Result — Phase 1 Go/No-Go (CANVA-07)

**Run timestamp:** 2026-03-28T07:50:40.319Z
**Probe script:** `scripts/canva-probe.ts`
**Probe command:** `npx tsx scripts/canva-probe.ts`

## Workspace / Template Identifiers

| Field | Value |
|-------|-------|
| CANVA_CLIENT_ID | *(not configured)* |
| CANVA_CLIENT_SECRET | *(not configured)* |
| CANVA_ACCESS_TOKEN | *(not configured)* |
| CANVA_REFRESH_TOKEN | *(not configured)* |
| CANVA_TEMPLATE_ID | *(not configured)* |

## Step-by-Step Results

### Step 1: API Connectivity
**Status:** NOT REACHED — credentials not configured
**HTTP Status:** N/A
**Details:** Probe rejected execution before API calls because all five required environment variables are missing.

### Step 2: Template Autofill
**Status:** NOT REACHED
**HTTP Status:** N/A
**Details:** Blocked by Step 1.

### Step 3: Editable Link Retrieval
**Status:** NOT REACHED
**HTTP Status:** N/A
**Details:** Blocked by Step 2.

## Dataset Field Summary

Not available — probe did not reach the API.

## Editable URL

Not available.

## Raw Probe Output

```json
{
  "timestamp": "2026-03-28T07:50:40.320Z",
  "templateId": "(not set)",
  "steps": [],
  "verdict": "NO-GO",
  "error": "Missing required environment variables: CANVA_CLIENT_ID, CANVA_CLIENT_SECRET, CANVA_ACCESS_TOKEN, CANVA_REFRESH_TOKEN, CANVA_TEMPLATE_ID\nSet these in .env.local before running the probe."
}
```

## Verdict: NO-GO

### Failing Step
The probe did not reach any API verification step. It exited at the credential validation stage because no Canva credentials or Brand Template ID are configured in the environment.

### Probable Root Cause

**Two independent blockers exist:**

1. **Missing credentials (immediate):** No Canva OAuth credentials or Brand Template ID have been configured in `.env.local`. The probe requires `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`, `CANVA_ACCESS_TOKEN`, `CANVA_REFRESH_TOKEN`, and `CANVA_TEMPLATE_ID` — all must be real SOHA Travel values, not placeholders.

2. **Canva plan limitation (structural — from research):** Even if credentials are provided, the Phase 1 research (01-RESEARCH.md §6) confirms that the Brand Template and autofill API endpoints require **Canva Enterprise** organization membership. The current SOHA Travel account uses **Canva Pro**, which does not support:
   - `GET /v1/brand-templates` — "must act on behalf of a user that's a member of a Canva Enterprise organization"
   - `GET /v1/brand-templates/{id}/dataset` — required plan: "Canva Enterprise"
   - `POST /v1/autofills` — "must act on behalf of a user that's a member of a Canva Enterprise organization"

   Research predicts that even with valid Canva Pro credentials, Step 1 would return HTTP 403 (permission denied).

### Does This Point to Plan Limitations?

**Yes.** The intended autofill workflow in Phase 4 (which uses `POST /v1/autofills` with Brand Templates) cannot work on Canva Pro. This is not a code bug or configuration error — it is a platform capability gap.

Key facts:
- Regular Canva designs (created under Pro) are **not autofillable** — only Brand Templates are
- Brand Templates can only be created in **Canva Enterprise** organizations
- The existing SOHA Travel templates (Canva Pro) would need to be **migrated or recreated** as Brand Templates under an Enterprise org

### What Must Change Before Phase 4 Can Rely on Canva

| # | Action Required | Owner | Notes |
|---|----------------|-------|-------|
| 1 | **Obtain Canva Enterprise access** for the SOHA Travel workspace | Team/Admin | Enterprise plan is required for Brand Templates API and autofill endpoints |
| 2 | **Register a private Canva Connect integration** under the Enterprise org | Team/Admin | Obtain Client ID + Client Secret |
| 3 | **Publish SOHA Travel templates as Brand Templates** | Design team | Existing Pro templates must be re-published as Brand Templates in the Enterprise workspace |
| 4 | **Complete OAuth flow** to obtain access + refresh tokens | Dev | Run one-time PKCE flow against the Enterprise integration |
| 5 | **Configure env vars** in `.env.local` with real values | Dev | CANVA_CLIENT_ID, CANVA_CLIENT_SECRET, CANVA_ACCESS_TOKEN, CANVA_REFRESH_TOKEN, CANVA_TEMPLATE_ID |
| 6 | **Re-run the probe** (`npx tsx scripts/canva-probe.ts`) | Dev | All 3 steps must pass to change verdict to GO |

### Alternative Paths (if Enterprise is not feasible)

| Option | Description | Trade-off |
|--------|-------------|-----------|
| A | Upgrade to Canva Enterprise → re-run probe | Cost increase; enables full autofill workflow as designed |
| B | Use Canva design copy + manual field editing | No autofill; user must manually fill Canva fields from app output |
| C | Switch to PDF generation output | Loses editable Canva output (core value); needs design rethink |
| D | Use Canva design copy API (`POST /v1/designs`) with post-edit | Partial automation; copies template but cannot pre-fill text fields |

**Recommendation:** Option A is the intended path. The entire Phase 4 pipeline was built around the autofill workflow. Options B–D would require significant redesign of the generation pipeline.

---

*Phase: 01-capability-gate-secure-access*
*Probe run: 2026-03-28*
*Verdict: NO-GO — Canva Enterprise and real credentials required*
