# Phase 3: Structured AI Extraction, Rules & Human Review - Research

**Researched:** 2026-03-24
**Domain:** Structured AI extraction, deterministic rules enforcement, and human review workflow for Vietnamese tour content
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AI-01 | System sends extracted document text to the configured external AI API for structured itinerary extraction | Use server-only OpenAI SDK client with custom `baseURL`, bounded retry classification, and automatic call from the upload pipeline. |
| AI-02 | AI extraction returns a structured result suitable for itinerary and menu generation, not free-form unvalidated text | Use `chat.completions.parse()` with `zodResponseFormat()` and a discriminated Zod schema keyed by duration. |
| AI-03 | User can review extracted content before Canva generation | Add dedicated `/review/[id]` route backed by persisted draft JSON and review status. |
| AI-04 | User can edit extracted fields inline before final generation | Use inline section/field editing with Server Actions, `useActionState`, and server-side re-validation on each save. |
| AI-05 | System does not invent missing tour facts when source text is incomplete; uncertain fields are left blank or flagged for review | Model nullable facts plus explicit `reviewFlags[]` and forbid prompt instructions that guess missing values. |
| RULE-01 | For 1-day tours, itinerary output is organized into 2 columns: Buổi sáng and Buổi chiều | Enforce with duration-discriminated schema and deterministic rules layer that normalizes section keys. |
| RULE-02 | For 2-day tours, itinerary output is organized into 2 columns: Ngày 1 and Ngày 2 | Same discriminated schema and rules verifier for 2-day structure. |
| RULE-03 | For school tours, greeting uses the school audience wording "Quý thầy cô và các bạn học sinh" | Prefer deterministic server derivation from `clientType === SCHOOL`; auto-fix when confident. |
| RULE-04 | For business or group tours, greeting uses business audience wording such as "Quý khách" or "Quý đoàn" | Deterministic rules layer derives/normalizes greeting from `clientType === GROUP`. |
| RULE-05 | School name must stay logically intact and not be split into separate broken lines in generated content preparation | Keep `schoolName` as a single canonical string token in draft JSON; rules layer must not fragment it. |
| RULE-06 | Phrases about returning to school must include the specific school name when the source document indicates a school-based tour | Rules layer composes or validates return phrase using `schoolName` when `clientType === SCHOOL`. |
| RULE-07 | Menu content is generated separately from itinerary content and follows the selected template structure for 1-day or 2-day tours | Separate `menu` subtree from `itinerary` subtree and mirror duration layout in schema. |
| SAFE-02 | AI output is validated before being used in rules processing or Canva payload construction | Reject non-parseable or non-schema-valid AI responses before persistence to approved draft state. |
</phase_requirements>

## Summary

Phase 3 should be planned as a typed pipeline, not a prompt-only feature. The safest v1 shape is: Phase 2 persists `normalizedText` on `Upload`, Phase 3 automatically runs a server-only OpenAI SDK call against the configured OpenAI-compatible gateway, the SDK parses into a Zod schema, a deterministic rules layer normalizes/fixes what can be fixed, the resulting draft is persisted, and the user lands on `/review/[id]` where inline edits are re-validated server-side before approval. This matches the project’s existing App Router, Prisma, Zod, and server-only secret handling patterns.

The most important planning constraint is that the AI should extract facts, while the server should own business-critical formatting logic. Greeting text, duration structure, and school-return wording are deterministic enough that the rules layer should be the source of truth even if the prompt also mentions them. That dual-layer model satisfies D-14/D-15 and reduces downstream Canva risk.

The largest uncertainty is gateway compatibility, not app structure. The OpenAI Node SDK officially supports custom `baseURL` and Zod-based parsing, but this phase depends on pikaai.xyz faithfully supporting the compatible endpoint behavior for `chat.completions.parse()` and the `gpt-5.4` model identifier. Plan 03-01 should begin with a real contract smoke test against the gateway before UI work expands.

