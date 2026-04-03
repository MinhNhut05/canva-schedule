---
phase: 02-document-intake-parsing
verified: 2026-03-24T04:00:15Z
status: human_needed
score: 4/4 must-haves verified
human_verification:
  - test: "Kiểm tra giao diện tải tài liệu trên desktop và mobile"
    expected: "Sidebar, mobile sheet, drag-and-drop zone, badge màu, banner cảnh báo và panel đọc văn bản hiển thị đúng như UI spec tiếng Việt."
    why_human: "Static analysis và Playwright xác nhận phần tử/copy tồn tại, nhưng không đánh giá được chất lượng thị giác, spacing, responsive feel và độ rõ ràng của trạng thái UI."
  - test: "Tải thử các file thực tế chất lượng kém"
    expected: "PDF scan hoặc DOCX phức tạp vẫn cho phản hồi tiếng Việt rõ ràng; khi chất lượng thấp, người dùng hiểu được nên thử lại hay đổi file nguồn."
    why_human: "Bộ fixture hiện có chỉ đại diện cho một số trường hợp; độ dễ hiểu của cảnh báo trên tài liệu thật cần người dùng xác nhận."
  - test: "Kiểm tra flow hết hạn phiên đăng nhập trong lúc upload"
    expected: "Khi session hết hạn, người dùng nhận thông báo 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.' và có thể khôi phục flow hợp lý."
    why_human: "Có thể kiểm tra code-path 401, nhưng UX thực tế khi session expiry xảy ra giữa thao tác cần xác nhận thủ công trong trình duyệt."
---

# Phase 2: Document Intake & Parsing Verification Report

