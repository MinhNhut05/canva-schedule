# Pitfalls Research

**Domain:** Document-to-Canva Automation (PDF/DOCX → AI → Canva Connect API)
**Project:** SileTravel — Tour program design automation
**Stack:** Next.js + TypeScript, Vietnamese content
**Researched:** 2025-03-22
**Confidence:** HIGH (Canva API spec verified), MEDIUM (PDF/AI từ community patterns)

---

## Critical Pitfalls

### Pitfall 1: Autofill chỉ hoạt động với Brand Templates — không phải regular templates

**What goes wrong:**
Developer tạo template thông thường trên Canva, gọi autofill API, rồi nhận lỗi không rõ ràng. Autofill **chỉ hoạt động với Brand Templates** (enterprise feature) — không phải design thường hay shared templates.

**Why it happens:**
Canva có 2 loại: "Design" (creative work) và "Brand Template" (autofillable). Docs không nhấn mạnh đủ, developer assume template = template.

**How to avoid:**
- Kiểm tra endpoint `/v1/brand-templates/{id}/dataset` để verify template có autofill fields không
- Brand Templates yêu cầu **Canva Enterprise account** — confirm tài khoản trước khi build
- Đặt element names trong Brand Template editor (Canva UI) khớp với code dataset keys

**Warning signs:**
- Response `403` hoặc `capability_not_supported` từ autofill endpoint
- Template dataset trả về empty fields
- Autofill job status = `failed` ngay lập tức

**Phase to address:** Phase 1 — Setup & Infrastructure (trước khi design bất kỳ template nào)

---

### Pitfall 2: Async Job Pattern — không handle đúng polling loop

**What goes wrong:**
Autofill, export, asset upload đều là **async jobs**. Code gọi create job rồi immediately dùng kết quả → nhận `job_not_ready` hoặc incomplete data. Hoặc poll vô hạn không có timeout → app treo.

**Why it happens:**
Pattern REST API thông thường là synchronous. Developer không quen async-job pattern của Canva: create → poll → result.

**How to avoid:**
```typescript
async function pollJob(jobId: string, maxRetries = 20): Promise<JobResult> {
  for (let i = 0; i < maxRetries; i++) {
    const job = await canva.getAutofillJob(jobId);
    if (job.status === 'success') return job.result;
    if (job.status === 'failed') throw new Error(job.error);
    await sleep(Math.min(1000 * 2 ** i, 10000));
  }
  throw new Error('Job timeout');
}
```
- Set maximum poll time (~2 phút) để tránh infinite loop
- Handle `failed` status riêng với error message cụ thể

**Warning signs:**
- App "freeze" khi chờ export/autofill
- Kết quả design trống hoặc incomplete
- Memory leak do unresolved polling intervals

**Phase to address:** Phase 2 — Canva API Integration

---

### Pitfall 3: Rate Limits làm vỡ batch processing

**What goes wrong:**
Khi automation xử lý nhiều tour programs, vượt rate limits → `429 Too Many Requests` → toàn bộ batch fail hoặc data corruption.

**Why it happens:**
Rate limits thực tế của Canva Connect API (từ OpenAPI spec):
- `POST /v1/autofills`: **60 requests/window** per client-user
- `POST /v1/exports`: **20 requests/5-min**, **500/24h** per user
- `GET /v1/autofills/{jobId}` (polling): **60 requests/window**
- `POST /v1/designs`: **20 requests/window**
- Export hard limits: **750 exports/5-min** (integration-wide), **5,000/24h** (integration-wide)

**How to avoid:**
- Implement **request queue** với rate limiting middleware (e.g., `bottleneck` npm package)
- Xử lý sequential thay vì parallel khi batch > 5 items
- Cache export URLs (valid 24h) để tránh re-export cùng design
- Monitor `X-RateLimit-Remaining` header trong responses

**Warning signs:**
- Response `429` trong logs
- Batch jobs succeed cho 5-10 items đầu rồi fail
- Export URLs expire nhanh khi không cache

**Phase to address:** Phase 3 — Batch Processing & Queue System

---

### Pitfall 4: Vietnamese Text bị mangle khi parse PDF

**What goes wrong:**
Text tiếng Việt trong PDF bị:
- Mất dấu thanh: "Hà Nội" → "Ha Noi"
- Tách glyph sai: "ươ" → "u" + "o" + dấu riêng lẻ
- Kết hợp sai columns: nội dung 2 cột bị merge ngang thành 1 dòng vô nghĩa
- Font custom không embedded → toàn bộ text thành ký tự lạ

**Why it happens:**
PDF format không có concept "word" hay "paragraph" — chỉ có glyph positions. Tiếng Việt dùng Unicode combining characters. Nhiều PDF tour program dùng custom Vietnamese fonts với encoding riêng.