**Primary recommendation:** Use `openai` SDK structured parsing with a duration-discriminated Zod schema, persist one canonical review draft as Prisma JSON on the `Upload` record, and gate all downstream approval on server-side rules verification plus human review.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `openai` | 6.32.0 | Server-side AI client with custom `baseURL`, typed errors, and schema parsing helpers | Official SDK; supports overriding `baseURL` and has first-party Zod parsing examples/helpers. |
| `zod` | repo: 3.24.0 installed; current: 4.3.6 | Canonical schema for AI output, review edits, and rules validation | Already in repo; official `openai` examples explicitly note compatibility with Zod v3 and v4. |
| `@prisma/client` | repo: 6.6.0 installed; current: 7.5.0 | Persist nested itinerary/menu draft, flags, and rules metadata | Existing ORM stack; official docs support `Json` fields for imported or irregular nested structures. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Next.js App Router Server Actions | repo: 15.3.1 | Inline draft edits, approval, and re-extract mutations | Use for same-app form mutations on `/review/[id]` instead of adding new REST endpoints. |
| React `useActionState` / `useFormStatus` | React 19.1.0 | Inline edit feedback, pending state, and validation messages | Use in editable review sections and approve/re-extract buttons. |
| Existing `server-only` env pattern (`getAiEnv()`, `getAiConfig()`) | current repo pattern | Keep secrets off the client | Use for all AI client creation and rule-seeding scripts. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `openai` SDK parse helpers | Raw `fetch` + manual JSON parsing | More boilerplate, weaker error typing, easier to mishandle invalid JSON or retries. |
| Prisma `Json` draft payload | Fully normalized itinerary/day/activity tables | Better for analytics later, but over-modeled for lean v1 review/edit flow and re-extract cycles. |
| Server Actions for edits | Custom `/api/review/*` endpoints | Acceptable for public/external APIs, but unnecessary for same-app inline edits in current architecture. |

**Installation:**
```bash
npm install openai
```

**Version verification:**
- `openai`: 6.32.0, published 2026-03-17 (`npm view openai version time --json`)
- `zod`: 4.3.6 current, published 2026-01-22; repo currently uses 3.24.0 and the official OpenAI parsing example notes it also works with `zod/v3`
- `@prisma/client`: 7.5.0 current, published 2026-03-11; repo currently uses 6.6.0 and this phase does not require a Prisma upgrade

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/
│   └── (app)/
│       └── review/
│           └── [id]/
│               ├── page.tsx          # Review screen loader and layout
│               ├── actions.ts        # Inline save, approve, and re-extract actions
│               └── loading.tsx       # AI extraction/reload state
├── components/
│   └── review/
│       ├── review-page.tsx           # 2-column composition
│       ├── editable-field.tsx        # Click-to-edit primitive
│       ├── flagged-field.tsx         # Warning border/icon wrapper
│       ├── itinerary-editor.tsx      # Left column
│       └── menu-editor.tsx           # Right column
├── lib/
│   ├── ai/
│   │   ├── extraction-client.ts      # OpenAI client factory + retry wrapper
│   │   ├── extraction-prompt.ts      # Hardcoded v1 prompt
│   │   ├── extraction-schema.ts      # Zod schema + types
│   │   └── extract-tour.ts           # AI call → parsed draft
│   ├── review/
│   │   ├── draft.ts                  # Draft persistence + review flags
│   │   └── status.ts                 # Workflow enums/helpers
│   └── rules/
│       ├── engine.ts                 # Deterministic post-AI rules verifier
│       ├── types.ts                  # Rule config types
│       └── seed.ts                   # Seed defaults for v1 rules
└── prisma/
    ├── schema.prisma                 # Upload JSON/status extensions + rules table
    └── seed.ts                       # Seed rules alongside users
