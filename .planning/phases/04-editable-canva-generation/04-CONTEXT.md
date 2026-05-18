# Phase 4: Editable Canva Generation - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Map reviewed, approved tour content into supported Canva templates and return editable Canva links. Users approve content on the review page, confirm template selection, trigger generation, and receive two editable Canva links (Itinerary + Menu) displayed directly on the review page. This phase delivers: externalized template mappings, Canva API integration (copy template + populate text), async generation with polling, token lifecycle management, and the generation-to-link UI flow. It does NOT include history persistence, admin template management, or end-to-end progress indicators — those are Phase 5 and Phase 6 respectively.

</domain>

<decisions>
## Implementation Decisions

### Template Selection & Mapping
- **D-01:** 4 Canva templates for v1: 1-day Itinerary, 1-day Menu, 2-day Itinerary, 2-day Menu. Each is a regular Canva design (not Brand Template).
- **D-02:** Template selection is automatic + confirm. System detects `tourDuration` from Phase 3 extraction, pre-selects the correct template set, and user confirms before generation. No manual dropdown required.
- **D-03:** Template IDs stored in environment variables (e.g., `CANVA_TEMPLATE_1DAY_ITINERARY`, `CANVA_TEMPLATE_1DAY_MENU`, `CANVA_TEMPLATE_2DAY_ITINERARY`, `CANVA_TEMPLATE_2DAY_MENU`). Phase 5 may migrate to DB for admin UI.
- **D-04:** Field name mapping (structuredDraft fields to Canva text element names) will be defined after Claude researches Canva Connect API capabilities. User will setup data fields in Canva templates based on Claude's recommended field names derived from the structuredDraft Zod schema.
- **D-05:** Templates already exist in Canva but are not yet configured with API-compatible data fields. Setup will happen based on research findings.

### Canva API & Template Structure
- **D-06:** User has Canva Pro plan. Templates are regular designs (not Brand Templates).
- **D-07:** API flow: Copy the original template design to create a new design, then populate text content into the copy. The original template stays untouched as the source of truth.
- **D-08:** Current manual workflow: Open Canva → choose template → duplicate → manually edit text → done. The app automates this exact flow via API.
- **D-09:** Claude must research Canva Connect API to determine the best approach for working with regular designs on Canva Pro (autofill vs. copy+update elements vs. other methods). This research is a critical prerequisite before planning.
- **D-10:** v1 supports only 1-day and 2-day tours. 3-day tour support is deferred to v2 per roadmap.

### Template Text Elements
- **D-11:** Each template has text elements where each line/activity is a separate text box (khung rieng).
- **D-12:** Templates have a fixed maximum number of text boxes per section (~5-7 activity lines per section). Tours with fewer activities leave extra boxes empty.
- **D-13:** Each template has 1 page only.
- **D-14:** Text fitting: System only populates text into boxes. Adjustments to letter spacing, line height, and font size are left to the user in Canva afterward.
- **D-15:** When a tour has fewer activities than available boxes, extra boxes are left empty (blank text). User cleans up in Canva if needed.
- **D-16:** Target quality: 80-90% correct output. User fine-tunes remaining 10-20% in Canva (spacing, alignment, removing empty boxes, etc.).

### Generation Flow & UX
- **D-17:** Two-step flow after review: (1) Click "Xac nhan" to approve content, (2) Confirm template selection and click "Tao Canva" to trigger generation. Approve and Generate are separate actions.
- **D-18:** During generation (~10-30s), user sees a spinner/progress indicator on the review page. No redirect or navigation away.
- **D-19:** Re-generation is allowed. User can click "Tao lai" anytime to regenerate Canva outputs from the same approved content (e.g., after editing, or wanting a fresh copy).
- **D-20:** Both Itinerary and Menu generate in parallel with a single click. User does not need to trigger them separately.

### Results & Canva Links
- **D-21:** Canva links are displayed directly on the review page below the reviewed content. No redirect to a separate results page.
- **D-22:** Each link presented as a separate card: "Itinerary" card and "Menu" card, each with its own action buttons.
- **D-23:** Link actions: "Mo trong Canva" (open in new tab) + "Sao chep link" (copy to clipboard) + thumbnail preview of the generated design (if Canva API supports thumbnail retrieval).
- **D-24:** Links persist on the review page. User can bookmark `/review/[id]` and return anytime to see generated Canva links without regenerating.

