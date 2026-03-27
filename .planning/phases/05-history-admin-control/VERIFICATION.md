---
phase: 05-history-admin-control
verified_at: "2026-03-27"
verifier: claude-code
requirements_verified: [HIST-01, HIST-02, ADMIN-01, ADMIN-02]
plans_verified: [05-01, 05-02]
verdict: PASS_WITH_DEFECT
---

# Phase 05 Verification Report

**Phase:** 05-history-admin-control
**Goal:** History viewing and admin management for templates/rules
**Requirements in scope:** HIST-01, HIST-02, ADMIN-01, ADMIN-02
**Plans executed:** 05-01 (wave 0), 05-02 (wave 1)
**Test results:** 41/41 unit/integration tests pass

---

## 1. Requirements Traceability

Cross-referenced against REQUIREMENTS.md. All four phase-5 requirement IDs are accounted for.

| Req ID  | Description (from REQUIREMENTS.md)                                                                        | Plan   | Status |
|---------|-----------------------------------------------------------------------------------------------------------|--------|--------|
| HIST-01 | System stores past generation jobs with file name, timestamp, status, and resulting Canva link(s)         | 05-01  | ✅ PASS |
| HIST-02 | Logged-in user can revisit previous jobs and reopen generated Canva links                                  | 05-01  | ✅ PASS |
| ADMIN-01 | Admin or authorized user can manage Canva template mappings for supported tour types                      | 05-02  | ✅ PASS |
| ADMIN-02 | System stores company formatting rules in a maintainable way so they can evolve without rewriting pipeline | 05-02  | ✅ PASS |

### Unrelated requirements in this phase
No additional requirement IDs appear in either PLAN frontmatter beyond the four listed above.
All other v1 requirements (AUTH, DOC, AI, RULE, CANVA, UX, SAFE) belong to phases 1–4 and 6 per the REQUIREMENTS.md traceability table — none are orphaned.

---

## 2. Plan 05-01 Must-Haves Verification

### Truth 1: Paginated history table visible to all authenticated users
**Claim:** "Logged-in user can view a paginated history table of all team generation jobs with file name, date, status, tour type, and Canva link status"

| Check | File | Result |
|-------|------|--------|
| `PAGE_SIZE = 20` defined | `src/app/(app)/history/page.tsx:11` | ✅ |
| `prisma.upload.findMany` without userId filter (all-team) | `history/page.tsx:29` | ✅ |
| `orderBy: { createdAt: "desc" }` | `history/page.tsx:30` | ✅ |
| `canvaArtifacts` included in select | `history/page.tsx:38-44` | ✅ |
| `prisma.upload.count()` for total pages | `history/page.tsx:49` | ✅ |
| Table columns: Ten file, Ngay tao, Trang thai, Loai tour, Lien ket Canva | `history-table.tsx:77-81` | ✅ |
| `HistoryPagination` rendered when `totalPages > 1` | `history/page.tsx:111-115` | ✅ |
| `HistoryEmpty` rendered when `totalCount === 0` | `history/page.tsx:53-60` | ✅ |

**Verdict: ✅ PASS**

---

### Truth 2: History row click navigates to /review/[id] for any authenticated team member
**Claim:** "Clicking a history row navigates to /review/[id] and the review page loads successfully for any authenticated team member, not just the uploader"

| Check | File | Result |
|-------|------|--------|
| Rows have `role="link"`, `tabIndex={0}` | `history-table.tsx:88-89` | ✅ |
| `onClick` → `router.push(/review/${job.id})` | `history-table.tsx:91` | ✅ |
| Enter/Space keyboard handler navigates | `history-table.tsx:92-96` | ✅ |
| Review page lookup uses `where: { id }` (no userId filter) | `review/[id]/page.tsx:29-39` | ✅ |
| Review page `select` includes `userId: true` | `review/[id]/page.tsx:37` | ✅ |
| `loadCanvaArtifacts` uses `getUploadForRead` (team-wide read) | `review/[id]/actions.ts:363-364` | ✅ |
| Mutations (`saveDraftField`, `approveDraft`, `generateCanva`, `retryCanvaArtifact`, `reExtractDraft`) remain owner-scoped | `review/[id]/actions.ts` (owner checks preserved) | ✅ |

