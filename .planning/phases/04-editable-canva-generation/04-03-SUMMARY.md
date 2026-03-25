---
phase: 04-editable-canva-generation
plan: 03
subsystem: ui
tags: [canva, review, nextjs, prisma, vitest, playwright]
requires:
  - phase: 03-structured-ai-extraction-rules-human-review
    provides: mandatory review gate, canonical structuredDraft editing, /review/[id] resume flow
  - phase: 04-editable-canva-generation
    provides: template resolver, payload builders, Canva adapter/job orchestration
provides:
  - approve-then-generate Canva flow on the review page
  - persisted itinerary/menu Canva result cards with open and copy actions
  - Playwright E2E coverage for review-to-Canva generation with local Canva mock server
affects: [phase-05-history-admin-control, phase-06-operational-polish-reliability, canva-generation, review-ui]
tech-stack:
  added: []
  patterns:
    - server actions for generate/retry/load Canva artifacts
    - client-side hydration of persisted Canva artifact state with retry/regenerate handling
    - test-only Canva API base URL overrides for end-to-end mockability
key-files:
  created:
    - src/app/(app)/review/[id]/__tests__/actions.test.ts
    - src/components/review/template-confirmation.tsx
    - src/components/review/canva-generation-panel.tsx
    - src/components/review/canva-result-card.tsx
    - tests/e2e/review-canva-generation.spec.ts
  modified:
    - src/app/(app)/review/[id]/actions.ts
    - src/app/(app)/review/[id]/page.tsx
    - src/components/review/review-page.tsx
    - src/components/review/review-actions.tsx
    - src/components/review/__tests__/template-confirmation.test.tsx
    - src/components/review/__tests__/canva-result-card.test.tsx
    - src/lib/canva/client.ts
    - src/lib/canva/oauth.ts
    - playwright.config.ts
    - tsconfig.json
key-decisions:
  - "Keep approval and Canva generation as two separate review actions while hydrating persisted artifact results on revisit."
  - "Allow Canva API base URL and token URL overrides only through server env so Playwright can exercise the full review generation flow against a local mock server."
patterns-established:
  - "Review Canva orchestration: approve -> confirm template pair -> generate both artifacts in parallel -> retry failed artifact or regenerate both."
  - "Persisted artifact cards are treated as the source of truth when reopening /review/[id], with fresh Canva URLs resolved server-side."
requirements-completed: [CANVA-01, CANVA-02, CANVA-03, CANVA-04, CANVA-05, CANVA-06, UX-03, UX-04, SAFE-03]
duration: 55 min
completed: 2026-03-25
---

# Phase 4 Plan 03: Reviewed-content-to-editable-link Flow End to End Summary

**Approved review drafts now generate persisted itinerary and menu Canva links with inline progress, retry/re-generate handling, and reopen/copy actions verified end to end.**

## Performance

- **Duration:** 55 min
- **Started:** 2026-03-25T14:03:00Z
- **Completed:** 2026-03-25T14:57:50Z
- **Tasks:** 4
- **Files modified:** 14

## Accomplishments
- Added server actions to generate both Canva artifacts in parallel, retry a single failed artifact, and reload persisted artifact URLs on revisit.
- Shipped the review-page Canva UX: separate approval vs generation, template confirmation, inline progress/rate-limit states, result cards, retry, and re-generation.
- Added component/unit coverage plus a real Playwright review-to-Canva E2E flow using a local mock Canva server.

## Task Commits

Each task was committed atomically:

1. **Task 3.1: Create Server Actions for Canva generation, retry, and artifact loading** - `334397d` (feat)
2. **Task 3.2: Create template confirmation, generation panel, and result card UI components** - `6af42d2` (feat)
3. **Task 3.3: Wire review page: split approve/generate, integrate components, handle all states** - `d35fd2b` (feat)
4. **Task 3.4: Create E2E test for the full review→approve→generate→open/copy flow** - `8935496` (feat)
5. **Post-verification fix: stabilize review component test harness** - `ee6584d` (fix)

**Plan metadata:** Pending final docs commit

## Files Created/Modified
- `/home/minhnhut_dev/projects/siletravel/src/app/(app)/review/[id]/actions.ts` - Adds generateCanva, retryCanvaArtifact, and loadCanvaArtifacts server actions with partial-success handling.
- `/home/minhnhut_dev/projects/siletravel/src/app/(app)/review/[id]/page.tsx` - Loads template pair and persisted Canva artifacts for review-page hydration.
- `/home/minhnhut_dev/projects/siletravel/src/components/review/review-page.tsx` - Wires approval, template confirmation, generation progress, retry, regenerate, and revisit persistence states.
- `/home/minhnhut_dev/projects/siletravel/src/components/review/review-actions.tsx` - Splits sticky footer behavior between approval and Canva generation.
- `/home/minhnhut_dev/projects/siletravel/src/components/review/template-confirmation.tsx` - Renders the auto-selected template pair confirmation panel.
- `/home/minhnhut_dev/projects/siletravel/src/components/review/canva-generation-panel.tsx` - Renders generation and rate-limit feedback inline.
- `/home/minhnhut_dev/projects/siletravel/src/components/review/canva-result-card.tsx` - Renders per-artifact result actions for open, copy, retry, and optional re-generation.
- `/home/minhnhut_dev/projects/siletravel/src/app/(app)/review/[id]/__tests__/actions.test.ts` - Verifies generate/retry/load server-action behavior.
- `/home/minhnhut_dev/projects/siletravel/src/components/review/__tests__/template-confirmation.test.tsx` - Verifies confirmation panel copy and CTA behavior.
- `/home/minhnhut_dev/projects/siletravel/src/components/review/__tests__/canva-result-card.test.tsx` - Verifies result-card copy and failed-state behavior.
- `/home/minhnhut_dev/projects/siletravel/tests/e2e/review-canva-generation.spec.ts` - Exercises approve → confirm template → generate → copy/open → revisit persistence.
- `/home/minhnhut_dev/projects/siletravel/playwright.config.ts` - Injects test-only Canva env overrides into the Playwright dev server command.
- `/home/minhnhut_dev/projects/siletravel/src/lib/canva/client.ts` - Supports env-based Canva API base URL override for E2E mockability.
- `/home/minhnhut_dev/projects/siletravel/src/lib/canva/oauth.ts` - Supports env-based Canva token URL override for E2E mockability.
- `/home/minhnhut_dev/projects/siletravel/tsconfig.json` - Aligns JSX compilation with the review component test path.

