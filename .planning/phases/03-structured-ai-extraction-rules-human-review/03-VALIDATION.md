---
phase: 3
slug: structured-ai-extraction-rules-human-review
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts or "none — Wave 0 installs" |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | AI-01 | unit | `npx vitest run src/lib/ai/__tests__/` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | AI-02, AI-03 | unit | `npx vitest run src/lib/ai/__tests__/` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | AI-04, AI-05, SAFE-02 | unit | `npx vitest run src/lib/ai/__tests__/` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | AI-04 | integration | `npx vitest run src/app/review/__tests__/` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | AI-05 | integration | `npx vitest run src/app/review/__tests__/` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | RULE-01, RULE-02, RULE-03 | unit | `npx vitest run src/lib/rules/__tests__/` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 2 | RULE-04, RULE-05, RULE-06, RULE-07 | unit | `npx vitest run src/lib/rules/__tests__/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/ai/__tests__/extraction.test.ts` — stubs for AI-01..AI-05, SAFE-02
- [ ] `src/lib/rules/__tests__/rules.test.ts` — stubs for RULE-01..RULE-07
- [ ] `src/app/review/__tests__/review.test.tsx` — stubs for review/edit flow
- [ ] vitest + @testing-library/react install — if no test framework detected

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vietnamese text extraction quality | AI-01, AI-02 | AI output varies per input | Upload sample .docx, verify structured output matches expected fields |
| Inline edit saves correctly | AI-04 | Visual UI interaction | Edit a field in review page, verify persistence |
| Flagged/blank fields display | AI-03, SAFE-02 | Visual rendering | Check uncertain fields show warning indicators |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
