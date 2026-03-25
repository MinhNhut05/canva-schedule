---
phase: 03-structured-ai-extraction-rules-human-review
plan: 01
subsystem: api
tags: [openai, zod, prisma, nextjs, vitest, ai-extraction]

# Dependency graph
requires:
  - phase: 02-document-intake-parsing
    provides: upload persistence, normalized Vietnamese text extraction, upload API pipeline
provides:
  - structured AI extraction pipeline with schema validation
  - persisted review draft metadata on uploads
  - automatic post-upload AI extraction with non-fatal retryable failure handling
affects: [review-ui, rules-engine, canva-generation]

# Tech tracking
tech-stack:
  added: [openai]
  patterns: [server-only AI env adapter, duration-discriminated draft schema, upload-anchored review draft persistence]

key-files:
  created:
    - src/lib/ai/extraction-schema.ts
    - src/lib/ai/extraction-client.ts
    - src/lib/ai/extraction-prompt.ts
    - src/lib/ai/extract-tour.ts
    - src/lib/review/status.ts
    - src/lib/review/draft.ts
    - src/lib/ai/__tests__/extraction-schema.test.ts
    - src/lib/ai/__tests__/extract-tour.test.ts
    - prisma/migrations/20260325032135_add_ai_extraction_review_fields/migration.sql
  modified:
    - package.json
    - package-lock.json
    - prisma/schema.prisma
    - src/lib/env.ts
    - src/lib/ai/server-client.ts
    - src/app/api/uploads/route.ts

key-decisions:
  - "Resolve both AI_API_* and ANTHROPIC_* env names through one server-only adapter so Phase 1 secret handling and Phase 3 gateway decisions stay compatible."
  - "Persist one canonical structuredDraft JSON payload plus workflow metadata on Upload instead of introducing new relational draft tables in v1."
  - "Treat AI extraction failure as non-fatal to upload success so parsed text remains available and users can retry extraction later."

patterns-established:
  - "Pattern 1: Validate AI output with a duration-discriminated Zod schema before persistence."
  - "Pattern 2: Route upload parsing into extractTour() immediately after normalizedText is stored."
  - "Pattern 3: Store review flags and AI workflow state alongside the upload record for later review UI loading."

requirements-completed: [AI-01, AI-02, AI-05, SAFE-02]

# Metrics
duration: 14 min
completed: 2026-03-25
---

# Phase 3 Plan 01: Structured AI Extraction with Schema Validation Summary

**OpenAI-compatible tour extraction with a discriminated Vietnamese draft schema, persisted review metadata, and automatic post-upload AI orchestration**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-25T03:19:00Z
- **Completed:** 2026-03-25T03:33:07Z
- **Tasks:** 5
- **Files modified:** 15

## Accomplishments
- Installed the OpenAI SDK and extended the Upload model with AI lifecycle, review, and draft persistence fields.
- Added a schema-validated AI extraction pipeline with a hardcoded Vietnamese system prompt, retry wrapper, and typed draft parser.
- Wired upload processing to trigger AI extraction automatically and added unit coverage for schema safety and extraction error handling.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install openai package and extend Prisma schema with AI/review fields** - `72fcb6f` (feat)
2. **Task 2: Create Zod extraction schema with discriminated union and review status/draft helpers** - `0ca21de` (feat)
3. **Task 3: Create AI extraction client with retry, prompt, and extract-tour orchestrator** - `5157810` (feat)
4. **Task 4: Integrate AI extraction into upload pipeline** - `d804573` (feat)
5. **Task 5: Unit tests for extraction schema validation and extract-tour function** - `e13e7bb` (test)