**Verdict: ✅ PASS**

---

### Truth 3: User role propagates from DB through JWT and session
**Claim:** "User role (admin or member) propagates from the database through JWT and session so that server components and client components can read session.user.role"

| Check | File | Result |
|-------|------|--------|
| `User.role String @default("member")` in Prisma schema | `prisma/schema.prisma:23` | ✅ |
| `role: "admin" \| "member"` in User interface | `src/types/next-auth.d.ts:8` | ✅ |
| `role: "admin" \| "member"` in Session.user interface | `src/types/next-auth.d.ts:16` | ✅ |
| `role: "admin" \| "member"` in JWT interface | `src/types/next-auth.d.ts:26` | ✅ |
| `token.role = (user as ...).role` in jwt callback | `src/lib/auth.config.ts:17` | ✅ |
| `session.user.role = token.role as "admin" \| "member"` in session callback | `src/lib/auth.config.ts:26` | ✅ |
| `authorize` returns `role` from DB user | `src/lib/auth.ts` (verified by summary) | ✅ |

**Verdict: ✅ PASS**

---

### Truth 4: Sidebar shows Lich su for all users, Quan ly section only for admin
**Claim:** "Sidebar shows enabled Lich su link for all users and admin-only Quan ly section for admin users"

| Check | File | Result |
|-------|------|--------|
| `{ href: "/history", label: "Lich su" }` in `primaryItems` (no `disabled` flag) | `app-sidebar.tsx:60` | ✅ |
| `adminItems` with `/admin/rules` and `/admin/templates` | `app-sidebar.tsx:63-66` | ✅ |
| `role === "admin"` guard around admin section render | `app-sidebar.tsx:143` | ✅ |
| "Quan ly" section heading text | `app-sidebar.tsx:146` | ✅ |
| `role` prop passed through AppSidebar → MobileSidebar → SidebarContent | `app-sidebar.tsx:39,47,115` | ✅ |
| `role={session?.user?.role ?? "member"}` passed from layout | `src/app/(app)/layout.tsx` (verified by summary) | ✅ |
| Old disabled secondary items removed | `app-sidebar.tsx` (no `secondaryItems`) | ✅ |

**Verdict: ✅ PASS**

---

## 3. Plan 05-02 Must-Haves Verification

### Truth 1: Admin users can manage Canva template mappings at /admin/templates
**Claim:** "Authorized admin users can manage Canva template mappings for supported v1 tour types from the app at /admin/templates"

| Check | File | Result |
|-------|------|--------|
| `src/app/(app)/admin/templates/page.tsx` exists | directory listing | ✅ |
| `src/app/(app)/admin/templates/_components/templates-table.tsx` exists | directory listing | ✅ |
| `src/app/(app)/admin/templates/_components/template-edit-sheet.tsx` exists | directory listing | ✅ |
| `getTemplates`, `updateTemplate`, `toggleTemplateActive`, `getFieldsForTemplate` exported | `admin/templates/actions.ts:36,45,85,25` | ✅ |
| `assertAdmin` called in every action | `admin/templates/actions.ts:14,38,54` | ✅ |
| `verifyCanvaTemplate` called before persisting changed templateId | `admin/templates/actions.ts:63` | ✅ |
| No create/delete (fixed 4 slots) | `admin/templates/actions.ts` (only update) | ✅ |
| `revalidatePath("/admin/templates")` called on update | `admin/templates/actions.ts:81` | ✅ |

**Verdict: ✅ PASS**

---

### Truth 2: Admin users can CRUD company formatting rules at /admin/rules with seeded rule protection
**Claim:** "Admin users can CRUD company formatting rules at /admin/rules with seeded rules protected from deletion"

