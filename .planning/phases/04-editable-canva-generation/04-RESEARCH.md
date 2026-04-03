# Phase 4: Editable Canva Generation - Research

**Researched:** 2026-03-25
**Domain:** Canva Connect API editable generation, template mapping, async job orchestration, and token lifecycle handling for reviewed Vietnamese tour content
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
- 3-day tour template support — v2 (user has template ready but roadmap scopes v1 to 1-day and 2-day only)
- Admin UI for template mapping management — Phase 5
- In-app Canva preview/editing — out of scope per roadmap
- Thumbnail generation as primary deliverable — thumbnails are nice-to-have if API supports it
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CANVA-01 | User can select the appropriate Canva template set for the current tour type | Use `tourDuration`-driven auto-selection plus explicit confirmation UI backed by an externalized template resolver. |
| CANVA-02 | System maps reviewed content into 2 separate Canva templates per tour: Itinerary and Menu | Use two payload builders from the Phase 3 `structuredDraft` into distinct Canva field maps: `ITINERARY` and `MENU`. |
| CANVA-03 | System creates editable Canva outputs rather than static-only assets | Use Canva Connect design autofill jobs that return a generated design object with edit/view URLs; do not use export APIs as the primary output path. |
| CANVA-04 | System returns at least one editable Canva link for the generated design outputs | Persist Canva `designId` and resolve fresh edit URLs from `GET /designs/{id}` for the review page. |
| CANVA-05 | Canva integration handles asynchronous job completion and reports failure clearly when generation does not succeed | Model each Canva generation as its own async job with persisted per-artifact status, bounded polling, timeout, and partial-success UI. |
| CANVA-06 | Template identifiers and mappings are managed outside hardcoded business logic so template changes can be updated safely | Validate template IDs from env now, behind one resolver module, and keep field names in one typed mapping manifest. |
| UX-03 | User can copy or open the generated Canva link directly from the app | Add result cards with `Mo trong Canva` and `Sao chep link` actions fed by persisted design records. |
| UX-04 | User can clearly see which template type is being used for the current generation | Show a template confirmation panel that names the selected tour duration and the two templates before generation starts. |
| SAFE-03 | System handles Canva token expiry or authorization refresh without requiring repeated manual intervention during normal operation | Persist refresh tokens server-side, refresh on 401/expiry, rotate stored refresh token when Canva returns a new one, and retry once safely. |
</phase_requirements>

## Summary

The most important planning fact is a verified constraint from Canva's official docs: the supported Autofill API is designed for Brand Templates with autofill datasets and requires a user in a Canva Enterprise organization. I did not find an official Canva Connect endpoint for "duplicate a regular design, then update arbitrary text elements". That means the current locked assumption in `04-CONTEXT.md` — regular designs on Canva Pro with copy-and-edit automation — is not supported by the official Autofill docs I could verify.

So Phase 4 should be planned around an adapter boundary, but with a hard capability note at the top of the plan: use the official Canva path only if the production account/template setup validated in Phase 1 is actually Enterprise + Brand Templates + dataset fields. If that production path is not available, the planner should not treat the regular-design copy workflow as implementable with the documented API. The adapter still matters because it lets the app keep the review flow, persistence model, and UI contracts even if the Canva output strategy must change later.

Within the supported path, the implementation shape is clear and standard: resolve template IDs outside business logic, map Phase 3 `structuredDraft` data into named Canva autofill fields, create two async autofill jobs in parallel, poll until each job reaches `success` or `failed`, persist `designId` plus status for each artifact, refresh expiring edit URLs on demand, and handle OAuth refresh server-side with persisted token rotation.

