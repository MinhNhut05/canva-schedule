# Phase 2: Document Intake & Parsing - Research

**Researched:** 2026-03-23
**Domain:** Next.js App Router file intake, PDF/DOCX text extraction, Vietnamese extraction quality detection
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOC-01 | User can upload a PDF tour program file from the web interface | Protected `/upload` page, drag/drop UI, authenticated multipart Route Handler, PDF allowlist + parser adapter |
| DOC-02 | User can upload a DOCX tour program file from the web interface | Same intake pipeline with DOCX allowlist + Mammoth extractor adapter |
| DOC-03 | System validates file type before processing and rejects unsupported formats with a human-readable error | Client `accept` filtering, server size check, extension allowlist, binary signature sniffing, parser smoke check, Vietnamese error contract |
| DOC-04 | System extracts readable Vietnamese text from supported PDF/DOCX inputs for downstream processing | `pdfjs-dist` page text extraction, `mammoth.extractRawText()`, Unicode normalization, text cleanup |
| DOC-05 | System detects low-quality or unreadable extraction and informs the user when manual retry or better source file is needed | Advisory quality scoring, garbling/scanned detection, structured flags, yellow warning banner with continue option |
</phase_requirements>

## Summary

Phase 2 should be planned as a dedicated document-intake pipeline, not as a generic form submission. The cleanest fit for this codebase is: protected `/upload` page inside the existing `(app)` route group, drag/drop + manual submit UI in a client component, authenticated `POST` Route Handler for binary upload, immediate upload-row persistence in Prisma, then format-specific extraction and quality scoring before returning a structured result to the page.

For parsing, the strongest standard stack is `pdfjs-dist` for PDF and `mammoth` for DOCX. `pdfjs-dist` is the official PDF.js distribution and its Node example shows the exact text-extraction path needed here: `getDocument()` → `getPage()` → `getTextContent()`. `mammoth.extractRawText()` is the best DOCX match because the product needs readable Vietnamese raw text, not layout-faithful rendering. Mammoth’s own docs explicitly say raw text ignores formatting, table formatting is ignored, Markdown output is deprecated, and source documents are not sanitised.

The biggest planning risk is not “can we extract something?” but “can we tell when the output is too unreliable for downstream AI use?” Vietnamese PDF mangling, image-only/scanned PDFs, and table-heavy DOCX flattening are the failure modes that matter. Plan the phase around an advisory quality gate: normalize text, compute quality signals, persist flags and score, then show a warning without blocking the user. That matches the locked product decisions and keeps v1 honest about OCR limitations.

