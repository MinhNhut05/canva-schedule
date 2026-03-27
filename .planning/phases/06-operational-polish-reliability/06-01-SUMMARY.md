---
phase: 06-operational-polish-reliability
plan: 01
subsystem: ui
tags: [react, nextjs, tailwind, shadcn, lucide-react, stepper, error-ux, vietnamese]

# Dependency graph
requires:
  - phase: 06-02
    provides: cooldownUntil DB field, initialCooldownUntil prop in ReviewPage, cooldown state management

provides:
  - WorkflowStepper component (5-step workflow progress indicator)
  - CooldownBanner component (amber rate-limit warning with countdown)
  - CompletionBanner component (full/partial success state)
  - messages.ts (centralized Vietnamese copy constants)
  - Persistent inline Alert errors at all 3 failure points
  - shadcn tooltip component installed

affects: [phase-07, future-ui-changes]

# Tech tracking
tech-stack:
  added: [lucide-react, @radix-ui/react-tooltip (via shadcn tooltip)]
  patterns:
    - Centralized copy constants in messages.ts imported by multiple components
    - useMemo for computed step/completion state derived from artifact/upload state
    - Persistent inline Alert (variant=destructive) replaces toast.error at error points
    - CooldownBanner driven by parent cooldownMinutes state (no internal timer)

key-files:
  created:
    - src/lib/messages.ts
    - src/components/workflow-stepper.tsx
    - src/components/review/cooldown-banner.tsx
    - src/components/review/completion-banner.tsx
    - src/components/ui/tooltip.tsx
  modified:
    - src/app/(app)/upload/upload-form.tsx
    - src/components/review/review-page.tsx
    - src/components/review/canva-generation-panel.tsx
    - src/components/ui/alert.tsx

key-decisions:
  - "Alert component extended with variant prop (default | destructive) to support shadcn-style variant API without introducing cva dependency"
  - "computedStep useMemo placed before early returns in ReviewPage so all 3 return branches can render WorkflowStepper"
  - "isRateLimited kept as optional prop in CanvaGenerationPanel interface for backward compatibility while rate-limit display moves to CooldownBanner"
  - "CanvaGenerationPanel aiStatus === PROCESSING check in early-return branch simplified to just isReExtracting to avoid TS unreachable-comparison error"

patterns-established:
  - "Messages pattern: all new Phase 6 UI copy centralized in src/lib/messages.ts with named exports per category"
  - "Error display pattern: persistent Alert variant=destructive with AlertTitle + AlertDescription + icon (no auto-dismiss)"
  - "Step computation pattern: useMemo deriving { activeStep, errorStep } from upload.aiStatus + artifacts state"

requirements-completed: [UX-01, UX-02, SAFE-04]

# Metrics
duration: 35min
completed: 2026-03-27
---

# Phase 06-01: Step Feedback, Error UX, Completion State — Summary

**End-to-end workflow stepper with 5 visual states, persistent Vietnamese error Alerts at all 3 failure points, global cooldown banner, and full/partial completion states in ReviewPage**

## Performance

- **Duration:** 35 min
- **Started:** 2026-03-27T23:20:00Z
- **Completed:** 2026-03-27T23:55:00Z
- **Tasks:** 7
- **Files modified:** 9

## Accomplishments

- WorkflowStepper renders 5 steps (Tải lên → Trích xuất → Duyệt → Tạo Canva → Hoàn thành) with completed/active/error/future visual states, Tooltip on error steps, aria-label accessibility, responsive label hiding on mobile
- Persistent inline destructive Alert replaces toast.error at all 3 failure points (upload parsing, AI extraction, Canva generation); toast.success kept per D-06
- CooldownBanner (amber bg-amber-50) + CompletionBanner (green full success / neutral partial) integrated into ReviewPage, CanvaGenerationPanel local rate-limit alert removed

## Task Commits

