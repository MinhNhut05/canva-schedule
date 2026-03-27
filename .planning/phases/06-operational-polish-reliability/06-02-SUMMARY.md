---
plan: 06-02
title: Harden pipeline for routine volume, backoff, and external API limits
completed_at: 2026-03-27
duration_minutes: 20
tasks_completed: 5
files_changed: 7
---

# Summary: Plan 06-02 — Pipeline Reliability Hardening

## What Was Done

Made the backend pipeline failure-tolerant and volume-safe for ~10 tours/week by persisting Canva rate-limit cooldown in the DB, upgrading AI extraction with exponential backoff and timeout, adding a Canva polling wall-clock deadline, and hydrating cooldown state from SSR to the review UI.

## Tasks Completed

### T1: Add cooldownUntil to CanvaToken schema and create cooldown helpers
- Added `cooldownUntil DateTime?` field to `CanvaToken` model in `prisma/schema.prisma`
- Ran `npx prisma db push` — schema applied successfully
- Created `src/lib/canva/cooldown.ts` with three exports:
  - `getGlobalCooldown()` — queries latest token, returns Date if cooldown still active
  - `setGlobalCooldown(seconds)` — writes cooldown deadline to latest token row
  - `getRemainingCooldownSeconds(date)` — computes remaining seconds until cooldown expires

### T2: Upgrade AI extraction client with exponential backoff and 30s timeout
- Replaced linear backoff `attempt * 1000` with exponential `Math.pow(2, attempt - 1) * 1000`
- Added `AbortController`-based 30s timeout per API call attempt
- Added `AbortError` detection in `isRetryableError` (timeouts are retryable)
- Added Vietnamese timeout error message: "AI phan hoi qua cham (30 giay). Vui long thu lai."
- Exported new constant `AI_TIMEOUT_MS`

### T3: Add 2-minute wall-clock timeout to Canva polling
- Added `POLL_TIMEOUT_MS = 120_000` constant
- Added `deadline = Date.now() + POLL_TIMEOUT_MS` at start of `pollAutofillJob`
- Added `Date.now() > deadline` check before each poll iteration
- Deadline exceeded throws Vietnamese error: "Canva tao thiet ke qua lau (vuot 2 phut). Vui long thu lai."
- Exported `POLL_TIMEOUT_MS`

### T4: Wire global cooldown check and write into actions.ts and adapter.ts
- `adapter.ts`: imported `setGlobalCooldown`, added `await setGlobalCooldown(error.cooldownSeconds)` inside `CanvaRateLimitError` catch block
- `actions.ts`: imported `getGlobalCooldown` + `getRemainingCooldownSeconds`
- `generateCanva()`: checks cooldown before `resolveTemplatePair`, returns `isRateLimited: true` with remaining seconds
- `retryCanvaArtifact()`: same cooldown gate before `resolveTemplatePair`

### T5: Pass initialCooldown from SSR page to ReviewPage component
- `page.tsx`: calls `getGlobalCooldown()` on SSR, passes result as `initialCooldownUntil` ISO string prop
- `review-page.tsx`:
  - Added `initialCooldownUntil?: string | null` to `ReviewPageProps`
  - Replaced `isRateLimited` + `cooldownMinutes` static initial state with lazy initializers from prop
  - Added `cooldownUntil: useState<Date | null>` driven by `initialCooldownUntil`
  - Replaced 60s setTimeout countdown with 30s `setInterval` tick that reads from `cooldownUntil` Date
  - Updated `applyCooldown` to set `setCooldownUntil(new Date(Date.now() + seconds * 1000))`

## Verification Results

- `npx prisma validate` — ✅ schema valid
- `npx tsc --noEmit` — ✅ no new errors (pre-existing test file errors unrelated to this plan)
- All must_have acceptance criteria — ✅ verified via grep

## Files Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `cooldownUntil DateTime?` to CanvaToken |
| `src/lib/canva/cooldown.ts` | New file — cooldown DB helpers |
| `src/lib/ai/extraction-client.ts` | Exponential backoff + AbortController timeout |
| `src/lib/canva/jobs.ts` | POLL_TIMEOUT_MS + deadline check in pollAutofillJob |
| `src/lib/canva/adapter.ts` | setGlobalCooldown call on rate limit |
| `src/app/(app)/review/[id]/actions.ts` | Cooldown gate in generateCanva + retryCanvaArtifact |
| `src/app/(app)/review/[id]/page.tsx` | SSR getGlobalCooldown + initialCooldownUntil prop |
| `src/components/review/review-page.tsx` | Accept + hydrate initialCooldownUntil, interval countdown |

## Decisions

No new architectural decisions. Followed D-10 (global cooldown in DB), D-15 (timeouts), and Phase 05-01 decision to use `db push` for schema changes.
