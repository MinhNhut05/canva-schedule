# Phase 03 Verification: Structured AI Extraction, Rules Engine & Human Review

**Phase:** 03-structured-ai-extraction-rules-human-review
**Verified:** 2026-03-25T04:36:00Z
**Verdict:** PASS

---

## Phase Goal

> Build AI extraction pipeline with structured schema validation, deterministic company rules engine, and human review gate with inline editing

## Plans Executed

| Plan | Title | Status | Requirements Covered |
|------|-------|--------|---------------------|
| 03-01 | Structured AI Extraction with Schema Validation | COMPLETE | AI-01, AI-02, AI-05, SAFE-02 |
| 03-02 | Review and Inline Edit Step (Human Review Gate) | COMPLETE | AI-03, AI-04 |
| 03-03 | Company Rules Engine | COMPLETE | RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, RULE-07 |

**3/3 plans complete. All 3 SUMMARYs exist with self-check PASSED.**

---

## Requirement Cross-Reference

Every requirement ID listed in the phase frontmatter is traced below against REQUIREMENTS.md definitions and verified against the actual codebase.

### AI-01: System sends extracted document text to the configured external AI API for structured itinerary extraction

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "System sends extracted document text to the configured external AI API for structured itinerary extraction" |
| Claimed in plan | 03-01 |
| Codebase evidence | `src/lib/ai/extraction-client.ts` — `callExtractionApi()` sends `systemPrompt` + `userContent` to OpenAI-compatible API via `client.chat.completions.create()`. `src/lib/ai/extract-tour.ts` — `extractTour(normalizedText)` orchestrates the call. `src/app/api/uploads/route.ts:107` — `extractTour(result.normalizedText)` is called after text extraction completes. `src/lib/env.ts` — `getAiEnv()` resolves `AI_API_URL` / `AI_API_KEY` from env. `package.json` — `"openai": "^6.32.0"` installed. |
| **Status** | **PASS** |

### AI-02: AI extraction returns a structured result suitable for itinerary and menu generation, not free-form unvalidated text

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "AI extraction returns a structured result suitable for itinerary and menu generation, not free-form unvalidated text" |
| Claimed in plan | 03-01 |
| Codebase evidence | `src/lib/ai/extraction-schema.ts` — Zod discriminated union schema (`structuredDraftSchema`) validates ONE_DAY (morning/afternoon) and TWO_DAY (day1/day2) structures with typed `Activity[]` and `MenuItem[]`. `src/lib/ai/extract-tour.ts:34` — `structuredDraftSchema.safeParse(rawJson)` validates AI output before returning. `src/lib/ai/extraction-prompt.ts` — hardcoded Vietnamese system prompt specifies exact JSON schema. |
| **Status** | **PASS** |

### AI-03: User can review extracted content before Canva generation

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "User can review extracted content before Canva generation" |
| Claimed in plan | 03-02 |
| Codebase evidence | `src/app/(app)/review/[id]/page.tsx` — bookmarkable server route at `/review/[id]` loads upload metadata + draft from DB, renders `ReviewPage`. `src/components/review/review-page.tsx` — 2-column layout: `ItineraryEditor` (left) + `MenuEditor` (right). Handles empty state, error state, and approved state. `src/components/review/review-actions.tsx` — sticky bottom bar with "Xac nhan & Tao Canva" CTA that sets `reviewStatus=APPROVED`. Button disabled until approval, enforcing the gate. `src/app/(app)/upload/upload-form.tsx:211` — `router.push('/review/${payload.data.uploadId}')` redirects after upload, ensuring review step is mandatory. |
| **Status** | **PASS** |

### AI-04: User can edit extracted fields inline before final generation

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "User can edit extracted fields inline before final generation" |
| Claimed in plan | 03-02 |
| Codebase evidence | `src/components/review/editable-field.tsx` — click-to-edit primitive: click text -> Input/Textarea in place. Escape cancels, Enter saves single-line. Save/Cancel buttons for explicit confirm. `src/components/review/itinerary-editor.tsx` — renders EditableField for title, clientName, schoolName, tourDate, greetingText, pickupLocation, returnLocation, and each activity text/timeLabel. `src/components/review/menu-editor.tsx` — renders EditableField for each menu item text. `src/app/(app)/review/[id]/actions.ts` — `saveDraftField(uploadId, fieldPath, newValue)` server action patches one field by dot-path in structuredDraft JSON, re-validates with Zod, persists. |
| **Status** | **PASS** |

