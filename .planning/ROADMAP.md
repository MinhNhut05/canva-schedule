# Roadmap: SileTravel

## Overview

SileTravel v1 is sequenced around the riskiest dependency first, then the strict delivery pipeline that research recommends: parse documents before AI, apply AI extraction plus company rules before Canva, and only add history/admin/polish after the end-to-end reviewed generation flow works. The roadmap keeps scope lean for the internal SOHA Travel team: only 1-day and 2-day tours are included in v1, human review is mandatory before Canva generation, and mobile, bulk upload, 3-4 day tours, and any in-app Canva editor remain out of scope.

## Roadmap Guardrails

- Early go/no-go verification for Canva autofill and Brand Template feasibility is mandatory before production reliance on Canva generation.
- Human review/edit is a hard gate between AI extraction and Canva generation.
- Parsing risk is handled before AI risk; AI/rules risk is handled before Canva integration risk.
- Admin, history, and polish come after the first complete reviewed-to-Canva workflow is working.
- Coverage: 39/39 v1 requirements mapped exactly once.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Capability Gate & Secure Access** - Verify the real Canva autofill path early and establish protected internal access.
- [ ] **Phase 2: Document Intake & Parsing** - Accept supported tour files and produce readable Vietnamese text for downstream use.
- [ ] **Phase 3: Structured AI Extraction, Rules & Human Review** - Turn parsed text into editable, rule-aware itinerary and menu content.
- [ ] **Phase 4: Editable Canva Generation** - Map reviewed content into supported Canva templates and return editable links.
- [ ] **Phase 5: History & Admin Control** - Persist jobs and let authorized users maintain rules and template mappings safely.
- [ ] **Phase 6: Operational Polish & Reliability** - Make the weekly internal workflow clear, resilient, and stable at v1 volume.

## Phase Details

### Phase 1: Capability Gate & Secure Access
**Goal**: Team members can securely access a protected app, and the project has a verified Canva autofill path before downstream work depends on it.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, CANVA-07, SAFE-01
**Success Criteria** (what must be TRUE):
  1. Team member can log in with an assigned internal account and remain signed in across browser refresh until logout or expiry.
  2. Unauthenticated visitors cannot access upload, generation, history, rules, or template pages.
  3. AI and Canva credentials remain server-side and are never exposed in browser code or network calls.
  4. The team can verify whether the target Canva account plus Brand Template setup supports the intended autofill workflow, or record a concrete blocker before Canva-dependent work proceeds.
**Plans**: 3 plans
**Notes/Risks**: Research indicates Canva Pro may be insufficient; Brand Templates and possibly Canva Enterprise may be required. This is a go/no-go phase for the intended Canva autofill path.

Plans:
- [ ] 01-01: Set up internal authentication, session persistence, and route protection.
- [ ] 01-02: Establish server-side secret handling for AI and Canva credentials.
- [ ] 01-03: Verify Canva Brand Template/autofill feasibility with the real account and template setup.

### Phase 2: Document Intake & Parsing
**Goal**: Users can upload supported tour documents and receive readable Vietnamese text or clear guidance when source quality is insufficient.
**Depends on**: Phase 1
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05
**Success Criteria** (what must be TRUE):
  1. User can upload both PDF and DOCX tour program files from the web interface.
  2. Unsupported file types are rejected before processing with a human-readable explanation.
  3. Supported files produce readable Vietnamese text suitable for downstream processing.
  4. When extraction quality is too poor for reliable downstream use, the app tells the user to retry or provide a better source file.
**Plans**: 7 plans
**Notes/Risks**: PITFALLS highlights Vietnamese PDF mangling, scanned PDFs, and DOCX table complexity as early input risks. v1 should detect poor extraction reliably even when full OCR support is not guaranteed. All UI text must be Vietnamese with full diacritics (D-12).

Plans:
- [x] 02-01: Foundation — shadcn/ui init, types, fixtures, Prisma schema (Wave 0)
- [x] 02-02: File validation module and Route Handler with transitional stub (Wave 1)
- [x] 02-03: Sidebar navigation and upload page UI (Wave 1, parallel with 02-02)
- [x] 02-04: Text extractors and normalization — PDF, DOCX, normalize (Wave 2)
- [ ] 02-05: Quality scoring, extraction pipeline, and route integration (Wave 3)
- [ ] 02-06: Extraction result UI and core unit tests (Wave 4)
- [ ] 02-07: Quality scoring tests, e2e tests, and phase gate (Wave 5)

