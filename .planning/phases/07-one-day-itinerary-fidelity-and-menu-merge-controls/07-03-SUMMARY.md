---
phase: 07-one-day-itinerary-fidelity-and-menu-merge-controls
plan: 07-03
subsystem: api
tags: [canva, payloads, server-actions, vitest, playwright]
requires:
  - phase: 07-01
    provides: canonical one-day wording and program-label/title fidelity
  - phase: 07-02
    provides: persisted per-upload Canva options and review warning state
provides:
  - One-day itinerary payload support for saved menu-merge options
  - Canonical program-label/title and destination-preserving payload regressions
  - Action-layer wiring so generate and retry both read durable one-day options
  - Mock-Canva end-to-end assertions against actual outgoing autofill payloads
affects: [phase-07-complete, canva-generation, future-one-day-template-work]
tech-stack:
  added: []
  patterns:
    - Insert concise one-day menu lines into itinerary sections only when the saved option is enabled
    - Verify Canva output regressions against captured outgoing autofill payloads, not just UI state
key-files:
  created: []
  modified:
    - src/lib/canva/payload.ts
    - src/lib/canva/__tests__/payload.test.ts
    - src/app/(app)/review/[id]/actions.ts
    - src/app/(app)/review/[id]/__tests__/actions.test.ts
    - tests/e2e/review-canva-generation.spec.ts
key-decisions:
  - "When no meal sentence exists in the one-day itinerary block, merged lunch/snack lines should be inserted before the return leg instead of after it"
  - "Playwright should assert against the actual PATCH payload sent to the mocked Canva design endpoint so saved-option regressions are caught end to end"
patterns-established:
  - "One-day payload pattern: use reviewed programName/title as separate fields, preserve canonical wording, and merge menu lines only from persisted generation options"
requirements-completed: [CANVA-08, UX-06]
duration: not-tracked
completed: 2026-04-11
---

# Summary: Plan 07-03 — Apply saved one-day options in Canva payload generation

**The one-day Canva itinerary payload now reads the saved per-upload merge option, preserves the canonical Long Tuyền/Suối Tiên wording, and is guarded by unit plus end-to-end payload assertions.**

## Performance

- **Duration:** Not tracked in this resumed execution
- **Started:** Not tracked in this resumed execution
- **Completed:** 2026-04-11
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Refactored `buildOneDayItineraryPayload()` so saved one-day options can inject concise menu lines into the appropriate itinerary section without affecting two-day payloads.
- Wired `generateCanva()` and `retryCanvaArtifact()` to load persisted one-day options before building itinerary payloads.
- Upgraded regression coverage to assert the canonical `program_label`, 13:00 wording, 15:30 return destination, and before/after merge differences against the actual mocked Canva payload.

## Task Commits

No plan-specific commits were created in this shared worktree execution. The changes remain local alongside other in-progress workspace edits.

## Files Created/Modified

- `src/lib/canva/payload.ts` — added one-day merge-option support, concise menu-line injection helpers, and section-aware insertion before return travel when no meal anchor exists.
- `src/lib/canva/__tests__/payload.test.ts` — added canonical Phase 7 payload regressions for label/title separation and merge-enabled output changes.
- `src/app/(app)/review/[id]/actions.ts` — loads persisted one-day Canva options for both generate and retry paths.
- `src/app/(app)/review/[id]/__tests__/actions.test.ts` — verifies one-day itinerary generation and retry both reuse durable options.
- `tests/e2e/review-canva-generation.spec.ts` — captures outgoing Canva PATCH payloads and asserts canonical content before and after toggling the saved merge option.

## Decisions Made

- Keep the adapter boundary intact: the saved option is resolved in review actions, then passed into the one-day itinerary payload builder only where needed.
- Treat the mocked Canva PATCH payload as the source of truth for end-to-end verification so UI-only regressions cannot mask incorrect autofill data.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Duplicate `Tạo lại` buttons made the new Playwright regenerate step ambiguous**
- **Found during:** Task 3.3 (canonical end-to-end regression)
- **Issue:** The updated review page exposed two matching regenerate buttons, causing Playwright strict-mode locator failure.
- **Fix:** Tightened the test locator to target the first visible regenerate button used in the completed-results section.
- **Files modified:** `tests/e2e/review-canva-generation.spec.ts`
- **Verification:** `npx playwright test tests/e2e/review-canva-generation.spec.ts`
- **Committed in:** None — work remains uncommitted in the shared worktree.

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was verification-only and kept the implementation scope unchanged.

## Issues Encountered

- `apply_patch` was unavailable in this environment, so file edits were written directly and then validated with targeted tests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 7 success criteria are covered across extraction, rules, review persistence, and Canva payload generation.
- The milestone is ready for phase-level verification and any follow-up roadmap work.

---
*Phase: 07-one-day-itinerary-fidelity-and-menu-merge-controls*
*Completed: 2026-04-11*