### AI-05: System does not invent missing tour facts when source text is incomplete; uncertain fields are left blank or flagged for review

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "System does not invent missing tour facts when source text is incomplete; uncertain fields are left blank or flagged for review" |
| Claimed in plan | 03-01 |
| Codebase evidence | `src/lib/ai/extraction-prompt.ts:6-7` — Rule 1: "Chỉ trích xuất thông tin CÓ TRONG văn bản. KHÔNG BAO GIỜ bịa thêm thông tin không có." Rule 2: "Nếu không tìm thấy thông tin cho một trường, để trống (null/undefined) hoặc đánh dấu needsReview: true." `src/lib/ai/extraction-schema.ts` — All common fields (title, clientName, schoolName, tourDate, greetingText, pickupLocation, returnLocation) are `.optional()`. Activities have `needsReview: z.boolean().default(false)` and `sourceConfidence: z.enum(["high", "medium", "low"])`. `src/lib/ai/__tests__/extract-tour.test.ts:117-138` — "leaves optional fields blank when AI omits them" test confirms undefined fields. `src/lib/ai/__tests__/extract-tour.test.ts:88-115` — "preserves needsReview flags from AI response" test confirms flag preservation. `src/lib/review/draft.ts:77-105` — `collectReviewFlags()` generates flags like `missing_title`, `missing_client_name`, `activity_needs_review` from blank/flagged fields. |
| **Status** | **PASS** |

### RULE-01: For 1-day tours, itinerary output is organized into 2 columns: Buoi sang and Buoi chieu

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "For 1-day tours, itinerary output is organized into 2 columns: Buoi sang and Buoi chieu" |
| Claimed in plan | 03-03 |
| Codebase evidence | `src/lib/rules/definitions.ts:7-43` — `rule01OneDayLayout` checks ONE_DAY drafts for non-empty `itinerary.morning` and `itinerary.afternoon`, flags `needs_review` if empty. `src/lib/ai/extraction-schema.ts:43-54` — `oneDaySchema` enforces `itinerary: { morning: Activity[], afternoon: Activity[] }`. `src/lib/rules/__tests__/engine.test.ts:71-113` — 5 test cases for RULE-01 pass/fail/both-empty/not-applied-to-TWO_DAY. |
| **Status** | **PASS** |

### RULE-02: For 2-day tours, itinerary output is organized into 2 columns: Ngay 1 and Ngay 2

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "For 2-day tours, itinerary output is organized into 2 columns: Ngay 1 and Ngay 2" |
| Claimed in plan | 03-03 |
| Codebase evidence | `src/lib/rules/definitions.ts:45-80` — `rule02TwoDayLayout` checks TWO_DAY drafts for non-empty `itinerary.day1` and `itinerary.day2`, flags `needs_review` if empty. `src/lib/ai/extraction-schema.ts:57-67` — `twoDaySchema` enforces `itinerary: { day1: Activity[], day2: Activity[] }`. `src/lib/rules/__tests__/engine.test.ts:115-148` — 4 test cases for RULE-02. |
| **Status** | **PASS** |

### RULE-03: For school tours, greeting uses "Quy thay co va cac ban hoc sinh"

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "For school tours (tieu hoc, THCS, THPT), greeting uses the school audience wording 'Quy thay co va cac ban hoc sinh'" |
| Claimed in plan | 03-03 |
| Codebase evidence | `src/lib/rules/definitions.ts:83-110` — `rule03SchoolGreeting` auto-fixes SCHOOL drafts whose greeting != "Quy thay co va cac ban hoc sinh" with `severity: "auto_fixed"`. `src/lib/rules/__tests__/engine.test.ts:150-183` — 4 test cases: correct greeting passes, incorrect greeting auto-fixes, missing greeting auto-fixes, not applied to GROUP. |
| **Status** | **PASS** |

### RULE-04: For business or group tours, greeting uses "Quy khach" or "Quy doan"

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "For business or group tours, greeting uses business audience wording such as 'Quy khach' or 'Quy doan'" |
| Claimed in plan | 03-03 |
| Codebase evidence | `src/lib/rules/definitions.ts:112-141` — `rule04GroupGreeting` checks GROUP greeting against `["Quy khach", "Quy doan"]`, auto-fixes to "Quy khach" if non-matching. `src/lib/rules/__tests__/engine.test.ts:185-222` — 5 test cases: "Quy khach" passes, "Quy doan" passes, incorrect auto-fixes, missing auto-fixes, not applied to SCHOOL. |
| **Status** | **PASS** |