**Primary recommendation:** Use an authenticated Node-runtime Route Handler plus `pdfjs-dist` + `mammoth`, persist upload state immediately, and make extraction quality scoring a first-class output of the intake pipeline.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pdfjs-dist` | `5.5.207` (published 2026-03-01) | PDF text extraction with per-page text items | Official PDF.js distribution; gives direct access to text items and page counts needed for Vietnamese quality heuristics |
| `mammoth` | `1.12.0` (published 2026-03-12) | DOCX raw text extraction | Purpose-built for Word documents; `extractRawText()` matches Phase 2 output needs exactly |
| `file-type` | `21.3.4` (published 2026-03-22) | Best-effort binary signature sniffing before parsing | Stronger than extension-only checks; helps reject obvious bad uploads before parser errors |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Next.js Route Handlers | project uses `next@15.3.1` | Multipart intake via `request.formData()` | Use for the actual PDF/DOCX upload endpoint |
| `zod` | existing project dependency (`^3.24.0`) | Validate response contracts and internal parser state | Use for structured result validation, not for the binary file payload itself |
| `vitest` | `4.1.0` (published 2026-03-12) | Fast parser and heuristic unit tests | Add in Wave 0 because Playwright alone is too coarse for extraction and scoring logic |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `pdfjs-dist` | `pdf-parse` | Wrapper is simpler, but `pdfjs-dist` is the official source and exposes lower-level page/text signals needed for DOC-05 |
| Route Handler | Server Action | Server Actions are fine for normal forms, but the default request body limit is 1MB and this phase needs reliable 30MB file intake |
| `mammoth.extractRawText()` | Custom OOXML unzip/XML parser | More control, much more maintenance, no benefit for v1 raw-text output |
| Advisory quality warning | OCR fallback in v1 | OCR adds real complexity and the product explicitly does not guarantee scanned-PDF support in v1 |

**Installation:**
```bash
npm install pdfjs-dist mammoth file-type
npm install -D vitest
```

**Version verification:** Before implementation, verify against the registry:
```bash
npm view pdfjs-dist version
npm view mammoth version
npm view file-type version
npm view vitest version
```

Verified current versions and publish dates:
- `pdfjs-dist@5.5.207` — published `2026-03-01T20:24:02.230Z`
- `mammoth@1.12.0` — published `2026-03-12T21:40:09.129Z`
- `file-type@21.3.4` — published `2026-03-22T14:29:40.810Z`
- `vitest@4.1.0` — published `2026-03-12T14:06:30.610Z`

Additional verified notes:
- `pdfjs-dist@5.5.207` requires Node `>=20.19.0 || >=22.13.0 || >=24`; current environment is Node `v22.19.0`, so it is compatible.
- `mammoth@1.12.0` ships built-in types (`./lib/index.d.ts`). Do not plan `@types/mammoth`.
- `file-type@21.3.4` is ESM-only and requires Node `>=20`.
- `next.config.ts` currently does not configure `serverActions.bodySizeLimit`, so the documented 1MB default still applies.

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx               # protected layout with sidebar nav
│   │   ├── dashboard/page.tsx       # existing protected landing page
│   │   └── upload/
│   │       ├── page.tsx             # server page shell
│   │       ├── UploadForm.tsx       # client drag/drop + preview + submit
│   │       └── ExtractionResult.tsx # raw text preview + warning banner
│   └── api/
│       └── uploads/
│           └── route.ts             # authenticated multipart intake + extraction
├── components/
│   └── app-sidebar.tsx              # dashboard/upload navigation
├── lib/
│   └── documents/
│       ├── intake.ts                # file validation + orchestration entry point
│       ├── detect.ts                # extension/signature/parser smoke checks
│       ├── extract-pdf.ts           # pdfjs-dist adapter
│       ├── extract-docx.ts          # mammoth adapter
│       ├── normalize.ts             # unicode + whitespace cleanup
│       ├── quality.ts               # scoring and flags
│       └── types.ts                 # shared extraction result types
└── prisma/
    └── schema.prisma                # Upload model + status enum
```

### Pattern 1: Route Handler for Binary Intake
**What:** Use a `POST` Route Handler as the real upload boundary.

**When to use:** Always for this phase’s 30MB PDF/DOCX intake.