**Primary recommendation:** Plan Phase 4 to use Canva Connect Autofill against Brand Templates only, behind a server-side Canva adapter that persists `designId` instead of trusting long-lived edit URLs; treat regular-design duplication and element editing as unsupported unless Phase 1 already verified a different documented capability.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Canva Connect REST API | REST v1 docs checked 2026-03-25 | Autofill jobs, design lookup, OAuth refresh, edit URL retrieval | Official supported API surface for editable design generation. |
| `next` | repo: 15.3.1; current: 16.2.1 | Server Actions, route handlers, protected review page integration | Already the app framework; Canva generation fits existing App Router patterns. |
| `@prisma/client` | repo: 6.6.0; current: 7.5.0 | Persist tokens, generation job state, design IDs, retry metadata | Existing ORM and persistence pattern already anchors the upload pipeline. |
| `zod` | repo: 3.24.0; current: 4.3.6 | Validate env, field-map manifests, and Canva API payload/response shapes | Already used everywhere; ideal for typed mapping manifests and adapter contracts. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `fetch` in Node/Next runtime | platform built-in | Call Canva REST endpoints without adding another SDK dependency | Use for all Canva API calls inside server-only modules. |
| `sonner` | repo: 2.0.3 | Copy-link success/error toasts and transient feedback | Use for clipboard actions and non-blocking review-page feedback. |
| `vitest` | repo: 4.1.1; current: 4.1.1 | Unit/integration tests for template resolver, payload builder, token refresh, polling | Use for all server-side Canva adapter logic. |
| `@playwright/test` | repo: 1.52.0; current: 1.58.2 | E2E coverage for review-page generation flow and result cards | Use for end-to-end approval → generate → open/copy link behavior. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Official Autofill + Brand Templates | Regular design duplication + text-element editing | I could not verify an official Connect API for editing arbitrary elements in regular designs; this remains unsupported/LOW confidence. |
| Native `fetch` adapter | A third-party Canva SDK wrapper | Adds dependency risk without obvious value because the official REST docs are complete enough for this phase. |
| Persisting `designId` + refreshing URLs on demand | Persisting `edit_url` forever | `edit_url` is temporary (30 days) and thumbnails expire after 15 minutes, so direct URL persistence alone will break the "return anytime" expectation. |

**Installation:**
```bash
# No additional npm package is required for the Canva adapter.
# Use native fetch + the existing Next.js / Prisma / Zod stack.
```

**Version verification:** Before writing the Standard Stack table, verify each recommended package version is current:
```bash
npm view next version
npm view @prisma/client version
npm view zod version
npm view vitest version
npm view @playwright/test version
```

Verified on 2026-03-25:
- `next`: current `16.2.1`, published `2026-03-20T23:31:11.148Z`; repo currently uses `15.3.1`
- `@prisma/client`: current `7.5.0`, published `2026-03-11T14:44:35.031Z`; repo currently uses `6.6.0`
- `zod`: current `4.3.6`, published `2026-01-22T19:14:35.382Z`; repo currently uses `3.24.0`
- `vitest`: current `4.1.1`, published `2026-03-23T14:58:50.811Z`; repo currently uses `4.1.1`
- `@playwright/test`: current `1.58.2`, published `2026-02-06T16:42:52.725Z`; repo currently uses `1.52.0`

This phase does not require upgrading framework packages. The main integration surface is the Canva REST API, not a new npm dependency.

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/
│   └── (app)/
│       └── review/
│           └── [id]/
│               ├── actions.ts                    # approve + generate + retry actions
│               └── page.tsx                      # loads draft + Canva generation state
├── components/
│   └── review/
│       ├── template-confirmation.tsx             # auto-selected template set + confirm UI
│       ├── canva-generation-panel.tsx            # spinner, cooldown, retry states
│       ├── canva-result-card.tsx                 # Itinerary/Menu cards with open/copy actions
│       └── review-actions.tsx                    # split Approve vs Generate controls
├── lib/
│   ├── canva/
│   │   ├── adapter.ts                            # public Canva service contract
│   │   ├── client.ts                             # authenticated REST wrapper + refresh retry
│   │   ├── oauth.ts                              # refresh token flow + persistence
│   │   ├── template-resolver.ts                  # env-backed template lookup by duration/kind
│   │   ├── field-map.ts                          # canonical Canva field names per template type
│   │   ├── payload.ts                            # structuredDraft -> Canva autofill payload
│   │   ├── jobs.ts                               # create/poll autofill jobs
│   │   └── designs.ts                            # get design + resolve fresh edit URLs
│   └── review/
│       └── canva-status.ts                       # workflow enums/helpers for generation states
└── prisma/
    └── schema.prisma                             # Upload extensions + Canva token/artifact tables
