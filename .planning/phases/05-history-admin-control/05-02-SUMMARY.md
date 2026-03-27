---
phase: 05-history-admin-control
plan: 02
subsystem: admin
tags: [nextjs, prisma, server-actions, canva, shadcn, vitest]

# Dependency graph
requires:
  - phase: 05-01
    provides: User.role field, CanvaTemplate model, Auth.js role propagation, require-admin.ts helper

provides:
  - Server-side admin route protection at /admin/* (role guard layout)
  - DB-based Canva template resolver (replaces env vars)
  - Canva template verification helper (GET /designs/{id})
  - Admin rules CRUD with seeded rule protections at /admin/rules
  - Admin templates CRUD with Canva verification at /admin/templates
  - Two-column field mapping editor for Canva template elements
  - Integration tests for admin actions and DB-based resolver
affects: [future-phases, canva-generation, playwright-e2e]

# Tech tracking
tech-stack:
  added: [shadcn table, shadcn switch]
  patterns: [server-action admin assertion, async DB-based resolver, seeded-ID protection set]

key-files:
  created:
    - src/app/(app)/admin/layout.tsx
    - src/lib/canva/verify-template.ts
    - src/lib/canva/template-resolver.ts (rewritten)
    - src/app/(app)/admin/rules/actions.ts
    - src/app/(app)/admin/rules/page.tsx
    - src/app/(app)/admin/rules/_components/rules-table.tsx
    - src/app/(app)/admin/rules/_components/rule-edit-sheet.tsx
    - src/app/(app)/admin/rules/_components/rule-create-sheet.tsx
    - src/app/(app)/admin/rules/_components/rule-active-toggle.tsx
    - src/app/(app)/admin/templates/actions.ts
    - src/app/(app)/admin/templates/page.tsx
    - src/app/(app)/admin/templates/_components/templates-table.tsx
    - src/app/(app)/admin/templates/_components/template-edit-sheet.tsx
    - src/app/(app)/admin/rules/__tests__/actions.test.ts
    - src/app/(app)/admin/templates/__tests__/actions.test.ts
    - src/lib/rules/__tests__/seed.test.ts
    - src/components/ui/table.tsx
    - src/components/ui/switch.tsx
  modified:
    - src/lib/canva/adapter.ts (await resolveTemplateId)
    - src/lib/canva/server-client.ts (remove templates property)
    - src/lib/env.ts (remove CANVA_TEMPLATE_* from schema)
    - src/lib/canva/__tests__/template-resolver.test.ts (DB-based mocks)
    - playwright.config.ts (remove CANVA_TEMPLATE_* env vars)

key-decisions:
  - "Template resolver migrated to DB: resolveTemplateId is now async, reads from db.canvaTemplate"
  - "CANVA_TEMPLATE_* env vars removed from runtime validation — templates are DB-only"
  - "Admin actions use assertAdmin() helper pattern for consistent role enforcement"
  - "softDeleteRule rejects SEEDED_RULE_IDS (Set) instead of hard-coded IDs for maintainability"
  - "Template verification calls GET /designs/{id} — same endpoint used in production generation"
  - "No create/delete for CanvaTemplate — fixed 4 slots (2 durations x 2 artifact types)"

patterns-established:
  - "assertAdmin pattern: every server action starts with assertAdmin(session?.user?.role)"
  - "SEEDED_RULE_IDS Set: used for O(1) seeded-rule protection checks"
  - "DB-resolver pattern: resolveTemplateId is async, throws with Vietnamese message if inactive/missing"
  - "Verify-before-persist: template changes verify with Canva API before DB write"
  - "Two-column mapping grid: left=read-only source fields, right=editable Canva element names"

requirements-completed: [ADMIN-01, ADMIN-02]

# Metrics
duration: 25min
completed: 2026-03-27
---

# Plan 05-02: Admin Management for Template Mappings and Maintainable Company Rules

**Admin UI for managing Canva template mappings and company formatting rules, with DB-based template resolver replacing env vars and 173 tests green**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-27T16:05:00Z
- **Completed:** 2026-03-27T16:30:00Z
- **Tasks:** 10 (2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12)
- **Files modified:** 19

## Accomplishments
- Admin layout with server-side role guard: non-admin users see Vietnamese 403, unauthenticated redirect to /login
- Template resolver migrated from env vars to DB: `resolveTemplateId` is now `async`, reads from `db.canvaTemplate`
- Canva template verification helper: calls `GET /designs/{id}` before persisting admin changes
- Admin rules CRUD: create (auto-ID), update, toggleActive, soft-delete with SEEDED_RULE_IDS protection
- Admin templates CRUD: update templateId (with Canva verification), fieldMapping, isActive toggle
- Two-column field mapping editor: left column read-only source fields, right column editable Canva element names
- All 173 unit/integration tests pass after removing CANVA_TEMPLATE_* env var dependencies

## Task Commits

Each task was committed atomically:

1. **Task 2.1: Admin layout with server-side role guard** - `c416d97` (feat)
2. **Task 2.3: Migrate template resolver from env vars to DB** - `0527c53` (feat)
3. **Task 2.4: Canva template verification helper** - `a3befd8` (feat)
4. **Task 2.5: Admin rules page and server actions** - `a5d62b8` (feat)
5. **Task 2.9: Install shadcn table and switch components** - `cd1de72` (feat)
6. **Task 2.6: Admin rules table, edit sheet, create sheet, toggle** - `f4de8cc` (feat)
7. **Task 2.7: Admin templates page and server actions** - `c436688` (feat)
8. **Task 2.8: Templates table and edit sheet with field mapping** - `62a06fd` (feat)
9. **Task 2.10: Rules action tests and seed non-destructive tests** - `1a772c3` (test)
10. **Task 2.11: Templates action tests and DB resolver tests** - `f109cef` (test)
11. **Task 2.12: Remove CANVA_TEMPLATE_* from playwright.config.ts** - `9ae37e3` (chore)

## Files Created/Modified
- `src/app/(app)/admin/layout.tsx` - Server-side admin route guard with Vietnamese 403 page
- `src/lib/canva/template-resolver.ts` - Async DB-based resolver (replaces env-based)
- `src/lib/canva/adapter.ts` - Added `await` to `resolveTemplateId` call
- `src/lib/canva/server-client.ts` - Removed `templates` property from config
- `src/lib/env.ts` - Removed `CANVA_TEMPLATE_*` from `canvaEnvSchema` and `FORBIDDEN_PUBLIC_PREFIXES`
- `src/lib/canva/verify-template.ts` - NEW: Canva API verification via GET /designs/{id}
- `src/app/(app)/admin/rules/actions.ts` - NEW: CRUD server actions with admin assertion
- `src/app/(app)/admin/rules/page.tsx` - NEW: Admin rules page with isSeeded metadata
- `src/app/(app)/admin/rules/_components/rules-table.tsx` - NEW: Table with badges and keyboard nav
- `src/app/(app)/admin/rules/_components/rule-edit-sheet.tsx` - NEW: Edit sheet with soft-delete
- `src/app/(app)/admin/rules/_components/rule-create-sheet.tsx` - NEW: Create sheet
- `src/app/(app)/admin/rules/_components/rule-active-toggle.tsx` - NEW: Inline toggle (44px)
- `src/app/(app)/admin/templates/actions.ts` - NEW: updateTemplate with Canva verification
- `src/app/(app)/admin/templates/page.tsx` - NEW: Admin templates page
- `src/app/(app)/admin/templates/_components/templates-table.tsx` - NEW: Clickable template table
- `src/app/(app)/admin/templates/_components/template-edit-sheet.tsx` - NEW: Two-column mapping editor
- `src/components/ui/table.tsx` - NEW: Installed from shadcn registry
- `src/components/ui/switch.tsx` - NEW: Installed from shadcn registry
- `src/app/(app)/admin/rules/__tests__/actions.test.ts` - NEW: 12 tests for rules CRUD
- `src/app/(app)/admin/templates/__tests__/actions.test.ts` - NEW: 10 tests for templates CRUD
- `src/lib/rules/__tests__/seed.test.ts` - NEW: 4 tests for non-destructive seed
- `src/lib/canva/__tests__/template-resolver.test.ts` - Updated for DB-based resolver (7 tests)
- `playwright.config.ts` - Removed CANVA_TEMPLATE_* env vars from webServer command

## Decisions Made
- Template resolver now uses `async/await` with DB query — adapter.ts required `await` addition
- `getFieldsForTemplate` is a regular (non-async) export so template-edit-sheet can call it synchronously during useEffect
- Two-column field mapping uses `fieldMapping[field] ?? field` as default (field name = element name)
- Deactivation in templates uses AlertDialog confirmation, matching UI-SPEC copy exactly
- `softDeleteRule` soft-deletes (sets `isActive: false`) rather than hard-deletes for non-seeded rules

## Deviations from Plan
None — plan executed exactly as written. Task 2.2 was explicitly marked as removed in the plan (handled by 05-01).

## Issues Encountered
None — all tests passed on first run.

## User Setup Required
None — no external service configuration required. Templates are now configured via /admin/templates UI.

## Next Phase Readiness
- Phase 5 plans 05-01 and 05-02 are both complete
- Admin users can manage Canva templates and rules from the app UI
- Template env vars (CANVA_TEMPLATE_*) can be removed from .env files
- Phase 6 can proceed

---
*Phase: 05-history-admin-control*
*Completed: 2026-03-27*
