---
phase: 06-operational-polish-reliability
verified_at: 2026-03-27
verifier: claude-code
plans_verified: [06-02, 06-01]
requirements_verified: [UX-01, UX-02, SAFE-04]
result: PASS
---

# Phase 06 Verification Report

**Phase goal:** Operational polish — step feedback, error UX, pipeline reliability
**Requirement IDs in scope:** UX-01, UX-02, SAFE-04
**Execution order:** 06-02 (wave 1) → 06-01 (wave 2)

---

## Requirement Cross-Reference

Cross-referenced against `REQUIREMENTS.md` traceability table. Every ID declared in both PLAN frontmatters is accounted for.

| Req ID | Declared in plan | REQUIREMENTS.md assignment | Codebase status |
|--------|-----------------|---------------------------|-----------------|
| UX-01 | 06-01 | Phase 6 | ✅ PASS |
| UX-02 | 06-01 | Phase 6 | ✅ PASS |
| SAFE-04 | 06-01, 06-02 | Phase 6 | ✅ PASS |

No requirement IDs declared in the PLANs are missing from REQUIREMENTS.md.
No Phase 6 requirement IDs from REQUIREMENTS.md are left unaddressed.

---

## Plan 06-02: Pipeline Reliability Hardening

**Goal:** Persist Canva rate-limit cooldown in DB, exponential backoff for AI, 2-min polling timeout, SSR hydration of cooldown state.

### must_haves verification

| # | must_have | Evidence | Result |
|---|-----------|----------|--------|
| 1 | `CanvaToken` model has nullable `cooldownUntil DateTime?` | `prisma/schema.prisma` line 76: `cooldownUntil DateTime?` inside CanvaToken model | ✅ PASS |
| 2 | `getGlobalCooldown()` and `setGlobalCooldown()` helpers exist in `src/lib/canva/cooldown.ts` | File exists; exports `getGlobalCooldown`, `setGlobalCooldown`, `getRemainingCooldownSeconds`; includes `import "server-only"`; queries `db.canvaToken.findFirst` with `orderBy: { updatedAt: "desc" }` | ✅ PASS |
| 3 | AI extraction uses exponential backoff (1s, 2s, 4s) instead of linear | `extraction-client.ts` line 89: `Math.pow(2, attempt - 1) * 1000`; no linear `attempt * 1000` pattern in retry wait | ✅ PASS |
| 4 | AI extraction aborts after 30 seconds with a Vietnamese error message | `extraction-client.ts`: `AI_TIMEOUT_MS = 30_000`, `new AbortController()`, `setTimeout(() => controller.abort(), AI_TIMEOUT_MS)`, `clearTimeout(timeoutId)`, `signal: controller.signal`; AbortError caught at line 98; message: `"AI phan hoi qua cham (30 giay). Vui long thu lai."` | ✅ PASS |
| 5 | Canva polling aborts after 2 minutes wall-clock time | `jobs.ts`: `POLL_TIMEOUT_MS = 120_000`, `deadline = Date.now() + POLL_TIMEOUT_MS`, `Date.now() > deadline` check inside polling loop; throws `"Canva tao thiet ke qua lau (vuot 2 phut)..."` | ✅ PASS |
| 6 | `generateCanva()` and `retryCanvaArtifact()` check global cooldown before starting | `actions.ts` line 250: `await getGlobalCooldown()` in `generateCanva` before `resolveTemplatePair`; line 363: same check in `retryCanvaArtifact`; both return `isRateLimited: true` when active | ✅ PASS |
| 7 | `generateArtifact()` writes cooldown to DB when Canva rate limit is hit | `adapter.ts` line 6: `import { setGlobalCooldown } from "./cooldown"`; line 126: `await setGlobalCooldown(error.cooldownSeconds)` inside `CanvaRateLimitError` catch block | ✅ PASS |
| 8 | Review page SSR queries `cooldownUntil` and passes it as prop to `ReviewPage` | `page.tsx` line 12: `import { getGlobalCooldown } from "@/lib/canva/cooldown"`; line 52: `await getGlobalCooldown()`; line 68: `initialCooldownUntil={cooldownUntil?.toISOString() ?? null}` | ✅ PASS |
| 9 | `ReviewPage` accepts `initialCooldown` prop and initializes cooldown state from it | `review-page.tsx` line 106: `initialCooldownUntil?: string | null` in `ReviewPageProps`; lines 176–191: `useState<Date | null>` lazy init from `initialCooldownUntil`; lines 225–226: `setInterval(tick, 30_000)` countdown; `applyCooldown` sets `setCooldownUntil(new Date(Date.now() + seconds * 1000))` | ✅ PASS |

