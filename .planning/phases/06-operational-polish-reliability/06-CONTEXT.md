# Phase 6: Operational Polish & Reliability - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the weekly internal workflow (upload -> extract -> review -> generate -> done) clear, failure-tolerant, and stable at v1 volume (~10 tours/week). This phase delivers: end-to-end step progress indicator, recovery-oriented error UX across all 3 failure points, global Canva rate-limit handling with DB cooldown flag, request timeouts, and a completion state. It does NOT expand scope into bulk upload, mobile app, 3-4 day tours, or in-app Canva editing.

</domain>

<decisions>
## Implementation Decisions

### Step Progress Display
- **D-01:** Horizontal stepper bar with 5 steps: "Tai len" -> "Trich xuat" -> "Duyet" -> "Tao Canva" -> "Hoan thanh". Current step highlighted, completed steps show checkmark icon.
- **D-02:** Stepper is always visible at the top of every workflow page (upload, review). Not just the review page.
- **D-03:** Completed steps are clickable — user can navigate back to previous pages (e.g., click "Tai len" from review page to go back to upload). Future/unreached steps are not clickable.
- **D-04:** When a step encounters an error, the stepper shows a red warning icon on that step with a brief tooltip (e.g., "Trich xuat that bai").
- **D-05:** On mobile screens, stepper collapses to compact mode: shows step numbers + icons only, hides text labels. Full labels show on desktop.

### Error & Recovery UX
- **D-06:** Errors display as persistent inline Alert components (not toast). Toasts remain for success/info messages only. Error alerts do not auto-dismiss — user must see the error and recovery action.
- **D-07:** Each error has a specific Vietnamese message + recovery hint with action button. Example: "AI khong tra ve ket qua — Thu lai hoac chon file khac" with a "Thu lai" button.
- **D-08:** Error UX improvements apply to all 3 failure points in the pipeline: parsing/upload failure, AI extraction failure, and Canva generation failure. Each has its own error Alert with contextual recovery actions.
- **D-09:** Stepper bar reflects error state — the failed step shows a red warning icon, making errors visible even when scrolled past the error detail.

### Volume & Rate Limit Hardening
- **D-10:** Global cooldown for Canva rate limits: when any user triggers a Canva rate limit, the cooldown applies to ALL users (not per-user). Implemented via a DB flag (e.g., cooldown timestamp in a settings table) so all sessions see it.
- **D-11:** AI extraction keeps current retry (2 retries) + adds exponential backoff (1s, 2s, 4s). If all retries fail, shows inline error with manual "Thu lai" button.
- **D-12:** Canva generation adds server-side exponential backoff + global cooldown flag persisted in DB. When cooldown is active, all users see it.
- **D-13:** No concurrent generation limit needed — ~10 tours/week volume is too low for contention. Global cooldown is sufficient protection.
- **D-14:** Console/server logs for error tracking only. No DB error log table or external monitoring service needed for v1 volume.
- **D-15:** Add request timeouts: AI extraction timeout at 30 seconds, Canva polling timeout at 2 minutes. On timeout, return clear error message instead of hanging indefinitely.
- **D-16:** Global cooldown UI: yellow warning banner at top of page with countdown ("He thong dang cho Canva — con X phut"). Generate button disabled during cooldown.
- **D-16A:** Canva token-lineage failures are operational recovery events, not normal retry errors. Mark token state `NEEDS_RECONNECT` and route admins to `/admin/canva` to reconnect the affected environment.

### Completion State
- **D-17:** When both Canva links (Itinerary + Menu) succeed: show green success banner "Hoan thanh! Tai lieu da san sang tren Canva" + the 2 result cards + CTA buttons "Tao tour moi" (links to /upload) and "Xem lich su" (links to /history). Stepper shows final step with checkmark.
- **D-18:** Partial success (1 of 2 artifacts fails): show partial success message "Lich trinh da tao thanh cong. Thuc don gap loi — bam Thu lai." Stepper shows warning icon on "Tao Canva" step. Successful artifact shows result card, failed one shows retry button.

### Mobile Experience
- **D-19:** Desktop-first responsive design. Mobile should not break layout but is not the priority.
- **D-20:** Stepper compact mode on mobile: step numbers + icons only, text labels hidden. Full labels on desktop (md breakpoint and above).

### Vietnamese Wording Consistency
- **D-21:** Create a centralized messages/constants file (e.g., `src/lib/messages.ts`) for Phase 6 components: stepper labels, error messages, cooldown banner text, completion messages.
- **D-22:** Stepper labels: "Tai len", "Trich xuat", "Duyet", "Tao Canva", "Hoan thanh" — matching sidebar terminology.
- **D-23:** Scope: only centralize text for new Phase 6 components. Do not refactor existing phase text (upload form, review page inline text, etc.).

