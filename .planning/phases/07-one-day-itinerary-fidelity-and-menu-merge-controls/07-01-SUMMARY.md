---
phase: 07-one-day-itinerary-fidelity-and-menu-merge-controls
plan: 07-01
subsystem: ai
tags: [prompting, rules, vitest, one-day-tours, canva]
requires:
  - phase: 03-structured-ai-extraction-rules-human-review
    provides: structured draft schema, review flags, and deterministic rules pipeline
provides:
  - Source-near one-day extraction prompt constraints
  - RULE-08 fidelity and low-confidence review enforcement
  - RULE-09 program-label/title separation guardrail
  - Canonical Long Tuyền 2 regression coverage for extraction and rules
affects: [07-02, 07-03, one-day-canva-output]
tech-stack:
  added: []
  patterns:
    - Prefer source-near wording and needsReview over invented shortening for one-day itineraries
    - Enforce one-day wording fidelity with deterministic rules after extraction
key-files:
  created: []
  modified:
    - src/lib/ai/extraction-prompt.ts
    - src/lib/ai/__tests__/extract-tour.test.ts
    - src/lib/rules/definitions.ts
    - src/lib/rules/seed.ts
    - src/lib/rules/__tests__/engine.test.ts
key-decisions:
  - "One-day travel and return lines must keep explicit destinations instead of collapsing to generic 'Khởi hành đi/về' wording"
  - "If the extractor is unsure how to shorten a one-day activity, it should stay closer to the source and flag review instead of inventing broader phrasing"
patterns-established:
  - "Phase 7 fidelity pattern: preserve reviewed source wording for sensitive destination lines and use rules to catch over-shortening"
requirements-completed: [RULE-08, RULE-09]
duration: not-tracked
completed: 2026-04-11
---

# Summary: Plan 07-01 — One-day fidelity prompt and rule tightening

**One-day extraction now keeps canonical destination-rich wording, flags low-confidence shortening for review, and protects reviewed program-label/title separation through deterministic rules.**

## Performance

- **Duration:** Not tracked in this resumed execution
- **Started:** Not tracked in this resumed execution
- **Completed:** 2026-04-11
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Updated the extraction prompt so 1-day travel/return lines keep full destinations, `programName` stays separate from `title`, and the model avoids forcing phrases like `Sau khi dùng bữa trưa`.
- Added `RULE-08` to catch low-confidence one-day wording, generic outbound/return lines, and over-expanded activity blocks.
- Added `RULE-09` plus extraction/rules regressions for the canonical Long Tuyền 2 sample so the approved `program_label`, 13:00 block, and 15:30 return wording stay guarded.

## Task Commits

No plan-specific commits were created in this shared worktree execution. The changes remain local alongside other in-progress workspace edits.

## Files Created/Modified

- `src/lib/ai/extraction-prompt.ts` — tightened 1-day fidelity instructions around destinations, heading preservation, and conservative shortening.
- `src/lib/ai/__tests__/extract-tour.test.ts` — added canonical one-day extraction assertions for `programName`, 13:00 wording, and the full 15:30 return line.
- `src/lib/rules/definitions.ts` — introduced `RULE-08` and `RULE-09` to enforce one-day wording fidelity after extraction.
- `src/lib/rules/seed.ts` — seeded metadata for the new Phase 7 rules.
- `src/lib/rules/__tests__/engine.test.ts` — added regressions for generic return repair, low-confidence review flags, and program-label/title separation.

## Decisions Made

- Keep one-day wording source-near by default and treat uncertainty as a review problem, not a rewriting opportunity.
- Guard `programName` and `title` separately at the rules layer so Canva-facing labels cannot silently collapse back together.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The one-day draft contract now preserves the canonical wording needed by downstream review and Canva generation.
- Plan 07-02 can safely persist per-upload Canva options against the more stable one-day reviewed draft.

---
*Phase: 07-one-day-itinerary-fidelity-and-menu-merge-controls*
*Completed: 2026-04-11*
