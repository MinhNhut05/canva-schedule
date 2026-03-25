# Phase 5: History & Admin Control - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Persist generation jobs and let authorized users maintain templates and formatting rules without code changes. Users can view previous generation jobs with key metadata and reopen Canva outputs from history. Admin users can manage Canva template mappings (including field mappings) and company formatting rules from the app. This phase delivers: history listing page, role-based access control, rule CRUD admin UI, template mapping admin UI with Canva API verification, and sidebar navigation updates. It does NOT include end-to-end progress indicators, error UX improvements, or volume hardening — those are Phase 6.

</domain>

<decisions>
## Implementation Decisions

### History Page
- **D-01:** Table layout displaying jobs chronologically (newest first). Each row shows: file name, creation date, status (success/error), tour type (1-day/2-day), and Canva link status.
- **D-02:** Click on a row navigates to `/review/[id]` — reuses the existing review page which already shows reviewed content and Canva links. No separate detail page needed.
- **D-03:** All team members see all jobs from the entire team (not scoped per-user). This matches the small internal team workflow (~10 users).
- **D-04:** Page pagination with 20 items per page. Pagination buttons at the bottom of the table.
- **D-05:** No filtering or search in v1 — simple chronological sort is sufficient for ~40-50 jobs/month volume.
- **D-06:** Empty state: friendly Vietnamese message + "Tai tai lieu" CTA button linking to `/upload`.
- **D-07:** Route: `/history` — enable the existing disabled "Lich su" sidebar item.

### Admin Access Model
- **D-08:** Simple `role` field on User model: `'admin'` or `'member'`. No separate permissions table.
- **D-09:** Default role for new users: `member`. Admin role is assigned via DB seed or direct DB update — no admin UI for role management in v1.
- **D-10:** Admin-only sidebar section "Quan ly" with sub-items: "Quy tac" (Rules) and "Mau Canva" (Templates). Only visible when user role is admin — completely hidden for members.
- **D-11:** Server-side route protection: admin pages return 403 or redirect for non-admin users. Client-side hiding is not sufficient as the only guard.

### Rule Management (Admin)
- **D-12:** Full CRUD on CompanyRule model. Admin can create new rules, edit existing rules, and soft-delete rules (set `isActive = false`). Hard delete is not allowed.
- **D-13:** New rules created by admin are metadata-only — they store name, description, and category but do NOT auto-enforce. Enforcement requires developer code changes. This is acceptable for v1 because the team understands rule enforcement is code-driven.
- **D-14:** The 7 original seeded rules (RULE-01 through RULE-07) cannot be deleted but can be toggled off or have their text edited.
- **D-15:** UI: Table layout with columns: Rule ID, Name, Category, Active toggle. Click row to open edit form (modal or inline).
- **D-16:** Route: `/admin/rules`

### Template Mapping (Admin)
- **D-17:** Migrate template IDs from environment variables to database. New Prisma model `CanvaTemplate` (or similar) stores: tour type, artifact type, Canva template ID, field mappings, and active status.
- **D-18:** DB-first with env var fallback removed — once migrated, templates are managed exclusively through admin UI.
- **D-19:** When admin saves a new template ID, the system calls Canva API to verify the template exists and is accessible before persisting. Show Vietnamese error if verification fails.
- **D-20:** Field mapping is editable from admin UI. Two-column mapping interface: left column shows structuredDraft field names (read from Zod schema, not editable), right column shows corresponding Canva text element names (editable by admin). This allows admin to reconfigure mappings when Canva templates change.
- **D-21:** UI: Table layout with columns: Tour Type (1-day/2-day), Artifact Type (Itinerary/Menu), Canva Template ID, Status. Click row to edit template ID and field mappings.
- **D-22:** Route: `/admin/templates`