```

### Pattern 1: Use a discriminated schema keyed by duration
**What:** Model the structured draft as a Zod discriminated union on `duration`, so 1-day and 2-day tours cannot share invalid section shapes.

**When to use:** Always. This phase explicitly excludes 3-day and 4-day support, so the schema should encode that constraint.

**Why:** It prevents impossible combinations like `duration: "ONE_DAY"` with `day2` content, and it gives the planner clear validation boundaries for SAFE-02.

**Example:**
```typescript
import { z } from "zod";

const activitySchema = z.object({
  timeLabel: z.string().optional(),
  text: z.string().min(1),
  sourceConfidence: z.enum(["high", "medium", "low"]),
  needsReview: z.boolean().default(false),
});

const oneDaySchema = z.object({
  duration: z.literal("ONE_DAY"),
  itinerary: z.object({
    morning: z.array(activitySchema),
    afternoon: z.array(activitySchema),
  }),
  menu: z.object({
    morning: z.array(z.string()),
    lunch: z.array(z.string()),
    afternoon: z.array(z.string()),
  }),
});

const twoDaySchema = z.object({
  duration: z.literal("TWO_DAY"),
  itinerary: z.object({
    day1: z.array(activitySchema),
    day2: z.array(activitySchema),
  }),
  menu: z.object({
    day1: z.array(z.string()),
    day2: z.array(z.string()),
  }),
});

export const structuredDraftSchema = z.discriminatedUnion("duration", [
  oneDaySchema,
  twoDaySchema,
]);
```
Source: Official Zod usage pattern in Next.js forms guide and official OpenAI parsing example with `zodResponseFormat()`

### Pattern 2: Facts first, deterministic rules second
**What:** Ask AI to extract facts and section content, then let the server compute or normalize deterministic business outputs.

**When to use:** For greeting text, duration section labels, school-return wording, and school-name integrity.

**Why:** AI is useful for extraction from messy Vietnamese source documents; it is not the best source of truth for business rules that are fixed and visible to clients.

**Example:**
```typescript
function applyRules(draft: StructuredDraft, rules: RuleSet): StructuredDraft {
  if (draft.clientType === "SCHOOL") {
    draft.greetingText = "Quý thầy cô và các bạn học sinh";

    if (draft.schoolName && draft.returnLocation?.includes("trường")) {
      draft.returnLocation = `Về lại ${draft.schoolName}`;
    }
  }

  if (draft.clientType === "GROUP") {
    draft.greetingText = "Quý khách";
  }

  return draft;
}
```
Source: Project rules in `/home/minhnhut_dev/projects/siletravel/.planning/PROJECT.md` and Phase 3 locked decisions in `/home/minhnhut_dev/projects/siletravel/.planning/phases/03-structured-ai-extraction-rules-human-review/03-CONTEXT.md`

### Pattern 3: Persist one canonical draft plus review metadata on `Upload`
**What:** Extend `Upload` with JSON draft payload(s), workflow status, attempts, and review flags instead of building many new tables for v1.

**When to use:** For the current phase’s extracted itinerary/menu draft, unresolved flags, approval state, and re-extract count.

**Why:** The app already uses `Upload` as the pipeline anchor. Reusing it keeps routing simple (`/review/[id]`), avoids premature over-modeling, and aligns with Prisma’s JSON field guidance for irregular nested data.

**Suggested fields:**
- `aiStatus` (`PENDING`, `PROCESSING`, `READY_FOR_REVIEW`, `FAILED`)
- `reviewStatus` (`PENDING_REVIEW`, `REVIEWED`, `APPROVED`)
- `structuredDraft Json?`
- `reviewFlags Json?` or `String[]`
- `aiModel String?`
- `aiAttemptCount Int @default(0)`
- `approvedAt DateTime?`
- `clientType String?`
- `tourDuration String?`

### Pattern 4: Inline edits should still submit through server validation
**What:** Use client-side click-to-edit UX, but every save should go through a Server Action that validates the changed field/section and re-runs invariant checks.

**When to use:** All itinerary/menu edits, tour type changes, and approve/re-extract actions.

**Example:**
```typescript
"use server";