```

### Pattern 1: Keep Canva behind an adapter boundary
**What:** Wrap all Canva API behavior behind one server-only adapter with typed methods like `generateItinerary()`, `generateMenu()`, `refreshAccessTokenIfNeeded()`, and `getDesignLink()`.

**When to use:** Always. The roadmap explicitly says the Canva output layer may need to change if account capability constraints surface.

**Why:** The UI and review flow should depend on a stable app contract, not on Canva endpoint details.

**Example:**
```typescript
export interface CanvaArtifactResult {
  artifactType: "ITINERARY" | "MENU";
  status: "SUCCEEDED" | "FAILED";
  designId?: string;
  editUrl?: string;
  viewUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface CanvaAdapter {
  generateFromApprovedDraft(input: {
    uploadId: string;
    templateKey: "ONE_DAY_ITINERARY" | "ONE_DAY_MENU" | "TWO_DAY_ITINERARY" | "TWO_DAY_MENU";
    data: Record<string, unknown>;
  }): Promise<CanvaArtifactResult>;

  resolveFreshDesignUrls(designId: string): Promise<{
    editUrl: string;
    viewUrl: string;
    thumbnailUrl?: string;
  }>;
}
```
Source: https://www.canva.dev/docs/connect/api-reference/autofills/create-design-autofill-job.md and https://www.canva.dev/docs/connect/api-reference/designs/get-design.md

### Pattern 2: Externalized template resolution, not switch-heavy business logic
**What:** Resolve template identifiers in one module from validated env variables keyed by duration and artifact kind.

**When to use:** Before every generation and at startup validation.

**Why:** CANVA-06 requires template IDs outside hardcoded business logic, and the current repo already centralizes env access.

**Example:**
```typescript
import { z } from "zod";

const canvaTemplatesSchema = z.object({
  CANVA_TEMPLATE_1DAY_ITINERARY: z.string().min(1),
  CANVA_TEMPLATE_1DAY_MENU: z.string().min(1),
  CANVA_TEMPLATE_2DAY_ITINERARY: z.string().min(1),
  CANVA_TEMPLATE_2DAY_MENU: z.string().min(1),
});

export function resolveTemplateKey(duration: "ONE_DAY" | "TWO_DAY", kind: "ITINERARY" | "MENU") {
  const env = canvaTemplatesSchema.parse(process.env);

  if (duration === "ONE_DAY" && kind === "ITINERARY") return env.CANVA_TEMPLATE_1DAY_ITINERARY;
  if (duration === "ONE_DAY" && kind === "MENU") return env.CANVA_TEMPLATE_1DAY_MENU;
  if (duration === "TWO_DAY" && kind === "ITINERARY") return env.CANVA_TEMPLATE_2DAY_ITINERARY;
  return env.CANVA_TEMPLATE_2DAY_MENU;
}
```
Source: project env pattern in `/home/minhnhut_dev/projects/siletravel/src/lib/env.ts`

### Pattern 3: Make Canva field names explicit and dataset-driven
**What:** Use one canonical field-map manifest that translates `StructuredDraft` into Canva autofill field names. The user configures those field names inside Canva templates to match the manifest.

**When to use:** For every supported template family before first production generation.

**Why:** Canva's Brand Template dataset is the canonical schema for what can be autofilled. This avoids magic strings spread across service code.

**Recommended v1 field naming convention:**
- Shared: `title`, `client_name`, `tour_date`, `greeting_text`, `pickup_location`, `return_location`
- 1-day itinerary: `morning_1` ... `morning_7`, `afternoon_1` ... `afternoon_7`
- 1-day menu: `menu_morning_1` ... `menu_morning_7`, `menu_lunch_1` ... `menu_lunch_7`, `menu_afternoon_1` ... `menu_afternoon_7`
- 2-day itinerary: `day1_1` ... `day1_7`, `day2_1` ... `day2_7`
- 2-day menu: `menu_day1_1` ... `menu_day1_7`, `menu_day2_1` ... `menu_day2_7`

**Example:**
```typescript
function toFixedTextSlots(values: string[], size: number): string[] {
  return Array.from({ length: size }, (_, index) => values[index] ?? "");
}

export function buildOneDayItineraryPayload(draft: OneDayDraft) {
  const morning = toFixedTextSlots(draft.itinerary.morning.map((item) => item.text), 7);
  const afternoon = toFixedTextSlots(draft.itinerary.afternoon.map((item) => item.text), 7);

  return {
    title: { type: "text", text: draft.title ?? "" },
    greeting_text: { type: "text", text: draft.greetingText ?? "" },
    morning_1: { type: "text", text: morning[0] },
    morning_2: { type: "text", text: morning[1] },
    afternoon_1: { type: "text", text: afternoon[0] },
    afternoon_2: { type: "text", text: afternoon[1] },
  };
}
```
Source: https://www.canva.dev/docs/connect/api-reference/brand-templates/get-brand-template-dataset.md

### Pattern 4: Treat Itinerary and Menu as two independent async jobs
**What:** Start two generation jobs in parallel, persist their states separately, and render partial success.

**When to use:** Every generation and re-generation.

**Why:** The context explicitly requires partial success handling and separate result cards.

**Example:**
```typescript
const [itinerary, menu] = await Promise.allSettled([
  canva.generateFromApprovedDraft({
    uploadId,
    templateKey: `${duration}_ITINERARY` as const,
    data: itineraryPayload,
  }),
  canva.generateFromApprovedDraft({
    uploadId,
    templateKey: `${duration}_MENU` as const,
    data: menuPayload,
  }),
]);

// Persist both outcomes independently.
```
Source: project locked decisions D-20, D-27 and Canva async job docs at https://www.canva.dev/docs/connect/api-reference/autofills/get-design-autofill-job.md

### Pattern 5: Persist `designId`; refresh URLs at read time
**What:** Save Canva `designId` as the durable reference and resolve fresh `edit_url`, `view_url`, and thumbnail URLs when rendering the review page.

**When to use:** On successful generation and on subsequent page loads.

**Why:** Canva docs say `edit_url` is only valid for 30 days and thumbnail URLs expire after 15 minutes.

**Example:**
```typescript
export async function getRenderableCanvaLink(designId: string) {
  const design = await canva.getDesign(designId);

  return {
    designId,
    editUrl: design.urls.edit_url,
    viewUrl: design.urls.view_url,
    thumbnailUrl: design.thumbnail?.url,
    title: design.title,
  };
}
```
Source: https://www.canva.dev/docs/connect/api-reference/designs/get-design.md

### Anti-Patterns to Avoid
- **Planning around regular-design text editing:** I did not verify an official endpoint for arbitrary element updates in regular designs.
- **Storing only `edit_url`:** This breaks after 30 days and undermines D-24.
- **All-or-nothing generation status:** Context explicitly requires partial success and per-card retry.
- **Template IDs read directly in many files:** Centralize resolution in one server-only module.
- **Client-side token refresh:** OAuth exchange and refresh must stay on the backend.
- **Polling forever in the browser:** Poll on the server with bounded retries/timeouts and persist final state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Regular-design duplication workflow | Undocumented copy-and-patch element editing logic | Official Brand Template dataset + Autofill APIs | Official docs support dataset-driven autofill; I could not verify arbitrary element editing for regular designs. |
| Long-lived Canva links | Persist `edit_url` as if permanent | Persist `designId`, fetch fresh URLs from `GET /designs/{id}` | `edit_url` expires after 30 days; thumbnail URL expires after 15 minutes. |
| Token lifecycle handling | Env-only token storage or ad-hoc in-memory refresh cache | Prisma-backed token store with refresh-token rotation | Refreshed tokens must survive restarts and Canva may rotate refresh tokens. |
| Field-map logic | Inline string concatenation scattered across service code | One typed `field-map.ts` + payload builders | Reduces template drift and makes user-configured Canva field names auditable. |
| Polling/error classification | Raw loops with no state model | Typed job helper with `in_progress/success/failed`, timeout, and rate-limit handling | Canva jobs are async and rate-limited; planner needs stable recovery behavior. |

**Key insight:** The difficult part is not "put text in boxes". The real risk is building against a Canva capability that the official API does not support, then persisting brittle URLs or tokens. The plan must lock onto the documented API shape first.

## Common Pitfalls

### Pitfall 1: Assuming regular Canva designs can be autofilled like Brand Templates
**What goes wrong:** The implementation plan assumes a Pro account can duplicate a normal design and update text boxes through the Connect API.

**Why it happens:** The manual Canva workflow looks automatable, but the official Autofill docs are for Brand Templates with datasets, not generic designs.

**How to avoid:** Treat Brand Template + dataset + async autofill job as the only HIGH-confidence official path. If the account is not Enterprise-capable, surface that as a planning blocker, not an implementation detail.

**Warning signs:** No dataset is available for the chosen template, no Brand Template listing works, or the real account is Pro-only.

### Pitfall 2: Designing persistence around temporary URLs
**What goes wrong:** The app stores the returned `edit_url` and assumes `/review/[id]` can show that same URL forever.

**Why it happens:** The create-autofill response already contains convenient URLs.

**How to avoid:** Persist `designId` and re-resolve URLs on page load.

**Warning signs:** Older jobs suddenly show dead Canva links, or thumbnails disappear after a refresh.

### Pitfall 3: Letting field naming drift between app code and Canva template setup
**What goes wrong:** The payload builder sends `morning_1` while the Canva template dataset contains `day1_slot_1`, so generation fails or silently leaves blanks.

**Why it happens:** Field names are configured partly in code and partly in Canva.

**How to avoid:** Keep one canonical field-map manifest in code, derive user setup instructions from it, and verify the dataset before first real generation.

**Warning signs:** Autofill jobs fail with validation-like errors, or generated designs show blank boxes despite non-empty input.

### Pitfall 4: Treating two outputs as one job
**What goes wrong:** If Menu generation fails, the app hides the successful Itinerary result because the page models one overall Canva status.

**Why it happens:** The feature starts as one button and teams over-collapse the state model.

**How to avoid:** Persist and render `ITINERARY` and `MENU` artifacts separately with their own status, timestamps, error message, and retry action.

**Warning signs:** Successful design IDs disappear after a partial failure, or retry always regenerates both cards unnecessarily.

### Pitfall 5: Refreshing access tokens without persisting the rotated refresh token
**What goes wrong:** The first auto-refresh works, but the next server restart or expiry fails because the new refresh token was never stored.

**Why it happens:** Many OAuth integrations update only `access_token` and ignore refresh-token rotation.

**How to avoid:** Persist the full token response (`access_token`, `refresh_token`, `expires_in`, scope, refreshedAt`) atomically.

