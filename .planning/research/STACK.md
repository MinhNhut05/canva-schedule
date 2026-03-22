# Stack Research

**Domain:** Document-to-Canva automation web app
**Researched:** 2026-03-22
**Confidence:** MEDIUM-HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x stable | Web app + API routes | Fit tốt cho internal tool, 1 codebase cho UI và backend orchestration |
| TypeScript | 5.x | Type safety across pipeline | Giảm lỗi ở flow nhiều bước: parse → AI → rules → Canva |
| PostgreSQL | 16.x | Persist users, jobs, template mappings, rules | Ổn định, quen thuộc, hợp với Prisma |
| Prisma | 6.x | ORM + schema migrations | DX tốt với Next.js/TypeScript, phù hợp CRUD nội bộ |
| Zod | 4.3.6 | Validate request bodies và AI structured output | Cực quan trọng để chặn malformed AI output |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pdf-parse | 2.4.5 | Parse text từ PDF thường | Default parser cho PDF có text layer |
| pdfjs-dist | 5.5.207 | PDF parsing fallback/control sâu hơn | Khi `pdf-parse` cho output lỗi/mất dấu/merge cột |
| mammoth | 1.12.0 | Extract text từ DOCX | Default DOCX parser cho file Word bình thường |
| tesseract.js | 7.0.0 | OCR cho scanned PDFs | Chỉ dùng fallback khi PDF không có text layer |
| openai | 6.32.0 | AI API integration option | Khi user cung cấp OpenAI-compatible endpoint/key |
| @anthropic-ai/sdk | 0.80.0 | Claude API integration option | Khi dùng Claude cho structured extraction |
| ai | 4.x | Unified AI SDK patterns | Dùng nếu muốn trừu tượng hóa provider về sau |
| formidable | 3.5.4 | Multipart parsing | Khi cần kiểm soát upload server-side đơn giản |
| next-auth / Auth.js | 5.x | Login/session management | Đủ cho team nội bộ nhiều user |
| bottleneck | latest | Rate limit / queue control | Khi bắt đầu chạm Canva rate limits |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Code quality | Dùng config mặc định của Next.js ban đầu là đủ |
| Prettier | Consistent formatting | Giữ project dễ review, đặc biệt với JSON schemas/prompt files |
| Prisma Studio | Inspect DB data | Rất tiện để kiểm tra jobs, users, template mappings |

## Installation

```bash
# Core
npm install next react react-dom typescript zod @prisma/client

# Parsing + AI + auth
npm install pdf-parse pdfjs-dist mammoth tesseract.js formidable openai @anthropic-ai/sdk ai next-auth

# Supporting
npm install bottleneck

# Dev dependencies
npm install -D prisma eslint prettier
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js | NestJS + separate React frontend | Khi app lớn hơn nhiều, cần backend service tách biệt rõ từ đầu |
| Prisma + PostgreSQL | Supabase | Khi muốn managed DB + auth + storage nhanh cho MVP |
| pdf-parse + pdfjs-dist | unstructured / external document parsing service | Khi file cực đa dạng, OCR nặng, muốn outsource parsing |
| mammoth | custom DOCX XML parser | Khi DOCX thực tế có quá nhiều merged tables và mammoth không đủ |
| Zod | Joi / Yup | Chỉ khi team đã standardize sẵn tool khác |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Client-side PDF parsing | Bundle nặng, khó giữ keys/tokens an toàn | Parse ở server route handler |
| Free-form AI output parsing | Rất dễ vỡ khi model đổi format | Structured JSON + Zod validation |
| Hardcoded Canva template IDs in code | Template đổi là vỡ flow | Lưu template mappings trong DB/admin config |
| One parser for every document | PDF/DOCX/scan có đặc tính khác nhau | Multi-strategy parser pipeline |

## Stack Patterns by Variant

**If Canva autofill capability is confirmed:**
- Use Next.js monolith + Canva OAuth + DB-backed template mappings
- Because user cần editable Canva links trực tiếp

**If Canva autofill is NOT available on user's plan:**
- Use same web app + AI extraction, nhưng đổi output strategy
- Because core parsing/rules/review vẫn giữ nguyên; chỉ thay integration/output layer

**If scanned PDFs are common:**
- Add OCR fallback early in phase 1
- Because OCR không nên là patch muộn nếu input quality thấp xảy ra thường xuyên

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.x | React 19 | Chọn stable release, tránh canary |
| Prisma 6.x | PostgreSQL 16.x | Combination phổ biến, ổn định |
| Zod 4.3.6 | TypeScript 5.x | Phù hợp cho schema-first validation |
| pdfjs-dist 5.5.207 | Node modern runtime | Cần kiểm tra runtime support khi deploy |

## Recommended Architecture Decision

- **Start simple:** Next.js App Router monolith
- **Keep all external integrations server-side**
- **Design around a strict pipeline:** upload → parse → AI extract → review/edit → rules → Canva generate
- **Treat Canva integration as replaceable adapter**, vì đây là phần nhiều rủi ro nhất theo research

## Open Risks / Clarifications

1. **Canva capability mismatch:** user nói Canva Pro, nhưng research cho thấy autofill có thể cần Brand Templates / Enterprise.
2. **DOCX complexity:** nếu file DOCX chứa nhiều merged tables, có thể cần custom extraction hơn `mammoth`.
3. **Scanned PDF frequency:** nếu scan xuất hiện nhiều, OCR sẽ thành scope bắt buộc sớm hơn.

## Sources

- Canva Connect API docs / OpenAPI spec
- Next.js official docs
- npm package version checks gathered during research
- Project context from `.planning/PROJECT.md`

---
*Stack research for: SileTravel*
*Researched: 2026-03-22*
