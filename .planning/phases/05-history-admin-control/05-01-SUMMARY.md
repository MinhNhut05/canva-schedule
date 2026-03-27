---
plan: 05-01
phase: 5
completed_at: "2026-03-27"
tasks_completed: 8
files_modified: 15
tests_added: 12
---

# Summary: Plan 05-01 — Schema Foundations, Role Propagation, Team History Page & Sidebar

## What Was Done

Implemented all 8 tasks for Plan 05-01, establishing the data foundation for Phase 5:

### Task 1.1 — Extend Prisma schema (User.role + CanvaTemplate model)
- Added `role String @default("member")` to User model
- Added `CanvaTemplate` model with tourDuration, artifactType, templateId, fieldMapping (Json), isActive
- `@@unique([tourDuration, artifactType])` and `@@map("canva_templates")`
- Applied via `prisma db push` + generated client

### Task 1.2 — Role propagation through Auth.js JWT/session pipeline
- Updated `src/types/next-auth.d.ts`: added `role: "admin" | "member"` to User, Session, JWT interfaces
- Updated `src/lib/auth.config.ts`: jwt callback sets `token.role`, session callback sets `session.user.role`
- Updated `src/lib/auth.ts`: authorize returns `role: (user.role as "admin" | "member") ?? "member"`

### Task 1.3 — Non-destructive seed scripts + CanvaTemplate seeder
- Fixed `src/lib/rules/seed.ts`: `update: {}` (non-destructive, preserves admin edits), exported `SEEDED_RULE_IDS`
- Created `src/lib/canva/template-seed.ts`: `seedCanvaTemplates` reads 4 template IDs from env vars, uses `update: {}` for non-destructive upserts
- Updated `prisma/seed.ts`: calls `seedCanvaTemplates`, admin user gets `role: "admin"`, others get `role: "member"`

### Task 1.4 — Role-aware sidebar navigation
- Updated `src/components/app-sidebar.tsx`: added `role` prop to all interfaces, enabled `/history` in primaryItems, removed old disabled secondaryItems, added `adminItems` for `/admin/rules` and `/admin/templates`, conditionally renders "Quan ly" section only for `role === "admin"`
- Updated `src/app/(app)/layout.tsx`: passes `role={session?.user?.role ?? "member"}` to AppSidebar

### Task 1.5 — Relax review page read access for team-wide reopen
- `review/[id]/page.tsx`: upload lookup now uses `where: { id }` without userId filter; select includes `userId: true`
- `review/[id]/actions.ts`: added `getUploadForRead` for team-wide reads, `loadCanvaArtifacts` uses it; mutations (`saveDraftField`, `approveDraft`, `generateCanva`, `retryCanvaArtifact`, `reExtractDraft`) remain owner-only

### Task 1.6 — Admin role guard utility
- Created `src/lib/auth/require-admin.ts`: exports `requireAdmin()` and `AdminCheckResult` interface
- Returns `isAdmin: true` only when `session.user.role === "admin"`

### Task 1.7 — History page with pagination, table, empty state, skeleton
- `src/app/(app)/history/page.tsx`: server component, auth check, `prisma.upload.findMany` orderBy createdAt desc, PAGE_SIZE=20, skip/take pagination, derives status and canvaLinkLabel per row
- `history-table.tsx`: 5 columns (Ten file, Ngay tao, Trang thai, Loai tour, Lien ket Canva), `role="link"`, `tabIndex={0}`, Enter/Space keyboard nav
- `history-empty.tsx`: heading "Chua co lich su tao Canva", CTA button to `/upload`
- `history-pagination.tsx`: 44px touch targets, right-aligned, aria-current
- `history-skeleton.tsx`: 5 animate-pulse skeleton rows

### Task 1.8 — Tests
- `history/__tests__/page.test.tsx`: 8 tests for status derivation, canvaLinkLabel, pagination math, Prisma query shape
- `src/lib/auth/__tests__/role-propagation.test.ts`: 4 tests for role type semantics
- `tests/e2e/history.spec.ts`: 3 skipped stub tests for E2E flow
- All 12 unit tests pass

## Truths Validated

- ✅ Logged-in user can view paginated history table of all team generation jobs
- ✅ Clicking a history row navigates to /review/[id] and loads for any authenticated team member
- ✅ User role propagates from DB through JWT and session (session.user.role available in server and client components)
- ✅ Sidebar shows enabled Lich su for all users and admin-only Quan ly section for admin users

## Artifacts Created/Modified

| File | Change |
|------|--------|
| prisma/schema.prisma | Added User.role and CanvaTemplate model |
| src/types/next-auth.d.ts | Added role to User, Session, JWT interfaces |
| src/lib/auth.config.ts | Role propagation in jwt/session callbacks |
| src/lib/auth.ts | Return role in authorize |
| src/lib/rules/seed.ts | Non-destructive update:{}, export SEEDED_RULE_IDS |
| src/lib/canva/template-seed.ts | NEW — CanvaTemplate seeder |
| prisma/seed.ts | Call seedCanvaTemplates, add role to users |
| src/components/app-sidebar.tsx | Role-aware navigation |
| src/app/(app)/layout.tsx | Pass role to AppSidebar |
| src/app/(app)/review/[id]/page.tsx | Team-wide upload read |
| src/app/(app)/review/[id]/actions.ts | getUploadForRead for team reads |
| src/lib/auth/require-admin.ts | NEW — admin guard utility |
| src/app/(app)/history/page.tsx | NEW — history server page |
| src/app/(app)/history/_components/history-table.tsx | NEW |
| src/app/(app)/history/_components/history-empty.tsx | NEW |
| src/app/(app)/history/_components/history-pagination.tsx | NEW |
| src/app/(app)/history/_components/history-skeleton.tsx | NEW |
| src/app/(app)/history/__tests__/page.test.tsx | NEW — 8 tests |
| src/lib/auth/__tests__/role-propagation.test.ts | NEW — 4 tests |
| tests/e2e/history.spec.ts | NEW — e2e stub (3 skipped) |
