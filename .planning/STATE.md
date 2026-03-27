---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Phase 6 Plan 02 complete
last_updated: "2026-03-27T17:00:00.000Z"
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 20
  completed_plans: 16
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-03-22)

**Core value:** Team members can transform a detailed tour program into a professional, condensed Canva design in seconds instead of manually reading, summarizing, and re-typing into Canva.
**Current focus:** Phase 06 — operational-polish-reliability

## Current Position

Phase: 06 (operational-polish-reliability) — EXECUTING
Plan: 2 of 2 — COMPLETE (all plans in Phase 06 done)

## Performance Metrics

**Velocity:**

- Total plans completed: 1
- Average duration: 9 min
- Total execution time: 0.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02 | 1 | 9 min | 9 min |

**Recent Trend:**

- Last 5 plans: 02-01 (9 min)
- Trend: Stable

*Updated after each plan completion*
| Phase 02 P01 | 9 min | 4 tasks | 23 files |
| Phase 02 P02 | 7 min | 2 tasks | 3 files |
| Phase 02 P03 | 6 min | 2 tasks | 6 files |
| Phase 02 P04 | 9 min | 3 tasks | 3 files |
| Phase 02 P05 | 8min | 3 tasks | 3 files |
| Phase 02 P06 | 3min | 3 tasks | 4 files |
| Phase 02 P07 | 21m | 2 tasks | 3 files |
| Phase 03 P01 | 14 min | 5 tasks | 15 files |
| Phase 03 P02 | 14 min | 7 tasks | 15 files |
| Phase 03 P03 | 33 min | 6 tasks | 9 files |
| Phase 04 P01 | 15 min | 3 tasks | 9 files |
| Phase 04 P02 | 11 min | 3 tasks | 9 files |
| Phase 04 P03 | 55 min | 4 tasks | 14 files |
| Phase 05 P01 | 20 min | 8 tasks | 20 files |
| Phase 05 P02 | 25 min | 11 tasks | 19 files |
| Phase 06 P01 | — | — | — |
| Phase 06 P02 | 20 min | 5 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1]: Treat Canva autofill feasibility as a hard early gate because Brand Templates or Enterprise may be required.
- [Phase 3]: Human review and inline edit are mandatory before any Canva generation.
- [Phase 4]: Keep Canva integration replaceable so output strategy can adapt if capability constraints appear.
- [Phase 02]: Bootstrapped the Tailwind and shadcn baseline manually after shadcn CLI preflight failed without Tailwind setup.
- [Phase 02]: Embedded Liberation Sans into generated PDF fixtures so Vietnamese diacritics remain reliable for extraction tests.
- [Phase 02]: Use binary signature sniffing via file-type after extension validation so renamed files cannot bypass intake checks.
- [Phase 02]: Persist accepted uploads immediately with PENDING status and return a clearly marked transitional stub until Plan 02-05 wires the real extraction pipeline.
- [Phase 02]: Use one shared sidebar content component for desktop and mobile so navigation labels, active state, and sign-out behavior stay consistent.
- [Phase 02]: Validate upload extension and size immediately in the client before POSTing FormData to /api/uploads so users get fast Vietnamese feedback without waiting for a server round trip.
- [Phase 02]: Use pdfjs-dist legacy build through dynamic import so PDF extraction stays Node-compatible in server code.
- [Phase 02]: Use mammoth.extractRawText() and keep output as plain text to avoid unsafe HTML rendering from uploaded DOCX files.
- [Phase 02]: Normalize extracted text with NFC and whitespace cleanup only, preserving Vietnamese diacritics exactly for downstream quality scoring.
- [Phase 02]: Map PDF pageCount/textItemCount and DOCX lineCount explicitly into QualityInput so scoring stays decoupled from extractor internals.
- [Phase 02]: Persist PROCESSING before extraction and finalize uploads as COMPLETED, COMPLETED_WITH_WARNING, or FAILED based on the extraction outcome.
- [Phase 02]: Use real PDF and DOCX fixtures in unit tests so Vietnamese extraction behavior stays covered end to end.
- [Phase 02]: Keep extraction quality messaging advisory in the UI so users can continue reviewing results without being blocked by warning or poor quality states.
- [Phase 02]: Load pdfjs-dist through a file URL with webpackIgnore so PDF extraction works reliably inside the Next server runtime used by API routes and Playwright.
- [Phase 02]: Delay window.fetch in the browser for the upload submission test instead of fulfilling the route manually so the real multipart request still exercises the extraction pipeline.
- [Phase 03]: Resolve both AI_API_* and ANTHROPIC_* env names through one server-only adapter so Phase 1 secret handling and Phase 3 gateway decisions stay compatible.
- [Phase 03]: Persist one canonical structuredDraft JSON payload plus workflow metadata on Upload instead of introducing new relational draft tables in v1.
- [Phase 03]: Treat AI extraction failure as non-fatal to upload success so parsed text remains available and users can retry extraction later.
- [Phase 03]: Made /review/[id] the canonical review URL so uploads can be bookmarked and resumed before Canva generation.
- [Phase 03]: Persist inline review edits by dot-path patching the canonical structuredDraft JSON with Zod revalidation instead of creating a separate draft model.
- [Phase 03]: Redirect successful uploads directly into the review page so extraction cannot bypass the mandatory approval gate.
- [Phase 03]: Run applyRules immediately after extractTour so only corrected drafts and explicit violations are persisted.
- [Phase 03]: Merge rule-derived flags into Upload.reviewFlags using rule:{ruleId}:{severity} markers for downstream review UI.
- [Phase 03]: Seed canonical CompanyRule rows now so Phase 5 admin tooling can evolve from stored metadata.