### RULE-05: School name must stay logically intact and not be split into separate broken lines

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "School name must stay logically intact and not be split into separate broken lines in generated content preparation" |
| Claimed in plan | 03-03 |
| Codebase evidence | `src/lib/rules/definitions.ts:143-176` — `rule05SchoolNameIntegrity` detects line breaks (`\n`, `\r`) and excessive whitespace in `schoolName`, auto-fixes by collapsing to single clean string. `src/lib/rules/__tests__/engine.test.ts:224-268` — 5 test cases: clean name passes, line breaks fixed, excessive whitespace fixed, carriage returns fixed, missing name not flagged. |
| **Status** | **PASS** |

### RULE-06: Phrases about returning to school must include the specific school name

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "Phrases about returning to school must include the specific school name when the source document indicates a school-based tour" |
| Claimed in plan | 03-03 |
| Codebase evidence | `src/lib/rules/definitions.ts:178-208` — `rule06ReturnToSchool` checks if `returnLocation` includes `schoolName` for SCHOOL clients, auto-fixes to "Ve lai {schoolName}". `src/lib/rules/__tests__/engine.test.ts:270-312` — 5 test cases: includes school name passes, doesn't include auto-fixes, missing auto-fixes, not applied to GROUP, not applied when schoolName missing. |
| **Status** | **PASS** |

### RULE-07: Menu content is generated separately from itinerary content

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "Menu content is generated separately from itinerary content and follows the selected template structure for 1-day or 2-day tours" |
| Claimed in plan | 03-03 |
| Codebase evidence | `src/lib/rules/definitions.ts:210-250` — `rule07MenuStructure` flags `needs_review` when menu sections are entirely empty for either ONE_DAY (morning/lunch/afternoon) or TWO_DAY (day1/day2). `src/lib/ai/extraction-schema.ts` — `menu` is a separate top-level field from `itinerary` in both one-day and two-day schemas. `src/components/review/menu-editor.tsx` — menu renders in a separate right column from itinerary. `src/lib/rules/__tests__/engine.test.ts:314-360` — 5 test cases for RULE-07. |
| **Status** | **PASS** |

### SAFE-02: AI output is validated before being used in rules processing or Canva payload construction

| Check | Result |
|-------|--------|
| REQUIREMENTS.md definition | "AI output is validated before being used in rules processing or Canva payload construction" |
| Claimed in plan | 03-01 |
| Codebase evidence | `src/lib/ai/extract-tour.ts:33-43` — `structuredDraftSchema.safeParse(rawJson)` validates AI JSON before returning. Invalid output throws Vietnamese error, never reaches persistence or rules. `src/app/api/uploads/route.ts:107-108` — `extractTour()` runs and validates before `applyRules()` runs. `src/app/(app)/review/[id]/actions.ts:70-79` — `saveDraftField` re-validates with `structuredDraftSchema.safeParse(updated)` after every inline edit. `src/lib/ai/__tests__/extraction-schema.test.ts:189-213` — 4 SAFE-02 tests: rejects invalid shape, unknown duration, null, string. `src/lib/ai/__tests__/extract-tour.test.ts:76-86` — "throws when AI returns JSON that fails schema validation (SAFE-02)" test. |
| **Status** | **PASS** |

---

## Must-Have Truths Verification (Plan 03-01)

| # | Truth | Verified | Evidence |
|---|-------|----------|----------|
| 1 | OpenAI SDK installed, configured with custom baseURL | PASS | `package.json`: `"openai": "^6.32.0"`. `extraction-client.ts:14`: `new OpenAI({ apiKey, baseURL })` using `getAiConfig()` which reads `AI_API_URL`. |
| 2 | Upload model extended with aiStatus, reviewStatus, structuredDraft, reviewFlags, aiModel, aiAttemptCount, approvedAt, clientType, tourDuration | PASS | `prisma/schema.prisma:48-58`: all fields present on Upload model. |
| 3 | Zod discriminated union validates 1-day/2-day structures | PASS | `extraction-schema.ts:70-73`: `z.discriminatedUnion("duration", [oneDaySchema, twoDaySchema])`. |
| 4 | AI extraction returns structured JSON matching Zod or fails with Vietnamese error | PASS | `extract-tour.ts:28-42`: JSON parse + safeParse, Vietnamese errors on failure. |
| 5 | Missing/uncertain facts left blank or flagged needsReview=true | PASS | All common fields `.optional()`. Prompt rules 1-2 enforce. Tests confirm. |
| 6 | Invalid AI output rejected before persistence | PASS | `extract-tour.ts:35`: safeParse before return. Upload route stores only after successful extraction+validation. |
| 7 | Auto retry up to 2 times on API failure | PASS | `extraction-client.ts:6`: `MAX_RETRIES = 2`. Loop runs `MAX_RETRIES + 1` = 3 attempts max. |
| 8 | Upload pipeline auto-triggers AI extraction after text extraction | PASS | `uploads/route.ts:105-124`: after normalizedText stored, `extractTour()` + `applyRules()` + `saveDraft()` called. |