import { auth } from "@/lib/auth";
import { structuredDraftSchema } from "@/lib/ai/extraction-schema";

export async function saveDraftField(uploadId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const patch = Object.fromEntries(formData);
  // load persisted draft, merge patch, safeParse, re-run rules verifier, then persist
}
```
Source: Next.js official forms guide (`<form action={serverAction}>`, `useActionState`, auth inside each Server Action)

### Anti-Patterns to Avoid
- **Flat schema with dozens of nullable fields:** Avoid `morningText`, `afternoonText`, `day1Text`, `day2Text` in one object. It makes invalid states easy and validation brittle.
- **Prompt-only rule enforcement:** If greeting text or return wording is only in the prompt, rule drift will leak into Canva payloads.
- **Client-only approval:** Never trust the browser’s current state as approval truth. Approval must re-load, re-validate, and persist server-side.
- **Re-extract silently overwriting edits:** If a user already edited the draft, re-extract must warn or require confirmation before replacing current content.
- **Public/browser AI calls:** All AI requests must stay behind existing server-only env handling.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema-safe AI parsing | Manual `JSON.parse()` + ad-hoc object checks | `openai` SDK `chat.completions.parse()` + `zodResponseFormat()` + Zod | Official helper already handles schema formatting and parsed output flow. |
| Nested draft persistence | Many small relational tables for morning/day/menu rows in v1 | Prisma `Json` field for canonical draft + a few scalar workflow columns | Review payload is nested and changes shape by duration; JSON is simpler for v1. |
| Inline review mutations | Bespoke REST layer for same-page edits | Server Actions + `useActionState` / `useFormStatus` | Matches current Next.js architecture and reduces boilerplate. |
| Business greeting selection | AI-only text generation | Deterministic server rule derived from `clientType` | Greeting errors are business-visible and easily normalized. |
| Retry/error taxonomy | Custom string matching on thrown errors | Official SDK error classes + bounded retry policy | Avoids retrying auth/config failures that should fail fast. |

**Key insight:** The expensive bugs in this domain are not layout bugs, they are silent data-shape and business-rule bugs. First-party parsing helpers, JSON persistence, and deterministic rule derivation remove more risk than custom code adds value.

## Common Pitfalls

### Pitfall 1: Environment variable mismatch between locked decision and current code
**What goes wrong:** Phase 3 context locks `ANTHROPIC_BASE_URL` / `ANTHROPIC_API_KEY`, but the current repo only validates `AI_API_URL` / `AI_API_KEY` via `getAiEnv()` and `getAiConfig()`.

**Why it happens:** Phase decisions evolved after Phase 1 secret handling was already implemented.

**How to avoid:** Add a single server-only env adapter that resolves the chosen names explicitly and fails with a clear startup error if neither set is present. Do not scatter direct `process.env` reads.

**Warning signs:** Local setup works for one developer but CI or production fails with missing env errors despite credentials existing.

### Pitfall 2: Treating structured output as "good enough" without explicit parse failure handling
**What goes wrong:** A model returns almost-correct JSON, but downstream code assumes success and stores partial or malformed data.

**Why it happens:** Teams validate only at prompt time, not at parse time.

**How to avoid:** Treat parse failure as a first-class result: retry bounded times, then persist a failed AI status and show a Vietnamese error. Never continue to rules processing without a valid parsed object.

**Warning signs:** `undefined` section fields, impossible duration/layout combinations, or Canva payload builders needing defensive null guards everywhere.

### Pitfall 3: Letting AI invent missing facts instead of modeling uncertainty
**What goes wrong:** Missing pickup/return/school/date values get guessed and look convincing enough to slip through review.

**Why it happens:** Prompts optimize for completeness; UIs often represent blank and unknown the same way.

**How to avoid:** Use explicit `needsReview`/`reviewFlags[]` markers and preserve `null` for unknown facts. Make highlighted review state visually stronger than normal fields.

**Warning signs:** Review page looks complete even when the source document is incomplete, or users cannot tell which fields came from inference.

### Pitfall 4: Overwriting user edits during re-extract
**What goes wrong:** User corrects tour type or menu items, then clicks re-extract and loses accepted work.

**Why it happens:** Re-extract is implemented as a blind overwrite of `structuredDraft`.

**How to avoid:** Track `reviewStatus` and `dirty` state, then require confirmation before replacing an edited draft. Persist `aiAttemptCount` so support/debugging can see retries.

**Warning signs:** User reports "I fixed it and it changed back" or approved draft fields differ from latest AI output unexpectedly.

### Pitfall 5: JSON field querying assumptions on PostgreSQL
**What goes wrong:** Planner assumes Prisma JSON filtering works identically across connectors or supports every nested array-object filter on PostgreSQL.

**Why it happens:** Prisma supports advanced JSON filters, but connector syntax and capabilities differ.

**How to avoid:** For v1, query workflow with scalar columns (`reviewStatus`, `clientType`, `tourDuration`) and treat JSON filtering as secondary. Use PostgreSQL `path: ["..."]` syntax only where needed.

**Warning signs:** Complex admin/history queries start depending on deep JSON array/object matching and become awkward or unsupported.

## Code Examples

Verified patterns from official sources:

### Create an OpenAI client with custom `baseURL`
```typescript
import OpenAI from "openai";
import { getAiConfig } from "@/lib/ai/server-client";