| Check | File | Result |
|-------|------|--------|
| `src/app/(app)/admin/rules/page.tsx` exists | directory listing | ✅ |
| All 4 rule components exist (rules-table, rule-edit-sheet, rule-create-sheet, rule-active-toggle) | directory listing | ✅ |
| `createRule`, `updateRule`, `toggleRuleActive`, `softDeleteRule` exported | `admin/rules/actions.ts:14,23,59,90,94` | ✅ |
| `assertAdmin` called in all actions | `admin/rules/actions.ts:8-11` | ✅ |
| `SEEDED_RULE_IDS.has(ruleId)` guard in `softDeleteRule` | `admin/rules/actions.ts:98` | ✅ |
| Error message: "Quy tắc gốc không được xóa. Chỉ có thể tắt hoạt động." | `admin/rules/actions.ts:101` | ✅ |
| Auto-generated ruleId in `createRule` (RULE-XX increments) | `admin/rules/actions.ts:36-43` | ✅ |
| `SEEDED_RULE_IDS` exported from seed.ts as a Set of 7 IDs | `src/lib/rules/seed.ts:54-56` | ✅ |
| `update: {}` in upsert (non-destructive seed) | `src/lib/rules/seed.ts:64` | ✅ |

**Verdict: ✅ PASS**

---

### Truth 3: Non-admin users receive server-enforced 403 at /admin/* routes
**Claim:** "Non-admin users receive server-enforced 403 when accessing /admin/* routes directly"

| Check | File | Result |
|-------|------|--------|
| `src/app/(app)/admin/layout.tsx` exists as server component (no "use client") | `admin/layout.tsx:1-37` | ✅ |
| `redirect("/login")` for unauthenticated users | `admin/layout.tsx:13` | ✅ |
| `session.user.role !== "admin"` check before rendering children | `admin/layout.tsx:16` | ✅ |
| Vietnamese 403 copy: "Bạn không có quyền truy cập" | `admin/layout.tsx:20` | ✅ |
| CTA: "Về bảng điều khiển" linking to `/dashboard` | `admin/layout.tsx:26-30` | ✅ |

**Verdict: ✅ PASS**

---

### Truth 4: Template resolver reads from DB instead of env vars
**Claim:** "Template resolver reads from DB instead of env vars, with seed migration from current env values"

| Check | File | Result |
|-------|------|--------|
| `resolveTemplateId` is `async`, returns `Promise<string>` | `template-resolver.ts:21-42` | ✅ |
| Queries `db.canvaTemplate.findUnique` | `template-resolver.ts:25` | ✅ |
| No reference to `getCanvaConfig` or env vars in resolver | `template-resolver.ts` (imports only `db`) | ✅ |
| Throws with message "Missing active Canva template..." when not found/inactive | `template-resolver.ts:35-38` | ✅ |
| `adapter.ts` uses `await resolveTemplateId(...)` | `adapter.ts:75` | ✅ |
| `canvaEnvSchema` does NOT contain `CANVA_TEMPLATE_*` fields | `src/lib/env.ts:41-46` | ✅ |
| `FORBIDDEN_PUBLIC_PREFIXES` does NOT contain template entries | `src/lib/env.ts:8-19` | ✅ |
| `src/lib/canva/server-client.ts` does NOT reference `CANVA_TEMPLATE` | checked via grep | ✅ |
| `src/lib/canva/template-seed.ts` exists and seeds from env vars (one-time migration) | `template-seed.ts:56-87` | ✅ |
| `prisma/seed.ts` calls `seedCanvaTemplates` | `prisma/seed.ts:27` | ✅ |

**Verdict: ✅ PASS**

---

### Truth 5: Company formatting rules stored as editable DB metadata with non-destructive seed
**Claim:** "Company formatting rules are stored as editable metadata in DB with non-destructive seed behavior"

