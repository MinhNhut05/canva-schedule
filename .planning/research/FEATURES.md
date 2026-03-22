# Feature Research

**Domain:** Document-to-Design Automation (PDF/DOCX → Canva tour program)
**Researched:** 2025-03-22
**Confidence:** HIGH (based on Canva API docs, comparable tools: MagicSlides, Simplified, Zapier/Canva integrations, PDFMonkey, Docupilot patterns)

---

## Context: SileTravel Constraints

Trước khi vào feature landscape, cần hiểu rõ scope của project:

- **Users:** ~5-10 nhân viên SOHA Travel (non-technical)
- **Volume:** ~10 tours/week → không cần scale lớn, cần **reliable** hơn **fast**
- **Templates:** 2 loại (1-day, 2-day) với company-specific rules (lời chào tiếng Việt, tên trường, layout cột)
- **Output:** Editable Canva links (không phải static PDF)
- **Canva constraint:** Canva Connect API (autofill approach) hoặc Bulk Create — cả hai đều có giới hạn

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **File upload** (PDF/DOCX) | Điểm khởi đầu của toàn bộ flow — không có thì không dùng được | LOW | Drag-and-drop + click-to-browse. Max file size validation. Format validation trước khi upload |
| **Upload progress indicator** | User cần biết file đang xử lý, không bị "treo màn hình" | LOW | Simple progress bar hoặc spinner với % |
| **AI extraction preview** | User phải xem AI extract được gì trước khi push sang Canva — tránh sai sót | MEDIUM | Show extracted fields: tên tour, trường, ngày, itinerary. Cho phép sửa trước khi confirm |
| **Template selection** | 1-day vs 2-day tours có template khác nhau — phải chọn đúng | LOW | 2 templates hiện tại, dropdown/radio đơn giản |
| **Processing status feedback** | AI + Canva API có latency. User cần biết đang ở bước nào | MEDIUM | Step indicator: Upload → Extract → Review → Generate → Done |
| **Output link delivery** | Canva editable link là deliverable cuối — phải hiển thị rõ ràng | LOW | Button "Mở trong Canva", copy link. Không chỉ text thuần |
| **Error messages (human-readable)** | Khi fail, user không hiểu lỗi kỹ thuật — cần hướng dẫn cụ thể | MEDIUM | "File không đọc được trang 3 — thử export lại từ Word" thay vì "Error 500" |
| **Processing history / job list** | 10 tours/week × nhiều user → cần tra lại link cũ | MEDIUM | List các lần xử lý: tên file, ngày, trạng thái, link Canva |
| **Re-open / copy previous links** | Canva link từ tuần trước vẫn cần dùng lại | LOW | Lưu link trong DB, hiển thị trong history |
| **Basic auth / login** | Multi-user team — phải phân biệt ai làm gì | MEDIUM | NextAuth hoặc simple JWT. Không cần phức tạp |

### Differentiators (Competitive Advantage)

Features that set SileTravel apart from generic tools.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Company-specific extraction rules** | Generic AI không biết format SOHA Travel (lời chào, tên trường, layout) — custom rules = output đúng ngay lần đầu | HIGH | Prompt engineering + field schema cụ thể cho tour programs. Ví dụ: luôn extract "Kính gửi Ban Giám Hiệu Trường [tên trường]" |
| **Inline field editing trước khi push Canva** | Cho phép sửa nhanh AI mistakes ngay trong app — không cần mở Word → sửa → upload lại | MEDIUM | Form chỉnh sửa các extracted fields. Đây là key differentiator cho accuracy |
| **Smart template auto-detection** | AI tự nhận diện 1-day vs 2-day tour từ nội dung file — không cần user chọn | MEDIUM | Pattern matching trên số ngày/đêm trong document. Fallback về manual selection |
| **Itinerary column layout mapping** | Tour programs có bảng giờ/hoạt động với cột đặc biệt — mapping đúng vào Canva template | HIGH | Phức tạp nhất: parse table từ PDF/DOCX, map sang Canva autofill fields |
| **Per-user job history** | Mỗi nhân viên thấy lịch sử của mình + có thể xem của team | LOW | Simple role-based: user thấy jobs của mình, admin thấy tất cả |
| **Retry với edited data** | Khi Canva API fail hoặc output sai — cho phép retry mà không cần upload file lại | LOW | Store extracted data, chỉ re-trigger Canva generation step |
| **Vietnamese language-aware extraction** | AI models đôi khi xử lý tiếng Việt kém (dấu, encoding) — cần test/validate | HIGH | Dùng GPT-4o hoặc Claude Haiku với prompt tiếng Việt. Test với file thực tế |
| **Validation rules engine** | Kiểm tra extracted data trước khi push: tên trường có blank không? Ngày có hợp lệ không? | MEDIUM | Set of required fields + format checks. Hiển thị warning rõ ràng |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this specific project.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time collaborative editing** | "Nhiều người cùng sửa một tour" | Canva đã có built-in collaboration — duplicate effort. Overengineering cho 10 users | Để Canva handle collaboration sau khi link được tạo |
| **In-app Canva preview/editor** | "Xem trước design không cần mở Canva" | Canva không embed design editor cho external apps (API restriction). Sẽ mất nhiều tháng build partial solution | Link trực tiếp sang Canva — users quen dùng Canva rồi |
| **Bulk upload nhiều file cùng lúc** | "Upload 10 files cùng lúc cho tiện" | Race conditions với Canva API rate limits, khó debug khi 1 file fail trong batch, UX phức tạp | Queue-based single processing. Process từng file, hiển thị queue status |
| **Custom template builder trong app** | "Tự tạo template mới không cần Canva" | Đây là full design tool — scope creep cực lớn. Canva đã làm tốt việc này | Templates được tạo và quản lý trực tiếp trong Canva bởi admin, app chỉ reference template ID |
| **Auto-send output qua email/zalo** | "Tự động gửi link cho khách hàng" | Ngoài scope của tool (document processing ≠ CRM). Tạo dependency không cần thiết | Copy link manually hoặc integrate sau ở v2 nếu có nhu cầu thực sự |
| **OCR cho ảnh chụp / scan PDF** | "Xử lý luôn file scan" | OCR accuracy thấp với tiếng Việt + bảng biểu. Tạo ra nhiều bad output hơn là giúp ích | Yêu cầu file digital (Word export to PDF), document rõ ràng trong onboarding |
| **Version history với diff** | "Track thay đổi qua các lần sửa" | Over-engineering cho 10 tours/week. Git-style diff cho tour content không có value | Đơn giản: mỗi submission là 1 job mới trong history. Timestamp là đủ |

