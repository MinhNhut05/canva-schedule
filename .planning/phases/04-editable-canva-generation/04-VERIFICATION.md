---
phase: 04-editable-canva-generation
verified: 2026-03-25T15:11:34Z
status: human_needed
score: 11/11 must-haves verified
human_verification:
  - test: "Validate real Canva generation against production-like credentials and templates"
    expected: "After approving reviewed content, both Itinerary and Menu open as editable Canva designs with reviewed content mapped into the selected template pair, and revisiting /review/[id] shows fresh actionable links again."
    why_human: "Automated coverage uses a local Canva mock server. Real Canva template capability, account permissions, and editability cannot be confirmed programmatically from static verification."
  - test: "Validate review-page layout and interaction quality on desktop and mobile"
    expected: "Section order remains review editors -> approval alert -> template confirmation -> generation panel -> result cards, cards render in 2 columns on desktop and stack on mobile, and copy/open/retry/regenerate controls feel clear and usable."
    why_human: "Visual appearance, spacing, responsiveness, and perceived interaction quality cannot be fully verified from source inspection alone."
---

# Phase 4: Editable Canva Generation Verification Report

**Phase Goal:** Map reviewed content into supported Canva templates and return editable links.
**Verified:** 2026-03-25T15:11:34Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | System can resolve the correct itinerary and menu template pair for the current tour duration | ✓ VERIFIED | `/src/lib/canva/template-resolver.ts` resolves `ONE_DAY/TWO_DAY` + `ITINERARY/MENU` from `/src/lib/canva/server-client.ts` template config and exposes `displayLabel` for UI consumption. |
| 2 | Approved review data can be transformed into Canva-ready payloads for both Itinerary and Menu artifacts | ✓ VERIFIED | `/src/lib/canva/payload.ts` exports four payload builders with shared fields and fixed-slot mapping; `/src/app/(app)/review/[id]/actions.ts` selects the correct builder based on duration and kind. |
| 3 | Generated Canva artifacts and refreshed tokens can be revisited later because durable state is persisted in the database | ✓ VERIFIED | `/prisma/schema.prisma` contains `CanvaToken`, `CanvaArtifact`, and `Upload.canvaArtifacts`; `/src/lib/canva/oauth.ts` upserts tokens; `/src/lib/canva/adapter.ts` upserts artifact state and design IDs. |
| 4 | Canva OAuth tokens auto-refresh on expiry and persist rotated refresh tokens to database | ✓ VERIFIED | `/src/lib/canva/oauth.ts` checks expiry buffer, refreshes via token endpoint, and persists `accessToken`, `refreshToken`, `expiresAt`, `scope`, and `tokenType` with `db.canvaToken.upsert(...)`. |
| 5 | Async autofill jobs are created, polled with bounded retries, and reach terminal success/failed states | ✓ VERIFIED | `/src/lib/canva/jobs.ts` creates autofill jobs, uses `POLL_DELAYS_MS = [2000, 3000, 5000, 5000, 5000, 5000]`, returns success payloads, and throws on failed/timeout states. |
| 6 | The adapter returns editable design metadata (`designId` + URLs), not export-only output | ✓ VERIFIED | `/src/lib/canva/adapter.ts` persists success with `designId`, calls `/src/lib/canva/designs.ts` for fresh `editUrl/viewUrl/thumbnailUrl`, and returns those values in `ArtifactResult`. |
| 7 | User can approve content and confirm template selection as two separate actions | ✓ VERIFIED | `/src/components/review/review-actions.tsx` shows `Xác nhận` before approval; `/src/components/review/review-page.tsx` renders `TemplateConfirmation` only after approval; old combined label `Xác nhận & Tạo Canva` is absent from `src/`. |
| 8 | User can trigger parallel Itinerary+Menu generation with a single click and see inline progress | ✓ VERIFIED | `/src/app/(app)/review/[id]/actions.ts` uses `Promise.allSettled([...generateArtifact(...)])`; `/src/components/review/review-page.tsx` calls `generateCanva(upload.id)` and renders `/src/components/review/canva-generation-panel.tsx` while `isGenerating` is true. |
| 9 | User can open or copy the resulting Canva links directly from the review page | ✓ VERIFIED | `/src/components/review/canva-result-card.tsx` renders `Mở trong Canva` anchor to `editUrl` and `Sao chép link` button using `navigator.clipboard.writeText(editUrl)` with `sonner` toast feedback. |
| 10 | Partial success is handled: successful card stays actionable while failed card shows retry | ✓ VERIFIED | `/src/app/(app)/review/[id]/actions.ts` converts per-artifact failures into individual `FAILED` results without failing the whole batch; `/src/components/review/review-page.tsx` merges retry results per artifact; `/src/components/review/canva-result-card.tsx` shows `Thử lại` only for failed cards. |
| 11 | Generated Canva links persist and reappear when revisiting `/review/[id]` | ✓ VERIFIED | `/src/app/(app)/review/[id]/page.tsx` loads `canvaArtifacts` via `loadCanvaArtifacts(upload.id)` and passes them to `/src/components/review/review-page.tsx`; `loadCanvaArtifacts()` refreshes URLs for succeeded artifacts before hydration. |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `prisma/schema.prisma` | Durable Canva token/artifact persistence | ✓ VERIFIED | `CanvaToken`, `CanvaArtifact`, unique `(uploadId, artifactType)`, and `Upload.canvaArtifacts` exist and are referenced by runtime code. |
| `src/lib/canva/template-resolver.ts` | Duration/kind -> template resolution | ✓ VERIFIED | Resolves template IDs and UI label from env-backed config; consumed by adapter, actions, and review page. |
| `src/lib/canva/field-map.ts` | Canonical field names and fixed slot counts | ✓ VERIFIED | Exports shared/template-specific field arrays and `MAX_SLOTS_PER_SECTION = 7`; used by payload builders. |
| `src/lib/canva/payload.ts` | Canva-ready payload builders | ✓ VERIFIED | Exports all four builders with `{ type: "text", text: string }` values and fixed-slot padding/truncation. |
| `src/lib/canva/adapter.ts` | Top-level Canva orchestration and persistence | ✓ VERIFIED | Handles `PROCESSING -> SUCCEEDED/FAILED`, rate-limit shaping, success persistence, and fresh URL resolution. |
| `src/lib/canva/oauth.ts` | Token refresh lifecycle | ✓ VERIFIED | Reads stored token, refreshes when needed, persists rotation, and supports forced refresh for 401 retry. |
| `src/lib/canva/jobs.ts` | Creation + polling workflow | ✓ VERIFIED | Supports direct design-copy path, autofill fallback, population best-effort, and bounded job polling. |
| `src/components/review/template-confirmation.tsx` | Post-approval template confirmation UI | ✓ VERIFIED | Displays resolver-driven pair labels and `Tạo Canva` CTA; rendered from `review-page.tsx`. |
| `src/components/review/canva-generation-panel.tsx` | Inline progress and rate-limit UI | ✓ VERIFIED | Renders spinner/progress helper text and cooldown alert state; driven by `review-page.tsx` state. |
| `src/components/review/canva-result-card.tsx` | Actionable per-artifact result card | ✓ VERIFIED | Renders title, status, helper copy, link open/copy, retry, optional thumbnail, and regenerate affordances. |
| `src/app/(app)/review/[id]/actions.ts` | Review-page Canva server actions | ✓ VERIFIED | Exports `generateCanva`, `retryCanvaArtifact`, and `loadCanvaArtifacts`; wired into review page and page loader. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/lib/env.ts` | `src/lib/canva/server-client.ts` | `getCanvaEnv()` -> `getCanvaConfig()` | ✓ WIRED | Server-only env validation feeds the template map and credentials used by downstream Canva modules. |
| `src/lib/canva/server-client.ts` | `src/lib/canva/template-resolver.ts` | `config.templates[key]` lookup | ✓ WIRED | Resolver uses env-backed `templates` object, not hardcoded template IDs. |
| `src/lib/canva/payload.ts` | `src/app/(app)/review/[id]/actions.ts` | `buildArtifactPayload()` dispatch to duration/kind builders | ✓ WIRED | Review actions build real Canva payloads before calling generation adapter. |
| `src/lib/canva/oauth.ts` | `src/lib/canva/client.ts` | `getValidAccessToken()` in `canvaFetch()` | ✓ WIRED | Authenticated Canva REST client always obtains a valid Bearer token and can force refresh after 401. |
| `src/lib/canva/client.ts` | `src/lib/canva/jobs.ts` | `canvaFetch()` calls to `/designs`, `/autofills`, `/autofills/{id}` | ✓ WIRED | Job orchestration uses the authenticated client for create/copy/update/poll operations. |
| `src/lib/canva/jobs.ts` | `src/lib/canva/adapter.ts` | `createDesignFromTemplate()` / `pollAutofillJob()` | ✓ WIRED | Adapter branches on direct design vs job result and persists terminal artifact state accordingly. |
| `src/lib/canva/designs.ts` | `src/lib/canva/adapter.ts` | `getFreshDesignUrls()` inside `persistSuccess()` and `resolveArtifactUrls()` | ✓ WIRED | Editable URLs are refreshed from persisted `designId`, enabling revisit behavior. |
| `src/lib/canva/adapter.ts` | `src/app/(app)/review/[id]/actions.ts` | `generateArtifact()`, `getArtifactsForUpload()`, `resolveArtifactUrls()` | ✓ WIRED | Review actions use the adapter boundary for create/retry/load flows. |
| `src/app/(app)/review/[id]/page.tsx` | `src/components/review/review-page.tsx` | props `canvaArtifacts` + `templatePair` | ✓ WIRED | Server route hydrates persisted Canva state and resolver-derived template pair into the client page. |
| `src/components/review/review-page.tsx` | `src/components/review/template-confirmation.tsx` | post-approval render + `onConfirm -> handleGenerate()` | ✓ WIRED | Template confirmation is not orphaned; it gates generation after approval. |
| `src/components/review/review-page.tsx` | `src/components/review/canva-generation-panel.tsx` | `isGenerating/isRateLimited/cooldownMinutes` props | ✓ WIRED | Inline progress and cooldown messages are fed by live review-page state. |
| `src/components/review/review-page.tsx` | `src/components/review/canva-result-card.tsx` | artifact state mapping + retry/regenerate callbacks | ✓ WIRED | Persisted and newly generated artifacts render as actionable cards with retry support. |
| `src/components/review/review-page.tsx` | `src/components/review/review-actions.tsx` | split approval/generation footer props | ✓ WIRED | Sticky footer swaps from `Xác nhận` to generation actions after approval. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `CANVA-01` | `04-01`, `04-03` | User can select the appropriate Canva template set for the current tour type | ✓ SATISFIED | `/src/lib/canva/template-resolver.ts` resolves duration-based pair; `/src/components/review/template-confirmation.tsx` and `/src/components/review/review-page.tsx` surface the selected pair after approval. |
| `CANVA-02` | `04-01`, `04-03` | System maps reviewed content into 2 separate Canva templates per tour: Itinerary and Menu | ✓ SATISFIED | `/src/lib/canva/payload.ts` produces itinerary/menu payloads; `/src/app/(app)/review/[id]/actions.ts` triggers both artifacts in parallel with separate titles and kinds. |
| `CANVA-03` | `04-02`, `04-03` | System creates editable Canva outputs rather than static-only assets | ✓ SATISFIED | `/src/lib/canva/adapter.ts` returns `designId/editUrl/viewUrl`; `/src/components/review/canva-result-card.tsx` opens editable `editUrl` in Canva. |
| `CANVA-04` | `04-03` | System returns at least one editable Canva link for the generated design outputs | ✓ SATISFIED | `/src/app/(app)/review/[id]/actions.ts` returns per-artifact results; `/src/components/review/canva-result-card.tsx` renders `Mở trong Canva` and revisit hydration restores links. |
| `CANVA-05` | `04-02`, `04-03` | Canva integration handles asynchronous job completion and reports failure clearly when generation does not succeed | ✓ SATISFIED | `/src/lib/canva/jobs.ts` polls bounded retries and throws on failure/timeout; `/src/lib/canva/adapter.ts` persists `FAILED`; `/src/components/review/canva-result-card.tsx` shows failure helper and retry CTA. |
| `CANVA-06` | `04-01`, `04-03` | Template identifiers and mappings are managed outside hardcoded business logic so template changes can be updated safely | ✓ SATISFIED | `/src/lib/env.ts` defines per-template env vars; `/src/lib/canva/server-client.ts` exposes template map; `/src/lib/canva/template-resolver.ts` centralizes lookup. |
| `UX-03` | `04-03` | User can copy or open the generated Canva link directly from the app | ✓ SATISFIED | `/src/components/review/canva-result-card.tsx` provides `Mở trong Canva` and clipboard copy actions with toast feedback. |
| `UX-04` | `04-01`, `04-03` | User can clearly see which template type is being used for the current generation | ✓ SATISFIED | `/src/lib/canva/template-resolver.ts` exposes `displayLabel`; `/src/components/review/template-confirmation.tsx` renders `Tour 1 ngày/Tour 2 ngày — Lịch trình/Thực đơn`. |
| `SAFE-03` | `04-02`, `04-03` | System handles Canva token expiry or authorization refresh without requiring repeated manual intervention during normal operation | ✓ SATISFIED | `/src/lib/canva/oauth.ts` refreshes expired tokens and persists rotation; `/src/lib/canva/client.ts` retries once on 401 with forced refresh. |

All requirement IDs declared in Phase 4 plan frontmatter are accounted for in `REQUIREMENTS.md`, and no orphaned Phase 4 requirement IDs were found among `CANVA-01..06`, `UX-03`, `UX-04`, and `SAFE-03`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| None | - | No blocker TODO/placeholder/stub patterns detected in verified Phase 4 implementation files | - | No automated evidence of placeholder-only delivery or orphaned Canva flow code |

### Human Verification Required

### 1. Real Canva editable-link validation

**Test:** Approve a real reviewed upload and generate Canva artifacts using real Canva credentials and real 1-day/2-day templates.
**Expected:** Both Itinerary and Menu return editable Canva links, open in the Canva editor, contain mapped reviewed content, and remain re-openable when revisiting `/review/[id]`.
**Why human:** Static verification and test coverage use a local mock Canva server, so actual Canva account permissions, template compatibility, and editor-side editability are not proven here.

### 2. Review-page visual/layout validation

**Test:** On desktop and mobile, walk through approve -> confirm template -> generate -> retry/regenerate and inspect spacing, hierarchy, responsiveness, and clarity of actions/messages.
**Expected:** The page keeps the expected section order, result cards display as 2 columns on desktop and a single stack on mobile, and the approval/generation controls remain understandable throughout the flow.
**Why human:** Visual appearance, responsive layout, and interaction feel cannot be fully established from source inspection.

### Gaps Summary

No implementation gaps were found in the automated verification pass. Phase 4 code substantively delivers the planned Canva mapping, persistence, async handling, and review-page wiring. Remaining risk is limited to human-only validation areas: real Canva service behavior and visual UX confirmation.

---

_Verified: 2026-03-25T15:11:34Z_
_Verifier: Claude (gsd-verifier)_
