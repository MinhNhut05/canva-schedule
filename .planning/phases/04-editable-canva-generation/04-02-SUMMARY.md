---
phase: 04-editable-canva-generation
plan: 02
subsystem: api
tags: [canva, oauth, prisma, vitest, nextjs]

# Dependency graph
requires:
  - phase: 04-01
    provides: Canva Prisma models, template resolver, field map manifest, payload builders
provides:
  - Server-only Canva OAuth refresh and token persistence
  - Authenticated Canva REST client with 401 retry and rate-limit handling
  - Async generation orchestration with bounded polling and fresh design URL resolution
  - Top-level per-artifact adapter for review page Server Actions
affects: [review-actions, canva-generation, phase-04-plan-03, persistence]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-only canva adapter boundary, db-backed oauth rotation, structured rate-limit errors, immediate-design-or-job generation flow]

key-files:
  created:
    - src/lib/canva/oauth.ts
    - src/lib/canva/client.ts
    - src/lib/canva/jobs.ts
    - src/lib/canva/designs.ts
    - src/lib/canva/adapter.ts
    - src/lib/canva/__tests__/oauth.test.ts
    - src/lib/canva/__tests__/client.test.ts
    - src/lib/canva/__tests__/jobs.test.ts
  modified:
    - src/lib/db.ts

key-decisions:
  - "Refresh Canva access tokens from persisted DB state first, then fall back to env refresh token for bootstrap."
  - "Model generation creation as either an immediate copied design or an async autofill job so the adapter contract stays stable despite Canva API uncertainty."
  - "Resolve fresh design URLs after success instead of trusting stale edit URLs returned during creation."

patterns-established:
  - "Pattern 1: Server-only Canva modules own token lifecycle, HTTP auth, and polling details behind a typed adapter."
  - "Pattern 2: Canva rate limiting is surfaced as structured cooldown state instead of raw HTTP failure text."

requirements-completed: [CANVA-03, CANVA-05, SAFE-03]

# Metrics
duration: 11 min
completed: 2026-03-25
---

# Phase 4 Plan 2: Canva API Adapter, OAuth Token Lifecycle & Async Job Orchestration Summary

**Canva OAuth rotation, authenticated REST retries, async autofill polling, and per-artifact generation persistence behind one server-only adapter**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-25T13:41:00Z
- **Completed:** 2026-03-25T13:51:35Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Added a DB-backed Canva OAuth module that reuses unexpired tokens, refreshes expired tokens, and persists rotated refresh tokens.
- Added Canva API client and job helpers for Bearer auth, one-time 401 retry, 429 cooldown handling, copy-first generation, autofill fallback, and bounded polling.
- Added a top-level adapter that persists artifact status transitions and returns fresh editable Canva URLs for downstream review-page actions.

## Task Commits

Each task was committed atomically:

1. **Task 2.1: Create OAuth token persistence and auto-refresh module** - `89f1eb9` (feat)
2. **Task 2.2: Create authenticated REST client, async job orchestration, and design URL resolver** - `7fad4b0` (feat)
3. **Task 2.3: Create top-level Canva adapter with per-artifact persistence** - `5007ea9` (feat)

Plan metadata commit will be created after STATE/ROADMAP updates.

## Files Created/Modified
- `/home/minhnhut_dev/projects/siletravel/src/lib/canva/oauth.ts` - Server-only access token lookup, refresh, and DB persistence logic.
- `/home/minhnhut_dev/projects/siletravel/src/lib/canva/client.ts` - Authenticated Canva fetch wrapper with 401 retry and 429 cooldown parsing.
- `/home/minhnhut_dev/projects/siletravel/src/lib/canva/jobs.ts` - Design copy flow, autofill fallback, and bounded job polling helpers.
- `/home/minhnhut_dev/projects/siletravel/src/lib/canva/designs.ts` - Fresh design URL resolver by persisted design ID.
- `/home/minhnhut_dev/projects/siletravel/src/lib/canva/adapter.ts` - Per-artifact orchestration and persistence boundary for generation callers.
- `/home/minhnhut_dev/projects/siletravel/src/lib/canva/__tests__/oauth.test.ts` - OAuth refresh and persistence test coverage.
- `/home/minhnhut_dev/projects/siletravel/src/lib/canva/__tests__/client.test.ts` - REST auth and rate-limit handling tests.
- `/home/minhnhut_dev/projects/siletravel/src/lib/canva/__tests__/jobs.test.ts` - Autofill creation and polling lifecycle tests.
- `/home/minhnhut_dev/projects/siletravel/src/lib/db.ts` - Added `db` alias for plan snippets and Canva modules.

## Decisions Made
- Use persisted Canva tokens as the primary source of truth, with env refresh token only for bootstrap or empty-database recovery.
- Keep the adapter contract stable even though the plan's copy-first flow may return either a design immediately or an async job handle depending on Canva behavior.
- Resolve URLs through `getFreshDesignUrls()` after success so review-page persistence depends on `designId`, not temporary edit URLs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Exported `db` alias from Prisma singleton**
- **Found during:** Task 2.1 (Create OAuth token persistence and auto-refresh module)
- **Issue:** Existing Prisma helper exported `prisma` only, while the plan and new Canva modules consistently imported `db`.
- **Fix:** Added `export const db = prisma` to preserve existing behavior while matching plan code and future imports.
- **Files modified:** src/lib/db.ts
- **Verification:** OAuth module tests passed and TypeScript typecheck succeeded.
- **Committed in:** `89f1eb9`

**2. [Rule 1 - Bug] Reconciled immediate design copy results with async autofill polling**
- **Found during:** Task 2.2 (Create authenticated REST client, async job orchestration, and design URL resolver)
- **Issue:** The plan's copy-first example returned a design ID immediately, but the adapter example in Task 2.3 assumed every creation path produced a pollable job ID.
- **Fix:** Introduced a typed creation result union so the adapter can handle direct copied designs and async autofill fallback jobs without changing its public contract.
- **Files modified:** src/lib/canva/jobs.ts, src/lib/canva/adapter.ts
- **Verification:** Client/job tests passed and TypeScript typecheck succeeded.
- **Committed in:** `7fad4b0`, `5007ea9`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes were required for correctness and plan continuity. No scope creep beyond the Canva adapter boundary.

## Issues Encountered
- Initial Vitest mock setup for the OAuth module needed `vi.hoisted()` because mocked factories are hoisted before top-level variables.
- Polling tests needed fresh `Response` instances per mock call to avoid undici body reuse errors when the same response object was consumed repeatedly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The review page Server Action layer can now call one adapter per artifact and safely persist partial success or structured rate-limit failures.
- Remaining phase work should wire this adapter into approval/generation UI and present persisted Canva artifact state on `/review/[id]`.

## Self-Check
PASSED
- Found summary file on disk.
- Verified task commits `89f1eb9`, `7fad4b0`, and `5007ea9` in git history.

---
*Phase: 04-editable-canva-generation*
*Completed: 2026-03-25*
