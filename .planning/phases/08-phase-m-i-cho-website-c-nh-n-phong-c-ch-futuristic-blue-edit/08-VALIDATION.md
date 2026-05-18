---
phase: 8
slug: phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright `^1.52.0` for UI validation; Vitest `^4.1.1` remains available for non-DOM unit checks |
| **Config file** | `playwright.config.ts`; `vitest.config.ts` |
| **Quick run command** | `npx playwright test tests/e2e/personal-website-visual-system.spec.ts --project=chromium` |
| **Full suite command** | `npm run test && npm run test:e2e` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test tests/e2e/personal-website-visual-system.spec.ts --project=chromium`
- **After every plan wave:** Run `npm run test && npm run test:e2e`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | PW-UI-01 | T-08-01 | Hero/body split preserves stable readable surfaces and controlled accent usage | e2e | `npx playwright test tests/e2e/personal-website-visual-system.spec.ts -g "surface split"` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | PW-UI-02 | T-08-02 | Root font wiring exposes Space Grotesk for headings and Inter for body/UI text | e2e | `npx playwright test tests/e2e/personal-website-visual-system.spec.ts -g "font contract"` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | PW-UI-03 | T-08-03 | Shared primitives keep visible focus and consistent hierarchy after restyling | e2e | `npx playwright test tests/e2e/personal-website-visual-system.spec.ts -g "primitive variants"` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 2 | PW-UI-04 | T-08-04 | Hover, glow, shadow, and disabled states remain readable and restrained | e2e | `npx playwright test tests/e2e/personal-website-visual-system.spec.ts -g "state effects"` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 3 | PW-UI-05 | — | Proof surface demonstrates token/component contract for downstream work | manual review | `Manual review against 08-UI-SPEC.md and proof surface` | ❌ W0 | ⬜ pending |
| 08-03-02 | 03 | 3 | PW-UI-06 | — | No layout/content strategy or personal-brand copywriting leaks into execution scope | manual review | `Manual diff review for scope boundaries` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/personal-website-visual-system.spec.ts` — phase-specific visual-system smoke coverage
- [ ] Proof surface/route for deterministic UI assertions if planner chooses proof-route strategy
- [ ] DOM-capable unit-test expansion only if planner decides component-level assertions are necessary

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual-system detail is sufficient for downstream UI work | PW-UI-05 | Downstream readiness depends on contract completeness, not only DOM behavior | Compare implemented tokens/primitives/proof surface against `08-CONTEXT.md` and `08-UI-SPEC.md`; confirm no foundational visual questions remain open |
| Scope stays design-system-only | PW-UI-06 | Scope leaks are architectural/product decisions rather than runtime behavior | Review changed files and verify no page IA, section ordering, portfolio copy, or marketing layout strategy was introduced |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