const { baseUrl, apiKey } = getAiConfig();

export const aiClient = new OpenAI({
  apiKey,
  baseURL: baseUrl,
});
```
Source: Official `openai` client source documents `baseURL` override support, and repo pattern in `/home/minhnhut_dev/projects/siletravel/src/lib/ai/server-client.ts`

### Parse structured output directly into a Zod schema
```typescript
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const TourDraft = z.object({
  title: z.string(),
  duration: z.enum(["ONE_DAY", "TWO_DAY"]),
});

const completion = await aiClient.chat.completions.parse({
  model: "gpt-5.4",
  messages: [
    { role: "system", content: "Extract only facts from the tour document." },
    { role: "user", content: normalizedText },
  ],
  response_format: zodResponseFormat(TourDraft, "tour_draft"),
});

const parsed = completion.choices[0]?.message.parsed;
if (!parsed) {
  throw new Error("AI did not return schema-valid output");
}
```
Source: Official `openai-node` parsing example and helpers docs

### Validate and submit inline edits with a Server Action
```typescript
"use client";

import { useActionState } from "react";
import { saveDraftField } from "./actions";

const initialState = { message: "" };

export function EditableFieldForm() {
  const [state, formAction, pending] = useActionState(saveDraftField, initialState);

  return (
    <form action={formAction}>
      <input name="value" required />
      <p aria-live="polite">{state.message}</p>
      <button disabled={pending}>Lưu</button>
    </form>
  );
}
```
Source: Next.js official forms guide (`useActionState`, pending state, `<form action={...}>`)

### Persist nested draft JSON with Prisma
```typescript
await prisma.upload.update({
  where: { id: uploadId },
  data: {
    structuredDraft: parsedDraft,
    reviewStatus: "PENDING_REVIEW",
    clientType: parsedDraft.clientType,
    tourDuration: parsedDraft.duration,
  },
});
```
Source: Prisma official JSON field guidance and current repo `Upload`-centric pipeline pattern

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Free-form completion text | Schema-constrained structured output parsed into application types | Current official `openai-node` SDK examples | Safer downstream automation and fewer defensive null/shape checks. |
| Prompt-only business formatting | Dual-layer AI prompt + deterministic server verifier | Current best practice for high-visibility business rules | Reduces hallucination and keeps rules editable later. |
| Client-triggered mutation APIs everywhere | App Router forms + Server Actions + pending hooks | Current Next.js App Router guidance | Cleaner inline edit flow with built-in progressive enhancement. |
| Over-normalizing imported nested documents | JSON payload + selective scalar metadata | Mature Prisma JSON field support | Faster iteration for nested, irregular draft content. |

**Deprecated/outdated:**
- Free-form AI output as the only extraction result: outdated for any workflow that must safely feed more automation.
- Treating OpenAI-compatible gateways as perfectly equivalent without contract tests: outdated assumption; compatibility should be verified, not presumed.
- UI-only validation for approval: insufficient once downstream Canva payload construction depends on the reviewed object.

## Open Questions

1. **Does pikaai.xyz fully support the exact OpenAI SDK parsing flow needed for `chat.completions.parse()` with `gpt-5.4`?**
   - What we know: Official SDK supports custom `baseURL` and official examples show Zod parsing helpers.
   - What's unclear: Whether this specific gateway/model pair supports the same response-format behavior end to end.
   - Recommendation: Start Plan 03-01 with a real gateway smoke test and keep a fallback path of `chat.completions.create()` + local `safeParse()` if parsing helpers fail.

2. **Which env names should become canonical for this repo: `AI_*` or `ANTHROPIC_*`?**
   - What we know: Current code uses `AI_API_URL` / `AI_API_KEY`; Phase 3 decision text names `ANTHROPIC_BASE_URL` / `ANTHROPIC_API_KEY`.
   - What's unclear: Whether Phase 3 should rename the project convention or support aliases.
   - Recommendation: Do not leave this implicit. Add one adapter function and document one canonical pair for future phases.

3. **Should re-extract overwrite the current draft or preserve an immutable previous version?**
   - What we know: v1 needs a re-extract button, but Phase 5 history has not shipped yet.
   - What's unclear: Whether the team wants version history now or only the latest draft.
   - Recommendation: For lean v1, persist only the latest canonical draft plus `aiAttemptCount`, but require confirmation before overwrite if the draft has user edits.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 + Playwright 1.52.0 |
| Config file | `/home/minhnhut_dev/projects/siletravel/vitest.config.ts`, `/home/minhnhut_dev/projects/siletravel/playwright.config.ts` |
| Quick run command | `npm run test -- src/lib/ai/structured-extraction.test.ts src/lib/rules/rule-engine.test.ts` |
| Full suite command | `npm run test && npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | Upload pipeline calls external AI on server after text extraction | unit/integration | `npm run test -- src/lib/ai/structured-extraction.test.ts` | ❌ Wave 0 |
| AI-02 | Only schema-valid structured output becomes draft data | unit | `npm run test -- src/lib/ai/extraction-schema.test.ts` | ❌ Wave 0 |
| AI-03 | User reaches dedicated review page before generation | e2e | `npm run test:e2e -- tests/e2e/ai-review.spec.ts` | ❌ Wave 0 |
| AI-04 | Inline edit saves field changes server-side | e2e/unit | `npm run test -- src/lib/review/save-draft.test.ts && npm run test:e2e -- tests/e2e/ai-review.spec.ts` | ❌ Wave 0 |
| AI-05 | Missing facts remain blank/flagged, not invented | unit | `npm run test -- src/lib/ai/structured-extraction.test.ts -t "leaves unknown facts blank"` | ❌ Wave 0 |
| RULE-01 | 1-day tours normalize to morning/afternoon structure | unit | `npm run test -- src/lib/rules/rule-engine.test.ts -t "one-day layout"` | ❌ Wave 0 |
| RULE-02 | 2-day tours normalize to day1/day2 structure | unit | `npm run test -- src/lib/rules/rule-engine.test.ts -t "two-day layout"` | ❌ Wave 0 |
| RULE-03 | School tours use school greeting | unit | `npm run test -- src/lib/rules/rule-engine.test.ts -t "school greeting"` | ❌ Wave 0 |
| RULE-04 | Group tours use business greeting | unit | `npm run test -- src/lib/rules/rule-engine.test.ts -t "group greeting"` | ❌ Wave 0 |
| RULE-05 | School name stays intact in prepared content | unit | `npm run test -- src/lib/rules/rule-engine.test.ts -t "school name intact"` | ❌ Wave 0 |
| RULE-06 | Return-to-school wording includes school name | unit | `npm run test -- src/lib/rules/rule-engine.test.ts -t "return wording"` | ❌ Wave 0 |
| RULE-07 | Menu remains separate and mirrors duration structure | unit/e2e | `npm run test -- src/lib/rules/rule-engine.test.ts -t "menu structure"` | ❌ Wave 0 |
| SAFE-02 | Invalid AI output never reaches downstream approval state | unit/integration | `npm run test -- src/lib/ai/structured-extraction.test.ts -t "rejects invalid output"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test -- src/lib/ai/structured-extraction.test.ts src/lib/rules/rule-engine.test.ts`
- **Per wave merge:** `npm run test && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/ai/structured-extraction.test.ts` — gateway call contract, retry policy, and blank/flagged fact behavior
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/ai/extraction-schema.test.ts` — discriminated schema validity and SAFE-02 guardrails
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/rules/rule-engine.test.ts` — RULE-01 through RULE-07 deterministic enforcement
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/review/save-draft.test.ts` — inline edit persistence and re-validation
- [ ] `/home/minhnhut_dev/projects/siletravel/tests/e2e/ai-review.spec.ts` — review page, inline edit, re-extract, and approve gate flow
- [ ] Authenticated review-page fixtures/seed helper — create an upload with `normalizedText` and persisted draft state for stable e2e coverage

## Sources

### Primary (HIGH confidence)
- Official OpenAI Node SDK README: https://github.com/openai/openai-node/blob/master/README.md - SDK installation, usage, error classes
- Official OpenAI Node parsing example: https://github.com/openai/openai-node/blob/master/examples/parsing.ts - `chat.completions.parse()` with `zodResponseFormat()`
- Official OpenAI Node helpers docs: https://github.com/openai/openai-node/blob/master/helpers.md - parsing helper behavior and restrictions
- Official OpenAI Node client source: https://github.com/openai/openai-node/blob/master/src/client.ts - `baseURL` override support
- Official Prisma docs on JSON fields: https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields - JSON persistence and filtering caveats
- Official Next.js forms guide: https://nextjs.org/docs/app/guides/forms - Server Actions, `useActionState`, `useFormStatus`, `useOptimistic`
- npm registry metadata for `openai`, `zod`, `@prisma/client`, and `next` - current versions and publish dates verified on 2026-03-24

### Secondary (MEDIUM confidence)
- `/home/minhnhut_dev/projects/siletravel/.planning/phases/03-structured-ai-extraction-rules-human-review/03-CONTEXT.md` - locked phase decisions and scope
- `/home/minhnhut_dev/projects/siletravel/.planning/PROJECT.md` - company rules and Canva/domain constraints
- `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts` - current upload orchestration pattern
- `/home/minhnhut_dev/projects/siletravel/src/lib/ai/server-client.ts` - existing server-only AI config access pattern
- `/home/minhnhut_dev/projects/siletravel/src/lib/env.ts` - current AI env naming and validation
- `/home/minhnhut_dev/projects/siletravel/prisma/schema.prisma` - current `Upload`-centric persistence model

### Tertiary (LOW confidence)
- PikaAI gateway compatibility assumptions for `chat.completions.parse()` and `gpt-5.4` - requires live contract validation in Plan 03-01

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - official SDK/docs and npm registry confirm the recommended libraries and capabilities
- Architecture: MEDIUM - repo-aligned recommendations are strong, but gateway behavior and exact persistence shape still need project-level validation
- Pitfalls: HIGH - most are directly evidenced by current repo patterns, locked decisions, and official docs caveats

**Research date:** 2026-03-24
**Valid until:** 2026-03-31