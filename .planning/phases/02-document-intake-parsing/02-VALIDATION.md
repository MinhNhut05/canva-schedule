---
phase: 2
slug: document-intake-parsing
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-23
updated: 2026-03-23
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.52.0 (e2e, existing) + Vitest 4.1.0 (unit/integration, Wave 0 install) |
| **Config file** | `playwright.config.ts` (existing); `vitest.config.ts` (Wave 0 creates) |
| **Quick run command** | `npx vitest run src/lib/documents/` |
| **Full suite command** | `npm run test:e2e && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/documents/`
- **After every plan wave:** Run `npm run test:e2e && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Verify | Status |
|---------|------|------|-------------|-----------|-----------------|--------|
| 02-01-01 | 01 | 0 | DOC-01..03 | infra | `npx vitest run` (exit 0, 0 tests OK) | ⬜ pending |
| 02-01-02 | 01 | 0 | DOC-01..05 | type-check | `npx tsc --noEmit` | ⬜ pending |
| 02-01-03 | 01 | 0 | DOC-01..05 | script | `npx tsx tests/fixtures/documents/create-fixtures.ts` | ⬜ pending |
| 02-01-04 | 01 | 0 | DOC-01..03 | migration | `npx prisma migrate status` | ⬜ pending |
| 02-02-01 | 02 | 1 | DOC-03 | type-check + grep | `grep "Định dạng file không được hỗ trợ" src/lib/documents/intake.ts` | ⬜ pending |
| 02-02-02 | 02 | 1 | DOC-01..03 | type-check + grep | `grep "TRANSITIONAL" src/app/api/uploads/route.ts` | ⬜ pending |
| 02-03-01 | 03 | 1 | DOC-01..02 | type-check + grep | `grep "Bảng điều khiển" src/components/app-sidebar.tsx` | ⬜ pending |
| 02-03-02 | 03 | 1 | DOC-01..03 | type-check + grep | `grep "Kéo và thả file vào đây" src/app/\(app\)/upload/upload-form.tsx` | ⬜ pending |
| 02-04-01 | 04 | 2 | DOC-04 | type-check | `npx tsc --noEmit` | ⬜ pending |
| 02-04-02 | 04 | 2 | DOC-04 | type-check | `npx tsc --noEmit` | ⬜ pending |
| 02-04-03 | 04 | 2 | DOC-04 | type-check | `npx tsc --noEmit` | ⬜ pending |
| 02-05-01 | 05 | 3 | DOC-05 | type-check | `npx tsc --noEmit` | ⬜ pending |
| 02-05-02 | 05 | 3 | DOC-04..05 | type-check | `npx tsc --noEmit` | ⬜ pending |
| 02-05-03 | 05 | 3 | DOC-04..05 | type-check + grep | `grep -v "TRANSITIONAL" src/app/api/uploads/route.ts` | ⬜ pending |
| 02-06-01 | 06 | 4 | DOC-04..05 | type-check + grep | `grep "Kết quả trích xuất" src/app/\(app\)/upload/extraction-result.tsx` | ⬜ pending |
| 02-06-02 | 06 | 4 | DOC-03 | unit | `npx vitest run src/lib/documents/intake.test.ts` | ⬜ pending |
| 02-06-03 | 06 | 4 | DOC-04 | unit | `npx vitest run src/lib/documents/extractors.test.ts` | ⬜ pending |
| 02-07-01 | 07 | 5 | DOC-05 | unit | `npx vitest run src/lib/documents/quality.test.ts` | ⬜ pending |
| 02-07-02 | 07 | 5 | DOC-01..05 | e2e | `npx playwright test tests/e2e/document-intake.spec.ts` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration
- [ ] Framework install: `npm install -D vitest`
- [ ] `tests/fixtures/documents/` — representative good/bad PDF and DOCX samples
- [ ] `src/lib/documents/types.ts` — shared types and constants

Wave 0 test files (created in Plan 02-06, Wave 4):
- [ ] `src/lib/documents/intake.test.ts` — size/type validation coverage for DOC-03
- [ ] `src/lib/documents/extractors.test.ts` — fixture-based PDF/DOCX extraction coverage for DOC-04
- [ ] `src/lib/documents/quality.test.ts` — heuristic scoring coverage for DOC-05
- [ ] `tests/e2e/document-intake.spec.ts` — upload flow and warning-banner UX for DOC-01..05

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag & drop UX works on real browser | DOC-01, DOC-02 | Browser drag events hard to simulate reliably | 1. Open /upload 2. Drag a PDF file onto the drop zone 3. Verify file info preview appears |
| Warning banner is visually readable (yellow, Vietnamese text with diacritics) | DOC-05 | Visual appearance verification | 1. Upload a poor-quality PDF 2. Verify yellow warning banner appears with Vietnamese text |
| All visible UI text uses Vietnamese diacritics (not ASCII-only) | D-12 | Visual/manual text inspection | 1. Navigate /upload 2. Check all labels, buttons, errors use proper diacritics |

---

## Vietnamese Diacritics Compliance (D-12)

All UI-visible text MUST use Vietnamese with full diacritics. Verification grep commands:

```bash
# Sidebar labels
grep -q "Bảng điều khiển" src/components/app-sidebar.tsx
grep -q "Tải tài liệu" src/components/app-sidebar.tsx
grep -q "Đăng xuất" src/components/app-sidebar.tsx

# Upload page
grep -q "Tải lên và trích xuất tài liệu" src/app/\(app\)/upload/page.tsx
grep -q "Kéo và thả file vào đây" src/app/\(app\)/upload/upload-form.tsx
grep -q "Chọn file" src/app/\(app\)/upload/upload-form.tsx

# Error messages
grep -q "Định dạng file không được hỗ trợ" src/lib/documents/intake.ts
grep -q "File vượt quá 10MB" src/lib/documents/intake.ts

# Result display
grep -q "Kết quả trích xuất" src/app/\(app\)/upload/extraction-result.tsx
grep -q "Chất lượng trích xuất thấp" src/app/\(app\)/upload/extraction-result.tsx
```

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify blocks
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] Vietnamese diacritics compliance section added for D-12

**Approval:** approved (post-revision)