- [Phase 04]: Add CanvaToken and CanvaArtifact Prisma models for OAuth token persistence and per-artifact generation tracking with unique constraint on [uploadId, artifactType].
- [Phase 04]: Replace single CANVA_TEMPLATE_ID with four per-template env vars to support independent 1-day/2-day itinerary/menu template configuration.
- [Phase 04]: Template resolver, field-map manifest, and payload builders implemented as adapter boundary so Canva API path (autofill vs copy+edit) can be swapped in Plan 04-02.
- [Phase 04]: Refresh Canva access tokens from persisted DB state first, then fall back to env refresh token for bootstrap.
- [Phase 04]: Model Canva generation as either an immediate copied design or an async autofill job so the adapter contract stays stable despite API uncertainty.
- [Phase 04]: Resolve fresh design URLs after success instead of trusting stale edit URLs returned during creation.
- [Phase 04]: Keep approval and Canva generation separate while hydrating persisted artifact results on revisit.
- [Phase 04]: Allow Canva API and token URL overrides only through server env so Playwright can exercise the review generation flow against a local mock server.

- [Phase 05-01]: Add User.role field to DB with default "member" and propagate through Auth.js JWT/session pipeline.
- [Phase 05-01]: Use db push (not migrate dev) for schema changes when agent is running to avoid blocked reset prompts.
- [Phase 05-01]: Relax review page upload lookup to team-wide (no userId filter) for read; keep owner-only for mutations.
- [Phase 05-01]: Create CanvaTemplate model with @@unique([tourDuration, artifactType]) for DB-backed template registry.

- [Phase 05-02]: Migrate template resolver to DB — resolveTemplateId is now async, reads from db.canvaTemplate; CANVA_TEMPLATE_* env vars removed from runtime validation.
- [Phase 05-02]: Admin actions use assertAdmin() pattern — every server action checks session.user.role === "admin".
- [Phase 05-02]: Template verification calls GET /designs/{id} before persisting admin templateId changes.
- [Phase 05-02]: No create/delete for CanvaTemplate — fixed 4 slots (2 durations × 2 artifact types) are admin-editable only.

- [Phase 06-02]: Use db push (not migrate dev) for CanvaToken.cooldownUntil addition — consistent with Phase 05-01 decision to avoid blocked reset prompts.
- [Phase 06-02]: Global cooldown persisted in DB via canva_tokens.cooldownUntil so all users and server instances see the same rate-limit state.
- [Phase 06-02]: AI extraction uses exponential backoff (2^(attempt-1) * 1000ms) with 30s AbortController timeout per attempt — AbortError is retryable.
- [Phase 06-02]: Canva polling has 2-minute wall-clock deadline checked before each poll iteration, not after full POLL_DELAYS_MS exhaustion.
- [Phase 06-02]: cooldownUntil state in ReviewPage driven by Date object (not minutes) for precision; 30s setInterval tick updates displayed minutes.

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1] Current Canva Pro setup may not support production autofill without Brand Templates or Enterprise capability.
- [Phase 2] Vietnamese PDF/DOCX extraction quality may vary; scanned or table-heavy files could require fallback handling.

## Session Continuity

Last session: 2026-03-27T17:00:00.000Z
Stopped at: Phase 6 Plan 02 complete — all Phase 06 plans done
Resume file: .planning/phases/06-operational-polish-reliability/06-02-SUMMARY.md
