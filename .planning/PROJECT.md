# SileTravel

## What This Is

SileTravel is an internal web app for SOHA Travel's team that automatically converts detailed tour program documents (PDF/DOCX) into condensed, branded Canva designs. Users upload a tour file, the system uses AI to extract and summarize the itinerary following company-specific rules, then auto-fills pre-made Canva templates (Itinerary + Menu) and returns editable Canva links.

## Core Value

Team members can transform a detailed tour program into a professional, condensed Canva design in seconds — instead of manually reading, summarizing, and re-typing into Canva.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Upload PDF/DOCX tour program files via web interface
- [ ] AI-powered extraction and summarization of tour content
- [ ] Automatic filling of Canva templates via Canva Connect API
- [ ] Support for 1-day tours (Morning/Afternoon columns)
- [ ] Support for 2-day tours (Day 1/Day 2 columns)
- [ ] Separate Canva templates for Itinerary and Menu (2 templates per tour)
- [ ] Return editable Canva links after generation
- [ ] Company-specific formatting rules engine
- [ ] Multi-user access for SOHA Travel team (~10 tours/week)

### Out of Scope

- 3-4 day tour templates — deferred to future update
- Mobile app — web-first
- Automatic PDF export from Canva — users edit in Canva directly
- Real-time collaboration features — Canva handles this natively

## Context

**Company:** SOHA Travel — tour operator in Vietnam
**Users:** Internal team members who prepare tour programs for clients
**Current workflow:** Manually read detailed tour documents (3-4 pages) → manually create condensed Canva designs (2 pages: itinerary + menu) → share with clients/schools
**Pain point:** Repetitive manual work ~10 times/week, error-prone, time-consuming

**Company formatting rules:**
1. **Audience greeting based on client type:**
   - Schools (Tieu hoc, THCS, THPT) → "Quy thay co va cac ban hoc sinh"
   - Businesses/groups → "Quy khach" or "Quy doan"
2. **School name must stay on one line** — never break "Truong cao dang ABC" across two lines
3. **"Return to school" must specify school name** — e.g., "ve tro lai Truong THPT Cai Nuoc" (not just "ve tro lai truong")
4. **Column layout based on duration:**
   - 1-day tour: Column 1 = Buoi sang, Column 2 = Buoi chieu
   - 2-day tour: Column 1 = Ngay 1, Column 2 = Ngay 2
5. **Menu page layout mirrors itinerary structure:**
   - 1-day tour: Bua sang / Bua trua / Bua chieu
   - 2-day tour: Menu Ngay 1 / Menu Ngay 2

**Canva setup:**
- User has Canva Pro account
- Pre-made templates exist for each tour duration (1-day, 2-day)
- 2 separate templates per tour: Itinerary template + Menu template
- Templates have placeholder text fields that the API will populate

**AI Integration:**
- External AI API (URL + API key to be provided later)
- AI reads full tour document → extracts key info → formats according to company rules
- AI handles Vietnamese text processing

**Sample files reviewed:**
- Input: H1903 HUONG NGHIEP - THPT CAI NUOC (4-page detailed program, 2-day tour)
- Output: THPT CAI NUOC chuong trinh rut gon (2-page Canva design: itinerary + menu)
- Input: A2401 THCS AN THANH TAY (3-page detailed program, 1-day tour)
- Output: Condensed 1-day layout (Morning/Afternoon + Menu)

## Constraints

- **Tech stack**: Next.js (frontend + API routes), TypeScript — per user's preferred stack
- **AI dependency**: Requires external AI API — URL and key provided later
- **Canva API**: Requires Canva Connect API access — user has Canva Pro
- **Language**: All tour content in Vietnamese — AI must handle Vietnamese text correctly
- **Templates**: User provides pre-made Canva template links — system fills in content, does not create designs from scratch

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Canva Connect API for template filling | User wants editable Canva links, not static images | — Pending |
| AI-powered extraction over rule-based parsing | Tour documents vary in format; AI handles flexibility better | — Pending |
| Web app over CLI | Team of multiple users needs simple UI | — Pending |
| 2 separate Canva templates per tour (Itinerary + Menu) | Matches existing workflow and template structure | — Pending |
| Start with 1-day and 2-day tours only | Most common tour types; 3-4 day support added later | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2025-03-22 after initialization*