**Plan 06-02 result: ✅ PASS — all 9 must_haves satisfied**

---

## Plan 06-01: Step Feedback, Error UX, Completion State

**Goal:** 5-step WorkflowStepper with visual states, persistent Alert errors at 3 failure points, global cooldown banner, completion banner.

### must_haves verification

| # | must_have | Evidence | Result |
|---|-----------|----------|--------|
| 1 | `src/lib/messages.ts` contains all Phase 6 Vietnamese text constants | File exists; exports: `STEPPER_LABELS` (5 elements: "Tải lên", "Trích xuất", "Duyệt", "Tạo Canva", "Hoàn thành"), `ERROR_MESSAGES` (keys: `uploadParsing`, `aiExtraction`, `aiTimeout`, `canvaGeneration`), `STEPPER_TOOLTIPS` (keys: `extraction`, `canva`), `COMPLETION_MESSAGES` (keys: `fullSuccess`, `partialSuccess`, `ctaNewTour`, `ctaHistory`), `COOLDOWN_MESSAGES` (primary function + secondary string); all strings use full Vietnamese diacritics | ✅ PASS |
| 2 | `WorkflowStepper` renders 5 steps with completed/active/error/future states | `workflow-stepper.tsx` exists with `"use client"`, `export function WorkflowStepper`; 4 visual state classes verified: `bg-primary/20 text-primary` (completed), `bg-primary text-primary-foreground` (active), `bg-destructive/20 text-destructive` (error), `bg-muted text-muted-foreground` (future) | ✅ PASS |
| 3 | Stepper rendered inside UploadForm (step 1 active) and ReviewPage (step 2–5 based on status) | `upload-form.tsx` line 226: `<WorkflowStepper activeStep={1} activeLoading={isProcessing} />`; `review-page.tsx`: 3 instances — main return (line 508), no-draft early return (line 413), FAILED early return (line 454); `computedStep` useMemo above all early returns | ✅ PASS |
| 4 | Completed steps are clickable — step 1 navigates to `/upload` | `workflow-stepper.tsx`: `status === "completed" && stepNumber === 1` → `onClick={() => router.push("/upload")}`; uses `useRouter` from `next/navigation` | ✅ PASS |
| 5 | Error steps show `AlertTriangle` icon with Tooltip | `workflow-stepper.tsx`: error state renders `<AlertTriangle size={16} />`; wrapped in `<TooltipProvider><Tooltip><TooltipTrigger>…<TooltipContent>{tooltipText}</TooltipContent>` | ✅ PASS |
| 6 | Stepper responsive — labels hidden below md, circles have `aria-label` | `workflow-stepper.tsx`: label span has `hidden md:block`; circle elements (div/button) have `aria-label={label}`; container has `px-2 py-3 md:px-4 md:py-4` | ✅ PASS |
| 7 | UploadForm replaces `toast.error()` with persistent inline `Alert variant="destructive"` | `upload-form.tsx`: no `toast.error` calls (comments confirm removal); `toast.success` kept at line 214; `<Alert variant="destructive">` with `AlertTriangle`, `AlertTitle` using `ERROR_MESSAGES.uploadParsing.title`, `AlertDescription` at lines 277–283 | ✅ PASS |
| 8 | ReviewPage Canva generation errors use persistent inline `Alert` instead of `toast.error()` | `review-page.tsx`: `handleGenerate` and `handleRetryArtifact` use `setCanvaError(...)` — no `toast.error` in either handler body; `<Alert variant="destructive">` with `ERROR_MESSAGES.canvaGeneration.title` at lines 568–574; `toast.error` retained only in `handleSaveError` (line 284), `handleApprove` (lines 304, 307), and `handleReExtract` (lines 401, 404) — all outside Phase 6 scope per D-23 | ✅ PASS |
| 9 | `CompletionBanner` shows green success banner (all artifacts succeed) with "Tạo tour mới" and "Xem lịch sử" CTAs | `completion-banner.tsx`: full variant renders `bg-green-50 text-green-800 border-green-200`; `<Link href="/upload">{COMPLETION_MESSAGES.ctaNewTour}</Link>` and `<Link href="/history">{COMPLETION_MESSAGES.ctaHistory}</Link>` | ✅ PASS |
| 10 | `CompletionBanner` shows partial success message when some artifacts fail | `completion-banner.tsx`: partial variant renders neutral card with `text-amber-600` icon; messages from `COMPLETION_MESSAGES.partialSuccess` | ✅ PASS |
| 11 | `CooldownBanner` shows amber warning with countdown from global cooldown state | `cooldown-banner.tsx`: `bg-amber-50 text-amber-800 border-amber-200`; `Clock` icon; renders `COOLDOWN_MESSAGES.primary(cooldownMinutes)` and `COOLDOWN_MESSAGES.secondary`; `cooldownMinutes <= 0` guard returns null | ✅ PASS |
| 12 | `CooldownBanner` disables generate button during cooldown | `review-page.tsx` line 264: `generationDisabled = isGenerating \|\| isRateLimited \|\| !templatePair`; `isRateLimited` is driven by cooldown state; `CooldownBanner` renders when `isRateLimited && cooldownMinutes > 0`; generate buttons pass `disabled={generationDisabled}` | ✅ PASS |
| 13 | shadcn tooltip component is installed | `src/components/ui/tooltip.tsx` exists; exports `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` via Radix UI | ✅ PASS |