---

## Feature Dependencies

```
[File Upload]
    └──requires──> [File Validation (format, size)]
                       └──requires──> [AI Extraction]
                                          └──requires──> [Extraction Review/Edit UI]
                                                             └──requires──> [Canva Template Mapping]
                                                                                └──requires──> [Canva API Integration]
                                                                                                   └──produces──> [Output Link Delivery]

[Auth / Login]
    └──enables──> [Job History per User]
                      └──enables──> [Admin View All Jobs]

[Smart Template Auto-detection] ──enhances──> [Template Selection]
    (fallback if auto-detect fails)

[Validation Rules Engine] ──enhances──> [Extraction Review/Edit UI]
    (blocks submission if required fields missing)

[Retry với edited data] ──requires──> [Job History]
    (cần biết job nào để retry)

[Vietnamese-aware Extraction] ──enhances──> [AI Extraction]
    (không thể tách rời, là một phần của extraction logic)
```

### Dependency Notes

- **File Upload requires File Validation:** Phải validate format/size trước khi gửi lên server — tránh waste AI API calls cho file không hợp lệ
- **AI Extraction requires Extraction Review/Edit UI:** Không bao giờ push thẳng sang Canva mà không có human review step — đây là safety net quan trọng nhất
- **Canva Template Mapping requires Canva API Integration:** Template mapping logic (field names, positions) gắn chặt với cách Canva API autofill hoạt động — phải build cùng nhau
- **Auth enables Job History:** Không có auth = job history không có owner = mất ý nghĩa trong multi-user context
- **Smart Auto-detection enhances Template Selection:** Auto-detect là UX improvement, không phải blocker — Template Selection vẫn hoạt động tốt nếu chỉ dùng manual
- **Validation Rules Engine enhances Extraction Review:** Engine chạy trên extracted data, highlight fields cần sửa trước khi user confirm — cần có Review UI trước

---

## MVP Definition

### Launch With (v1)

Minimum viable product — đủ để team SOHA Travel dùng thực tế hàng tuần.

- [ ] **File upload** (PDF + DOCX) với validation — vì không có upload thì không có gì
- [ ] **AI extraction** với Vietnamese-aware prompt — core value của tool
- [ ] **Extraction review + inline edit** — safety net, tránh output sai lên Canva
- [ ] **Manual template selection** (1-day / 2-day) — 2 loại, không cần auto-detect ở v1
- [ ] **Canva API integration** (autofill → create design) — deliverable cuối cùng
- [ ] **Output link display** với copy button — user cần lấy link
- [ ] **Processing step indicator** — UX không thể thiếu khi có latency
- [ ] **Human-readable error messages** — team non-technical, cần hướng dẫn rõ
- [ ] **Basic auth** (login/logout, multi-user) — team nhiều người
- [ ] **Job history** (per user, hiển thị link cũ) — 10 tours/week cần tra lại

### Add After Validation (v1.x)

Features thêm khi v1 đã stable và team dùng đều đặn.