**Phase Goal:** Document Intake & Parsing — users can upload PDF/DOCX files, the system validates, extracts, normalizes, and quality-scores the text, and displays the result with Vietnamese UI.
**Verified:** 2026-03-24T04:00:15Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | User can upload both PDF and DOCX tour program files from the web interface. | ✓ VERIFIED | `/home/minhnhut_dev/projects/siletravel/src/app/(app)/upload/upload-form.tsx` accepts `.pdf,.docx`, renders chooser/drag-drop UI, submits `FormData` to `/api/uploads`; `/home/minhnhut_dev/projects/siletravel/tests/e2e/document-intake.spec.ts` passes PDF and DOCX upload-preview tests. |
| 2 | Unsupported file types are rejected before processing with a human-readable explanation. | ✓ VERIFIED | `/home/minhnhut_dev/projects/siletravel/src/lib/documents/intake.ts` validates presence, size, extension, and binary signature with Vietnamese errors; `/home/minhnhut_dev/projects/siletravel/src/app/(app)/upload/upload-form.tsx` mirrors client-side rejection; unit test and E2E unsupported-file tests pass. |
| 3 | Supported files produce readable Vietnamese text suitable for downstream processing. | ✓ VERIFIED | `/home/minhnhut_dev/projects/siletravel/src/lib/documents/extract-pdf.ts`, `/home/minhnhut_dev/projects/siletravel/src/lib/documents/extract-docx.ts`, `/home/minhnhut_dev/projects/siletravel/src/lib/documents/normalize.ts`, and `/home/minhnhut_dev/projects/siletravel/src/lib/documents/pipeline.ts` implement extraction→normalize→score; E2E asserts visible Vietnamese text `CHƯƠNG TRÌNH TOUR` in result panel; all unit tests pass. |
| 4 | When extraction quality is too poor for reliable downstream use, the app tells the user to retry or provide a better source file. | ✓ VERIFIED | `/home/minhnhut_dev/projects/siletravel/src/lib/documents/quality.ts` flags low-quality extraction; `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts` persists `COMPLETED_WITH_WARNING`; `/home/minhnhut_dev/projects/siletravel/src/app/(app)/upload/extraction-result.tsx` renders Vietnamese advisory warning and `Tải file khác`; empty-PDF E2E test passes. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/types.ts` | Shared intake/extraction/quality contracts | ✓ VERIFIED | Exists, substantive, consumed by route, UI, pipeline, and tests. |
| `/home/minhnhut_dev/projects/siletravel/prisma/schema.prisma` | Upload persistence model and lifecycle statuses | ✓ VERIFIED | `UploadStatus` enum and `Upload` model exist with required fields and `User` relation. |
| `/home/minhnhut_dev/projects/siletravel/tests/fixtures/documents/` | Valid and invalid PDF/DOCX fixtures | ✓ VERIFIED | PDF, DOCX, empty PDF, and invalid binary fixtures exist and are used by unit/E2E tests. |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/detect.ts` | Binary signature sniffing | ✓ VERIFIED | Uses `file-type` dynamically, server-only, and is called by `validateFile()`. |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/intake.ts` | Validation orchestration with Vietnamese errors | ✓ VERIFIED | Implements presence→size→extension→signature checks and returns Vietnamese copy with diacritics. |
| `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts` | Authenticated upload endpoint with DB persistence and pipeline integration | ✓ VERIFIED | Checks auth, validates file, creates upload row, updates statuses, runs extraction pipeline, persists results, and returns typed response. |
| `/home/minhnhut_dev/projects/siletravel/src/app/(app)/upload/page.tsx` | Upload page shell in Vietnamese | ✓ VERIFIED | Exists, substantive, and wired to render `UploadForm`. |
| `/home/minhnhut_dev/projects/siletravel/src/app/(app)/upload/upload-form.tsx` | Client upload UI, preview panel, submit flow | ✓ VERIFIED | Exists, substantive, and wired to API plus extraction result rendering. |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/extract-pdf.ts` | PDF extraction adapter | ✓ VERIFIED | Uses PDF.js, tracks `pageCount` and `textItemCount`, and emits scanned-PDF warning. |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/extract-docx.ts` | DOCX extraction adapter | ✓ VERIFIED | Uses `mammoth.extractRawText()` and tracks `lineCount`. |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/normalize.ts` | NFC normalization with diacritic preservation | ✓ VERIFIED | Pure utility, no ASCII folding, used by pipeline. |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/quality.ts` | Quality scoring heuristics and levels | ✓ VERIFIED | Implements 6 flags, explicit `QualityInput`, score deductions, and good/warning/poor classification. |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/pipeline.ts` | Extraction orchestrator | ✓ VERIFIED | Dispatches by `DocumentKind`, normalizes, scores, and returns `ExtractionResult`. |
| `/home/minhnhut_dev/projects/siletravel/src/app/(app)/upload/extraction-result.tsx` | Result display with advisory warnings and text preview | ✓ VERIFIED | Displays Vietnamese quality badges, warning banner, and raw text panel with `whitespace-pre-wrap`. |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/intake.test.ts` | Validation unit coverage | ✓ VERIFIED | 7 test cases, including Vietnamese diacritic assertions and real fixtures. |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/extractors.test.ts` | Extractor and normalization unit coverage | ✓ VERIFIED | Covers PDF, DOCX, empty PDF warning, NFC normalization, and diacritic preservation. |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/quality.test.ts` | Quality scoring unit coverage | ✓ VERIFIED | Covers all 6 flags, level classification, and kind-specific guardrails. |
| `/home/minhnhut_dev/projects/siletravel/tests/e2e/document-intake.spec.ts` | End-to-end intake flow coverage | ✓ VERIFIED | 8 passing Playwright tests cover upload, validation, extraction result, warning flow, and reset. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `/home/minhnhut_dev/projects/siletravel/src/app/(app)/upload/upload-form.tsx` | `/api/uploads` | `fetch` POST with `FormData` | WIRED | `handleSubmit()` posts selected file to `/api/uploads`. |
| `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts` | `validateFile()` | Direct function call | WIRED | Route parses `formData`, converts `file`, then awaits `validateFile(file)`. |
| `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts` | `prisma.upload.create` | Prisma ORM | WIRED | Accepted uploads are persisted immediately with `PENDING`. |
| `/home/minhnhut_dev/projects/siletravel/src/app/api/uploads/route.ts` | `runExtractionPipeline()` | Direct function call | WIRED | Route reads file bytes, runs the pipeline, and returns real extraction output. |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/pipeline.ts` | `extract-pdf.ts` / `extract-docx.ts` | Conditional dispatch by `DocumentKind` | WIRED | PDF path calls `extractPdfText`; DOCX path calls `extractDocxText`. |
| `/home/minhnhut_dev/projects/siletravel/src/lib/documents/pipeline.ts` | `normalizeText()` → `scoreQuality()` | Sequential pipeline | WIRED | Extracted raw text is normalized before scoring and returned as `normalizedText`. |
| `/home/minhnhut_dev/projects/siletravel/src/app/(app)/upload/upload-form.tsx` result state | `/home/minhnhut_dev/projects/siletravel/src/app/(app)/upload/extraction-result.tsx` | React props | WIRED | Successful API response sets `result`, which renders `<ExtractionResult data={result} onReset={...} />`. |
| `/home/minhnhut_dev/projects/siletravel/src/app/(app)/upload/extraction-result.tsx` | upload-form reset state | `onReset` callback | WIRED | Warning action `Tải file khác` calls back into `resetFile()` through `onReset`. |
| `/home/minhnhut_dev/projects/siletravel/src/components/app-sidebar.tsx` | `/upload` | Next.js `Link` | WIRED | Primary navigation includes `Tải tài liệu` linked to `/upload`. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| DOC-01 | 02-01, 02-02, 02-03, 02-07 | User can upload a PDF tour program file from the web interface | ✓ SATISFIED | Upload form accepts PDF; route validates and processes PDF; Playwright PDF upload test passes. |
| DOC-02 | 02-01, 02-02, 02-03, 02-07 | User can upload a DOCX tour program file from the web interface | ✓ SATISFIED | Upload form accepts DOCX; route validates and processes DOCX; Playwright DOCX upload test passes. |
| DOC-03 | 02-01, 02-02, 02-03, 02-06, 02-07 | System validates file type before processing and rejects unsupported formats with a human-readable error | ✓ SATISFIED | Client and server validation both reject invalid files; `detectFileSignature()` blocks renamed-file bypass; unit and E2E rejection tests pass. |
| DOC-04 | 02-01, 02-04, 02-05, 02-06, 02-07 | System extracts readable Vietnamese text from supported PDF/DOCX inputs for downstream processing | ✓ SATISFIED | PDF/DOCX extractors, normalization, and pipeline exist and are wired; E2E shows extracted Vietnamese text in UI; extractor tests pass. |
| DOC-05 | 02-01, 02-05, 02-06, 02-07 | System detects low-quality or unreadable extraction and informs the user when manual retry or better source file is needed | ✓ SATISFIED | `scoreQuality()` flags low-quality cases; route stores warning status; UI displays Vietnamese warning and retry action; empty-PDF E2E test passes. |

