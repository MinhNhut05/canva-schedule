---
phase: 08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit
plan: 04
subsystem: ui
tags: [gap-closure, authorization, playwright, type-safety]
requires:
  - phase: 08-03
    provides: proof surface and smoke spec baseline
provides:
  - scoped /history proof surface by role
  - defensive page param parsing for history pagination
  - rerunnable visual smoke auth bootstrap
  - corrected heading ref types for CardTitle and AlertTitle
affects: [phase-08-verification, history-page, visual-proof-gate]
tech-stack:
  added: []
  patterns:
    - shared Prisma where filter for member vs admin history access
    - Playwright sign-in helper for deterministic setup
key-files:
  created:
    - .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-04-SUMMARY.md
  modified:
    - src/app/(app)/history/page.tsx
    - tests/e2e/personal-website-visual-system.spec.ts
    - src/components/ui/card.tsx
    - src/components/ui/alert.tsx
key-decisions:
  - "Kept proof surface on /history but restricted data visibility to admin or current user through one shared Prisma where filter."
  - "Stabilized Playwright setup with explicit signIn helper before navigating to /history, instead of repeating brittle login bootstrap in each test."
patterns-established:
  - "Gap-closure proof-gate fixes stay inside existing route/spec instead of creating a new validation surface."
requirements-completed: [PW-UI-03, PW-UI-05]
duration: not-tracked
completed: 2026-04-23
---

# Summary: Plan 08-04 — Close proof-gate safety and stability gaps

Phase 8 proof route is now role-scoped and pagination-safe. Visual smoke validation reruns cleanly, and shared heading primitive refs now match rendered DOM elements.

## Performance
- Duration: Not tracked
- Tasks: 2
- Files modified: 5

## Accomplishments
- Scoped `/history` Prisma reads through a shared `where` filter based on `session.user.role` and `session.user.id`.
- Hardened `page` parsing so malformed values fall back to page 1 instead of generating `NaN` skip values.
- Stabilized `tests/e2e/personal-website-visual-system.spec.ts` with reusable sign-in helper and deterministic `/history` setup.
- Fixed `CardTitle` and `AlertTitle` ref typings to use `HTMLHeadingElement`.

## Verification
- `npm run typecheck` passed.
- `npx playwright test tests/e2e/personal-website-visual-system.spec.ts --project=chromium` passed (5/5) when run against local dev server.

## Deviations from plan
- None.

## Issues encountered
- Direct Playwright run initially hit config `webServer` timeout again. Resolved by starting local dev server manually with expected env and rerunning the spec successfully.

## Self-Check: PASSED
- `/history` query now shares one scoped `where` filter for `findMany` and `count`.
- Invalid `page` values no longer flow into `skip` as `NaN`.
- Smoke spec reruns green.
- Heading ref types match rendered heading elements.

---
*Phase: 08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit*
*Completed: 2026-04-23*