## Must-Have Truths Verification (Plan 03-02)

| # | Truth | Verified | Evidence |
|---|-------|----------|----------|
| 1 | Review page at /review/[id] — bookmarkable | PASS | `src/app/(app)/review/[id]/page.tsx` exists as Next.js dynamic route. |
| 2 | 2-column layout: left=Itinerary, right=Menu | PASS | `review-page.tsx:216`: `grid grid-cols-1 gap-8 lg:grid-cols-2` with ItineraryEditor + MenuEditor. |
| 3 | Inline click-to-edit: Escape cancels, Enter saves single-line | PASS | `editable-field.tsx:89-97`: Escape -> handleCancel, Enter + !multiline -> handleSave. |
| 4 | Flagged fields: 2px #F59E0B border + warning icon + helper text | PASS | `flagged-field.tsx:39`: `border-2 border-[#F59E0B] bg-[#FFFBEB]` + WarningIcon + helperText. |
| 5 | Single primary CTA: "Xac nhan & Tao Canva" in sticky bottom bar | PASS | `review-actions.tsx:36`: `fixed bottom-0` bar. Line 51: `"Xac nhan & Tao Canva"`. |
| 6 | Re-extract button with confirmation dialog if user has edits | PASS | `review-header.tsx:104-115`: `handleReExtractClick` checks `hasUserEdits`, opens AlertDialog. |
| 7 | saveDraftField patches one field by dot-path, re-validates with Zod | PASS | `actions.ts:49-90`: `setByPath()` + `structuredDraftSchema.safeParse(updated)`. |
| 8 | approveDraft sets APPROVED + approvedAt | PASS | `draft.ts:67-75`: sets `REVIEW_STATUS.APPROVED` + `approvedAt: new Date()`. |
| 9 | reExtractDraft calls extractTour() again, overwrites draft | PASS | `actions.ts:120-175`: calls `extractTour(upload.normalizedText)` then `persistDraft()`. |
| 10 | Upload form redirects to /review/[id] | PASS | `upload-form.tsx:211`: `router.push('/review/${payload.data.uploadId}')`. |
| 11 | Empty state when no structuredDraft | PASS | `review-page.tsx:115-148`: "Chua co noi dung de duyet" with re-extract option. |
| 12 | Error state when aiStatus=FAILED | PASS | `review-page.tsx:151-193`: "Khong the trich xuat noi dung" with error message + re-extract. |

## Must-Have Truths Verification (Plan 03-03)

| # | Truth | Verified | Evidence |
|---|-------|----------|----------|
| 1 | applyRules(draft) returns correctedDraft + violations[] | PASS | `engine.ts:4-27`: pure function signature confirmed. |
| 2 | 7 v1 rules implemented (RULE-01 through RULE-07) | PASS | `definitions.ts:252-260`: `V1_RULES` array with all 7 rules. |
| 3 | Auto-fixable violations corrected with severity "auto_fixed" | PASS | RULE-03, RULE-04, RULE-05, RULE-06 use `severity: "auto_fixed"`. |
| 4 | Non-auto-fixable flagged with severity "needs_review" | PASS | RULE-01, RULE-02, RULE-07 use `severity: "needs_review"`. |
| 5 | CompanyRule Prisma model added | PASS | `prisma/schema.prisma:68-80`: CompanyRule model with ruleId, name, description, category, isActive, config. |
| 6 | Seed script populates 7 v1 rules | PASS | `src/lib/rules/seed.ts:3-52`: 7 rules seeded. `prisma/seed.ts:23`: calls `seedCompanyRules(prisma)`. |
| 7 | Rules called after AI extraction, before draft persistence | PASS | `uploads/route.ts:107-116`: `extractTour()` -> `applyRules(aiResult.draft)` -> `saveDraft(correctedDraft)`. |
| 8 | Violations merged into reviewFlags[] on Upload | PASS | `draft.ts:20-22`: `violationsToReviewFlags(ruleViolations)` merged with draft review flags into `mergedFlags`. |
| 9 | Unit tests cover all 7 rules with pass, fail, auto-fix | PASS | `engine.test.ts`: 37 test cases covering RULE-01 to RULE-07 + orchestrator + violationsToReviewFlags. |

