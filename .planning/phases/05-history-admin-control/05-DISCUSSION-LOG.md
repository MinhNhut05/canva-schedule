# Phase 5: History & Admin Control - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 05-history-admin-control
**Areas discussed:** History page, Admin access model, Rule management, Template mapping

---

## History Page

### Layout Style

| Option | Description | Selected |
|--------|-------------|----------|
| Table layout | Moi hang 1 job voi cot: Ten file, Ngay, Trang thai, Canva links — gon, nhin nhanh | :heavy_check_mark: |
| Card layout | Moi card 1 job voi day du info — de nhin hon nhung ton khong gian | |
| Claude decides | Ban quyet dinh layout phu hop nhat voi data dang co | |

**User's choice:** Table layout
**Notes:** Recommended option selected — clean, scannable for ~10 tours/week

### Information Density

| Option | Description | Selected |
|--------|-------------|----------|
| Essential info | Ten file, ngay tao, trang thai, loai tour — du cho doi ngu ~10 tour/tuan | :heavy_check_mark: |
| Detailed info | Them cot: user tao, AI model, thoi gian xu ly, so lan tao lai | |
| Minimal info | Chi ten file + ngay + link Canva — toi thieu nhat | |

**User's choice:** Essential info
**Notes:** Sufficient for team's needs without cluttering the table

### Click Action

| Option | Description | Selected |
|--------|-------------|----------|
| Go to review page | Click vao row → mo /review/[id] da co san voi Canva links va reviewed content | :heavy_check_mark: |
| Expand in-table | Click vao row → expand row hien them chi tiet + Canva links ngay trong table | |
| Links inline only | Chi show Canva link buttons truc tiep tren moi row | |

**User's choice:** Go to review page
**Notes:** Reuses existing page — no new page needed, Canva links already displayed there

### Sort/Filter

| Option | Description | Selected |
|--------|-------------|----------|
| Simple chronological | Moi nhat len truoc, khong can filter — voi ~10 tour/tuan khong can phuc tap | :heavy_check_mark: |
| Add status filter | Them loc theo trang thai va loai tour | |
| Full sort/filter/search | Full: sap xep + search + loc trang thai | |

**User's choice:** Simple chronological
**Notes:** Volume too low to justify complex filtering

### Job Visibility Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Own jobs only | Moi user chi thay jobs cua minh tao ra | |
| All team jobs | Tat ca user thay het jobs cua ca team | :heavy_check_mark: |
| Own + admin sees all | Mac dinh thay cua minh, admin thay het | |

**User's choice:** All team jobs
**Notes:** Small team, no need to hide jobs between members

### Pagination

| Option | Description | Selected |
|--------|-------------|----------|
| Load more scroll | Bat dau load 20 jobs, scroll xuong load them | |
| Page pagination | Hien 20 jobs/trang voi pagination buttons ben duoi | :heavy_check_mark: |
| Load all at once | Load het mot lan | |

**User's choice:** Page pagination
**Notes:** 20 items per page with pagination buttons

### Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Message + CTA | Message + nut 'Tai tai lieu' dan den /upload | :heavy_check_mark: |
| Simple text only | Chi dong text 'Chua co lich su' | |
| Claude decides | Claude quyet dinh | |

**User's choice:** Message + CTA
**Notes:** Guides user to start their first upload

---

## Admin Access Model

### Role Model

| Option | Description | Selected |
|--------|-------------|----------|
| Simple role field | Them cot role vao User: 'admin' hoac 'member' | :heavy_check_mark: |
| All users = admin | Tat ca user deu co quyen admin | |
| Permission-based | Bang Permission rieng voi cac quyen chi tiet | |

**User's choice:** Simple role field
**Notes:** Sufficient for small internal team

### Admin Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar section | Them muc 'Quan ly' trong sidebar voi sub-items: Rules, Templates. Chi hien khi user la admin | :heavy_check_mark: |
| Under Settings | Gop vao trang 'Cai dat' da co trong sidebar | |
| Separate admin area | Trang rieng /admin voi navigation rieng biet | |

**User's choice:** Sidebar section
**Notes:** Integrated into existing sidebar, conditionally shown

### Non-Admin Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Hide completely | Khong hien muc 'Quan ly' trong sidebar cho user thuong | :heavy_check_mark: |
| Show disabled | Hien muc nhung disabled (greyed out) | |
| Show + error | Hien binh thuong, bao loi khi click vao | |

**User's choice:** Hide completely
**Notes:** Clean UX — users don't see what they can't access

### Default Role