**Why:** Next.js Route Handlers support `request.formData()` directly. Next.js config docs also state that Server Actions default to a 1MB request body limit. In this repo, `next.config.ts` is currently empty, so planning around a Server Action would introduce an unnecessary config dependency.

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Vui lòng chọn file PDF hoặc DOCX" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, name: file.name, size: file.size });
}
```

### Pattern 2: Client Upload UI, Server Extraction Boundary
**What:** Keep drag/drop, file preview, and pending states in a client component, but send the file to the Route Handler with `fetch()` only when the user clicks `Xử lý`.

**When to use:** Always. This matches locked decisions D-02 and D-04.

**Project fit:** The codebase already uses protected server pages plus interactive client widgets and global Sonner toasts. The upload page should follow the same split: server page shell for auth/layout, client component for browser file APIs.

**Recommended flow:**
1. User selects or drops one file.
2. Client validates obvious constraints first (`accept`, one-file-only, 30MB limit).
3. UI shows file preview: name, size, type.
4. User clicks `Xử lý`.
5. Client sends `FormData` to `/api/uploads`.
6. Server re-validates everything, persists upload row, extracts text, scores quality, returns structured JSON.
7. Page renders raw text preview and advisory warning state.

### Pattern 3: Format-Specific Adapters with a Shared Result Contract
**What:** Separate PDF and DOCX extraction into dedicated adapters that return the same shape.

**When to use:** Immediately. Phase 3 should consume normalized text, not parser-specific details.

**Recommended shared result contract:**
```typescript
export interface ExtractionResult {
  kind: "pdf" | "docx";
  originalFileName: string;
  mime: string;
  sizeBytes: number;
  rawText: string;
  normalizedText: string;
  pageCount?: number;
  warnings: string[];
  quality: {
    score: number;
    level: "good" | "warning" | "poor";
    flags: string[];
  };
}
```

### Pattern 4: Persist Upload Row Before Extraction, Then Update Status
**What:** Create the database row as soon as the server accepts a supported file, then update it through processing states.

**When to use:** Required by D-13.

**Recommended status flow:**
`PENDING` → `PROCESSING` → `COMPLETED` | `COMPLETED_WITH_WARNING` | `FAILED`

**Recommended schema direction:**
- Add `Upload` or `DocumentUpload` model with: `id`, `userId`, `originalFileName`, `detectedMime`, `sourceKind`, `sizeBytes`, `status`, `rawText`, `normalizedText`, `qualityScore`, `qualityFlags`, `warningMessages`, `errorMessage`, `createdAt`, `updatedAt`
- Add `uploads Upload[]` relation on `User` now, because Phase 5 History will need it
- Store extracted text and metadata in Postgres; do not store binary file contents in the database for v1 unless a later requirement explicitly needs re-download

### Pattern 5: Normalize Before Scoring
**What:** Treat parser output as raw material. Run normalization before quality scoring or preview.

**When to use:** Always.

**Normalization steps:**
1. Normalize Unicode to `NFC`
2. Convert CRLF to `\n`
3. Collapse repeated spaces while preserving paragraph breaks
4. Trim repeated page headers/footers only if identical across pages
5. Preserve Vietnamese diacritics exactly; never ASCII-fold

### Pattern 6: Multi-Signal Advisory Quality Gate
**What:** Compute several quality signals, then turn them into score + flags + user-facing advisory text.

**When to use:** Always for DOC-05.

**Recommended initial signals:**
- `textTooShort`: normalized text length below a minimum plausible threshold for a 3-4 page tour program
- `containsReplacementChars`: count of `�` or similar garble markers
- `lowVietnameseSignal`: unusually low ratio of Vietnamese letters/diacritics relative to overall letters
- `highSymbolNoise`: unusual symbol/punctuation ratio
- `likelyScannedPdf`: PDF has pages but almost no extracted text items
- `fragmentedDocx`: many tiny lines/paragraph fragments suggesting table flattening

**Recommendation:** Score each signal, then classify into `good`, `warning`, or `poor`. Even `poor` should still return text and allow the user to continue, because D-09 makes the gate advisory.

### Anti-Patterns to Avoid
- **Using a Server Action as the main upload endpoint:** wrong default for a 30MB file boundary unless config is changed.
- **Relying on browser `accept` alone:** client filtering is UX only; the server must still validate.
- **Validating only by extension:** renamed files will still slip through.
- **Rendering Mammoth HTML from uploads:** Mammoth explicitly performs no sanitisation.
- **Treating “non-empty text” as success:** DOC-05 requires quality detection, not just parser output.
- **Blocking the user on poor extraction:** D-09 says warning-only, not hard-stop.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF parsing | Custom regex/byte parser | `pdfjs-dist` | PDF text extraction depends on font maps, text items, and page structure |
| DOCX extraction | Manual unzip + OOXML XML walker | `mammoth.extractRawText()` | OOXML is deceptively messy; Mammoth already handles common Word structures |
| File-type screening | `file.name.split(".")` checks only | extension allowlist + `file-type` + parser smoke check | Safer intake boundary than trusting filename alone |
| Extraction diagnostics | One boolean like `success=true` | structured score + flags + warning messages | Phase 3 and Phase 5 will need explainable parsing outcomes |
| OCR fallback | Homemade OCR path in Phase 2 | no OCR in v1; warn and ask for better file | OCR is explicitly not guaranteed for scanned/image-only PDFs in v1 |

**Key insight:** This phase should produce trustworthy text and trustworthy warnings. It should not try to perfectly recreate layout or silently “fix” bad documents.

## Common Pitfalls

### Pitfall 1: Server Action upload size surprise
**What goes wrong:** Larger PDFs/DOCX files fail even though the UI looks fine.
**Why it happens:** Next.js documents a default 1MB Server Action request body limit.
**How to avoid:** Use a Route Handler for binary upload. Keep Server Actions for metadata-only mutations.
**Warning signs:** Files under 1MB work; larger files fail before parser code runs.

### Pitfall 2: Extension-only validation accepts bad files
**What goes wrong:** A renamed unsupported file reaches the parser and throws a cryptic error.
**Why it happens:** Browser file names are not trustworthy.
**How to avoid:** Validate in order: size → extension allowlist → signature sniffing → parser smoke check.
**Warning signs:** Users never see a friendly “định dạng không hỗ trợ” message, only generic server errors.

### Pitfall 3: Vietnamese PDF text is technically extracted but semantically broken
**What goes wrong:** Output contains `�`, strange spacing, symbol noise, or almost no recognizable Vietnamese.
**Why it happens:** Some PDFs have bad text mapping or are effectively scanned/image-only.
**How to avoid:** Score garbling, text length, Vietnamese-signal ratio, and PDF text-item density.
**Warning signs:** Preview looks like gibberish, very short text, or disconnected fragments.

### Pitfall 4: DOCX tables flatten into awkward reading order
**What goes wrong:** Text exists, but itinerary order becomes hard to read.
**Why it happens:** Mammoth supports tables, but the docs say table formatting itself is ignored.
**How to avoid:** Optimize for readable raw text, not visual fidelity. Flag highly fragmented output as warning quality.
**Warning signs:** Many very short lines, merged meal sections, or broken day flow.

### Pitfall 5: Untrusted document content gets rendered as HTML
**What goes wrong:** The app renders unsafe HTML derived from uploaded files.
**Why it happens:** Mammoth explicitly states it performs no sanitisation of the source document.
**How to avoid:** Store and preview plain text only in Phase 2.
**Warning signs:** Implementation starts using `convertToHtml()` for preview.

### Pitfall 6: Node-only parsing code accidentally drifts toward Edge constraints
**What goes wrong:** Parsing libraries behave unexpectedly in an incompatible runtime path.
**Why it happens:** Binary parsing libraries are safest in Node runtime, while Route Handlers can be configured per route.
**How to avoid:** Explicitly export `runtime = "nodejs"` in the upload Route Handler.
**Warning signs:** Build/runtime errors mentioning Node APIs, workers, or package compatibility.

## Code Examples

Verified patterns from official sources:

### Read multipart form data in a Route Handler
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Missing file");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  return Response.json({ size: bytes.byteLength });
}
```