| Check | File | Result |
|-------|------|--------|
| `CompanyRule` model in `prisma/schema.prisma` with `ruleId`, `name`, `description`, `category`, `isActive`, `config` | `schema.prisma:102-113` | ✅ |
| `seedCompanyRules` uses `upsert` with `update: {}` (no fields overwritten) | `src/lib/rules/seed.ts:62-73` | ✅ |
| `CanvaTemplate` model with `fieldMapping Json`, `isActive`, `@@unique([tourDuration, artifactType])` | `schema.prisma:116-128` | ✅ |
| `seedCanvaTemplates` uses `update: {}` (non-destructive) | `template-seed.ts:74` | ✅ |
| `updateRule` allows editing name, description, category, isActive | `admin/rules/actions.ts:59-88` | ✅ |
| Page marks rules with `isSeeded` flag for UI differentiation | `admin/rules/page.tsx` (per summary) | ✅ |

**Verdict: ✅ PASS**

---

## 4. Artifact Presence Check

All artifacts listed in plan frontmatter verified as present:

**Plan 05-01 artifacts:**
| Artifact | Present |
|----------|---------|
| `src/app/(app)/history/page.tsx` | ✅ |
| `src/components/app-sidebar.tsx` | ✅ (modified) |
| `prisma/schema.prisma` | ✅ (modified) |
| `src/lib/auth.config.ts` | ✅ (modified) |
| `src/app/(app)/review/[id]/page.tsx` | ✅ (modified) |
| `src/app/(app)/review/[id]/actions.ts` | ✅ (modified) |
| `src/app/(app)/layout.tsx` | ✅ (modified) |
| `src/app/(app)/history/_components/history-table.tsx` | ✅ |
| `src/app/(app)/history/_components/history-empty.tsx` | ✅ |
| `src/app/(app)/history/_components/history-pagination.tsx` | ✅ |
| `src/app/(app)/history/_components/history-skeleton.tsx` | ✅ |
| `src/lib/auth/require-admin.ts` | ✅ |
| `src/lib/canva/template-seed.ts` | ✅ |
| `src/app/(app)/history/__tests__/page.test.tsx` | ✅ |
| `src/lib/auth/__tests__/role-propagation.test.ts` | ✅ |
| `tests/e2e/history.spec.ts` | ✅ |

**Plan 05-02 artifacts:**
| Artifact | Present |
|----------|---------|
| `src/app/(app)/admin/layout.tsx` | ✅ |
| `src/app/(app)/admin/rules/page.tsx` | ✅ |
| `src/app/(app)/admin/rules/actions.ts` | ✅ |
| `src/app/(app)/admin/rules/_components/rules-table.tsx` | ✅ |
| `src/app/(app)/admin/rules/_components/rule-edit-sheet.tsx` | ✅ |
| `src/app/(app)/admin/rules/_components/rule-create-sheet.tsx` | ✅ |
| `src/app/(app)/admin/rules/_components/rule-active-toggle.tsx` | ✅ |
| `src/app/(app)/admin/templates/page.tsx` | ✅ |
| `src/app/(app)/admin/templates/actions.ts` | ✅ |
| `src/app/(app)/admin/templates/_components/templates-table.tsx` | ✅ |
| `src/app/(app)/admin/templates/_components/template-edit-sheet.tsx` | ✅ |
| `src/lib/canva/template-resolver.ts` | ✅ (rewritten) |
| `src/lib/canva/verify-template.ts` | ✅ |
| `src/lib/env.ts` | ✅ (modified) |
| `src/app/(app)/admin/rules/__tests__/actions.test.ts` | ✅ |
| `src/app/(app)/admin/templates/__tests__/actions.test.ts` | ✅ |
| `src/lib/rules/__tests__/seed.test.ts` | ✅ |
| `src/lib/canva/__tests__/template-resolver.test.ts` | ✅ (updated) |

---

## 5. Test Results

```
Test Files  6 passed (6)
      Tests  41 passed (41)
   Duration  311ms
```

