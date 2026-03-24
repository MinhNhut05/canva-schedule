---
phase: 02-document-intake-parsing
plan: 03
subsystem: ui
tags: [nextjs, react, tailwind, shadcn, upload, sidebar]
requires:
  - phase: 01-capability-gate-secure-access
    provides:
      - authenticated protected app shell via `auth()` and `signOut()`
      - protected dashboard route and session user metadata
  - phase: 02-document-intake-parsing
    provides:
      - shared upload API contract at `/api/uploads`
      - document size and extension constraints from `src/lib/documents/types.ts`
provides:
  - responsive protected app sidebar with Vietnamese navigation labels and sign-out action
  - dedicated `/upload` page shell for document intake
  - client-side upload form with drag-drop, preview metadata, inline validation, and FormData submission
affects: [phase-2-upload-ui, extraction-results-ui, upload-api, protected-layout]
tech-stack:
  added: []
  patterns:
    - shared protected layout navigation rendered as persistent desktop sidebar plus mobile sheet drawer
    - Vietnamese-first upload UI copy with full diacritics across navigation, page shell, validation, and preview state
    - client-side upload forms validate extension and size before sending `FormData` to authenticated route handlers
key-files:
  created:
    - src/components/app-sidebar.tsx
    - src/app/(app)/actions.ts
    - src/app/(app)/upload/page.tsx
    - src/app/(app)/upload/upload-form.tsx
  modified:
    - src/app/(app)/layout.tsx
    - src/app/(app)/dashboard/page.tsx
key-decisions:
  - "Use one shared sidebar content component for desktop and mobile so navigation labels, active state, and sign-out behavior stay consistent."
  - "Validate upload extension and size immediately in the client before POSTing `FormData` to `/api/uploads` so users get fast Vietnamese feedback without waiting for a server round trip."
patterns-established:
  - "Protected app pages should render their main navigation through `AppSidebar` instead of ad-hoc headers."
  - "Upload workflow UI keeps the selected file preview visible while processing so users retain context during asynchronous actions."
requirements-completed: [DOC-01, DOC-02, DOC-03]
duration: 6 min
completed: 2026-03-24
---

# Phase 2 Plan 03: Sidebar Navigation and Upload Page UI Summary

**Responsive protected navigation with a Vietnamese upload workspace, drag-drop file intake, metadata preview, and client-side validation before `/api/uploads` submission**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-24T02:22:51Z
- **Completed:** 2026-03-24T02:29:15Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Replaced the protected app header with a responsive sidebar that shows Vietnamese navigation labels, user metadata, and a sign-out action.
- Added `/upload` as a dedicated protected page with the required Vietnamese heading and helper copy for document intake.
- Implemented a client upload form with drag-and-drop, inline validation, file preview metadata, and `fetch("/api/uploads")` submission using `FormData`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build sidebar navigation component and refactor app layout** - `d4d55e0` (feat)
2. **Task 2: Build upload page with drag-and-drop zone and file preview panel** - `85c91c9` (feat)

## Files Created/Modified
- `/home/minhnhut_dev/projects/siletravel/src/components/app-sidebar.tsx` - responsive protected navigation with desktop sidebar and mobile sheet drawer.
- `/home/minhnhut_dev/projects/siletravel/src/app/(app)/actions.ts` - server action wrapper for sign-out.
- `/home/minhnhut_dev/projects/siletravel/src/app/(app)/layout.tsx` - protected app shell refactored from inline header to sidebar-based layout.
- `/home/minhnhut_dev/projects/siletravel/src/app/(app)/dashboard/page.tsx` - dashboard heading localized to Vietnamese for D-12 consistency.
- `/home/minhnhut_dev/projects/siletravel/src/app/(app)/upload/page.tsx` - server page shell for the upload workflow.
- `/home/minhnhut_dev/projects/siletravel/src/app/(app)/upload/upload-form.tsx` - client upload flow with drag-drop zone, preview panel, inline errors, and API submission.

## Decisions Made
- Reused one `SidebarContent` renderer for both desktop and mobile to avoid copy drift in labels, active state logic, and account actions.
- Kept upload validation on the client limited to extension and size, matching the server contract while preserving fast Vietnamese feedback before network submission.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Localized the visible dashboard heading for D-12 compliance**
- **Found during:** Task 1 (Build sidebar navigation component and refactor app layout)
- **Issue:** The protected dashboard page still rendered the English heading `Dashboard`, which would leave visible English UI text after the new Vietnamese sidebar shipped.
- **Fix:** Updated the dashboard heading to `Bảng điều khiển` so the protected shell remains consistently Vietnamese.
- **Files modified:** `src/app/(app)/dashboard/page.tsx`
- **Verification:** Grep confirmed the Vietnamese heading is present and the previous English label is no longer shown in the protected page heading.
- **Committed in:** `d4d55e0` (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The auto-fix was required to keep visible protected UI text compliant with the phase-wide Vietnamese copy contract. No scope creep.

## Issues Encountered
- Found pre-existing untracked planning artifacts and `/home/minhnhut_dev/projects/siletravel/src/lib/documents/extract-pdf.ts` in the working tree. They remained out of scope for Plan 02-03 and were left untouched.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The protected layout now exposes a stable navigation entry point to `/upload` for upcoming extraction-result work.
- The upload form already posts to the authenticated `/api/uploads` route from Plan 02-02, so Plan 02-05 can wire real extraction output without changing the UI entry flow.
- Plan 02-06 can extend `upload-form.tsx` with extraction results and advisory quality banners on top of the file selection state already in place.

---
*Phase: 02-document-intake-parsing*
*Completed: 2026-03-24*

## Self-Check: PASSED
- Found summary key artifacts on disk.
- Verified task commits `d4d55e0` and `85c91c9` exist in git history.