## Files Created/Modified
- `package.json` - Adds the OpenAI SDK dependency for server-side extraction calls.
- `package-lock.json` - Locks the installed OpenAI package version.
- `prisma/schema.prisma` - Extends uploads with AI draft, status, and review metadata fields.
- `prisma/migrations/20260325032135_add_ai_extraction_review_fields/migration.sql` - Applies the new upload columns in PostgreSQL.
- `src/lib/env.ts` - Resolves AI env vars from either legacy `AI_API_*` names or Phase 3 `ANTHROPIC_*` names.
- `src/lib/ai/server-client.ts` - Continues exposing server-only AI config through the normalized env adapter.
- `src/lib/ai/extraction-schema.ts` - Defines the discriminated Zod schema and types for one-day and two-day drafts.
- `src/lib/ai/extraction-client.ts` - Wraps OpenAI-compatible API calls with retry classification and Vietnamese failures.
- `src/lib/ai/extraction-prompt.ts` - Stores the v1 Vietnamese extraction prompt with company-rule guidance.
- `src/lib/ai/extract-tour.ts` - Orchestrates AI call, JSON parsing, and schema validation.
- `src/lib/review/status.ts` - Defines AI and review workflow constants.
- `src/lib/review/draft.ts` - Persists validated drafts, failures, approvals, and derived review flags.
- `src/app/api/uploads/route.ts` - Triggers AI extraction after text parsing and preserves successful uploads when AI fails.
- `src/lib/ai/__tests__/extraction-schema.test.ts` - Covers discriminated schema acceptance and rejection cases.
- `src/lib/ai/__tests__/extract-tour.test.ts` - Covers AI JSON parsing, schema rejection, missing input, and review-flag preservation.

## Decisions Made
- Used a single env adapter in `/home/minhnhut_dev/projects/siletravel/src/lib/env.ts` so both old and new AI credential names resolve consistently without duplicating `process.env` access.
- Kept the draft as Upload-owned JSON because the current workflow revolves around one upload record progressing from parsing to review.
- Allowed AI extraction to fail without failing the upload route so users still retain parsed Vietnamese text and a recoverable upload record.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Prisma JSON typing in draft persistence**
- **Found during:** Task 2 (Create Zod extraction schema with discriminated union and review status/draft helpers)
- **Issue:** `structuredDraft` was initially cast to a generic record, which failed Prisma's `InputJsonValue` typing and blocked `npx tsc --noEmit`.
- **Fix:** Imported `Prisma` from `@prisma/client` and stored the draft as `Prisma.InputJsonValue`.
- **Files modified:** `src/lib/review/draft.ts`
- **Verification:** `npx tsc --noEmit`
- **Committed in:** `0ca21de` (part of task commit)

**2. [Rule 3 - Blocking] Narrowed discriminated union access in extract-tour tests**
- **Found during:** Task 5 (Unit tests for extraction schema validation and extract-tour function)
- **Issue:** Test code accessed `itinerary.morning` without narrowing the `StructuredDraft` union, causing TypeScript errors.
- **Fix:** Added an explicit `duration === "ONE_DAY"` assertion before reading one-day itinerary fields.
- **Files modified:** `src/lib/ai/__tests__/extract-tour.test.ts`
- **Verification:** `npx tsc --noEmit`, `npx vitest run src/lib/ai/__tests__/`
- **Committed in:** `e13e7bb` (part of task commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to keep the new extraction pipeline type-safe and verifiable. No scope creep.

## Issues Encountered
- Prisma warned that `package.json#prisma` is deprecated for Prisma 7, but this did not block the current Phase 3 work.

## User Setup Required
None - no external service configuration required during this plan.

## Next Phase Readiness
- Review UI work can now load a persisted `structuredDraft`, `reviewFlags`, and AI status from the upload record.
- Rules-layer work can consume the discriminated schema and canonical draft persistence path established here.
- Real gateway credentials are still required before exercising the extraction client against the actual AI service.

---
*Phase: 03-structured-ai-extraction-rules-human-review*
*Completed: 2026-03-25*

## Self-Check: PASSED
- Verified summary and key implementation files exist.
- Verified task commits `72fcb6f`, `0ca21de`, `5157810`, `d804573`, and `e13e7bb` exist in git history.
