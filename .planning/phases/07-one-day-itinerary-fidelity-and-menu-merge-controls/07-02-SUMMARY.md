---
phase: 07-one-day-itinerary-fidelity-and-menu-merge-controls
plan: 07-02
subsystem: ui
tags: [prisma, nextjs, server-actions, review-ui, playwright, vitest]
requires:
  - phase: 07-01
    provides: stable one-day reviewed wording and fidelity guardrails
provides:
  - Per-upload persisted Canva generation options on Upload.canvaOptions
  - Review-page one-day menu-merge toggle with SSR rehydration
  - Warning heuristic for oversized merged one-day itinerary content
  - Server-action and Playwright coverage for saved review options
affects: [07-03, review-flow, canva-generation]
tech-stack:
  added: []
  patterns:
    - Persist generation preferences separately from reviewed itinerary/menu facts
    - Rehydrate one-day review options on page load and save them independently from inline text edits
key-files:
  created: []
  modified:
    - prisma/schema.prisma
    - src/lib/review/draft.ts
    - src/app/(app)/review/[id]/actions.ts
    - src/app/(app)/review/[id]/page.tsx
    - src/components/review/review-page.tsx
    - src/components/review/review-actions.tsx
    - src/app/(app)/review/[id]/__tests__/actions.test.ts
    - tests/e2e/review-canva-generation.spec.ts
key-decisions:
  - "Store one-day Canva generation preferences as Upload.canvaOptions JSON so the choice remains per upload and separate from reviewed content"
  - "Use a warning heuristic instead of hard blocking when merged one-day content looks too long for the template"
patterns-established:
  - "One-day Canva option pattern: SSR-load persisted option, allow immediate toggle save, and show advisory warning before generation"
requirements-completed: [UX-05, UX-06]
duration: not-tracked
completed: 2026-04-11
---

# Summary: Plan 07-02 — Persist one-day Canva options and review warnings

**The review flow now persists a per-upload one-day menu-merge choice, rehydrates it on revisit, and warns when merged content is likely to overflow the Canva template.**

## Performance

- **Duration:** Not tracked in this resumed execution
- **Started:** Not tracked in this resumed execution
- **Completed:** 2026-04-11
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Added `Upload.canvaOptions` persistence plus `get/saveCanvaGenerationOptions()` helpers so the merge choice survives refreshes and later generation attempts.
- Integrated a 1-day-only review toggle (`Có nhập menu vào lịch trình không?`) with server action saving, SSR rehydration, and advisory warning copy.
- Extended server-action and Playwright coverage so the saved option and warning state survive revisit in the review flow.

## Task Commits

No plan-specific commits were created in this shared worktree execution. The changes remain local alongside other in-progress workspace edits.

## Files Created/Modified

- `prisma/schema.prisma` — added `canvaOptions Json?` to `Upload` for per-upload generation preferences.
- `src/lib/review/draft.ts` — introduced normalized option helpers and the one-day overflow warning heuristic.
- `src/app/(app)/review/[id]/actions.ts` — added the server action to save one-day Canva options.
- `src/app/(app)/review/[id]/page.tsx` — SSR-loads persisted Canva options and warning state.
- `src/components/review/review-page.tsx` — renders and saves the one-day merge toggle, disables generation while saving, and shows the warning alert.
- `src/components/review/review-actions.tsx` — accepts generate-disable state tied to option saving.
- `src/app/(app)/review/[id]/__tests__/actions.test.ts` — covers persisted option save behavior and warning state.
- `tests/e2e/review-canva-generation.spec.ts` — verifies saved toggle state and warning persistence across revisit.

## Decisions Made

- Persist the merge choice as generation metadata (`canvaOptions`) instead of storing it inside the reviewed itinerary/menu draft.
- Keep overflow handling advisory: warn first, but let the reviewer decide whether to shorten content or generate anyway.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma JSON input needed an explicit cast for persisted Canva options**
- **Found during:** Task 2.1 (persistent per-upload Canva generation options)
- **Issue:** Prisma rejected the raw typed object during TypeScript compilation for `Upload.canvaOptions` updates.
- **Fix:** Cast the normalized options object to `Prisma.InputJsonValue` at the persistence boundary.
- **Files modified:** `src/lib/review/draft.ts`
- **Verification:** `npx tsc --noEmit`
- **Committed in:** None — work remains uncommitted in the shared worktree.

**2. [Rule 3 - Blocking] Browser/runtime test prerequisites had to be restored for the review-flow regression**
- **Found during:** Task 2.3 (server-action and review-flow tests)
- **Issue:** The focused Playwright regression needed Chromium installed and the app running on a bindable local port.
- **Fix:** Installed Playwright Chromium, started the app on `3005` with the mock Canva env, and reran the regression against the live review flow.
- **Files modified:** None
- **Verification:** `npx playwright test tests/e2e/review-canva-generation.spec.ts`
- **Committed in:** None — environment/setup only.

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to verify the persisted option end to end. No scope creep.

## Issues Encountered

- Playwright locators needed to be tightened once the new one-day copy introduced additional matching text on the page; the regression now uses stricter selectors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Saved one-day Canva options now exist independently of the reviewed draft and are available for payload generation.
- Plan 07-03 can wire the persisted option into the actual one-day itinerary Canva payload without reopening the review UX contract.

---
*Phase: 07-one-day-itinerary-fidelity-and-menu-merge-controls*
*Completed: 2026-04-11*
