# Phase 2: Document Intake & Parsing - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can upload supported tour documents (PDF/DOCX) and receive readable Vietnamese text or clear guidance when source quality is insufficient. This phase delivers the upload UI, file validation, text extraction pipeline, and extraction quality detection. It does NOT include AI extraction or Canva generation — those are Phase 3 and Phase 4 respectively.

</domain>

<decisions>
## Implementation Decisions

### Upload UX & Entry Point
- **D-01:** Dedicated upload page at `/upload`, separate from the dashboard
- **D-02:** Drag & Drop zone + "Chọn file" button — both methods supported
- **D-03:** Single file per upload session (1 file / lần) — matches v1 volume (~10 tours/week)
- **D-04:** After selecting file, show file info preview (tên, kích thước, loại file) → user clicks "Xử lý" button to start extraction. No auto-processing.
- **D-05:** Add a sidebar/nav component to the app layout — includes links for Dashboard and Upload. Replaces current header-only navigation. Prepares structure for future pages (History, Settings, etc.)

### Extraction Output & Quality Gate
- **D-06:** After extraction, display the raw text (văn bản thô) on screen so user can preview before proceeding to AI (Phase 3)
- **D-07:** Automatic quality scoring system — checks for: garbled/mangled characters, text too short for a tour program, unusually high ratio of non-Vietnamese characters
- **D-08:** When quality is low: show a yellow warning banner with message like "Chất lượng extract thấp, có thể không chính xác. Bạn có thể tiếp tục hoặc upload file khác." User decides to continue or re-upload — no hard block
- **D-09:** Quality gate is advisory, not blocking — user always has the option to proceed

### File Constraints & Edge Cases
- **D-10:** Maximum file size: 30MB — sufficient for larger tour program PDFs/DOCX
- **D-11:** Accepted formats: `.pdf` and `.docx` only. Other formats rejected with Vietnamese error message before upload
- **D-12:** All error messages and UI text in Vietnamese (tiếng Việt) — this is an internal tool for SOHA Travel team
- **D-13:** Save upload record to database immediately: file name, upload date, user ID, processing status. This prepares the data model for History feature in Phase 5

### Claude's Discretion
- PDF extraction library choice (pdf-parse, pdfjs-dist, etc.)
- DOCX extraction library choice (mammoth, docx, etc.)
- Exact quality scoring algorithm and thresholds
- Sidebar/nav component design and styling approach
- File upload handling implementation (multer, formidable, Next.js API route, etc.)
- Database schema for upload records
- Raw text display component layout
- Loading/progress indicator during extraction

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above. Key source documents:

### Project context
- `.planning/PROJECT.md` — Project overview, company formatting rules, Canva setup details, constraints
- `.planning/REQUIREMENTS.md` — DOC-01 through DOC-05 requirement definitions
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, notes on Vietnamese PDF mangling risks

### Prior phase decisions
- `.planning/phases/01-capability-gate-secure-access/01-CONTEXT.md` — Phase 1 auth decisions, establishes NextAuth.js patterns, app layout structure, session handling

### Codebase patterns (established in Phase 1)
- `src/app/(app)/layout.tsx` — Current app layout with header nav (to be extended with sidebar)
- `src/app/(app)/dashboard/page.tsx` — Existing protected page pattern
- `src/lib/auth.ts` — Auth configuration pattern
- `src/lib/db.ts` — Prisma database client pattern
- `src/lib/env.ts` — Environment variable handling pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/db.ts` — Prisma client singleton, reuse for upload record persistence
- `src/lib/auth.ts` — Auth helpers, use `auth()` to get current user for upload ownership
- `src/lib/env.ts` — Env pattern for any new extraction-related config
- `zod` (already installed) — File validation schemas
- `sonner` (already installed) — Toast notifications for upload success/error

### Established Patterns
- Next.js 15 App Router with route groups: `(auth)` for login, `(app)` for protected pages
- Server Actions pattern (see `src/app/(auth)/login/actions.ts`, `src/app/(app)/settings/password/actions.ts`)
- Prisma for database access
- Inline styles (no CSS framework yet) — sidebar addition may be a good time to consider Tailwind or keep inline
- TypeScript strict mode with Zod validation

### Integration Points
- `src/app/(app)/layout.tsx` — Must be modified to add sidebar/nav
- New route: `src/app/(app)/upload/page.tsx` — Upload page within protected area
- New API route or Server Action for file upload handling
- Prisma schema extension for upload/job records
- Phase 3 will consume the extracted text output from this phase

</code_context>

<specifics>
## Specific Ideas

- Tour program files are typically 3-4 pages, Vietnamese content — extraction must handle Vietnamese diacritics correctly
- PITFALLS research highlighted Vietnamese PDF text mangling as a real risk — quality detection should specifically check for this
- The raw text preview serves as a sanity check — users familiar with tour content can quickly spot if extraction went wrong
- Keep the upload flow simple and linear: select file → preview info → click xử lý → see extracted text → decide next step

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-document-intake-parsing*
*Context gathered: 2026-03-23*
