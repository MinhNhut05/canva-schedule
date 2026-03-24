# Phase 3: Structured AI Extraction, Rules & Human Review - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 03-structured-ai-extraction-rules-human-review
**Areas discussed:** AI extraction flow, Review & Edit UI, Company rules logic, Tour type detection

---

## AI Extraction Flow

### AI Provider

| Option | Description | Selected |
|--------|-------------|----------|
| OpenAI | Dung OpenAI API (GPT-4o, GPT-4o-mini...) | |
| Anthropic | Dung Anthropic API (Claude Sonnet, Haiku...) | |
| Provider khac | Dung API khac (Google Gemini, Groq, OpenRouter, self-hosted...) | |

**User's choice:** OpenAI-compatible gateway (pikaai.xyz) — provided full env config with base URL, API key, and available models (gpt-5-mini, gpt-5.4, claude-sonnet-4.6, claude-opus-4.6)
**Notes:** User provided actual credentials and model list. Gateway uses OpenAI SDK format with custom baseURL.

### AI Output Format

| Option | Description | Selected |
|--------|-------------|----------|
| Structured JSON schema | AI tra ve JSON theo schema dinh san voi Zod validation | ✓ |
| Plain text + server parse | AI tra plain text, server parse ra cac field | |

**User's choice:** Structured JSON schema
**Notes:** None

### Fail Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Auto retry 2 lan | Goi lai AI toi da 2 lan khi loi/timeout | ✓ |
| Khong retry, user tu thu lai | Khong retry — loi la bao user ngay | |
| Ban quyet dinh | Claude tuy chon cach handle | |

**User's choice:** Auto retry 2 lan
**Notes:** None

### Model Selection

| Option | Description | Selected |
|--------|-------------|----------|
| gpt-5-mini (default) | Tiet kiem, nhanh | |
| gpt-5.4 | Manh hon, tot hon cho Vietnamese | ✓ |
| claude-sonnet-4.6 | Claude model | |
| Cho user chon | User chon model tren UI | |

**User's choice:** gpt-5.4
**Notes:** Strong model for accurate Vietnamese tour document extraction

### Uncertain Data

| Option | Description | Selected |
|--------|-------------|----------|
| De trong + flag review | Field khong ro → de trong, danh dau flag | ✓ |
| AI doan + flag | Field khong ro → AI doan best guess, danh dau | |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** De trong + flag review
**Notes:** Aligns with requirement AI-05 — system does not invent missing facts

### Prompt Style

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded prompt | Prompt co dinh trong code | ✓ |
| Configurable prompt | Prompt luu trong DB/file, admin co the sua | |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** Hardcoded prompt
**Notes:** Simple for v1

---

## Review & Edit UI

### Layout

| Option | Description | Selected |
|--------|-------------|----------|
| 2 cot song song | Itinerary ben trai, Menu ben phai | ✓ |
| Tabs (Itinerary / Menu) | Tab 1: Itinerary, Tab 2: Menu | |
| Single column scroll | Itinerary truoc, scroll xuong Menu | |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** 2 cot song song
**Notes:** User can see both Itinerary and Menu simultaneously

### Edit Style

| Option | Description | Selected |
|--------|-------------|----------|
| Inline edit (click to edit) | Bam vao text de sua truc tiep | ✓ |
| Form rieng | Mot form rieng voi cac input field | |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** Inline edit (click to edit)
**Notes:** Fast and intuitive

### Flagged Fields UI

| Option | Description | Selected |
|--------|-------------|----------|
| Highlight vang + icon | Vien vang/cam + icon canh bao | ✓ |
| Badge text | Badge nho goc field ghi "Can kiem tra" | |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** Highlight vang + icon
**Notes:** Visual and clear

### Approve Flow

| Option | Description | Selected |
|--------|-------------|----------|
| 1 nut approve chung | 1 nut "Xac nhan & tiep tuc" | ✓ |
| Approve tung cot | Moi cot co nut approve rieng | |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** 1 nut approve chung
**Notes:** User wants v1 to be complete and usable. Single approve for simplicity.

### Re-extract

| Option | Description | Selected |
|--------|-------------|----------|
| Co nut re-extract | Nut "Trich xuat lai" de goi AI lan nua | ✓ |
| Khong — upload lai | Phai upload lai tu dau | |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** Co nut re-extract
**Notes:** None

### Upload-to-Review Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Auto: upload → AI → review | Tu dong goi AI ngay sau extract text | ✓ |
| Manual: user bam nut goi AI | User bam nut de goi AI | |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** Auto: upload → AI → review
**Notes:** Seamless flow

### Review Page Location

| Option | Description | Selected |
|--------|-------------|----------|
| Trang rieng /review/:id | Co URL, bookmark duoc | ✓ |
| Cung trang upload | Hien thi step-by-step | |

**User's choice:** Trang rieng /review/:id
**Notes:** Has own URL, user can return to it

### Schema Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Full fields cho v1 | Tieu de, khach hang, ngay, so ngay, cac buoi, menu, loi chao, dia diem don/tra | ✓ |
| Minimal fields | Chi cac fields toi thieu | |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** Full fields cho v1
**Notes:** Complete v1 with all necessary fields

---

## Company Rules Logic

### Rules Application

| Option | Description | Selected |
|--------|-------------|----------|
| Trong prompt AI | Rules nam trong prompt AI | |
| Post-processing sau AI | Code server ap dung rules len ket qua AI | |
| Ca hai (AI + server verify) | AI biet rules + server verify lai | ✓ |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** Ca hai (AI + server verify)
**Notes:** Most reliable approach — dual layer

### Rule Violation Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-fix + flag | Tu sua luon neu biet chac, flag neu khong chac | ✓ |
| Chi flag, user sua | Chi flag cho user tat ca violations | |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** Auto-fix + flag
**Notes:** None

### Rule Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded trong code | Rules dinh nghia trong code | |
| Trong DB (admin quan ly) | Rules luu DB, admin sua tren UI | ✓ |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** Trong DB (admin quan ly)
**Notes:** Prepares for Phase 5 admin management UI. V1 seeds rules via migration.

---

## Tour Type Detection

### Tour Duration Detection

| Option | Description | Selected |
|--------|-------------|----------|
| AI detect → user confirm | AI doc van ban va xac dinh 1-day/2-day, user confirm | ✓ |
| User chon truoc | User chon loai tour truoc khi goi AI | |
| AI tu dong 100% | AI tu quyet dinh, khong can confirm | |

**User's choice:** AI detect → user confirm
**Notes:** None

### Client Type Detection

| Option | Description | Selected |
|--------|-------------|----------|
| AI detect → user confirm | AI detect tu van ban, user confirm | ✓ |
| User chon manual | User chon: Truong hoc / Doanh nghiep / Doan khach | |
| Ban quyet dinh | Claude tuy chon | |

**User's choice:** AI detect → user confirm
**Notes:** None

---

## Claude's Discretion

- Exact Zod schema structure and field naming
- Exact prompt engineering approach
- OpenAI SDK configuration details
- Database schema for rules storage
- Loading/progress UI during AI extraction
- Error state UI design
- Exact inline edit component implementation
- Review page responsive behavior

## Deferred Ideas

None — discussion stayed within phase scope
