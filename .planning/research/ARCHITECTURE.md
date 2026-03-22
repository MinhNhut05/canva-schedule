# Architecture Research

**Domain:** Document-to-Design Automation (PDF/DOCX → AI Summarize → Canva)
**Researched:** 2026-03-22
**Confidence:** HIGH (Next.js pipeline patterns), MEDIUM (Canva Connect API — limited public examples)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER (React UI)                          │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ Upload Page  │  │  Preview + Edit  │  │  History / Admin  │  │
│  │ (dropzone,   │  │  (parsed text,   │  │  (past designs,   │  │
│  │  template    │  │   AI summary,    │  │   rule manager,   │  │
│  │  selector)   │  │   confirm step)  │  │   template mgmt)  │  │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬──────────┘  │
└─────────┼───────────────────┼────────────────────┼─────────────┘
          │  HTTP / fetch      │                    │
┌─────────▼───────────────────▼────────────────────▼─────────────┐
│                  NEXT.JS API ROUTES (Node.js server)             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ /api/upload  │  │/api/generate │  │ /api/history           │ │
│  │ (parse file, │  │ (AI summary  │  │ /api/admin/rules       │ │
│  │  return text)│  │  + rules     │  │ /api/admin/templates   │ │
│  │              │  │  + Canva)    │  │ /api/auth/[...next]    │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────────────────┘ │
│         │                 │                                       │
│  ┌──────▼─────────────────▼──────────────────────────────────┐  │
│  │                  SERVICE LAYER  (src/lib/)                  │  │
│  │  ┌─────────────┐  ┌─────────────────┐  ┌───────────────┐  │  │
│  │  │ fileParser  │  │  aiSummarizer   │  │  canvaClient  │  │  │
│  │  │ (pdf-parse  │  │  (LLM call +    │  │  (OAuth2,     │  │  │
│  │  │  mammoth)   │  │   rulesEngine)  │  │   autofill)   │  │  │
│  │  └─────────────┘  └─────────────────┘  └───────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│         │                                          │              │
│  ┌──────▼──────────────────────────────────────────▼──────────┐  │
│  │             DATA LAYER  (Prisma + PostgreSQL)                │  │
│  │   users | generations | rules | canva_templates              │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                                          │
          ▼                                          ▼
   ┌─────────────┐                         ┌────────────────────┐
   │  LLM API    │                         │ Canva Connect API  │
   │ (external   │                         │ (OAuth2, autofill, │
   │  AI server) │                         │  design duplicate) │
   └─────────────┘                         └────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Upload Page | File dropzone, tour type selector (1-day/2-day), trigger parse | React + react-dropzone + shadcn/ui |
| Preview + Edit | Show parsed text, show AI summary result, allow minor text edits before push to Canva | React state + textarea |
| History Page | List past generations with Canva edit links, file names, timestamps | React Query + table |
| Admin Panel | CRUD formatting rules, manage Canva template IDs per tour type | Protected route, form UI |
| `/api/upload` | Receive file, run parser (pdf-parse / mammoth), return raw extracted text | Next.js Route Handler |
| `/api/generate` | Orchestrate: AI summarize → apply rules → call Canva API → save to DB → return edit link | Next.js Route Handler |
| `fileParser` | Extract plain text from PDF or DOCX, normalize Vietnamese encoding | `src/lib/parser.ts` |
| `aiSummarizer` | LLM call with structured output prompt, return parsed sections (title, greeting, sessions, menu) | `src/lib/ai/summarizer.ts` |
| `rulesEngine` | Apply SOHA Travel formatting rules (greeting, column labels, school name injection) | `src/lib/rules/engine.ts` |
| `canvaClient` | Manage OAuth2 token, duplicate template, POST autofill payload, return edit URL | `src/lib/canva/client.ts` |
| Database | Persist users, generation history, configurable rules, template ID mappings | Prisma + PostgreSQL |

---

## Recommended Project Structure