---

## Automated Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS (zero errors) |
| `npx vitest run src/lib/ai/__tests__/ src/lib/rules/__tests__/` | PASS (3 test files, 62/62 tests passed) |
| All 03-01, 03-02, 03-03 SUMMARY files exist | PASS |
| All SUMMARY self-checks | PASS |

---

## Requirement Coverage Matrix

All 13 requirement IDs from phase frontmatter are accounted for:

| Req ID | REQUIREMENTS.md Status | Plan | Codebase Verified |
|--------|----------------------|------|-------------------|
| AI-01 | Complete | 03-01 | PASS |
| AI-02 | Complete | 03-01 | PASS |
| AI-03 | Complete | 03-02 | PASS |
| AI-04 | Complete | 03-02 | PASS |
| AI-05 | Complete | 03-01 | PASS |
| RULE-01 | Complete | 03-03 | PASS |
| RULE-02 | Complete | 03-03 | PASS |
| RULE-03 | Complete | 03-03 | PASS |
| RULE-04 | Complete | 03-03 | PASS |
| RULE-05 | Complete | 03-03 | PASS |
| RULE-06 | Complete | 03-03 | PASS |
| RULE-07 | Complete | 03-03 | PASS |
| SAFE-02 | Complete | 03-01 | PASS |

**13/13 requirements PASS. 0 gaps.**

---

## Key Artifacts Summary

### AI Extraction Pipeline
- `src/lib/ai/extraction-schema.ts` — Zod discriminated union (ONE_DAY/TWO_DAY)
- `src/lib/ai/extraction-client.ts` — OpenAI SDK client with retry (MAX_RETRIES=2)
- `src/lib/ai/extraction-prompt.ts` — Vietnamese system prompt with company rules
- `src/lib/ai/extract-tour.ts` — Orchestrator: call AI, parse JSON, validate schema
- `src/lib/review/status.ts` — AI_STATUS and REVIEW_STATUS constants
- `src/lib/review/draft.ts` — saveDraft, saveAiFailure, getDraft, approveDraft

### Rules Engine
- `src/lib/rules/types.ts` — Rule, RuleViolation, RuleResult interfaces
- `src/lib/rules/definitions.ts` — 7 v1 rule definitions (pure functions)
- `src/lib/rules/engine.ts` — applyRules() orchestrator + violationsToReviewFlags()
- `src/lib/rules/seed.ts` — CompanyRule seeder (7 rules)

### Human Review Gate
- `src/app/(app)/review/[id]/page.tsx` — Server component route
- `src/app/(app)/review/[id]/actions.ts` — saveDraftField, approveDraft, reExtractDraft
- `src/app/(app)/review/[id]/loading.tsx` — Skeleton loader
- `src/components/review/review-page.tsx` — Client 2-column layout + state
- `src/components/review/editable-field.tsx` — Click-to-edit primitive
- `src/components/review/flagged-field.tsx` — Warning border wrapper
- `src/components/review/itinerary-editor.tsx` — Left column editor
- `src/components/review/menu-editor.tsx` — Right column editor
- `src/components/review/review-header.tsx` — Header + re-extract button
- `src/components/review/review-actions.tsx` — Sticky approve CTA

### Tests
- `src/lib/ai/__tests__/extraction-schema.test.ts` — 25 schema tests
- `src/lib/ai/__tests__/extract-tour.test.ts` — 6 extraction tests
- `src/lib/rules/__tests__/engine.test.ts` — 31 rules tests

---

## Final Verdict

**PASS** — Phase 03 goal fully achieved. All 13 requirements verified against codebase. All must_haves confirmed. All tests pass. TypeScript clean.

---
*Verified: 2026-03-25*
*Phase: 03-structured-ai-extraction-rules-human-review*