### Claude's Discretion
- Exact Prisma schema for CanvaTemplate model (field names, relations)
- Migration strategy from env vars to DB (seed script approach)
- Table component implementation (reuse shadcn/ui table or custom)
- Pagination component design
- Edit form/modal design for rules and templates
- Canva API verification implementation details
- Field mapping storage format in DB (JSON column approach)
- Loading and error states for admin pages
- Vietnamese text for all UI labels and messages

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Project overview, company formatting rules, Canva setup, team context
- `.planning/REQUIREMENTS.md` — HIST-01, HIST-02, ADMIN-01, ADMIN-02 requirement definitions
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, dependency on Phase 4

### Prior phase decisions
- `.planning/phases/03-structured-ai-extraction-rules-human-review/03-CONTEXT.md` — D-16: Rules stored in DB for Phase 5 admin, D-14: dual-layer rules enforcement, D-20: structuredDraft Zod schema
- `.planning/phases/04-editable-canva-generation/04-CONTEXT.md` — D-03: Template IDs in env vars (migrate to DB), D-04: field-map manifest, D-07: copy template + populate flow, D-24: Canva links persist on review page

### Codebase patterns (established in Phase 1-4)
- `prisma/schema.prisma` — Current schema with User, Upload, CanvaToken, CanvaArtifact, CompanyRule models
- `src/lib/rules/seed.ts` — CompanyRule seed data (7 rules with ruleId, name, description, category)
- `src/lib/env.ts` — Current env schema with CANVA_TEMPLATE_* vars (to be migrated)
- `src/lib/ai/extraction-schema.ts` — structuredDraft Zod schema (source of field names for mapping UI)
- `src/lib/canva/adapter.ts` — Canva adapter with template resolution logic (must be updated for DB-based templates)
- `src/components/app-sidebar.tsx` — Sidebar with disabled "Lich su" and "Cai dat" items (update for history + admin nav)
- `src/components/review/review-page.tsx` — Review page that history rows link to
- `src/app/(app)/review/[id]/page.tsx` — Review page server component (history click target)
- `src/lib/canva/oauth.ts` — Canva OAuth/token handling (needed for template verification API calls)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CompanyRule` Prisma model: Already has ruleId, name, description, category, isActive, config (JSON) — ready for admin CRUD
- `CanvaArtifact` model: Tracks generated Canva designs per upload with status, designId — data source for history
- `Upload` model: Has userId, originalFileName, createdAt, status, tourDuration, clientType, approvedAt — all needed for history table
- `src/components/ui/` — card, button, input, badge, alert, alert-dialog, textarea, separator — reusable for admin forms
- `src/lib/canva/oauth.ts` — Token handling for Canva API calls (reuse for template verification)
- `src/lib/db.ts` — Prisma client singleton

### Established Patterns
- Next.js 15 App Router with route groups: `(auth)` for login, `(app)` for protected pages
- Server Actions for mutations
- Prisma ORM with status-tracking pattern (PENDING → PROCESSING → COMPLETED/FAILED)
- Tailwind CSS + shadcn/ui for styling
- Vietnamese UI text throughout
- Sidebar nav with primary (enabled) and secondary (disabled placeholder) items

### Integration Points
- Sidebar: Enable "Lich su" → `/history`, add "Quan ly" section with Rules + Templates for admin users
- User model: Add `role` field with default `'member'`
- Template resolution in `src/lib/canva/adapter.ts`: Must switch from env var lookup to DB lookup
- Env vars: `CANVA_TEMPLATE_*` vars become seed data for initial DB migration, then can be removed
- History page queries Upload + CanvaArtifact with pagination
- Admin route protection: middleware or server-side check for `role === 'admin'`

</code_context>

<specifics>
## Specific Ideas

- History table should feel lightweight — team checks it briefly to find a past job and reopen the Canva link, not to analyze data
- Admin section is for the operations lead who manages which templates and rules are active — not for all team members
- Field mapping UI is important because Canva template text element names may change when templates are updated — admin needs to reconfigure without developer involvement
- Canva API verification when saving template IDs prevents broken generation from invalid template references
- The 7 original rules are special — they have hardcoded enforcement logic. New admin-created rules are metadata-only for tracking/documentation until a developer adds enforcement code

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-history-admin-control*
*Context gathered: 2026-03-26*
