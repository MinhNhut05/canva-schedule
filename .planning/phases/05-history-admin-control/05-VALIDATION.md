---
phase: 5
slug: history-admin-control
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.1 (unit/integration) + Playwright 1.52.0 (e2e) |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test -- src/app/(app)/history src/app/(app)/admin src/lib/canva/__tests__/template-resolver.test.ts src/lib/rules/__tests__/seed.test.ts` |
| **Full suite command** | `npm test && npm run test:e2e` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- src/app/(app)/history src/app/(app)/admin src/lib/canva/__tests__/template-resolver.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | HIST-01 | integration | `npm run test -- src/app/(app)/history/__tests__/page.test.tsx` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | HIST-02 | e2e | `npx playwright test tests/e2e/history.spec.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | ADMIN-01 | integration | `npm run test -- src/app/(app)/admin/templates/__tests__/actions.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | ADMIN-02 | integration | `npm run test -- src/app/(app)/admin/rules/__tests__/actions.test.ts src/lib/rules/__tests__/seed.test.ts` | ❌ W0 | ⬜ pending |
| 05-XX-XX | XX | 1 | ADMIN-01 | integration | `npm run test -- src/lib/auth/__tests__/role-propagation.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/(app)/history/__tests__/page.test.tsx` — stubs for HIST-01 server pagination and row aggregation
- [ ] `tests/e2e/history.spec.ts` — stubs for HIST-02 history-to-review reopen path
- [ ] `src/app/(app)/admin/templates/__tests__/actions.test.ts` — stubs for ADMIN-01 save, validation, and role guard
- [ ] `src/app/(app)/admin/rules/__tests__/actions.test.ts` — stubs for ADMIN-02 CRUD + seeded-rule protections
- [ ] `src/lib/rules/__tests__/seed.test.ts` — prevents future destructive reseed regressions
- [ ] `src/lib/auth/__tests__/role-propagation.test.ts` — verifies `role` reaches JWT/session types and callbacks

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin sidebar visibility | ADMIN-01 | Role-based UI rendering requires visual confirmation | 1. Login as member → verify no "Quan ly" section 2. Login as admin → verify "Quan ly" section appears with "Quy tac" and "Mau Canva" |
| Canva template verification UX | ADMIN-01 | Requires real Canva API response to verify error messaging | 1. Save invalid template ID → verify Vietnamese error message 2. Save valid template ID → verify success |
| History empty state | HIST-01 | Visual layout verification | 1. Login with fresh user (no jobs) → verify Vietnamese empty message and "Tai tai lieu" CTA |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
