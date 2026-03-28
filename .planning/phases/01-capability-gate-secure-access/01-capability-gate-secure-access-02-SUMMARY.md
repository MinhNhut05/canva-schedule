---
phase: 01-capability-gate-secure-access
plan: 02
subsystem: auth, middleware, ui
tags: [next-auth, jwt, credentials, middleware, playwright, sonner, e2e]

# Dependency graph
requires:
  - phase: 01-capability-gate-secure-access-01
    provides: "Env contract, User model, password utilities, seeded accounts"
provides:
  - "Middleware route protection with callbackUrl + reason redirect"
  - "Working credentials auth with 7-day JWT sessions"
  - "Minimal login UI with toast notification on auth-required redirect"
  - "Protected app shell with sidebar and logout"
  - "User-accessible password change flow"
  - "Automated E2E coverage for full auth slice"
affects: [01-03, 02, 03, 04, 05, 06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Middleware-level route protection via getToken() JWT check"
    - "callbackUrl + reason=auth-required redirect pattern for unauthenticated access"

key-files:
  created:
    - "middleware.ts"
  modified:
    - "src/lib/canva/field-map.ts"
    - "src/app/(app)/admin/templates/actions.ts"
    - "src/app/(app)/admin/templates/_components/template-edit-sheet.tsx"
    - "src/app/(app)/admin/templates/__tests__/actions.test.ts"
    - "tests/e2e/auth.spec.ts"

key-decisions:
  - "Move getFieldsForTemplate from 'use server' actions to shared field-map module — Next.js 15.5 requires all exported functions in server action files to be async"

patterns-established:
  - "Pattern: Middleware route protection using next-auth/jwt getToken()"
  - "Pattern: callbackUrl + reason query params for auth redirect UX"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 7 min
completed: 2026-03-28
---

# Phase 01 Plan 02: Auth Implementation, Route Protection, and E2E Verification Summary

**Middleware route protection with JWT token check, callbackUrl redirect, Vietnamese toast UX, and 9 passing E2E auth tests covering login/logout/session/password-change**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-28T07:47:32Z
- **Completed:** 2026-03-28T07:55:04Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Created middleware.ts for route-level protection with callbackUrl + reason=auth-required redirect per D-06/D-08
- Verified all existing auth artifacts from prior phases satisfy plan requirements (auth.ts, login page, password change, dashboard, sidebar)
- Fixed server action build failure by extracting getFieldsForTemplate to shared module
- All 9 E2E tests pass: redirect, toast, login, session persistence, authenticated redirect, logout, wrong password, re-login, password change

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement NextAuth credentials auth, 7-day sessions, and route protection** - `187cbd4` (feat)
2. **Task 2: Build the minimal login UX, toast redirect experience, and protected app shell** - `0998d75` (fix - server action build)
3. **Task 3: Add user-accessible password change and automated E2E auth verification** - `1a34d57` (test)

## Files Created/Modified
- `middleware.ts` - Route protection middleware with JWT check and callbackUrl redirect
- `src/lib/canva/field-map.ts` - Added getFieldsForTemplate shared helper
- `src/app/(app)/admin/templates/actions.ts` - Removed non-async export (build fix)
- `src/app/(app)/admin/templates/_components/template-edit-sheet.tsx` - Updated import path
- `src/app/(app)/admin/templates/__tests__/actions.test.ts` - Updated import path
- `tests/e2e/auth.spec.ts` - Fixed selectors to match Vietnamese UI, all 9 tests pass

## Decisions Made
- Moved getFieldsForTemplate from "use server" actions.ts to shared field-map.ts because Next.js 15.5 requires all exported functions in server action files to be async — pure helper is safely importable from both client and server code

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Server action build failure — non-async exported function**
- **Found during:** Task 2 (build verification)
- **Issue:** `getFieldsForTemplate` in admin templates actions.ts was a non-async export in a "use server" file; Next.js 15.5 rejects this
- **Fix:** Extracted the pure function to shared `src/lib/canva/field-map.ts` and updated all consumers
- **Files modified:** 4 files (actions.ts, template-edit-sheet.tsx, actions.test.ts, field-map.ts)
- **Verification:** `npm run build` passes, all unit tests pass
- **Committed in:** 0998d75

**2. [Rule 1 - Bug] E2E test selectors didn't match actual Vietnamese UI**
- **Found during:** Task 3 (E2E test run)
- **Issue:** Tests used `getByText("Dashboard")` and `getByText("Bảng điều khiển")` but "Bảng điều khiển" appears in both sidebar nav and page heading, causing strict mode violation
- **Fix:** Changed to `getByRole("heading", { name: "Bảng điều khiển" })` for unique targeting
- **Files modified:** tests/e2e/auth.spec.ts
- **Verification:** All 9 E2E tests pass
- **Committed in:** 1a34d57

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None — all verification checks passed after bug fixes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete auth infrastructure in place: middleware, auth, login, session, password change
- AUTH-01, AUTH-02, AUTH-03 requirements satisfied with automated E2E proof
- Ready for 01-03 (Canva autofill feasibility probe)

---
*Phase: 01-capability-gate-secure-access*
*Completed: 2026-03-28*
