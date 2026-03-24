# Phase 3: Structured AI Extraction, Rules & Human Review - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn parsed Vietnamese text (from Phase 2 extraction pipeline) into structured, reviewable tour content that follows v1 company rules. Users can review and edit AI-extracted content on a dedicated review page before any Canva generation happens. This phase delivers: AI extraction integration, structured output with schema validation, company rules enforcement (dual-layer: AI prompt + server verify), inline review/edit UI, and tour type detection. It does NOT include Canva generation, history, or admin rule management UI — those are Phase 4 and Phase 5 respectively.

</domain>

<decisions>
## Implementation Decisions

### AI Extraction Flow
- **D-01:** Use OpenAI-compatible gateway (pikaai.xyz) via OpenAI SDK with custom `baseURL`. Credentials: `ANTHROPIC_BASE_URL` as baseURL, `ANTHROPIC_API_KEY` as API key.
- **D-02:** Default model: `gpt-5.4` — strong enough for accurate Vietnamese tour document extraction.
- **D-03:** AI returns structured JSON matching a Zod schema. Only schema-valid output proceeds to rules processing. Invalid responses trigger retry or error.
- **D-04:** When AI cannot find information in the source document (e.g., missing departure time, missing location), the field is left blank and flagged for user review — system never invents/hallucinates missing facts.
- **D-05:** Prompt is hardcoded in code for v1. Prompt includes company rules so AI applies them during extraction.
- **D-06:** Auto retry up to 2 times on API failure (timeout, rate limit, invalid response), then show Vietnamese error message to user.
- **D-07:** Flow: Upload → Extract text (Phase 2 pipeline) → **Automatically** call AI extraction → Redirect to review page. No manual "call AI" step.

### Review & Edit UI
- **D-08:** Dedicated review page at `/review/:id` — has its own URL, user can bookmark and return to it.
- **D-09:** Layout: 2 columns side by side — left column: Itinerary (editable), right column: Menu (editable). User sees both simultaneously.
- **D-10:** Edit style: Inline click-to-edit — user clicks on any text field to edit it directly in place.
- **D-11:** Uncertain/flagged fields: Yellow/orange border highlight + warning icon next to fields that need review.
- **D-12:** Single "Xac nhan & Tao Canva" button to approve both itinerary and menu at once → proceeds to Canva generation (Phase 4).
- **D-13:** "Trich xuat lai" (Re-extract) button available — calls AI again with the same extracted text if user is not satisfied with results.

### Company Rules Logic
- **D-14:** Dual-layer rules enforcement: (1) AI knows rules via prompt and applies them during extraction, (2) Server verifies AI output against rules after extraction.
- **D-15:** Rule violations: Auto-fix when system is confident (e.g., school greeting for school tours), flag for user review when uncertain.
- **D-16:** Rules stored in database — prepares data model for Phase 5 admin management UI. For v1, rules are seeded via migration/seed script.
- **D-17:** v1 rules implemented:
  - RULE-01: 1-day tour → 2 columns: Buoi sang / Buoi chieu
  - RULE-02: 2-day tour → 2 columns: Ngay 1 / Ngay 2
  - RULE-03: School tours → greeting: "Quy thay co va cac ban hoc sinh"
  - RULE-04: Business/group tours → greeting: "Quy khach" or "Quy doan"
  - RULE-05: School name stays intact on one line
  - RULE-06: "Return to school" phrases include specific school name
  - RULE-07: Menu generated separately, follows same duration structure

### Tour Type Detection
- **D-18:** Tour duration (1-day vs 2-day): AI detects from document text → user confirms on review page (editable dropdown/radio).
- **D-19:** Client type (school vs business/group): AI detects from document text (keywords like "THPT", "tieu hoc", "THCS") → user confirms on review page.

### Structured Output Schema
- **D-20:** Full v1 fields: tour title, client/customer name, tour date(s), duration (1-day/2-day), greeting text, itinerary sections (morning/afternoon or day1/day2 with activities), menu sections (matching itinerary structure), pickup location, return location, school name (if applicable).

