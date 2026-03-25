---
phase: 03-structured-ai-extraction-rules-human-review
plan: 03
subsystem: api
tags: [prisma, rules-engine, vitest, nextjs, zod]
requires:
  - phase: 03-01
    provides: structured AI extraction with schema-validated StructuredDraft payloads
  - phase: 03-02
    provides: review persistence and approval flow on Upload records
provides:
  - deterministic company rule enforcement for v1 itinerary, greeting, naming, and menu constraints
  - upload pipeline integration that applies rule auto-fixes before draft persistence
  - Prisma seed coverage for maintainable CompanyRule records and unit tests for all seven v1 rules
affects: [phase-4-canva-generation, phase-5-admin-control, review-workflow]
tech-stack:
  added: [Prisma CompanyRule model, Vitest rules-engine coverage]
  patterns: [pure rule definitions, applyRules orchestrator, rule-to-reviewFlag persistence]
key-files:
  created:
    - /home/minhnhut_dev/projects/siletravel/src/lib/rules/seed.ts
    - /home/minhnhut_dev/projects/siletravel/src/lib/rules/__tests__/engine.test.ts
    - /home/minhnhut_dev/projects/siletravel/.planning/phases/03-structured-ai-extraction-rules-human-review/03-03-SUMMARY.md
  modified:
    - /home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts
    - /home/minhnhut_dev/projects/siletravel/src/lib/review/draft.ts
    - /home/minhnhut_dev/projects/siletravel/prisma/seed.ts
key-decisions:
  - "Run applyRules immediately after extractTour so only correctedDraft plus explicit violations reach persistence."
  - "Merge deterministic rule flags into Upload.reviewFlags so the review UI can surface both extraction uncertainty and server-side rule outcomes from one field."
  - "Seed v1 rules into company_rules now so Phase 5 admin UI can evolve from stored metadata instead of hardcoded-only configuration."
patterns-established:
  - "Rules Engine Pattern: pure rule definitions mutate only cloned drafts through applyRules and emit structured violations."
  - "Review Flag Pattern: persistence merges derived draft review flags with rule:* severity markers before READY_FOR_REVIEW state."
requirements-completed: [RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, RULE-07]
duration: 33 min
completed: 2026-03-25
---

# Phase 3 Plan 03: Company Rules Engine Summary

**Deterministic rule enforcement for itinerary layout, greeting normalization, school-name cleanup, return wording, and menu review flags before Canva preparation.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-03-25T03:44:15Z
- **Completed:** 2026-03-25T04:18:22Z
- **Tasks:** 6
- **Files modified:** 9

## Accomplishments
- Added the v1 deterministic rules layer with a Prisma-backed CompanyRule model, pure rule types, seven rule definitions, and a shared applyRules orchestrator.
- Integrated rule execution into the upload pipeline so corrected drafts and rule-derived review flags persist before human review.
- Added repeatable database seeding plus full Vitest coverage for pass, fail, auto-fix, count, and no-mutation scenarios.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CompanyRule Prisma model and create Rule/RuleViolation/RuleResult types** - `9adbfac` (feat)
2. **Task 2: Implement RULE-01 through RULE-07 as pure checker functions** - `779670a` (feat)
3. **Task 3: Build applyRules() orchestrator that runs all active rules against a draft** - `779670a` (feat)
4. **Task 4: Create Prisma seed function to populate 7 v1 CompanyRule records** - `dfbf12b` (test)
5. **Task 5: Wire applyRules() into the upload pipeline between AI extraction and draft persistence** - `845b120` (feat)
6. **Task 6: Comprehensive unit tests for rules engine — all 7 rules with pass, fail, and auto-fix scenarios** - `dfbf12b` (test)

**Plan metadata:** pending

## Files Created/Modified
- `/home/minhnhut_dev/projects/siletravel/prisma/schema.prisma` - stores CompanyRule metadata for future admin management.
- `/home/minhnhut_dev/projects/siletravel/src/lib/rules/types.ts` - defines structured violation, result, and rule interfaces.
- `/home/minhnhut_dev/projects/siletravel/src/lib/rules/definitions.ts` - contains the seven pure v1 company rules.
- `/home/minhnhut_dev/projects/siletravel/src/lib/rules/engine.ts` - runs ordered rule evaluation and converts violations into persisted flag strings.
- `/home/minhnhut_dev/projects/siletravel/src/lib/rules/seed.ts` - upserts the seven canonical CompanyRule records.
- `/home/minhnhut_dev/projects/siletravel/prisma/seed.ts` - includes company-rule seeding in the main Prisma seed flow.
- `/home/minhnhut_dev/projects/siletravel/src/lib/review/draft.ts` - merges rule-derived flags into Upload.reviewFlags.
- `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts` - applies rules between extractTour() and saveDraft().
- `/home/minhnhut_dev/projects/siletravel/src/lib/rules/__tests__/engine.test.ts` - validates all seven rules and orchestrator behavior.

## Decisions Made
- Applied deterministic rule enforcement after schema validation instead of embedding persistence-aware logic in extraction code, keeping applyRules reusable and pure.
- Persisted rule outcomes as `rule:{ruleId}:{severity}` flags so downstream review UI can reason about auto-fixed versus needs-review cases without re-running rules.
- Seeded CompanyRule rows alongside existing user seeds to keep rule metadata synchronized with schema setup and ready for future admin tooling.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Narrowed test fixtures to OneDayDraft and TwoDayDraft unions**
- **Found during:** Task 6 (Comprehensive unit tests for rules engine)
- **Issue:** `Partial<StructuredDraft>` fixtures made TypeScript unhappy when mutating itinerary/menu branches across discriminated unions.
- **Fix:** Switched helpers to `OneDayDraft` and `TwoDayDraft` fixture builders so mutations stay type-safe and the Vitest suite compiles cleanly.
- **Files modified:** `/home/minhnhut_dev/projects/siletravel/src/lib/rules/__tests__/engine.test.ts`
- **Verification:** `npx tsc --noEmit`, `npx vitest run src/lib/rules/__tests__/engine.test.ts`
- **Committed in:** `dfbf12b`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required to complete verification without changing planned behavior or scope.

## Issues Encountered
- `gsd-tools init execute-phase` returned empty phase discovery for this continuation, so summary/state updates were completed manually against the known 03-03 plan paths.
- Prisma emitted a deprecation warning for `package.json#prisma`, but seeding and migration status remained successful and no plan change was required.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 now has deterministic post-AI enforcement plus persisted rule metadata, so Phase 4 can consume corrected review-approved content for Canva mapping.
- Phase 5 can build admin rule management on the seeded `company_rules` table instead of inventing a new storage shape.

## Known Stubs
None.

## Self-Check
PASSED
- FOUND: /home/minhnhut_dev/projects/siletravel/.planning/phases/03-structured-ai-extraction-rules-human-review/03-03-SUMMARY.md
- FOUND: 9adbfac
- FOUND: 779670a
- FOUND: 845b120
- FOUND: dfbf12b

---
*Phase: 03-structured-ai-extraction-rules-human-review*
*Completed: 2026-03-25*