### Token Lifecycle & Error Recovery
- **D-25:** Canva OAuth2 token auto-refresh when access token expires. Refreshed tokens are persisted to database so they survive server restarts. User never needs to manually refresh tokens.
- **D-26:** On generation failure (timeout, API error, invalid template): show Vietnamese error message on the review page + "Thu lai" (Retry) button. Approved content is never lost.
- **D-27:** Partial success handling: If one of the two generations succeeds but the other fails, show the successful Canva link immediately and provide a retry button only for the failed one. No all-or-nothing behavior.
- **D-28:** Rate limit handling: Show Vietnamese message "Canva dang ban, vui long thu lai sau X phut" + temporarily disable the generate button with a cooldown timer.
- **D-29:** Canva refresh tokens are single-use and must not be shared across local, staging, or production. Each environment reconnects independently through `/admin/canva`; revoked token lineage is stored as `NEEDS_RECONNECT` and surfaced to admins.
- **D-30:** Canva token refresh uses a Postgres advisory transaction lock plus the existing in-process mutex so concurrent requests and multiple server instances cannot refresh the same token at the same time.

### Claude's Discretion
- Canva Connect API integration approach (based on research findings)
- Exact Prisma schema extensions for Canva artifacts and token storage
- Canva API service implementation details (polling interval, timeout thresholds)
- Field name mapping between structuredDraft and Canva text elements
- Spinner/progress component design
- Result card component design and styling
- Thumbnail preview implementation approach
- Token refresh mechanism internals
- Error message wording details (must be Vietnamese)
- Rate limit detection and cooldown logic

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Project overview, Canva setup details, company formatting rules, sample files, constraints
- `.planning/REQUIREMENTS.md` — CANVA-01 through CANVA-06, UX-03, UX-04, SAFE-03 requirement definitions
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, notes on Canva adapter pattern

### Prior phase decisions
- `.planning/phases/01-capability-gate-secure-access/01-CONTEXT.md` — Auth patterns, NextAuth.js, session handling, server-side secret management (SAFE-01), Canva verification approach
- `.planning/phases/02-document-intake-parsing/02-CONTEXT.md` — Upload UX, extraction pipeline, quality scoring, sidebar nav, Vietnamese UI conventions
- `.planning/phases/03-structured-ai-extraction-rules-human-review/03-CONTEXT.md` — AI extraction flow, review/edit UI, company rules logic, structured output schema, approval gate