### Claude's Discretion
- Exact Zod schema structure and field naming
- Exact prompt engineering approach
- OpenAI SDK configuration details
- Database schema for rules storage
- Loading/progress UI during AI extraction
- Error state UI design
- Exact inline edit component implementation
- Review page responsive behavior

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Company formatting rules, Canva setup, AI integration details, sample files
- `.planning/REQUIREMENTS.md` — AI-01 through AI-05, RULE-01 through RULE-07, SAFE-02 requirement definitions
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, notes on hallucination risk

### Prior phase decisions
- `.planning/phases/01-capability-gate-secure-access/01-CONTEXT.md` — Auth patterns, NextAuth.js, session handling, server-side secret management
- `.planning/phases/02-document-intake-parsing/02-CONTEXT.md` — Upload UX, extraction pipeline, quality scoring, sidebar nav, Vietnamese UI decisions

### Codebase patterns (established in Phase 1 & 2)
- `src/lib/ai/server-client.ts` — AI credentials access pattern (server-only, uses getAiEnv())
- `src/lib/documents/pipeline.ts` — Extraction pipeline that produces normalizedText (Phase 3 input)
- `src/lib/documents/types.ts` — ExtractionResult, QualityResult types (upstream data structures)
- `src/lib/env.ts` — Environment variable handling with AI_API_URL, AI_API_KEY
- `prisma/schema.prisma` — Current schema with User, Upload models
- `src/components/ui/` — shadcn/ui components: card, button, input, badge, alert, sheet, separator
- `src/components/app-sidebar.tsx` — Sidebar navigation component

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/ai/server-client.ts` — AI config accessor (`getAiConfig()` returns baseUrl + apiKey), reuse for OpenAI SDK initialization
- `src/lib/documents/pipeline.ts` — `runExtractionPipeline()` produces `ExtractionResult` with `normalizedText` — direct input for AI extraction
- `src/lib/documents/types.ts` — `ExtractionResult`, `QualityResult`, `DocumentKind` types
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/auth.ts` — Auth helpers for user context
- `src/components/ui/card.tsx` — Card component for layout sections
- `src/components/ui/button.tsx` — Button component for actions
- `src/components/ui/input.tsx` — Input component for inline editing
- `src/components/ui/badge.tsx` — Badge for status indicators
- `src/components/ui/alert.tsx` — Alert for warnings/flags
- `zod` (installed) — Schema validation for AI output
- `sonner` (installed) — Toast notifications

### Established Patterns
- Next.js 15 App Router with route groups: `(auth)` for login, `(app)` for protected pages
- Server Actions for mutations (see `src/app/(auth)/login/actions.ts`)
- Prisma ORM for database access
- Tailwind CSS + shadcn/ui for styling
- TypeScript strict mode with Zod validation
- "server-only" import guard for server-side modules

### Integration Points
- Phase 2 extraction pipeline output → Phase 3 AI extraction input
- Upload model in Prisma → needs extension for AI extraction results and review status
- New route: `src/app/(app)/review/[id]/page.tsx` — Review page
- Sidebar nav → needs "Review" or updated navigation flow
- Phase 4 will consume approved/reviewed content from this phase

</code_context>

<specifics>
## Specific Ideas

- Tour program files are 3-4 pages Vietnamese content — AI must handle Vietnamese diacritics correctly throughout
- The review page is the core UX of this phase — it's where users catch AI mistakes and apply corrections before Canva generation
- Company formatting rules are business-critical — wrong greeting or broken school name is immediately visible to clients
- The dual-layer approach (AI + server verify) adds safety against AI inconsistency while keeping the prompt as the primary mechanism
- Re-extract button is important because AI quality may vary — user should be able to try again without re-uploading

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-structured-ai-extraction-rules-human-review*
*Context gathered: 2026-03-24*