### Extract PDF text page-by-page with PDF.js
```typescript
// Source: https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/node/getinfo.mjs
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractPdfText(data: Uint8Array) {
  const pdf = await getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean);

    pages.push(strings.join(" "));
    page.cleanup();
  }

  return {
    pageCount: pdf.numPages,
    rawText: pages.join("\n\n"),
  };
}
```

### Extract DOCX raw text with Mammoth
```typescript
// Source: https://github.com/mwilliamson/mammoth.js#readme
import mammoth from "mammoth";

export async function extractDocxText(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });

  return {
    rawText: result.value,
    warnings: result.messages.map((message) => message.message),
  };
}
```

### Detect binary file type before parsing
```typescript
// Source: https://github.com/sindresorhus/file-type#readme
import { fileTypeFromBuffer } from "file-type";

export async function detectFileSignature(bytes: Uint8Array) {
  return fileTypeFromBuffer(bytes);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router API routes often needed extra body parsing configuration | App Router Route Handlers use the standard Web `Request` API and `request.formData()` | Current Next.js route docs, last updated 2026-03-03 | Upload endpoints are simpler and closer to platform APIs |
| Using Server Actions for every form submission | Use Route Handlers for binary/multipart intake and keep Server Actions for normal mutations | Current Next.js `serverActions` config docs, last updated 2025-06-16 | Avoids default 1MB body-limit surprises for file uploads |
| Mammoth Markdown output | Use `extractRawText()` for text extraction; Markdown support is deprecated | Current Mammoth README | Phase 2 should target raw text, not Markdown conversion |

**Deprecated/outdated:**
- Mammoth Markdown generation for this use case — deprecated in Mammoth’s own README.
- Extension-only upload validation — too weak for a server-side intake boundary.
- “Parser returned some text, so we are done” — outdated for a pipeline that must protect downstream AI from bad input.

## Open Questions

1. **What thresholds define “too poor” for real SOHA files?**
   - What we know: poor extraction must be detected, but the gate is advisory.
   - What's unclear: exact thresholds for short-text, garbling, and Vietnamese-signal ratios on the team’s real corpus.
   - Recommendation: collect 5-10 representative PDF/DOCX fixtures before finalizing thresholds; start conservative and tune using tests.

2. **Should original binary files be persisted anywhere in v1?**
   - What we know: locked decisions only require upload metadata, status, and usable extraction output.
   - What's unclear: whether Phase 5 history or audit needs binary re-download.
   - Recommendation: do not block Phase 2 on binary persistence. Store metadata + extracted text only unless a later requirement explicitly demands originals.

3. **How should “non-Vietnamese character ratio” be defined?**
   - What we know: D-07 explicitly wants this checked.
   - What's unclear: some valid tour docs may contain numbers, hotel names, English brand names, or all-caps ASCII headings.
   - Recommendation: use it as one signal among several, never as the only reason to flag a document.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright `^1.52.0` exists now; add Vitest `4.1.0` in Wave 0 for parser/quality unit tests |
| Config file | `/home/minhnhut_dev/projects/siletravel/playwright.config.ts`; none for Vitest yet — see Wave 0 |
| Quick run command | `npx vitest run src/lib/documents/quality.test.ts` |
| Full suite command | `npm run test:e2e && npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOC-01 | Upload PDF from `/upload` and receive extraction result | e2e | `npx playwright test tests/e2e/document-intake.spec.ts -g "upload PDF" -x` | ❌ Wave 0 |
| DOC-02 | Upload DOCX from `/upload` and receive extraction result | e2e | `npx playwright test tests/e2e/document-intake.spec.ts -g "upload DOCX" -x` | ❌ Wave 0 |
| DOC-03 | Reject unsupported file before processing with Vietnamese error | e2e + unit | `npx vitest run src/lib/documents/intake.test.ts -t "reject unsupported"` | ❌ Wave 0 |
| DOC-04 | Extract readable Vietnamese text from supported files | unit/integration | `npx vitest run src/lib/documents/extractors.test.ts -t "extract Vietnamese text"` | ❌ Wave 0 |
| DOC-05 | Flag low-quality extraction but allow user to continue | unit + e2e | `npx vitest run src/lib/documents/quality.test.ts -t "flags poor extraction"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/documents/quality.test.ts`
- **Per wave merge:** `npm run test:e2e && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `/home/minhnhut_dev/projects/siletravel/tests/e2e/document-intake.spec.ts` — covers DOC-01, DOC-02, DOC-03, and warning-banner UX
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/documents/extractors.test.ts` — fixture-based PDF/DOCX extraction coverage for DOC-04
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/documents/quality.test.ts` — heuristic scoring coverage for DOC-05
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/documents/intake.test.ts` — size/type validation coverage for DOC-03
- [ ] `/home/minhnhut_dev/projects/siletravel/tests/fixtures/documents/` — representative good/bad PDF and DOCX samples
- [ ] Framework install: `npm install -D vitest`