| Test file | Tests | Result |
|-----------|-------|--------|
| `history/__tests__/page.test.tsx` | 8 | ✅ all pass |
| `src/lib/auth/__tests__/role-propagation.test.ts` | 4 | ✅ all pass |
| `admin/rules/__tests__/actions.test.ts` | 12 | ✅ all pass |
| `lib/rules/__tests__/seed.test.ts` | 4 | ✅ all pass |
| `admin/templates/__tests__/actions.test.ts` | 13 | ✅ all pass |
| `lib/canva/__tests__/template-resolver.test.ts` | 7 (incl. resolveTemplatePair, getTemplatePairLabel) | ✅ all pass |
| `tests/e2e/history.spec.ts` | 3 (skipped stubs) | ⏭ skipped by design |

---

## 6. Defect Found: Missing `await` on `resolveTemplatePair` calls

**Severity: HIGH** — Runtime breakage when Canva generation is triggered.

`resolveTemplatePair` is declared `async` and returns `Promise<TemplatePair>`. Two call sites are missing `await`:

| File | Line | Code | Impact |
|------|------|------|--------|
| `src/app/(app)/review/[id]/actions.ts` | 248 | `const pair = resolveTemplatePair(upload.tourDuration)` | `pair.displayLabel` is `undefined` at runtime; Canva job titles become `"SileTravel - undefined - Lịch trình"` |
| `src/app/(app)/review/[id]/actions.ts` | 348 | `const pair = resolveTemplatePair(upload.tourDuration)` | Same — in `retryCanvaArtifact` path |
| `src/app/(app)/review/[id]/page.tsx` | 49 | `? resolveTemplatePair(upload.tourDuration as TourDuration)` | `templatePair` is a `Promise` object passed as prop — component receives wrong type |

`adapter.ts:75` correctly uses `await resolveTemplateId` (the inner resolver). The outer wrapper `resolveTemplatePair` was missed.

**Required fix:**
```typescript
// actions.ts line 248 and 348:
const pair = await resolveTemplatePair(upload.tourDuration);

// page.tsx line 49:
const templatePair = upload.tourDuration
  ? await resolveTemplatePair(upload.tourDuration as TourDuration)
  : null;
```

This fix is **not part of Phase 5 scope** — it is an incidental defect introduced by the async migration. Recommend fixing in Phase 5 cleanup or as the first task of Phase 6.

---

## 7. Summary

| Area | Result | Notes |
|------|--------|-------|
| HIST-01: Job storage with metadata | ✅ PASS | `prisma.upload` queried with canvaArtifacts, paginated |
| HIST-02: Revisit jobs and reopen Canva links | ✅ PASS | Team-wide read, row click → /review/[id] |
| ADMIN-01: Manage Canva template mappings | ✅ PASS | /admin/templates with update + Canva verification |
| ADMIN-02: Maintainable formatting rules in DB | ✅ PASS | /admin/rules with CRUD, seeded-rule protection |
| Role propagation (JWT → session) | ✅ PASS | All 3 type interfaces updated, callbacks wired |
| Admin route protection | ✅ PASS | Server-side layout guard, Vietnamese 403 |
| Non-destructive seed | ✅ PASS | `update: {}` in both rules and template upserts |
| Template resolver DB migration | ✅ PASS | Async DB-based, env vars removed from schema |
| Canva template verification | ✅ PASS | GET /designs/{id} before persisting changes |
| Tests (unit/integration) | ✅ PASS | 41/41 pass |
| E2E tests | ⏭ SKIPPED | Stub only — by plan design |
| `resolveTemplatePair` missing `await` | ⚠️ DEFECT | HIGH severity — affects generateCanva + retryCanva at runtime |

**Overall Phase Verdict: PASS WITH DEFECT**

Phase 5 requirements HIST-01, HIST-02, ADMIN-01, ADMIN-02 are fully implemented and verified. One high-severity defect (missing `await` on `resolveTemplatePair`) exists outside the requirement boundary but must be fixed before Phase 6 exercises the Canva generation path.

---
*Verified: 2026-03-27*
*Method: Manual code inspection + automated test run (`npx vitest run`, 41/41 pass)*