- [ ] **Smart template auto-detection** — trigger: users hay chọn sai template, hoặc feedback "chọn tự động tiện hơn"
- [ ] **Validation rules engine** — trigger: AI hay bỏ sót fields quan trọng (tên trường, ngày)
- [ ] **Admin view all jobs** — trigger: manager cần oversight hoặc audit ai làm gì
- [ ] **Retry với edited data** — trigger: Canva API fail thường xuyên hoặc user hay cần re-generate
- [ ] **Itinerary column layout mapping nâng cao** — trigger: output Canva hiện tại không đủ đẹp với bảng lịch trình phức tạp

### Future Consideration (v2+)

Features defer cho đến khi product-market fit rõ ràng.

- [ ] **3-4 day tour templates** — đã trong roadmap, defer vì cần học từ 1-day/2-day trước
- [ ] **Bulk queue processing** — defer vì 10 tours/week không cần, complexity cao
- [ ] **Canva template management trong app** — defer vì templates thay đổi ít, Canva UI đủ tốt
- [ ] **Analytics / usage reports** — defer vì team nhỏ, không cần dashboard phức tạp

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| File upload (PDF/DOCX) | HIGH | LOW | P1 |
| Upload progress indicator | HIGH | LOW | P1 |
| AI extraction (Vietnamese-aware) | HIGH | HIGH | P1 |
| Extraction review + inline edit | HIGH | MEDIUM | P1 |
| Manual template selection | HIGH | LOW | P1 |
| Canva API integration (autofill) | HIGH | HIGH | P1 |
| Processing step indicator | HIGH | LOW | P1 |
| Output link display + copy | HIGH | LOW | P1 |
| Human-readable error messages | HIGH | MEDIUM | P1 |
| Basic auth / login | HIGH | MEDIUM | P1 |
| Job history per user | HIGH | MEDIUM | P1 |
| Smart template auto-detection | MEDIUM | MEDIUM | P2 |
| Validation rules engine | MEDIUM | MEDIUM | P2 |
| Retry với edited data | MEDIUM | LOW | P2 |
| Admin view all jobs | MEDIUM | LOW | P2 |
| Itinerary column layout mapping | HIGH | HIGH | P2 |
| 3-4 day tour templates | HIGH | HIGH | P3 |
| Bulk queue processing | LOW | HIGH | P3 |
| Canva template management trong app | LOW | HIGH | P3 |

**Priority key:**
- **P1:** Must have for launch — không có thì tool không dùng được
- **P2:** Should have — add khi v1 stable, dựa trên user feedback
- **P3:** Nice to have — future consideration, defer

---

## Competitor Feature Analysis

Tools có use case gần nhất với SileTravel:

| Feature | MagicSlides | Simplified AI | Canva Bulk Create | SileTravel Approach |
|---------|-------------|---------------|-------------------|---------------------|
| File upload inputs | PDF, DOCX, URL, YouTube | Text paste, URL (max 5000 words) | CSV/Spreadsheet data | PDF + DOCX (tour program format) |
| AI extraction | Gemini-powered, generic | Generic content parsing | No AI — manual data | Custom extraction cho Vietnamese tour programs |
| Template selection | Auto-generated design | 10,000+ generic templates | User's own Canva template | 2 company templates (1-day, 2-day) |
| Processing feedback | Loading spinner | "5-10 seconds" timer | Inline generation | Step-by-step indicator (5 steps) |
| Human review before output | No — auto-generate | No — auto-generate | No — direct generate | **Yes** — extraction review + edit (key differentiator) |
| Output format | Google Slides, PPTX | Slides (in-app) | Canva design | Canva editable link |
| Team/multi-user | Team plans (paid) | Team plans (paid) | Yes (Canva native) | Built-in, free for team |
| Job history | No | No | No (manual tracking) | Yes — per-user history với links |
| Error handling | Generic errors | Generic errors | Basic validation | Human-readable với suggested fixes |
| Company-specific rules | No | No | No | **Yes** — Vietnamese greeting, school name, column layout |

**Key insight:** Tất cả competitor tools đều auto-generate output mà không có human review step. Với SileTravel, vì output đi thẳng vào Canva với company branding, **accuracy quan trọng hơn speed** — human review là differentiator thực sự.

---

## Sources

- Canva Connect API documentation (canva.dev/docs/connect) — Programmatic design creation, asset management, export jobs
- Zapier Canva integrations (zapier.com/apps/canva) — Automation patterns: form → upload, sheet → bulk design
- MagicSlides (magicslides.app) — PDF → presentation: Gemini AI, 136+ languages, Google Slides output
- Simplified AI Presentation Maker — 10,000+ templates, 5-10 second generation, text/URL input
- Industry patterns: PDFMonkey, Docupilot, Carbone — document automation SaaS feature sets
- Canva Bulk Create workflow — CSV data → template autofill, up to 500 designs per run

---

*Feature research for: Document-to-Design Automation (SileTravel / SOHA Travel)*
*Researched: 2025-03-22*