**Warning signs:** Generation works once after manual authorization but later returns repeated 401s.

### Pitfall 6: Polling too aggressively and creating self-inflicted rate limits
**What goes wrong:** The app polls both jobs every second from multiple browser tabs and quickly burns per-user rate limits.

**Why it happens:** Async jobs invite naive polling loops.

**How to avoid:** Poll server-side with bounded intervals (for example 2s → 3s → 5s), stop on terminal states, and persist the result so page refreshes do not restart polling from scratch.

**Warning signs:** 429/rate-limit messages during routine testing even though throughput is low.

## Code Examples

Verified patterns from official sources:

### Refresh an expired access token on the backend
```typescript
async function refreshCanvaToken(refreshToken: string) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Canva token refresh failed");
  return response.json();
}
```
Source: https://www.canva.dev/docs/connect/api-reference/authentication/generate-access-token.md

### Create an async autofill job
```typescript
async function createAutofillJob(brandTemplateId: string, data: Record<string, unknown>) {
  const response = await canvaFetch("https://api.canva.com/rest/v1/autofills", {
    method: "POST",
    body: JSON.stringify({
      brand_template_id: brandTemplateId,
      data,
      title: "SileTravel - generated itinerary",
    }),
  });

  const payload = await response.json();
  return payload.job.id as string;
}
```
Source: https://www.canva.dev/docs/connect/api-reference/autofills/create-design-autofill-job.md