### Claude's Discretion
- Stepper component implementation details (CSS/animation, exact breakpoint for compact mode)
- Exact error message wording variations for each failure scenario
- DB schema for global cooldown flag (new table vs column on existing model)
- Exponential backoff implementation details
- Timeout implementation approach (AbortController, Promise.race, etc.)
- Success banner visual design (icon, spacing, animation)
- Messages file structure and export pattern

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 6 requirements
- `.planning/REQUIREMENTS.md` — UX-01 (step progress), UX-02 (error messages), SAFE-04 (volume handling)
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, 2 planned plans (06-01 and 06-02)

### Project context
- `.planning/PROJECT.md` — Core workflow, company rules, team size (~10 users), Canva setup
- `.planning/STATE.md` — Current position, accumulated decisions

### Prior phase decisions affecting Phase 6
- `.planning/phases/04-editable-canva-generation/04-CONTEXT.md` — D-07: copy template + populate flow, D-24: Canva links persist on review page, Canva rate limit handling pattern
- `.planning/phases/05-history-admin-control/05-CONTEXT.md` — D-01/D-02: history page links to /review/[id], D-07: /history route

### Key codebase files
- `src/lib/canva/client.ts` — CanvaRateLimitError class, canvaFetch with 429 handling and auto-retry on 401
- `src/lib/canva/oauth.ts` — Canva token state, DB advisory refresh lock, proactive refresh, and reconnect-required error handling
- `src/app/(app)/admin/canva` — Admin recovery UI for reconnecting revoked/expired Canva token lineage
- `src/lib/ai/extraction-client.ts` — AI retry logic (MAX_RETRIES=2), exponential backoff pattern, OpenAI API error handling
- `src/components/review/review-page.tsx` — Main review page with Canva generation flow, rate limit cooldown state, artifact result handling
- `src/components/review/canva-generation-panel.tsx` — Current generating/rate-limited display
- `src/components/review/canva-result-card.tsx` — Individual artifact result display with retry
- `src/app/(app)/upload/upload-form.tsx` — Upload form with inline error handling pattern
- `src/components/app-sidebar.tsx` — Sidebar navigation (stepper must integrate alongside)
- `prisma/schema.prisma` — DB schema for cooldown flag consideration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CanvaRateLimitError` class in `canva/client.ts`: Already parses 429 Retry-After header — extend for global cooldown
- `canvaFetch()`: Has auto-retry on 401 pattern — similar pattern can be used for backoff
- `CanvaGenerationPanel` component: Already shows "Dang tao Canva..." and rate limit alert — extend for global cooldown banner
- `CanvaResultCard` component: Shows per-artifact result with retry button — extend for partial success state
- `ReviewPage` state management: Already tracks `isRateLimited`, `cooldownMinutes`, `artifacts` — extend for global cooldown
- `sonner` toast: Already used app-wide for success/info — keep for success, switch errors to inline
- shadcn/ui Alert component: Already used on review page for errors — standardize across all pages

### Established Patterns
- Next.js 15 App Router with route groups: `(auth)` for login, `(app)` for protected pages
- Server Actions for mutations (approveDraft, generateCanva, saveDraftField)
- Prisma ORM with status-tracking pattern (PENDING -> PROCESSING -> COMPLETED/FAILED)
- Tailwind CSS + shadcn/ui for styling — all new components should follow this
- Vietnamese UI text with full diacritics throughout
- Client-side state management with useState/useCallback hooks (no global state library)

### Integration Points
- Stepper component: Must be placed in `(app)/layout.tsx` or as a shared component above each workflow page
- Stepper needs to know current upload context (uploadId, status) to determine active step
- Global cooldown flag: New DB model/column — all sessions query this before allowing generation
- Error alerts: Replace toast.error() calls with inline Alert rendering in ReviewPage, UploadForm
- Completion state: Integrate into ReviewPage after both artifacts succeed
- Messages file: New `src/lib/messages.ts` — imported by stepper, error alerts, cooldown banner, completion banner

</code_context>

<specifics>
## Specific Ideas

- Stepper should feel like a checkout flow — clear, linear, not overwhelming
- Error messages must always include a concrete next action ("Thu lai", "Chon file khac", "Quay ve Tai tai lieu") — never leave user stuck without knowing what to do
- Global cooldown protects the shared Canva API key from the whole team hitting rate limits simultaneously
- Completion state should feel celebratory but professional — success banner, not confetti
- The 5-step model (Tai len -> Trich xuat -> Duyet -> Tao Canva -> Hoan thanh) maps to actual processing stages, not just page views

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-operational-polish-reliability*
*Context gathered: 2026-03-27*