### Phase 3: Structured AI Extraction, Rules & Human Review
**Goal**: Users can convert parsed text into structured, reviewable tour content that follows v1 company rules before any Canva generation happens.
**Depends on**: Phase 2
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, RULE-07, SAFE-02
**Success Criteria** (what must be TRUE):
  1. User can receive a structured itinerary and menu draft from extracted Vietnamese text instead of free-form, unvalidated AI output.
  2. User can review extracted tour content before Canva generation and edit fields inline when corrections are needed.
  3. Missing or uncertain facts are left blank or flagged for review rather than invented by the system.
  4. Reviewed content follows v1 company rules for 1-day and 2-day layouts, audience greeting, school-name integrity, return-to-school wording, and separate menu generation.
  5. Only schema-valid AI output is allowed to continue into downstream rules processing and Canva payload construction.
**Plans**: 3 plans
**Notes/Risks**: Human review is mandatory in this phase because research identified hallucination as a core risk. Keep v1 intentionally lean: no 3-day or 4-day support.

Plans:
- [ ] 03-01: Integrate structured AI extraction with schema validation.
- [ ] 03-02: Build the review and inline edit step as a hard gate before generation.
- [ ] 03-03: Implement the company rules layer for itinerary and menu preparation.

### Phase 4: Editable Canva Generation
**Goal**: Users can generate editable Canva outputs from reviewed content using the supported template sets for v1 tours.
**Depends on**: Phase 3
**Requirements**: CANVA-01, CANVA-02, CANVA-03, CANVA-04, CANVA-05, CANVA-06, UX-03, UX-04, SAFE-03
**Success Criteria** (what must be TRUE):
  1. User can clearly choose and confirm the active Canva template set for the current 1-day or 2-day tour.
  2. Reviewed itinerary and menu content is mapped into two separate Canva templates without relying on hardcoded template identifiers in business logic.
  3. Canva generation completes through the required asynchronous job flow and returns editable output rather than static-only assets.
  4. User can open or copy the resulting Canva link or links directly from the app.
  5. Normal Canva token expiry or authorization refresh is handled without repeated manual intervention during routine use.
**Plans**: 3 plans
**Notes/Risks**: This phase only proceeds on the production path validated in Phase 1. Treat Canva integration as an adapter so the output layer can change if account capability constraints surface.

Plans:
- [ ] 04-01: Define externalized template mappings for supported v1 tour types.
- [ ] 04-02: Implement Canva async generation, polling, and token lifecycle handling.
- [ ] 04-03: Ship the reviewed-content-to-editable-link flow end to end.

### Phase 5: History & Admin Control
**Goal**: The team can revisit previous generation jobs, and authorized users can maintain templates and formatting rules without code changes.
**Depends on**: Phase 4
**Requirements**: HIST-01, HIST-02, ADMIN-01, ADMIN-02
**Success Criteria** (what must be TRUE):
  1. Logged-in user can view previous generation jobs with file name, timestamp, status, and resulting Canva link or links.
  2. Logged-in user can reopen prior Canva outputs from history without regenerating the tour.
  3. Authorized users can manage Canva template mappings for the supported v1 tour types from the app.
  4. Company formatting rules are stored in a maintainable way so they can evolve without rewriting the whole pipeline.
**Plans**: 2 plans
**Notes/Risks**: This work is intentionally sequenced after the first working reviewed-to-Canva flow so v1 stays lean and validation happens on the core workflow first.

Plans:
- [ ] 05-01: Persist generation history and expose per-user job retrieval.
- [ ] 05-02: Add admin management for template mappings and maintainable company rules.

### Phase 6: Operational Polish & Reliability
**Goal**: The internal weekly workflow is understandable, failure-tolerant, and stable enough for routine v1 use.
**Depends on**: Phase 5
**Requirements**: UX-01, UX-02, SAFE-04
**Success Criteria** (what must be TRUE):
  1. User can see clear progress across the major steps: upload, extract, review, generate, and done.
  2. When parsing, AI extraction, or Canva generation fails, the app shows a human-readable error that helps the user recover.
  3. The app can handle normal weekly volume of about 10 tours without frequent rate-limit or concurrency failures.
**Plans**: 2 plans
**Notes/Risks**: This phase hardens the workflow after core value is proven. It does not expand scope into bulk upload, mobile, or in-app Canva editing.

Plans:
- [ ] 06-01: Add end-to-end step feedback and clearer recovery-oriented error UX.
- [ ] 06-02: Harden the pipeline for routine volume, backoff, and external API limits.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Capability Gate & Secure Access | 0/3 | Not started | - |
| 2. Document Intake & Parsing | 3/7 | In Progress | 2026-03-24 |
| 3. Structured AI Extraction, Rules & Human Review | 0/3 | Not started | - |
| 4. Editable Canva Generation | 0/3 | Not started | - |
| 5. History & Admin Control | 0/2 | Not started | - |
| 6. Operational Polish & Reliability | 0/2 | Not started | - |

## Recommended Next Command

`/gsd:plan-phase 1`