```
siletravel/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page (credentials)
│   │   │   └── layout.tsx
│   │   ├── (app)/                    # Protected routes (auth guard)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Upload + generate flow (main screen)
│   │   │   ├── history/
│   │   │   │   └── page.tsx          # Past generations + Canva links
│   │   │   ├── admin/
│   │   │   │   ├── rules/
│   │   │   │   │   └── page.tsx      # Formatting rules CRUD
│   │   │   │   └── templates/
│   │   │   │       └── page.tsx      # Canva template ID management
│   │   │   └── layout.tsx            # Single auth guard layout
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts      # next-auth handler
│   │   │   ├── upload/
│   │   │   │   └── route.ts          # POST: parse PDF/DOCX → raw text
│   │   │   ├── generate/
│   │   │   │   └── route.ts          # POST: AI + rules + Canva → edit URL
│   │   │   ├── history/
│   │   │   │   └── route.ts          # GET: user generation history
│   │   │   └── admin/
│   │   │       ├── rules/
│   │   │       │   └── route.ts      # GET/POST/PUT/DELETE rules
│   │   │       └── templates/
│   │   │           └── route.ts      # GET/POST/PUT template mappings
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── lib/                          # Business logic — server-side only
│   │   ├── parser.ts                 # PDF + DOCX text extraction
│   │   ├── ai/
│   │   │   ├── summarizer.ts         # LLM call + response parsing
│   │   │   └── prompts.ts            # Prompt templates per tour type
│   │   ├── rules/
│   │   │   ├── engine.ts             # Apply SOHA Travel rules to AI output
│   │   │   └── types.ts              # Rule schema types
│   │   ├── canva/
│   │   │   ├── client.ts             # Canva API wrapper (autofill + create)
│   │   │   ├── auth.ts               # OAuth2 token fetch + refresh
│   │   │   ├── autofill.ts           # Build autofill payload from finalContent
│   │   │   └── elementMap.ts         # Canva element name constants per template
│   │   ├── db.ts                     # Prisma client singleton
│   │   └── auth.ts                   # next-auth config + credentials provider
│   │
│   ├── components/                   # React UI components
│   │   ├── upload/
│   │   │   ├── FileDropzone.tsx      # Drag-and-drop file input
│   │   │   └── TemplateSelector.tsx  # 1-day / 2-day radio/select
│   │   ├── preview/
│   │   │   ├── SummaryPreview.tsx    # Show AI summary result + editable fields
│   │   │   └── GenerateButton.tsx    # Trigger Canva generation
│   │   ├── history/
│   │   │   └── HistoryTable.tsx      # Generation list with Canva links
│   │   ├── admin/
│   │   │   ├── RulesTable.tsx        # CRUD table for formatting rules
│   │   │   └── TemplateManager.tsx   # Template ID input per tour type
│   │   └── ui/                       # shadcn/ui auto-generated components
│   │
│   ├── types/                        # Shared TypeScript types
│   │   ├── api.ts                    # API request/response shapes
│   │   └── generation.ts             # Pipeline internal types
│   │
│   └── hooks/                        # React Query data hooks
│       ├── useUpload.ts              # POST /api/upload
│       ├── useGenerate.ts            # POST /api/generate
│       └── useHistory.ts             # GET /api/history
│
├── prisma/
│   ├── schema.prisma                 # DB models
│   └── migrations/
│
├── public/
├── .env.local                        # API keys (never commit)
├── next.config.ts
└── package.json
```

### Structure Rationale

- **`lib/` for all business logic:** `lib/` is server-side only — keeps AI API keys and Canva OAuth tokens off the browser. Route handlers stay thin and delegate to `lib/` functions.
- **`lib/ai/`, `lib/rules/`, `lib/canva/` as isolated sub-modules:** Each integration is independently testable and swappable (e.g., swap AI provider without touching Canva code).
- **`lib/canva/elementMap.ts` as single source of truth:** All Canva template element name strings in one place — template changes require updating only one file.
- **`(app)/` route group with layout:** Single auth guard protects all app routes. `(auth)/` routes bypass the guard cleanly.
- **`hooks/` for server state:** React Query hooks abstract fetch calls, provide loading/error states, and cache results to avoid redundant requests.