**Requirement ID accounting:** All requirement IDs declared in Phase 2 plans are accounted for: `DOC-01`, `DOC-02`, `DOC-03`, `DOC-04`, `DOC-05`.

**Orphaned requirements:** None. `REQUIREMENTS.md` maps exactly these five requirements to Phase 2, and all five appear in plan frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| None | - | No TODO/FIXME/TRANSITIONAL markers or user-visible stub implementations found in verified Phase 2 files. | - | No blocker or warning-level anti-patterns detected in the actual implementation. |

### Human Verification Required

### 1. Kiểm tra giao diện tải tài liệu trên desktop và mobile

**Test:** Mở `/upload` trên desktop và mobile, thử sidebar thường, mobile sheet, drag-and-drop active state, disabled state khi đang xử lý, badge chất lượng và banner cảnh báo.
**Expected:** Giao diện đúng tiếng Việt, bố cục rõ ràng, màu cảnh báo dễ nhận biết, panel đọc văn bản dễ dùng.
**Why human:** Automated checks xác nhận logic và phần tử có tồn tại, nhưng không đánh giá được chất lượng thị giác và cảm nhận responsive.

### 2. Tải thử các file thực tế chất lượng kém

**Test:** Dùng vài file PDF scan thật, PDF bị lỗi font tiếng Việt, và DOCX có bảng/phân mảnh mạnh.
**Expected:** Ứng dụng vẫn hiển thị cảnh báo phù hợp, nội dung preview không gây hiểu nhầm, và nút `Tải file khác`/copy hướng dẫn đủ rõ.
**Why human:** Fixture coverage tốt nhưng chưa đại diện toàn bộ dữ liệu sản xuất; độ rõ ràng của guidance cần người dùng xác nhận.

### 3. Kiểm tra flow hết hạn phiên đăng nhập trong lúc upload

**Test:** Đăng nhập, để session hết hạn hoặc xóa session rồi submit file tại `/upload`.
**Expected:** API trả lỗi 401 với thông báo tiếng Việt đúng, và UX khôi phục sang đăng nhập lại là hợp lý.
**Why human:** Có thể chứng minh code-path tồn tại, nhưng full browser recovery flow cần kiểm tra thủ công.

### Gaps Summary

Không có gap blocker nào được tìm thấy trong kiểm tra tự động. Goal cấp phase đã được codebase hỗ trợ đầy đủ theo 4 success criteria của ROADMAP và 5 requirement IDs DOC-01..DOC-05. Tuy nhiên, Phase 2 vẫn cần human sign-off cho phần visual/UX thực tế, tài liệu đầu vào ngoài fixture, và trải nghiệm khi session hết hạn.

### Automated Verification Evidence

- `npm --prefix "/home/minhnhut_dev/projects/siletravel" run typecheck` → passed
- `npm --prefix "/home/minhnhut_dev/projects/siletravel" run test` → 3 test files passed, 24 tests passed
- `npm --prefix "/home/minhnhut_dev/projects/siletravel" run test:e2e -- tests/e2e/document-intake.spec.ts` → 8 Playwright tests passed

---

_Verified: 2026-03-24T04:00:15Z_
_Verifier: Claude (gsd-verifier)_