## Sources

### Primary (HIGH confidence)
- https://nextjs.org/docs/app/api-reference/file-conventions/route — verified Route Handler `Request` API, `request.formData()`, and route runtime config
- https://nextjs.org/docs/app/guides/forms — verified Server Actions receive `FormData` and must re-check authentication/authorization on the server
- https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions — verified default 1MB Server Action body-size limit and `bodySizeLimit` override
- https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/node/getinfo.mjs — verified official PDF.js Node text extraction flow: `getDocument()` → `getPage()` → `getTextContent()`
- https://github.com/mwilliamson/mammoth.js#readme — verified `extractRawText()`, table-formatting limitation, Markdown deprecation, and unsanitised-input warning
- https://github.com/sindresorhus/file-type#readme — verified `fileTypeFromBuffer()`, ESM-only packaging, and best-effort binary-signature caveat
- npm registry metadata (`npm view`) for `pdfjs-dist`, `mammoth`, `file-type`, `vitest` — verified current versions, publish dates, engine requirements, and package type declarations

### Secondary (MEDIUM confidence)
- https://www.npmjs.com/package/pdf-parse — used only as a comparison point when evaluating wrapper vs. official `pdfjs-dist`
- https://authjs.dev/reference/nextjs — used to confirm current `auth`, `signIn`, and `signOut` API naming aligns with project patterns

### Tertiary (LOW confidence)
- None needed for primary recommendations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — core recommendations are backed by official docs/examples and current npm registry metadata
- Architecture: HIGH — route-based intake, adapter split, Node runtime, and status persistence are directly supported by verified platform behavior and current project structure
- Pitfalls: HIGH — Server Action size limit, Mammoth sanitisation warning, and parser limitations are directly documented; Vietnamese quality heuristics are also reinforced by project roadmap/context risks

**Research date:** 2026-03-23
**Valid until:** 2026-04-22