---

## Architectural Patterns

### Pattern 1: Pipeline Orchestration in Route Handler

**What:** The `/api/generate` route handler calls `lib/` functions in strict sequence — parse → summarize → apply rules → fill Canva — each step taking the previous step's output as input.

**When to use:** When steps have clear data dependencies and must run in order. Keeps route handler readable and each step unit-testable.

**Trade-offs:** Simple and debuggable. Does not support resuming from a failed step (acceptable for this scope — just retry the whole flow).

**Example:**
```typescript
// src/app/api/generate/route.ts
export async function POST(req: Request) {
  const { rawText, templateType } = await req.json()

  // Step 1 — AI summarize
  const aiOutput = await summarize(rawText, templateType)

  // Step 2 — Apply SOHA Travel rules
  const finalContent = applyRules(aiOutput, templateType)

  // Step 3 — Fill Canva template
  const { editUrl } = await createDesign(templateType, finalContent)

  // Step 4 — Save to history
  await db.generation.create({ data: { editUrl, templateType, ... } })

  return Response.json({ editUrl })
}
```

---

### Pattern 2: Structured Output from LLM

**What:** Ask the LLM to return a defined JSON schema (tool_use / JSON mode) instead of free text — guarantees consistent shape for the rules engine to consume.

**When to use:** Whenever AI output feeds into code logic. Free-text parsing is fragile; structured output is reliable.

**Trade-offs:** Slightly longer prompt. Requires JSON schema definition. Worth it — prevents random AI format changes breaking the pipeline.

**Example:**
```typescript
// src/lib/ai/summarizer.ts
const schema = z.object({
  title: z.string(),
  greeting: z.string(),
  tourType: z.enum(['1-day', '2-day']),
  sessions: z.array(z.object({
    column: z.enum(['morning', 'afternoon', 'day1', 'day2']),
    items: z.array(z.string()),
  })),
  menu: z.array(z.object({ meal: z.string(), items: z.array(z.string()) })),
})

export async function summarize(rawText: string, templateType: string) {
  const response = await llmClient.chat({ /* prompt */ })
  return schema.parse(JSON.parse(response.content)) // validated output
}
```

---

### Pattern 3: Server-Side OAuth Token Management

**What:** Canva OAuth2 access token is fetched and stored server-side (DB or encrypted env). All Canva API calls happen in `lib/canva/client.ts` — never exposed to the browser.

**When to use:** Any time an external API requires OAuth2 and the token must stay private.

**Trade-offs:** Requires token refresh logic (check expiry before each call). Keeps security boundary clean — no tokens in browser storage.

**Example:**
```typescript
// src/lib/canva/auth.ts
export async function getAccessToken(): Promise<string> {
  const stored = await db.canvaToken.findFirst()
  if (stored && stored.expiresAt > new Date()) {
    return stored.accessToken
  }
  // refresh token flow...
  const fresh = await refreshCanvaToken(stored.refreshToken)
  await db.canvaToken.update({ data: fresh })
  return fresh.accessToken
}
```

---

## Data Flow

### Main Request Flow (Generation Pipeline)

```
User selects file + tour type (1-day / 2-day)
        │
        ▼
POST /api/upload
  → fileParser.extract(file)          # pdf-parse or mammoth
  → returns: { rawText, fileType }
        │
        ▼
Browser shows text preview
User confirms (or edits)
        │
        ▼
POST /api/generate { rawText, templateType, userEdits? }
        │
        ├── 1. aiSummarizer.summarize(rawText, templateType)
        │         LLM call → structured JSON output
        │         returns: { title, greeting, sessions[], menu[] }
        │
        ├── 2. rulesEngine.apply(aiOutput, templateType)
        │         override greeting (school vs corporate)
        │         set column labels (Buoi sang/chieu or Ngay 1/2)
        │         inject school name in "return to school" phrase
        │         returns: finalContent (ready for Canva autofill)
        │
        ├── 3. canvaClient.createDesign(templateId, finalContent)
        │         GET OAuth token (refresh if expired)
        │         POST /designs/autofill with element mappings
        │         returns: { designId, editUrl }
        │
        └── 4. db.generation.create({ userId, editUrl, ... })
                  save to history
        │
        ▼
Browser receives { editUrl }
→ Display "Open in Canva" button
→ User edits and shares directly in Canva
```

