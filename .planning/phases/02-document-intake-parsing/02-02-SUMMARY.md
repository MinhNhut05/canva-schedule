---
phase: 02-document-intake-parsing
plan: 02
subsystem: api
tags: [nextjs, route-handler, prisma, file-type, multipart, validation]
requires:
  - phase: 01-capability-gate-secure-access
    provides:
      - authenticated Next.js session access via `auth()`
      - Prisma database client and protected app foundation
  - phase: 02-document-intake-parsing
    provides:
      - shared document intake types and file constraints from Plan 02-01
      - Upload persistence schema with `PENDING` lifecycle state
provides:
  - binary signature-based PDF/DOCX validation for upload intake
  - authenticated `/api/uploads` POST route with multipart parsing and upload persistence
  - transitional upload API response shape for later extraction pipeline integration
affects: [phase-2-upload-ui, extraction-pipeline, upload-api, testing]
tech-stack:
  added: []
  patterns:
    - server-only upload validation that checks presence, size, extension, and detected binary signature in order
    - authenticated App Router route handlers that persist an Upload row before downstream processing starts
    - transitional API stub responses explicitly marked for replacement by later extraction pipeline work
key-files:
  created:
    - src/lib/documents/detect.ts
    - src/lib/documents/intake.ts
    - src/app/api/uploads/route.ts
  modified: []
key-decisions:
  - "Use binary signature sniffing via `file-type` after extension validation so renamed files cannot bypass intake checks."
  - "Persist accepted uploads immediately with `PENDING` status and return a clearly marked transitional stub until Plan 02-05 wires the real extraction pipeline."
patterns-established:
  - "Upload validation order: presence -> size -> extension -> binary signature."
  - "Vietnamese server error messages for upload flows must preserve full diacritics and match the UI spec copy exactly."
  - "Upload route responses can return temporary extraction-shaped payloads when explicitly marked TRANSITIONAL for future replacement."
requirements-completed: [DOC-01, DOC-02, DOC-03]
duration: 7 min
completed: 2026-03-24
---

# Phase 2 Plan 02: File Validation Module and Route Handler Summary

**Server-side PDF/DOCX intake validation with binary signature checks, authenticated upload persistence, and a transitional extraction-shaped API stub**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T02:08:42Z
- **Completed:** 2026-03-24T02:15:46Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `detectFileSignature()` and `validateFile()` so uploads are rejected in Vietnamese when the file is missing, oversized, unsupported, or renamed to spoof its format.
- Shipped `/api/uploads` as an authenticated multipart POST endpoint that validates input and persists accepted uploads in PostgreSQL with `PENDING` status.
- Returned a clearly marked transitional response shaped like the future extraction result so Plans 02-03 and 02-05 can integrate against a stable contract.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build file validation module with binary signature detection** - `2a0b0a7` (feat)
2. **Task 2: Build authenticated Route Handler for file upload (transitional stub response)** - `33083b3` (feat)

## Files Created/Modified
- `/home/minhnhut_dev/projects/siletravel/src/lib/documents/detect.ts` - server-only binary signature detection using dynamic `file-type` import.
- `/home/minhnhut_dev/projects/siletravel/src/lib/documents/intake.ts` - ordered upload validation logic and Vietnamese error messages with full diacritics.
- `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts` - authenticated multipart upload endpoint with Prisma persistence and transitional stub response.
- `/home/minhnhut_dev/projects/siletravel/.planning/phases/02-document-intake-parsing/deferred-items.md` - out-of-scope tracking for pre-existing untracked extractor work discovered during execution.

## Decisions Made
- Used file-extension screening first and binary signature detection second, so obvious invalid files fail cheaply while renamed-file bypasses are still blocked before persistence.
- Kept the route response in the final `UploadApiResponse` shape now, but marked the extraction fields as `TRANSITIONAL` to make the handoff to Plan 02-05 explicit and traceable.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs
- `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts:52` - route returns a `TRANSITIONAL` stub response because Plan 02-05 is responsible for replacing it with real extraction pipeline output.
- `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts:62` - `rawText` is intentionally `""` until extraction integration lands in Plan 02-05.
- `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts:63` - `normalizedText` is intentionally `""` until extraction integration lands in Plan 02-05.
- `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts:65` - `quality` is intentionally `{ score: 0, level: "good", flags: [] }` as a transitional placeholder until Plan 02-05 computes real quality metrics.

## Issues Encountered
- Found pre-existing untracked file `/home/minhnhut_dev/projects/siletravel/src/lib/documents/extract-pdf.ts` while checking the working tree. It was outside Plan 02-02 scope, so it was logged in `/home/minhnhut_dev/projects/siletravel/.planning/phases/02-document-intake-parsing/deferred-items.md` for later review instead of being modified here.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts` now exposes the endpoint contract that Plan 02-03 can call from the upload UI.
- `/home/minhnhut_dev/projects/siletravel/src/lib/documents/intake.ts` provides reusable validation logic for both server routes and future tests.
- Plan 02-05 can replace the transitional stub payload with real extraction and quality output without changing the route path or authentication pattern.

---
*Phase: 02-document-intake-parsing*
*Completed: 2026-03-24*

## Self-Check: PASSED
- Found summary and all key artifacts on disk.
- Verified task commits `2a0b0a7` and `33083b3` exist in git history.