**Plan 06-01 result: ✅ PASS — all 13 must_haves satisfied**

---

## Requirement Fulfillment

### UX-01 — User sees processing progress across major steps
**Requirement:** User sees processing progress across major steps such as upload, extract, review, generate, and done.

**Satisfied by:**
- `WorkflowStepper` renders all 5 steps (Tải lên / Trích xuất / Duyệt / Tạo Canva / Hoàn thành) with distinct visual states
- Stepper visible on both the upload page (step 1 active) and the review page (steps 2–5 via `computedStep` useMemo)
- Active step shows spinner when loading (`activeLoading` prop)
- Completed state shows `Check` icon; error state shows `AlertTriangle` with tooltip; future steps show step number

**Verdict: ✅ FULFILLED**

---

### UX-02 — User receives human-readable error messages at failure points
**Requirement:** User receives human-readable error messages when parsing, AI extraction, or Canva generation fails.

**Satisfied by:**
- Failure point 1 (upload/parsing): `Alert variant="destructive"` in `upload-form.tsx` with `ERROR_MESSAGES.uploadParsing.title` ("Không thể đọc tệp") and inline error description; no auto-dismissing toast
- Failure point 2 (AI extraction): Existing FAILED state in ReviewPage renders `Alert` with `upload.aiErrorMessage` and retry actions; stepper shows `errorStep: 2` with tooltip "Trích xuất thất bại"
- Failure point 3 (Canva generation): `canvaError` state in ReviewPage drives `Alert variant="destructive"` with `ERROR_MESSAGES.canvaGeneration.title` ("Tạo Canva thất bại"); stepper shows `errorStep: 4` when `anyFailed` after approval
- All error messages use Vietnamese with full diacritics, sourced from `messages.ts`

**Verdict: ✅ FULFILLED**

---