### Poll until the Canva job reaches a terminal state
```typescript
async function waitForAutofillJob(jobId: string) {
  const delays = [2000, 3000, 5000, 5000, 5000];

  for (const delayMs of delays) {
    const response = await canvaFetch(`https://api.canva.com/rest/v1/autofills/${jobId}`);
    const payload = await response.json();
    const job = payload.job;

    if (job.status === "success") {
      return job.result.design;
    }

    if (job.status === "failed") {
      throw new Error(job.error?.message || "Canva autofill failed");
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("Canva generation timed out");
}
```
Source: https://www.canva.dev/docs/connect/api-reference/autofills/get-design-autofill-job.md

### Re-resolve a fresh edit URL for a persisted design
```typescript
async function getFreshDesignLinks(designId: string) {
  const response = await canvaFetch(`https://api.canva.com/rest/v1/designs/${designId}`);
  const payload = await response.json();

  return {
    editUrl: payload.design.urls.edit_url,
    viewUrl: payload.design.urls.view_url,
    thumbnailUrl: payload.design.thumbnail?.url,
  };
}
```
Source: https://www.canva.dev/docs/connect/api-reference/designs/get-design.md

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual duplicate design + type text in Canva | Official Autofill API against Brand Templates with datasets | Current official docs checked 2026-03-25 | The planner should target dataset-driven generation, not editor-style mutation. |
| Persist returned link as the durable record | Persist `designId` and refresh temporary links on demand | Current official docs checked 2026-03-25 | Required to satisfy bookmark/resume behavior without stale links. |
| Single template env like `CANVA_TEMPLATE_ID` | Per-duration, per-artifact template IDs | Required by Phase 4 scope | Necessary for CANVA-02 and CANVA-06. |

**Deprecated/outdated:**
- Old Brand Template ID assumptions: Canva docs note Brand Template IDs migrated to a new format in September 2025; stored IDs should be treated as data that may need verification.
- The current repo env shape with `CANVA_TEMPLATE_ID`: outdated for Phase 4 because this phase needs four separate template identifiers.

## Open Questions

1. **Does the real production Canva account satisfy the official Autofill prerequisites?**
   - What we know: official docs say Autofill APIs require Brand Templates and a user in a Canva Enterprise organization.
   - What's unclear: the phase context says the current account is Canva Pro and the templates are regular designs.
   - Recommendation: make this a planning gate at the top of 04-01/04-02. If Enterprise + Brand Templates are not available, record the blocker explicitly rather than planning a speculative regular-design API path.

2. **What exact field names should the user configure in Canva?**
   - What we know: the Brand Template dataset API is the canonical schema for valid field names and types.
   - What's unclear: the actual dataset has not been created yet, so the exact field contract is not verified against the real templates.
   - Recommendation: ship one canonical naming manifest in code and use it to drive the user setup checklist before the first integration test.

3. **How should long-term link persistence behave after the 30-day `edit_url` window?**
   - What we know: `edit_url` is temporary, `designId` is durable, and `GET /designs/{id}` can return fresh URLs.
   - What's unclear: whether the review page should always refresh URLs live or cache them for short periods.
   - Recommendation: persist `designId` as source of truth and resolve fresh URLs server-side on every review-page render.

4. **How should thumbnails be handled?**
   - What we know: the returned thumbnail URL expires after 15 minutes.
   - What's unclear: whether Phase 4 should spend time proxying/caching thumbnails or simply show them opportunistically.
   - Recommendation: treat thumbnails as optional. Never persist the thumbnail URL as durable state.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 for unit/integration; Playwright 1.52.0 for E2E |
| Config file | `/home/minhnhut_dev/projects/siletravel/vitest.config.ts`, `/home/minhnhut_dev/projects/siletravel/playwright.config.ts` |
| Quick run command | `npx vitest run src/lib/canva/__tests__/template-resolver.test.ts src/lib/canva/__tests__/payload.test.ts src/lib/canva/__tests__/oauth.test.ts src/lib/canva/__tests__/jobs.test.ts` |
| Full suite command | `npm test && npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CANVA-01 | Auto-select and confirm the active template set from `tourDuration` | unit + component | `npx vitest run src/lib/canva/__tests__/template-resolver.test.ts src/components/review/__tests__/template-confirmation.test.tsx` | ❌ Wave 0 |
| CANVA-02 | Map approved draft into separate Itinerary and Menu payloads | unit | `npx vitest run src/lib/canva/__tests__/payload.test.ts` | ❌ Wave 0 |
| CANVA-03 | Successful generation returns editable design metadata, not export-only output | integration | `npx vitest run src/lib/canva/__tests__/jobs.test.ts` | ❌ Wave 0 |
| CANVA-04 | Review page renders at least one usable Canva link from persisted design state | integration + e2e | `npx vitest run src/app/(app)/review/[id]/__tests__/actions.test.ts && npx playwright test tests/e2e/review-canva-generation.spec.ts` | ❌ Wave 0 |
| CANVA-05 | Async completion, timeout, and failed-job messaging behave correctly | unit + integration | `npx vitest run src/lib/canva/__tests__/jobs.test.ts src/app/(app)/review/[id]/__tests__/actions.test.ts` | ❌ Wave 0 |
| CANVA-06 | Template IDs and mappings stay outside hardcoded business logic | unit | `npx vitest run src/lib/canva/__tests__/template-resolver.test.ts src/lib/env.test.ts` | ❌ Wave 0 |
| UX-03 | User can open and copy resulting Canva links | component + e2e | `npx vitest run src/components/review/__tests__/canva-result-card.test.tsx && npx playwright test tests/e2e/review-canva-generation.spec.ts` | ❌ Wave 0 |
| UX-04 | User can see which template type is active before generating | component + e2e | `npx vitest run src/components/review/__tests__/template-confirmation.test.tsx && npx playwright test tests/e2e/review-canva-generation.spec.ts` | ❌ Wave 0 |
| SAFE-03 | Expired tokens refresh transparently and persist rotated credentials | unit + integration | `npx vitest run src/lib/canva/__tests__/oauth.test.ts src/lib/canva/__tests__/client.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/canva/__tests__/template-resolver.test.ts src/lib/canva/__tests__/payload.test.ts src/lib/canva/__tests__/oauth.test.ts src/lib/canva/__tests__/jobs.test.ts`
- **Per wave merge:** `npm test && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/canva/__tests__/template-resolver.test.ts` — covers CANVA-01, CANVA-06
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/canva/__tests__/payload.test.ts` — covers CANVA-02
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/canva/__tests__/jobs.test.ts` — covers CANVA-03, CANVA-05
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/canva/__tests__/oauth.test.ts` — covers SAFE-03
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/canva/__tests__/client.test.ts` — covers SAFE-03 retry/refresh wiring
- [ ] `/home/minhnhut_dev/projects/siletravel/src/app/(app)/review/[id]/__tests__/actions.test.ts` — covers CANVA-04, CANVA-05
- [ ] `/home/minhnhut_dev/projects/siletravel/src/components/review/__tests__/template-confirmation.test.tsx` — covers CANVA-01, UX-04
- [ ] `/home/minhnhut_dev/projects/siletravel/src/components/review/__tests__/canva-result-card.test.tsx` — covers UX-03, CANVA-04
- [ ] `/home/minhnhut_dev/projects/siletravel/tests/e2e/review-canva-generation.spec.ts` — end-to-end review → approve → generate → open/copy flow
- [ ] `/home/minhnhut_dev/projects/siletravel/scripts/canva-probe.ts` — `package.json` references this script, but the file does not currently exist; either add it or remove the script reference before relying on it for validation

