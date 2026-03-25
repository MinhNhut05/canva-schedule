---
phase: 4
slug: editable-canva-generation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.1 for unit/integration; Playwright 1.52.0 for E2E |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npx vitest run src/lib/canva/__tests__/template-resolver.test.ts src/lib/canva/__tests__/payload.test.ts src/lib/canva/__tests__/oauth.test.ts src/lib/canva/__tests__/jobs.test.ts` |
| **Full suite command** | `npm test && npm run test:e2e` |
| **Estimated runtime** | ~30 seconds (unit/integration), ~60 seconds (full + E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/canva/__tests__/`
- **After every plan wave:** Run `npm test && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | CANVA-01, CANVA-06 | unit | `npx vitest run src/lib/canva/__tests__/template-resolver.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | CANVA-02 | unit | `npx vitest run src/lib/canva/__tests__/payload.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | CANVA-06 | unit | `npx vitest run src/lib/env.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | SAFE-03 | unit + integration | `npx vitest run src/lib/canva/__tests__/oauth.test.ts src/lib/canva/__tests__/client.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | CANVA-03, CANVA-05 | unit + integration | `npx vitest run src/lib/canva/__tests__/jobs.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 2 | CANVA-04 | integration | `npx vitest run src/app/(app)/review/[id]/__tests__/actions.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | CANVA-01, UX-04 | component | `npx vitest run src/components/review/__tests__/template-confirmation.test.tsx` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 3 | UX-03, CANVA-04 | component | `npx vitest run src/components/review/__tests__/canva-result-card.test.tsx` | ❌ W0 | ⬜ pending |
| 04-03-03 | 03 | 3 | UX-03, UX-04, CANVA-04 | e2e | `npx playwright test tests/e2e/review-canva-generation.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/canva/__tests__/template-resolver.test.ts` — stubs for CANVA-01, CANVA-06
- [ ] `src/lib/canva/__tests__/payload.test.ts` — stubs for CANVA-02
- [ ] `src/lib/canva/__tests__/jobs.test.ts` — stubs for CANVA-03, CANVA-05
- [ ] `src/lib/canva/__tests__/oauth.test.ts` — stubs for SAFE-03
- [ ] `src/lib/canva/__tests__/client.test.ts` — stubs for SAFE-03 retry wiring
- [ ] `src/app/(app)/review/[id]/__tests__/actions.test.ts` — stubs for CANVA-04, CANVA-05
- [ ] `src/components/review/__tests__/template-confirmation.test.tsx` — stubs for CANVA-01, UX-04
- [ ] `src/components/review/__tests__/canva-result-card.test.tsx` — stubs for UX-03, CANVA-04
- [ ] `tests/e2e/review-canva-generation.spec.ts` — E2E approval-to-link flow
- [ ] Fix or remove `scripts/canva-probe.ts` reference in `package.json`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vietnamese diacritics render in Canva | CANVA-02 | Requires real Canva template with actual Vietnamese text | Generate with real tour data, open in Canva, check diacritics visually |
| Thumbnail preview display | UX-03 | Depends on real Canva API returning thumbnail URL | Generate, wait for result cards, verify thumbnail shows in card |
| Brand Template + Enterprise capability | CANVA-03 | Depends on actual Canva account configuration | Run capability probe against production Canva account |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