1. **T1: Install shadcn tooltip + create messages.ts** — `0fd8877` (feat)
2. **T2: Build WorkflowStepper component** — `0cc0d46` (feat)
3. **T3: Create CooldownBanner component** — `8aeb07f` (feat)
4. **T4: Create CompletionBanner component** — `0a8a36a` (feat)
5. **T5: Upgrade UploadForm with stepper + persistent Alert** — `b4d15d3` (feat)
6. **T6: Integrate all components into ReviewPage** — `259eff3` (feat)
7. **T7: Simplify CanvaGenerationPanel, remove rate-limit alert** — `cc896b2` (feat)

## Files Created/Modified

- `src/lib/messages.ts` — Centralized Vietnamese copy: STEPPER_LABELS, ERROR_MESSAGES, STEPPER_TOOLTIPS, COMPLETION_MESSAGES, COOLDOWN_MESSAGES
- `src/components/workflow-stepper.tsx` — 5-step horizontal stepper with state-based styling and Tooltip
- `src/components/review/cooldown-banner.tsx` — Amber banner for global Canva rate-limit display
- `src/components/review/completion-banner.tsx` — Green full-success / neutral partial-success banner with CTAs
- `src/components/ui/tooltip.tsx` — shadcn tooltip component (installed via npx shadcn add tooltip)
- `src/components/ui/alert.tsx` — Extended with `variant` prop (default | destructive)
- `src/app/(app)/upload/upload-form.tsx` — Added WorkflowStepper (step 1), replaced toast.error with Alert variant=destructive
- `src/components/review/review-page.tsx` — Added WorkflowStepper + computedStep useMemo, CooldownBanner, CompletionBanner, canvaError Alert; removed toast.error from handleGenerate + handleRetryArtifact
- `src/components/review/canva-generation-panel.tsx` — Removed local rate-limit Alert block; kept spinner card

## Decisions Made

- Alert component extended with `variant` prop instead of installing cva — keeps the component lightweight with no new runtime dependency
- `computedStep` useMemo hoisted above early returns in ReviewPage so both the "no draft" and "FAILED" early-return branches can also render WorkflowStepper
- `isRateLimited` prop kept optional in CanvaGenerationPanel (not removed) to avoid breaking the call site reference until T6 fully takes ownership of rate-limit display

## Deviations from Plan

### Auto-fixed Issues

**1. [Blocking] Alert.tsx missing variant prop**
- **Found during:** Task 5 (UploadForm upgrade)
- **Issue:** Plan calls for `<Alert variant="destructive">` but existing alert.tsx had no variant prop
- **Fix:** Extended alert.tsx with `AlertVariant` type and `variantClasses` map; no cva dependency needed
- **Files modified:** src/components/ui/alert.tsx
- **Verification:** `npx tsc --noEmit` passes on all new/modified files
- **Committed in:** b4d15d3 (part of T5 commit)

**2. [Blocking] lucide-react not installed**
- **Found during:** Task 2 (WorkflowStepper — imports Check, AlertTriangle, Loader2)
- **Issue:** `lucide-react` not in package.json; TS error TS2307 on import
- **Fix:** `npm install lucide-react`
- **Files modified:** package.json, package-lock.json
- **Verification:** TS error resolved, import works
- **Committed in:** 0cc0d46 (part of T2 commit)

**3. [Rule — TS Correctness] Unreachable type comparison in FAILED early-return**
- **Found during:** Task 6 (ReviewPage integration)
- **Issue:** TS2367 — checking `upload.aiStatus === "PROCESSING"` inside `if (upload.aiStatus === "FAILED")` branch is always false
- **Fix:** Simplified `activeLoading` prop in that branch to just `isReExtracting`
- **Files modified:** src/components/review/review-page.tsx
- **Verification:** TS error resolved
- **Committed in:** 259eff3 (part of T6 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking missing deps, 1 TS correctness)
**Impact on plan:** All fixes necessary for build correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## Next Phase Readiness

- All Phase 6 plans complete (06-01 and 06-02 done)
- UX-01 (step progress), UX-02 (error messages), SAFE-04 (volume handling) all fulfilled
- Phase 6 milestone ready for transition

---
*Phase: 06-operational-polish-reliability*
*Completed: 2026-03-27*