| Option | Description | Selected |
|--------|-------------|----------|
| Default member | User moi la 'member', chi admin hien tai moi doi role qua DB | :heavy_check_mark: |
| Default admin | User moi deu la admin | |
| Admin manages roles | Admin co the set role cho user khac tu admin UI | |

**User's choice:** Default member
**Notes:** Role management via DB/seed only in v1

---

## Rule Management

### Edit Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle + edit text | Toggle on/off + sua name va description. Khong xoa hoac tao rule moi | |
| Full CRUD | Full CRUD: tao rule moi, sua, xoa | :heavy_check_mark: |
| Toggle only | Chi toggle on/off — tat/bat rule, khong sua text | |

**User's choice:** Full CRUD
**Notes:** User wants full flexibility to add custom rules

### New Rule Enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Metadata-only rules | Rule moi chi la metadata (ten, mo ta, category) de tracking. Enforcement van can developer code | :heavy_check_mark: |
| Config-driven rules | Rule moi co the config kem logic don gian (regex match, keyword check) | |
| Claude decides | Claude quyet dinh | |

**User's choice:** Metadata-only rules
**Notes:** New rules are for documentation/tracking — enforcement requires code changes

### Rule UI

| Option | Description | Selected |
|--------|-------------|----------|
| Table + click edit | Table danh sach voi cot: Rule ID, Ten, Category, Active toggle. Click row de edit | :heavy_check_mark: |
| Card list | Danh sach cards, moi card 1 rule voi edit button | |
| Inline edit | Edit inline ngay tren table row | |

**User's choice:** Table + click edit
**Notes:** Consistent with History table pattern

### Delete Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Soft delete only | Soft delete — danh dau isActive = false, khong xoa khoi DB. 7 rules goc khong duoc xoa | :heavy_check_mark: |
| Hard delete | Hard delete + confirmation dialog. 7 rules goc khong duoc xoa | |
| Claude decides | Claude quyet dinh | |

**User's choice:** Soft delete only
**Notes:** Safe approach — no data loss, original 7 rules protected

---

## Template Mapping

### Storage Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Move to DB | Migrate sang DB (Prisma model moi). Admin sua trong UI, khong can restart server | :heavy_check_mark: |
| Keep in env vars | Giu o env vars, admin UI chi hien gia tri hien tai (read-only) | |
| DB + env fallback | DB nhung fallback ve env vars neu DB chua co data | |

**User's choice:** Move to DB
**Notes:** Primary motivation for Phase 5 admin control

### Template UI

| Option | Description | Selected |
|--------|-------------|----------|
| Table + click edit | Table voi cot: Loai tour, Loai template, Canva ID, Status. Click de edit | :heavy_check_mark: |
| Grid cards | 2x2 grid cards cho 4 templates | |
| Simple form | Form don gian voi 4 input fields | |

**User's choice:** Table + click edit
**Notes:** Consistent with Rules and History table pattern

### Template Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Format check only | Chi kiem tra format hop le (non-empty string) | |
| Verify via Canva API | Goi Canva API kiem tra template ID co ton tai va accessible khong truoc khi luu | :heavy_check_mark: |
| Claude decides | Claude quyet dinh | |

**User's choice:** Verify via Canva API
**Notes:** Prevents broken generation from invalid template references

### Field Mapping Editability

| Option | Description | Selected |
|--------|-------------|----------|
| Field map in code | Khong — giu field mapping trong code nhu Phase 4 da lam | |
| Field map in admin UI | Co — admin co the sua field mapping tu UI | :heavy_check_mark: |
| Claude decides | Claude quyet dinh | |

**User's choice:** Field map in admin UI
**Notes:** Important for when Canva template text element names change

### Field Mapping UI Style

| Option | Description | Selected |
|--------|-------------|----------|
| Two-column mapping | Bang 2 cot: Draft field (doc tu Zod schema, khong sua) ↔ Canva element name (admin nhap) | :heavy_check_mark: |
| JSON editor | Admin sua JSON mapping truc tiep | |
| Claude decides | Claude quyet dinh | |

**User's choice:** Two-column mapping
**Notes:** Visual, intuitive interface for non-technical admin users

---

## Claude's Discretion

- Table component implementation (shadcn/ui table or custom)
- Pagination component design and styling
- Edit form/modal design for rules and templates
- Canva API verification implementation details
- Field mapping storage format in DB (JSON column)
- Loading and error states for admin pages
- Exact Vietnamese text for UI labels and messages
- Prisma schema for new CanvaTemplate model
- Migration strategy from env vars to DB

## Deferred Ideas

None — discussion stayed within phase scope