### Codebase patterns (established in Phase 1-3)
- `src/lib/canva/server-client.ts` — Canva config accessor (`getCanvaConfig()`) — server-only wrapper
- `src/lib/canva/oauth.ts` — Canonical Canva OAuth/token lifecycle path: proactive refresh, DB advisory lock, `NEEDS_RECONNECT`, and app OAuth helper functions
- `src/app/(app)/admin/canva` — Admin Canva connection status and reconnect flow
- `src/lib/env.ts` — Canva env schema (`getCanvaEnv()`) with CANVA_CLIENT_ID, CANVA_CLIENT_SECRET, CANVA_ACCESS_TOKEN, CANVA_REFRESH_TOKEN, CANVA_TEMPLATE_ID; forbidden public prefixes for Canva secrets
- `src/lib/ai/extraction-schema.ts` — `structuredDraftSchema` (discriminated union), `oneDaySchema`, `twoDaySchema`, `activitySchema`, `menuItemSchema` — the data structures to map into Canva
- `src/lib/review/draft.ts` — Draft persistence (`getDraft()`, `saveDraft()`, `approveDraft()`), review flag generation
- `src/app/(app)/review/[id]/page.tsx` — Review page server component loading upload + draft
- `src/app/(app)/review/[id]/actions.ts` — `approveDraft()` server action (currently only marks approval; Phase 4 extends with generation trigger)
- `src/components/review/review-page.tsx` — Review page client component with approval flow, post-approval alert banner
- `src/components/review/review-actions.tsx` — "Xac nhan & Tao Canva" button (currently approve-only)
- `src/app/api/uploads/route.ts` — Established API route pattern: auth check → validate → create record → run pipeline → update status → return JSON
- `prisma/schema.prisma` — Upload model (no Canva fields yet), UploadStatus enum
- `src/components/app-sidebar.tsx` — Sidebar nav items (no Canva/generate nav yet)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/canva/server-client.ts` — Canva config accessor, reuse and extend for API client initialization
- `src/lib/env.ts` — Env validation with Canva secret schema, extend with per-template-type env vars
- `src/lib/review/draft.ts` — Draft loading/saving, `getDraft()` returns validated `StructuredDraft` ready for Canva mapping
- `src/lib/db.ts` — Prisma client singleton for token persistence and generation record storage
- `src/components/ui/card.tsx` — Card component for Canva result link cards
- `src/components/ui/button.tsx` — Button component for generate/retry/open actions
- `src/components/ui/alert.tsx` — Alert component for error/success/cooldown messages
- `src/components/ui/badge.tsx` — Badge for generation status indicators
- `zod` (installed) — Validation for API responses and configuration schemas
- `sonner` (installed) — Toast notifications for copy-to-clipboard, generation success/failure

### Established Patterns
- Next.js 15 App Router with route groups: `(auth)` for login, `(app)` for protected pages
- Server Actions for mutations (approve draft, trigger generation)
- API routes with `runtime = "nodejs"`, auth check first, structured JSON responses `{ success, data?, error? }`
- Prisma ORM for database access with status-tracking pattern (PENDING → PROCESSING → COMPLETED/FAILED)
- Tailwind CSS + shadcn/ui for styling
- TypeScript strict mode with Zod validation
- `"server-only"` import guard for server-side modules
- Vietnamese UI text throughout (all user-facing strings)

### Integration Points
- `src/components/review/review-page.tsx` — Must be extended: add generation trigger UI, progress indicator, result cards with Canva links
- `src/components/review/review-actions.tsx` — Must be extended: separate approve step from generate step, add template confirmation
- `src/app/(app)/review/[id]/actions.ts` — Must add: `generateCanva()` server action
- `prisma/schema.prisma` — Must extend Upload model: add Canva generation status, design IDs, editable URLs, error messages, generation timestamps
- `src/lib/env.ts` — Must extend: add per-template-type env vars (CANVA_TEMPLATE_1DAY_ITINERARY, etc.)
- `src/lib/canva/server-client.ts` — Must extend: add Canva API service (copy design, populate content, poll job, retrieve edit URL)
- New: Canva token model in Prisma for persisting refreshed OAuth tokens
- New: Canva API route or server action for generation job status polling
- Phase 5 will consume persisted generation records (design IDs, URLs, timestamps) for history

</code_context>

<specifics>
## Specific Ideas

- The manual workflow today is: open Canva → pick template → duplicate → read tour document → type content into each text box → adjust spacing/line height → share. The app automates the reading+typing part, user still fine-tunes layout in Canva.
- Each text element in the template is a separate box for one line/activity. This means the API needs to identify and update individual text elements by position or name, not dump all content into one large text area.
- Vietnamese diacritics must render correctly in Canva outputs — test with real Vietnamese tour content during implementation.
- Canva Pro plan may limit API capabilities compared to Canva for Teams/Enterprise. Research must verify: can autofill work with regular designs? If not, what's the copy+update-elements approach?
- Template field setup is a joint effort: Claude recommends field names based on structuredDraft schema, user configures them in Canva. This happens before first real generation test.
- The 80-90% quality target means the system should not over-engineer text fitting. Focus on getting the right text into the right boxes; user handles visual polish.

</specifics>

<deferred>
## Deferred Ideas

- 3-day tour template support — v2 (user has template ready but roadmap scopes v1 to 1-day and 2-day only)
- Admin UI for template mapping management — Phase 5
- In-app Canva preview/editing — out of scope per roadmap
- Thumbnail generation as primary deliverable — thumbnails are nice-to-have if API supports it

</deferred>

---

*Phase: 04-editable-canva-generation*
*Context gathered: 2026-03-25*