### SAFE-04 — System avoids immediate failure under normal weekly volume; respects rate limits
**Requirement:** System avoids immediate failure under normal weekly volume (~10 tours/week) and respects Canva/API rate limits at this scale.

**Satisfied by:**
- **Global Canva cooldown persisted in DB:** `cooldownUntil DateTime?` on `CanvaToken`; `setGlobalCooldown()` called on every `CanvaRateLimitError`; `getGlobalCooldown()` checked before every `generateCanva` and `retryCanvaArtifact` call — all users see the same cooldown
- **Cooldown hydrated via SSR:** Review page queries cooldown at render time and passes it to `ReviewPage` as ISO string; client initializes state from it so no unconstrained API calls on load
- **AI exponential backoff:** Retry delays of 1 s → 2 s → 4 s; maximum 3 attempts total before hard failure
- **AI 30 s per-attempt timeout:** `AbortController` cancels stalled API calls; `AbortError` is retryable; exhausted retries surface a Vietnamese error message
- **Canva polling 2-minute wall-clock deadline:** `pollAutofillJob` checks `Date.now() > deadline` before each poll iteration; prevents indefinite blocking
- **CooldownBanner blocks further generation UI:** Generate button disabled while `isRateLimited` is true; user sees countdown in amber banner

**Verdict: ✅ FULFILLED**

---

## Files Verified

| File | Role | Phase |
|------|------|-------|
| `src/lib/messages.ts` | Centralized Vietnamese copy constants | 06-01 |
| `src/components/workflow-stepper.tsx` | 5-step progress indicator | 06-01 |
| `src/components/review/cooldown-banner.tsx` | Amber rate-limit countdown banner | 06-01 |
| `src/components/review/completion-banner.tsx` | Full/partial success banner with CTAs | 06-01 |
| `src/components/ui/tooltip.tsx` | shadcn tooltip (installed) | 06-01 |
| `src/components/ui/alert.tsx` | Extended with `variant` prop | 06-01 |
| `src/app/(app)/upload/upload-form.tsx` | WorkflowStepper + persistent Alert error | 06-01 |
| `src/components/review/review-page.tsx` | Stepper integration + cooldown/completion banners + canvaError Alert | 06-01, 06-02 |
| `src/components/review/canva-generation-panel.tsx` | Local rate-limit alert removed; spinner card kept | 06-01 |
| `prisma/schema.prisma` | `cooldownUntil DateTime?` on CanvaToken | 06-02 |
| `src/lib/canva/cooldown.ts` | DB cooldown helpers | 06-02 |
| `src/lib/ai/extraction-client.ts` | Exponential backoff + AbortController 30 s timeout | 06-02 |
| `src/lib/canva/jobs.ts` | `POLL_TIMEOUT_MS` + deadline check in `pollAutofillJob` | 06-02 |
| `src/lib/canva/adapter.ts` | `setGlobalCooldown` on rate limit | 06-02 |
| `src/app/(app)/review/[id]/actions.ts` | Cooldown gate in `generateCanva` + `retryCanvaArtifact` | 06-02 |
| `src/app/(app)/review/[id]/page.tsx` | SSR cooldown query + `initialCooldownUntil` prop | 06-02 |

---

## Summary

| Plan | must_haves | Result |
|------|-----------|--------|
| 06-02 Pipeline Reliability | 9 / 9 | ✅ PASS |
| 06-01 Step Feedback & Error UX | 13 / 13 | ✅ PASS |

| Requirement | Result |
|-------------|--------|
| UX-01 | ✅ FULFILLED |
| UX-02 | ✅ FULFILLED |
| SAFE-04 | ✅ FULFILLED |

**Phase 06 verification: ✅ PASS**
All 3 requirement IDs from PLAN frontmatters are addressed and cross-referenced against `REQUIREMENTS.md`. No IDs unaccounted for.

---
*Verified: 2026-03-27*
*Next phase: 07 (authentication — AUTH-01, AUTH-02, AUTH-03, SAFE-01, CANVA-07)*
