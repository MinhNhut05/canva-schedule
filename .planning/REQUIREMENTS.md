# Requirements: SileTravel

**Defined:** 2026-03-22
**Core Value:** Team members can transform a detailed tour program into a professional, condensed Canva design in seconds — instead of manually reading, summarizing, and re-typing into Canva.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: Team member can log in to the web app with an assigned internal account
- [ ] **AUTH-02**: User session persists across browser refresh until logout or expiry
- [ ] **AUTH-03**: Unauthenticated users cannot access upload, generation, history, rules, or template pages

### Document Intake

- [x] **DOC-01**: User can upload a PDF tour program file from the web interface
- [x] **DOC-02**: User can upload a DOCX tour program file from the web interface
- [x] **DOC-03**: System validates file type before processing and rejects unsupported formats with a human-readable error
- [x] **DOC-04**: System extracts readable Vietnamese text from supported PDF/DOCX inputs for downstream processing
- [x] **DOC-05**: System detects low-quality or unreadable extraction and informs the user when manual retry or better source file is needed

### AI Extraction & Review

- [x] **AI-01**: System sends extracted document text to the configured external AI API for structured itinerary extraction
- [x] **AI-02**: AI extraction returns a structured result suitable for itinerary and menu generation, not free-form unvalidated text
- [x] **AI-03**: User can review extracted content before Canva generation
- [x] **AI-04**: User can edit extracted fields inline before final generation
- [x] **AI-05**: System does not invent missing tour facts when source text is incomplete; uncertain fields are left blank or flagged for review

### Tour Layout Rules

- [x] **RULE-01**: For 1-day tours, itinerary output is organized into 2 columns: Buổi sáng and Buổi chiều
- [x] **RULE-02**: For 2-day tours, itinerary output is organized into 2 columns: Ngày 1 and Ngày 2
- [x] **RULE-03**: For school tours (tiểu học, THCS, THPT), greeting uses the school audience wording "Quý thầy cô và các bạn học sinh"
- [x] **RULE-04**: For business or group tours, greeting uses business audience wording such as "Quý khách" or "Quý đoàn"
- [x] **RULE-05**: School name must stay logically intact and not be split into separate broken lines in generated content preparation
- [x] **RULE-06**: Phrases about returning to school must include the specific school name when the source document indicates a school-based tour
- [x] **RULE-07**: Menu content is generated separately from itinerary content and follows the selected template structure for 1-day or 2-day tours

### Canva Generation

- [ ] **CANVA-01**: User can select the appropriate Canva template set for the current tour type
- [ ] **CANVA-02**: System maps reviewed content into 2 separate Canva templates per tour: Itinerary and Menu
- [ ] **CANVA-03**: System creates editable Canva outputs rather than static-only assets
- [ ] **CANVA-04**: System returns at least one editable Canva link for the generated design outputs
- [ ] **CANVA-05**: Canva integration handles asynchronous job completion and reports failure clearly when generation does not succeed
- [ ] **CANVA-06**: Template identifiers and mappings are managed outside hardcoded business logic so template changes can be updated safely
- [ ] **CANVA-07**: Canva plan/template capability is verified before production reliance on autofill workflow

### UX & Feedback

- [ ] **UX-01**: User sees processing progress across major steps such as upload, extract, review, generate, and done
- [ ] **UX-02**: User receives human-readable error messages when parsing, AI extraction, or Canva generation fails
- [ ] **UX-03**: User can copy or open the generated Canva link directly from the app
- [ ] **UX-04**: User can clearly see which template type is being used for the current generation

### History & Admin

- [ ] **HIST-01**: System stores past generation jobs with file name, timestamp, status, and resulting Canva link(s)
- [ ] **HIST-02**: Logged-in user can revisit previous jobs and reopen generated Canva links
- [ ] **ADMIN-01**: Admin or authorized user can manage Canva template mappings for supported tour types
- [ ] **ADMIN-02**: System stores company formatting rules in a maintainable way so they can evolve without rewriting the entire pipeline

