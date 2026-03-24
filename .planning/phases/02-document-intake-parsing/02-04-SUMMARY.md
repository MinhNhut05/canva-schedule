---
phase: 02-document-intake-parsing
plan: 04
subsystem: api
tags: [pdfjs-dist, mammoth, unicode, vietnamese, parsing]

# Dependency graph
requires:
  - phase: 02-01
    provides: file validation contracts and shared document types
provides:
  - PDF text extraction adapter using pdfjs-dist legacy build
  - DOCX raw text extraction adapter using mammoth.extractRawText()
  - NFC-based text normalization preserving Vietnamese diacritics
affects: [document-pipeline, quality-scoring, upload-processing]

# Tech tracking
tech-stack:
  added: []
  patterns: [dynamic pdfjs import in server-only module, plain-text DOCX extraction, NFC-first normalization]

key-files:
  created:
    - src/lib/documents/extract-pdf.ts
    - src/lib/documents/extract-docx.ts
    - src/lib/documents/normalize.ts
  modified: []

key-decisions:
  - "Use pdfjs-dist legacy build through dynamic import so PDF extraction stays Node-compatible in server code."
  - "Use mammoth.extractRawText() and keep output as plain text to avoid unsafe HTML rendering from uploaded DOCX files."
  - "Normalize extracted text with NFC and whitespace cleanup only, preserving Vietnamese diacritics exactly for downstream quality scoring."

patterns-established:
  - "Parser adapters return raw extraction diagnostics such as pageCount, textItemCount, warnings, and lineCount."
  - "Normalization is a separate pure utility layered after extraction rather than embedded inside parser adapters."

requirements-completed: [DOC-04]

# Metrics
duration: 9min
completed: 2026-03-24
---

# Phase 2 Plan 04: Text Extractors and Normalization Summary

**Vietnamese-safe PDF and DOCX extraction adapters with NFC text normalization for downstream intake quality scoring**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-24T02:35:47Z
- **Completed:** 2026-03-24T02:44:21Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added a server-only PDF extraction adapter using `pdfjs-dist/legacy/build/pdf.mjs` with per-page text collection and scanned-PDF warning support.
- Added a server-only DOCX extraction adapter using `mammoth.extractRawText()` with warning passthrough and non-empty line counting.
- Added a pure normalization utility that converts text to NFC, standardizes line endings, cleans whitespace, and preserves Vietnamese diacritics.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build PDF text extraction adapter using pdfjs-dist** - `dd06b15` (feat)
2. **Task 2: Build DOCX text extraction adapter using mammoth** - `a973b4b` (feat)
3. **Task 3: Build text normalization module** - `c061c70` (feat)

**Plan metadata:** Recorded in the final docs commit for this plan's execution artifacts.

## Files Created/Modified
- `src/lib/documents/extract-pdf.ts` - Extracts plain text from PDF pages, tracks `pageCount`, `warnings`, and `textItemCount`.
- `src/lib/documents/extract-docx.ts` - Extracts DOCX raw text with Mammoth and counts non-empty lines for fragmentation checks.
- `src/lib/documents/normalize.ts` - Normalizes Unicode and whitespace without stripping Vietnamese diacritics.

## Decisions Made
- Used the PDF.js legacy Node build through dynamic import so the adapter can run safely in server-only code paths.
- Kept DOCX extraction on `extractRawText()` only, because Phase 2 needs readable raw text and should not render unsanitized HTML from uploads.
- Separated normalization into a pure utility so the upcoming pipeline can normalize parser output consistently before quality scoring.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- The plan's sample `grep -qv` verification lines can report false negatives for “absence” checks, so final verification relied on direct typecheck plus explicit negative searches across the implemented files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The extraction pipeline in Plan 02-05 can now import dedicated PDF and DOCX adapters plus a shared normalization helper.
- Raw extraction diagnostics are available for quality heuristics such as scanned PDF detection and fragmented DOCX warnings.

---
*Phase: 02-document-intake-parsing*
*Completed: 2026-03-24*

## Self-Check: PASSED
- Verified all expected source files exist on disk.
- Verified task commits `dd06b15`, `a973b4b`, and `c061c70` exist in git history.