## Sources

### Primary (HIGH confidence)
- https://www.canva.dev/docs/connect/api-reference/autofills.md — verified that Autofill APIs are documented for Brand Templates with datasets, not generic regular designs
- https://www.canva.dev/docs/connect/api-reference/autofills/create-design-autofill-job.md — checked request shape, async job creation, returned design metadata, rate limit
- https://www.canva.dev/docs/connect/api-reference/autofills/get-design-autofill-job.md — checked polling states, terminal errors, temporary edit/view URLs, thumbnail expiry
- https://www.canva.dev/docs/connect/api-reference/brand-templates.md — checked Brand Template scope and Enterprise requirement language
- https://www.canva.dev/docs/connect/api-reference/brand-templates/get-brand-template-dataset.md — checked canonical dataset field model and autofill field types
- https://www.canva.dev/docs/connect/api-reference/brand-templates/list-brand-templates.md — checked identifiers, metadata, dataset filtering, and ID migration note
- https://www.canva.dev/docs/connect/api-reference/authentication/generate-access-token.md — checked refresh-token flow and backend-only token exchange requirements
- https://www.canva.dev/docs/connect/api-reference/designs/get-design.md — checked temporary edit/view links and thumbnail expiry
- https://www.canva.dev/docs/connect/return-navigation-guide.md — checked editor open/return guidance
- https://www.canva.dev/sources/connect/api/latest/api.yml — checked for copy/edit endpoints; found autofill and resize jobs but no verified regular-design element-edit endpoint in the inspected spec content
- `/home/minhnhut_dev/projects/siletravel/.planning/phases/04-editable-canva-generation/04-CONTEXT.md` — locked phase decisions and UI requirements
- `/home/minhnhut_dev/projects/siletravel/.planning/REQUIREMENTS.md` — requirement definitions and traceability
- `/home/minhnhut_dev/projects/siletravel/.planning/ROADMAP.md` — phase scope and adapter-risk note
- `/home/minhnhut_dev/projects/siletravel/src/lib/env.ts` — existing env-validation pattern to extend
- `/home/minhnhut_dev/projects/siletravel/src/lib/canva/server-client.ts` — existing server-only Canva wrapper entry point
- `/home/minhnhut_dev/projects/siletravel/src/lib/ai/extraction-schema.ts` — approved data model to map into Canva payloads
- `/home/minhnhut_dev/projects/siletravel/prisma/schema.prisma` — current persistence shape and required extension point

