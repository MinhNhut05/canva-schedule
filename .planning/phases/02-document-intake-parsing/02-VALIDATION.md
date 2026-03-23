---
phase: 2
slug: document-intake-parsing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DOC-01, DOC-02 | e2e | `npx playwright test tests/e2e/document-intake.spec.ts -g "upload" -x` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | DOC-03 | unit + e2e | `npx vitest run src/lib/documents/intake.test.ts -t "reject unsupported"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | DOC-04 | unit/integration | `npx vitest run src/lib/documents/extractors.test.ts -t "extract Vietnamese"` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | DOC-05 | unit + e2e | `npx vitest run src/lib/documents/quality.test.ts -t "flags poor extraction"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/document-intake.spec.ts` — stubs for DOC-01, DOC-02, DOC-03 upload flows and warning-banner UX
- [ ] `src/lib/documents/extractors.test.ts` — fixture-based PDF/DOCX extraction coverage for DOC-04
- [ ] `src/lib/documents/quality.test.ts` — heuristic scoring coverage for DOC-05
- [ ] `src/lib/documents/intake.test.ts` — size/type validation coverage for DOC-03
- [ ] `tests/fixtures/documents/` — representative good/bad PDF and DOCX samples
- [ ] `vitest.config.ts` — Vitest configuration
- [ ] Framework install: `npm install -D vitest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag & drop UX works on real browser | DOC-01, DOC-02 | Browser drag events hard to simulate reliably | 1. Open /upload 2. Drag a PDF file onto the drop zone 3. Verify file info preview appears |
| Warning banner is visually readable (yellow, Vietnamese text) | DOC-05 | Visual appearance verification | 1. Upload a poor-quality PDF 2. Verify yellow warning banner appears with Vietnamese text |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
