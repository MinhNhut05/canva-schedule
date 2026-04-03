---
phase: 02-document-intake-parsing
plan: 02-05
subsystem: api
tags: [nextjs, typescript, prisma, pdfjs-dist, mammoth, document-intake, quality-scoring]
requires:
  - phase: 02-02
    provides: upload record persistence and initial /api/uploads route contract
  - phase: 02-04
    provides: PDF/DOCX extractors and text normalization
provides:
  - extraction pipeline orchestration with explicit metadata mapping
  - advisory quality scoring for PDF and DOCX extraction output
  - persisted upload processing lifecycle and extraction result storage
affects: [phase-03-ai-summarization, upload-history, extraction-preview]
tech-stack:
  added: []
  patterns:
    - explicit extractor metadata mapping into quality scoring input
    - advisory quality scoring before downstream document AI processing
    - upload status transitions persisted in Prisma around extraction lifecycle
key-files:
  created:
    - src/lib/documents/quality.ts
    - src/lib/documents/pipeline.ts
  modified:
    - src/app/api/uploads/route.ts
key-decisions:
  - "Map PDF pageCount/textItemCount and DOCX lineCount explicitly into QualityInput instead of coupling scoreQuality() to extractor internals."
  - "Persist PROCESSING before extraction and finalize uploads as COMPLETED, COMPLETED_WITH_WARNING, or FAILED based on extraction outcome."
patterns-established:
  - "Pipeline Pattern: extract -> normalize -> score -> return ExtractionResult"
  - "Quality Pattern: multi-signal advisory scoring with format-specific checks gated by document kind"
requirements-completed: [DOC-04, DOC-05]
duration: 8min
completed: 2026-03-24
---

# Phase 2 Plan 05: Quality Scoring, Extraction Pipeline, and Route Integration Summary

**Document extraction now flows through normalize-and-score orchestration with explicit PDF/DOCX metadata mapping and persisted upload lifecycle states.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-24T02:48:37Z
- **Completed:** 2026-03-24T02:56:18Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added a reusable quality scoring module that detects short text, replacement characters, low Vietnamese signal, symbol noise, scanned PDFs, and fragmented DOCX output.
- Built a server-only extraction pipeline that dispatches by document kind, normalizes extracted text, maps extractor metadata explicitly, and returns a typed `ExtractionResult`.
- Replaced the upload route transitional stub with real extraction processing, Prisma status updates, and persisted extraction/quality fields.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build quality scoring module with explicit extractor metadata input** - `faa909a` (feat)
2. **Task 2: Build extraction pipeline orchestrator with explicit metadata mapping** - `0e01e7c` (feat)
3. **Task 3: Update Route Handler to run extraction pipeline and persist results** - `64d3e82` (feat)

**Plan metadata:** Pending self-check and state update commit

## Files Created/Modified
- `src/lib/documents/quality.ts` - Defines `QualityInput`, six extraction quality signals, scoring deductions, and `scoreQuality()` level classification.
- `src/lib/documents/pipeline.ts` - Orchestrates extractor dispatch, text normalization, explicit metadata mapping, scoring, and `processingTimeMs` capture.
- `src/app/api/uploads/route.ts` - Runs the full extraction pipeline, persists upload lifecycle/status changes, stores extraction fields in Prisma, and handles Vietnamese extraction failures.

## Decisions Made
- Used one explicit `QualityInput` contract so `scoreQuality()` receives `kind`, `pageCount`, `textItemCount`, and `lineCount` from the pipeline instead of relying on implicit extractor knowledge.
- Treated quality scoring as advisory only: the route persists `COMPLETED_WITH_WARNING` for non-good results rather than blocking extraction output.
- Stored `PROCESSING` before extraction begins so database state reflects the real pipeline lifecycle instead of jumping directly from `PENDING` to terminal states.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 3 can consume normalized text, quality score, warning flags, and upload status directly from the persisted extraction result.
- Upload history and preview flows can now distinguish successful, warning-level, and failed extractions using stored Prisma fields.

## Self-Check: PASSED
- Verified summary and created files exist on disk.
- Verified task commits `faa909a`, `0e01e7c`, and `64d3e82` exist in git history.

---
*Phase: 02-document-intake-parsing*
*Completed: 2026-03-24*