### Reliability & Safety

- [ ] **SAFE-01**: External AI API credentials and Canva credentials are stored server-side and never exposed to the browser
- [x] **SAFE-02**: AI output is validated before being used in rules processing or Canva payload construction
- [ ] **SAFE-03**: System handles Canva token expiry or authorization refresh without requiring repeated manual intervention during normal operation
- [ ] **SAFE-04**: System avoids immediate failure under normal weekly volume (~10 tours/week) and respects Canva/API rate limits at this scale

## v2 Requirements

### Expanded Tour Support

- **EXP-01**: System supports 3-day tours with appropriate template layout
- **EXP-02**: System supports 4-day tours with appropriate template layout
- **EXP-03**: System can auto-detect likely tour duration from document content before user confirmation

### Smarter Validation

- **VAL-01**: System automatically flags missing school name, ambiguous greeting, or mismatched day structure before Canva generation
- **VAL-02**: System verifies critical extracted facts against source text for high-risk fields
- **VAL-03**: User can retry Canva generation from previously reviewed data without re-uploading the file

### Team Management

- **TEAM-01**: Manager can view all team generation jobs across users
- **TEAM-02**: Admin can manage more granular rule sets by customer segment or template family

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first internal tool is sufficient for current team workflow |
| Real-time collaborative editing inside the app | Canva already provides collaboration after link generation |
| In-app Canva editor or embedded design canvas | High complexity and constrained by Canva platform capabilities |
| Automatic sending via email/Zalo/CRM | Not core to document-to-Canva generation workflow |
| Bulk multi-file upload queue in v1 | Not necessary for current weekly volume and increases failure complexity |
| Custom template builder inside the app | Canva remains the source of truth for template design |
| Guaranteed support for scanned/image-only PDFs in v1 | OCR may be added selectively after validating input quality frequency |
| 3-day and 4-day layouts in v1 | Explicitly deferred until 1-day and 2-day flows are validated |
| Static PDF export as the primary deliverable | Main value is editable Canva output |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| DOC-01 | Phase 2 | Complete |
| DOC-02 | Phase 2 | Complete |
| DOC-03 | Phase 2 | Complete |
| DOC-04 | Phase 2 | Complete |
| DOC-05 | Phase 2 | Complete |
| AI-01 | Phase 3 | Complete |
| AI-02 | Phase 3 | Complete |
| AI-03 | Phase 3 | Complete |
| AI-04 | Phase 3 | Complete |
| AI-05 | Phase 3 | Complete |
| RULE-01 | Phase 3 | Complete |
| RULE-02 | Phase 3 | Complete |
| RULE-03 | Phase 3 | Complete |
| RULE-04 | Phase 3 | Complete |
| RULE-05 | Phase 3 | Complete |
| RULE-06 | Phase 3 | Complete |
| RULE-07 | Phase 3 | Complete |
| CANVA-01 | Phase 4 | Pending |
| CANVA-02 | Phase 4 | Pending |
| CANVA-03 | Phase 4 | Pending |
| CANVA-04 | Phase 4 | Pending |
| CANVA-05 | Phase 4 | Pending |
| CANVA-06 | Phase 4 | Pending |
| CANVA-07 | Phase 1 | Pending |
| UX-01 | Phase 6 | Pending |
| UX-02 | Phase 6 | Pending |
| UX-03 | Phase 4 | Pending |
| UX-04 | Phase 4 | Pending |
| HIST-01 | Phase 5 | Pending |
| HIST-02 | Phase 5 | Pending |
| ADMIN-01 | Phase 5 | Pending |
| ADMIN-02 | Phase 5 | Pending |
| SAFE-01 | Phase 1 | Pending |
| SAFE-02 | Phase 3 | Complete |
| SAFE-03 | Phase 4 | Pending |
| SAFE-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after roadmap creation*