### Secondary (MEDIUM confidence)
- `/home/minhnhut_dev/projects/siletravel/src/components/review/review-page.tsx` — confirmed current review-page composition and extension points for Phase 4 UI
- `/home/minhnhut_dev/projects/siletravel/src/components/review/review-actions.tsx` — confirmed current approve CTA must split into two-step approve/generate flow
- `/home/minhnhut_dev/projects/siletravel/src/app/(app)/review/[id]/actions.ts` — confirmed current Server Action mutation pattern
- `/home/minhnhut_dev/projects/siletravel/vitest.config.ts` and `/home/minhnhut_dev/projects/siletravel/playwright.config.ts` — confirmed validation stack already exists

### Tertiary (LOW confidence)
- None. Unverified community claims were intentionally excluded from the recommendations.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - official Canva docs plus direct inspection of the current repo stack are enough to recommend the adapter, persistence, and validation foundation.
- Architecture: MEDIUM - the internal app structure is clear, but the actual production Canva capability still depends on whether the account/template setup satisfies Brand Template + Enterprise prerequisites.
- Pitfalls: HIGH - the biggest pitfalls are directly documented by Canva (temporary URLs, dataset requirement, async jobs, token refresh behavior) or directly visible in the current repo (`CANVA_TEMPLATE_ID` mismatch, missing `canva-probe.ts`).

**Research date:** 2026-03-25
**Valid until:** 2026-04-01