## Decisions Made
- Kept approval and Canva generation separate so the mandatory human review gate remains explicit even when generation state is revisited later.
- Hydrated the review page from persisted Canva artifacts and resolved fresh URLs server-side instead of trusting stale in-memory client results.
- Used server-side env overrides for Canva API/token endpoints so Playwright can run a true end-to-end generation flow without calling the real Canva service.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed review-page prop contract after server page hydration change**
- **Found during:** Task 3.1 (Create Server Actions for Canva generation, retry, and artifact loading)
- **Issue:** `page.tsx` began passing `canvaArtifacts` and `templatePair`, but `ReviewPage` did not accept those props yet.
- **Fix:** Extended `ReviewPage` prop types immediately so task 3.1 did not leave the route in a broken state.
- **Files modified:** `/home/minhnhut_dev/projects/siletravel/src/components/review/review-page.tsx`
- **Verification:** `npm run typecheck`
- **Committed in:** `334397d`

**2. [Rule 3 - Blocking] Stabilized component tests against current Vitest/Rolldown TSX limitations**
- **Found during:** Task 3.2 (Create template confirmation, generation panel, and result card UI components)
- **Issue:** Review component tests failed when Vitest parsed JSX-heavy shadcn primitives (`button`, `badge`, `card`) through the current test stack.
- **Fix:** Mocked the relevant UI primitives inside the two review component tests and aligned JSX compilation with `react-jsx`.
- **Files modified:** `/home/minhnhut_dev/projects/siletravel/src/components/review/__tests__/template-confirmation.test.tsx`, `/home/minhnhut_dev/projects/siletravel/src/components/review/__tests__/canva-result-card.test.tsx`, `/home/minhnhut_dev/projects/siletravel/tsconfig.json`
- **Verification:** `npx vitest run src/app/(app)/review/[id]/__tests__/actions.test.ts src/components/review/__tests__/template-confirmation.test.tsx src/components/review/__tests__/canva-result-card.test.tsx`
- **Committed in:** `ee6584d`

**3. [Rule 3 - Blocking] Added test-only Canva endpoint overrides so E2E could mock server-side Canva calls**
- **Found during:** Task 3.4 (Create E2E test for the full review→approve→generate→open/copy flow)
- **Issue:** Playwright cannot intercept Next.js server-action fetches directly, so the review generation E2E needed a server-side mock route.
- **Fix:** Added env-driven overrides for Canva API/token endpoints and configured Playwright to boot the app against a local mock Canva server.
- **Files modified:** `/home/minhnhut_dev/projects/siletravel/src/lib/canva/client.ts`, `/home/minhnhut_dev/projects/siletravel/src/lib/canva/oauth.ts`, `/home/minhnhut_dev/projects/siletravel/playwright.config.ts`, `/home/minhnhut_dev/projects/siletravel/tests/e2e/review-canva-generation.spec.ts`
- **Verification:** `npx playwright test tests/e2e/review-canva-generation.spec.ts`
- **Committed in:** `8935496`

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes were required to keep verification real and the review-to-Canva flow executable end to end. No product scope creep.

## Issues Encountered
- Local test DB initially lacked the `canva_artifacts` table even though Prisma migration status reported up to date; resolved during verification by syncing schema with `npx prisma db push` before rerunning the E2E spec.
- Playwright strict-mode text locators needed narrowing for repeated Vietnamese copy in alerts, headings, and buttons; the spec was updated to use more precise role-based assertions.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Next Phase Readiness
- Phase 4 now has the full reviewed-content-to-editable-link path working with persisted revisit behavior and E2E coverage.
- Phase 5 can build history/admin features on top of persisted `CanvaArtifact` records and stable review-page resume behavior.
- Production readiness still depends on the earlier Canva capability concern: real account/template support must remain valid outside the E2E mock path.

---
*Phase: 04-editable-canva-generation*
*Completed: 2026-03-25*

## Self-Check: PASSED
- Found SUMMARY file at `/home/minhnhut_dev/projects/siletravel/.planning/phases/04-editable-canva-generation/04-03-SUMMARY.md`
- Found task commits: `334397d`, `6af42d2`, `d35fd2b`, `8935496`, `ee6584d`