### State Management

```
Server State (React Query)
  ├── useUpload()      → POST /api/upload   → { rawText }
  ├── useGenerate()    → POST /api/generate → { editUrl }
  └── useHistory()     → GET  /api/history  → Generation[]

Client State (React useState — minimal)
  ├── selectedFile      (before upload)
  ├── templateType      (1-day | 2-day)
  ├── editedSummary     (user tweaks in preview step)
  └── currentStep       ('upload' | 'preview' | 'generating' | 'done')
```

No Zustand / Redux needed — React Query + useState is sufficient for this scope.

### Key Data Flows

1. **File → Text:** Upload → `fileParser` → `rawText` (plain string) — text flows right to browser for preview.
2. **Text → Structured AI output:** `rawText` + `templateType` → LLM → `AiSummaryResult` (validated Zod schema).
3. **AI output → Canva payload:** `AiSummaryResult` → `rulesEngine` → `finalContent` → `canvaClient.autofill()` → `editUrl`.
4. **Edit URL → User:** `editUrl` stored in DB, returned in API response, shown as button in UI.

---

## Build Order

Build in this sequence — each phase unblocks the next:

```
Phase 1: Foundation
  → Next.js project setup
  → Prisma schema (users, generations, rules, canva_templates)
  → next-auth credentials login
  → Protected routes (app layout with auth guard)
  UNBLOCKS: all other phases can use auth + DB

Phase 2: File Parsing
  → /api/upload route handler
  → fileParser (pdf-parse + mammoth)
  → Upload page UI + text preview
  UNBLOCKS: Phase 3 (needs rawText to feed to AI)

Phase 3: AI + Rules Engine
  → aiSummarizer (LLM call + Zod schema)
  → prompt templates (1-day / 2-day variants)
  → rulesEngine (hardcoded v1 rules matching PROJECT.md rules)
  → Preview UI (show summary, allow edit)
  UNBLOCKS: Phase 4 (needs finalContent shape to map to Canva elements)

Phase 4: Canva Integration
  → canvaClient OAuth2 token flow
  → autofill payload builder (elementMap.ts)
  → /api/generate orchestration
  → Save to history + return editUrl
  → "Open in Canva" button in UI
  UNBLOCKS: Phase 5 (core flow working end-to-end before adding admin)

Phase 5: Admin Panels
  → Rules CRUD page (move hardcoded rules to DB)
  → Template management page (map templateType → Canva template ID)
  UNBLOCKS: Phase 6 (polish needs all features in place)

Phase 6: Polish
  → Error handling on all pipeline steps
  → Loading states + progress indicators
  → Edge cases (empty file, unreadable PDF, LLM timeout)
  → Vietnamese encoding / whitespace normalization tests
  → Canva API rate-limit retry with backoff
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-20 users (current) | Synchronous pipeline in a single API route is fine. No queue needed. Monolith Next.js handles this easily. |
| 20-200 users | Add BullMQ + Redis job queue if generation > 30s causes Vercel/server timeouts. Return `jobId` immediately, poll for status. |
| 200+ users | Split AI worker and Canva worker into separate services. Add file hash cache to skip re-parsing identical uploads. |

### Scaling Priorities

1. **First bottleneck:** Canva API rate limits (per-token request quotas). Add retry with exponential backoff in `canvaClient.ts` from day 1.
2. **Second bottleneck:** LLM API latency (~10-20s for long tour programs). Consider streaming AI response to show progress in UI if UX feels slow.

---

## Anti-Patterns

### Anti-Pattern 1: All Logic Inside the Route Handler

**What people do:** Put parser + AI call + rules + Canva calls all inline in `/api/generate/route.ts` (200+ lines).

**Why it's wrong:** Hard to test individual steps. One error in the middle makes the whole route fail silently. Impossible to swap AI provider. Timeouts affect the entire pipeline at once.

**Do this instead:** Each step is a function in `lib/` — route handler is thin orchestration only. Unit-test `summarizer`, `rulesEngine`, and `canvaClient` independently.

---

### Anti-Pattern 2: Storing Canva OAuth Token in the Browser

**What people do:** Redirect Canva OAuth to browser, store `access_token` in `localStorage`, call Canva API from client.

**Why it's wrong:** Exposes Canva token to XSS. Any injected script can steal the token and create/modify designs on the account.

**Do this instead:** Complete OAuth2 flow server-side, store token in DB (encrypted). All Canva API calls from `lib/canva/` only — never from client components.

---

### Anti-Pattern 3: Hardcoding Canva Element Names Across Files

**What people do:** Copy-paste element name strings like `"itinerary_col1_row1"` wherever needed.

**Why it's wrong:** Canva template element names are brittle. One rename in Canva silently creates blank designs. Finding all occurrences requires grep across the whole project.

**Do this instead:** Single `src/lib/canva/elementMap.ts` file. All element name mappings centralized per template type. One place to update when templates change.

---

### Anti-Pattern 4: Parsing Files on the Client Side

**What people do:** Bundle pdf.js in the browser to extract text client-side, then send extracted text to the AI API.

**Why it's wrong:** ~3MB bundle size increase. Encoding inconsistencies across browsers. LLM API key must be exposed if called from client.

**Do this instead:** Upload raw binary file to `/api/upload`, parse server-side with `pdf-parse` / `mammoth`, return normalized text to browser.

---

### Anti-Pattern 5: Skipping Validation on AI Output

**What people do:** Directly use `JSON.parse(llmResponse)` and pass raw object to rules engine without shape validation.

**Why it's wrong:** LLMs occasionally return malformed JSON or missing fields. Unvalidated output crashes the rules engine in production at random intervals.

**Do this instead:** Validate AI output with `zod.parse()` immediately after receiving LLM response. Throw a typed error if validation fails — triggers clean error handling in route handler.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Canva Connect API | REST + OAuth2 — server-side only | Token stored in DB. Use `/designs/autofill` endpoint. Element names must exactly match template field names. |
| LLM API (external) | REST via `fetch` or SDK — server-side only | API key in `process.env`. Use structured output (JSON mode / tool_use) for reliable schema. Handle timeout errors gracefully. |
| PostgreSQL | Prisma ORM with connection pool | `PrismaClient` singleton in `lib/db.ts`. Avoid instantiating multiple clients (common Next.js mistake in dev HMR). |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React UI ↔ API Routes | HTTP fetch via React Query hooks | Always use typed interfaces from `types/api.ts` for request/response shapes |
| API Routes ↔ Service Layer | Direct function import | Route handlers are thin — validate input, call `lib/` function, return response |
| `aiSummarizer` ↔ `rulesEngine` | `AiSummaryResult` TypeScript type | Zod-validated AI output is the contract between these two modules |
| `rulesEngine` ↔ `canvaClient` | `FinalContent` TypeScript type | Rules engine output maps 1:1 to Canva autofill element keys in `elementMap.ts` |
| `canvaClient` ↔ `canva/auth.ts` | Function call: `getAccessToken()` | Auth module handles token lifecycle; client module never touches token storage |

---

## Sources

- Next.js App Router docs — Route Handlers, Server Components, FormData file upload
- Canva Connect API docs (canva.dev) — Autofill API reference, OAuth2 authorization code flow
- next-auth v5 App Router guide — credentials provider, session strategy
- Prisma docs — connection pooling, singleton pattern for Next.js dev HMR
- PROJECT.md — SileTravel requirements, SOHA Travel formatting rules, Canva template setup

---
*Architecture research for: Document-to-Design Automation (SileTravel — SOHA Travel Program Summarizer)*
*Researched: 2026-03-22*