**How to avoid:**
- Dùng `pdf-parse` + fallback sang `pdfjs-dist` khi output có tỷ lệ ký tự lạ > 5%
- Detect scanned PDF (không có text layer) → route sang OCR pipeline (Tesseract với `vie` language pack)
- Post-process: NFC normalize Unicode sau khi extract (`text.normalize('NFC')`)
- Test với **thực tế các PDF từ clients** trước khi ship — không giả định format chuẩn

**Warning signs:**
- Text output chứa nhiều `?` hoặc box characters (□)
- Giá tour bị sai: "1.200.000đ" → "1200000"
- Lịch trình ngày "Ngày 1:" bị merge với nội dung ngày khác

**Phase to address:** Phase 1 — Document Parsing Pipeline

---

### Pitfall 5: AI Hallucination trên dữ liệu tour cụ thể

**What goes wrong:**
AI "tự sáng tác" thông tin tour:
- Giá tiền bị làm tròn sai hoặc đơn vị sai
- Ngày tháng bị shift
- Tên địa danh sai
- Bao gồm dịch vụ không có trong document gốc

**Why it happens:**
LLM được train trên dữ liệu chung về travel nên dễ tự bổ sung. Khi context window bị truncate, AI đoán phần bị cắt.

**How to avoid:**
- System prompt nghiêm ngặt: chỉ dùng thông tin có trong document
- Dùng structured output thay vì free-form text
- Verify key facts xuất hiện nguyên văn trong source text
- Tách prompt: extract raw facts → format/summarize

**Warning signs:**
- AI trả về giá trị không xuất hiện trong PDF gốc
- Itinerary có nhiều ngày hơn duration đã declare
- Field có dịch vụ không được mention trong source

**Phase to address:** Phase 2 — AI Summarization & Extraction

---

### Pitfall 6: Template Text Overflow — Canva không tự wrap/truncate

**What goes wrong:**
Text được autofill dài hơn text box trong template → text bị clip hoặc tràn ra ngoài khung, phá vỡ layout.

**How to avoid:**
- Định nghĩa character limits cho mỗi field trong AI extraction prompt
- Implement smart truncation
- Tạo template variants theo số ngày
- Test với content dài nhất trước khi launch

**Phase to address:** Phase 2 — Template Design + Phase 3 — Content Processing

---

### Pitfall 7: OAuth Token Management — Token expire làm gián đoạn automation

**What goes wrong:**
Access token Canva expire sau vài giờ, các requests sau đó fail với `401 Unauthorized`.

**How to avoid:**
- Auto-refresh trước khi expire
- Store `refresh_token` securely
- Retry once on `401`
- Lưu client secret ngay lúc tạo app

**Phase to address:** Phase 1 — Authentication Setup

---

### Pitfall 8: DOCX Parsing — Nested Tables và Merged Cells

**What goes wrong:**
Tour program DOCX thường dùng table layout phức tạp. Nhiều parsers đọc text theo XML order, bỏ qua structure → output lộn xộn.

**How to avoid:**
- Dùng parser phù hợp cho DOCX có table phức tạp
- Extract theo row/column structure
- Detect table type bằng header keywords
- Test với actual client DOCX files

**Phase to address:** Phase 1 — Document Parsing Pipeline

---

### Pitfall 9: Brand Template ID Migration

**What goes wrong:**
Canva đổi format Brand Template ID. Nếu hardcode IDs trong code hoặc DB structure không tốt, flow có thể break.

**How to avoid:**
- Không hardcode Brand Template IDs
- Store trong DB với metadata
- Build health check verify template IDs

**Phase to address:** Phase 1 — Template Management System

---

### Pitfall 10: Scanned PDF — Không có text layer

**What goes wrong:**
PDF scan/image-only làm text extraction trả về rỗng. AI không có input đáng tin cậy.

**How to avoid:**
- Detect image-only PDF sớm
- OCR fallback: Tesseract.js với `vie+eng`
- Cảnh báo user về chất lượng extract

**Phase to address:** Phase 1 — Document Parsing Pipeline

---

## Key Takeaways for Roadmap

- **Phải verify Canva capability rất sớm** trước khi đầu tư vào autofill pipeline
- **Human review step là bắt buộc** để chặn AI hallucination
- **Vietnamese parsing là rủi ro lớn nhất ở input side**
- **Template IDs + OAuth + rate limit** là rủi ro lớn nhất ở integration side

---

## Sources

- Canva Connect API OpenAPI Spec
- Canva Connect API Docs
- Community PDF parsing patterns
- Structured output / hallucination best practices

---
*Pitfalls research for: Document-to-Canva automation (SileTravel)*
*Researched: 2025-03-22*
