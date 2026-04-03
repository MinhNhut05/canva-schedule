---
phase: 02-document-intake-parsing
plan: 07
subsystem: testing
tags: [vitest, playwright, pdfjs-dist, nextjs, vietnamese-copy]

requires:
  - phase: 02-document-intake-parsing
    provides: upload UI, extraction pipeline, quality scoring, and extraction result rendering from Plans 02-05 and 02-06
provides:
  - quality scoring unit coverage with explicit extractor metadata inputs
  - end-to-end upload flow coverage for preview, validation, extraction result, warning, and reset states
  - runtime-safe PDF.js loading for real PDF extraction in Next server tests
affects: [phase-03-ai-extraction, upload-flow, extraction-pipeline, test-suite]

tech-stack:
  added: []
  patterns:
    - explicit QualityInput metadata in tests for kind/pageCount/textItemCount/lineCount
    - Playwright upload assertions locked to Vietnamese UI copy with diacritics
    - PDF.js loaded from file URL with webpackIgnore for Next server runtime compatibility

key-files:
  created:
    - src/lib/documents/quality.test.ts
    - tests/e2e/document-intake.spec.ts
  modified:
    - src/lib/documents/extract-pdf.ts

key-decisions:
  - "Load pdfjs-dist through a file URL with webpackIgnore so PDF extraction works reliably inside the Next server runtime used by API routes and Playwright."
  - "Delay window.fetch in the browser for the upload submission test instead of fulfilling the route manually so the real multipart request still exercises the extraction pipeline."

patterns-established:
  - "Testing Pattern: quality scoring cases must pass explicit extractor metadata instead of relying on hidden extractor internals."
  - "E2E Pattern: visible copy assertions use Vietnamese text with full diacritics and exact match locators where repeated text exists."

requirements-completed: [DOC-01, DOC-02, DOC-03, DOC-04, DOC-05]

duration: 21m
completed: 2026-03-24
---

# Phase 2 Plan 7: Quality Scoring Tests, E2E Tests, and Phase Gate Summary

**Quality scoring coverage now exercises extractor metadata explicitly, and the upload flow is protected by Playwright tests that verify Vietnamese preview, extraction, warning, and reset behavior end to end.**

## Performance

- **Duration:** 21m 15s
- **Started:** 2026-03-24T03:28:55Z
- **Completed:** 2026-03-24T03:50:10Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added 9 Vitest cases covering all 6 quality flags plus level classification and format-specific guardrails.
- Added 8 Playwright tests covering upload page access, sidebar labels, file preview, validation error, successful extraction, warning flow, and reset behavior.
- Fixed a real runtime blocker in PDF extraction so the Next API route can load PDF.js successfully during browser-driven E2E execution.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write quality scoring unit tests with extractor metadata** - `31dba61` (test)
2. **Task 2: Write e2e tests for complete upload and extraction flow** - `19255dd` (test)

**Plan metadata:** Pending

## Files Created/Modified
- `/home/minhnhut_dev/projects/siletravel/src/lib/documents/quality.test.ts` - Vitest coverage for quality scoring inputs, flags, and level classification.
- `/home/minhnhut_dev/projects/siletravel/tests/e2e/document-intake.spec.ts` - Playwright coverage for the complete document intake flow using real fixtures and Vietnamese assertions.
- `/home/minhnhut_dev/projects/siletravel/src/lib/documents/extract-pdf.ts` - Runtime-safe PDF.js loader used by the API extraction pipeline during E2E execution.

## Decisions Made
- Loaded `pdfjs-dist` through a file URL with `webpackIgnore` because the direct package import failed inside the Next server runtime during upload E2E execution.
- Delayed `window.fetch` in the browser for the submit-flow test so the UI processing state remains observable without breaking the real multipart upload request.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed PDF.js runtime loading for API upload extraction**
- **Found during:** Task 2 (Write e2e tests for complete upload and extraction flow)
- **Issue:** Real PDF uploads failed with `TypeError: Object.defineProperty called on non-object` when the API route dynamically imported `pdfjs-dist/legacy/build/pdf.mjs` inside the Next server runtime.
- **Fix:** Switched the extractor to import PDF.js from an absolute file URL with `webpackIgnore` and disabled the worker for server-side extraction.
- **Files modified:** `/home/minhnhut_dev/projects/siletravel/src/lib/documents/extract-pdf.ts`
- **Verification:** `npx vitest run src/lib/documents/extractors.test.ts`, `npx playwright test tests/e2e/document-intake.spec.ts`
- **Committed in:** `19255dd` (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The auto-fix was required to make the planned E2E upload flow executable with real PDF fixtures. No unrelated scope was added.

## Issues Encountered
- Playwright route interception with manual fulfill caused the upload-result assertion to become unreliable, so the test was adjusted to delay browser `fetch` while preserving the real backend response.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 gates now pass with `tsc`, Vitest suites, and Playwright upload coverage.
- Upload extraction behavior is now exercised against real PDF and DOCX fixtures, so Phase 3 can build on a verified raw-text handoff.

## Known Stubs
None.

## Self-Check: PASSED
- Verified summary and task files exist on disk.
- Verified task commits `31dba61` and `19255dd` exist in git history.

---
*Phase: 02-document-intake-parsing*
*Completed: 2026-03-24*
