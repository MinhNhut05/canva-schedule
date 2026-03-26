# Phase 5: History & Admin Control - Research

**Researched:** 2026-03-26
**Domain:** Next.js App Router history retrieval, Auth.js role-based admin control, Prisma-backed template/rule management
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HIST-01 | System stores past generation jobs with file name, timestamp, status, and resulting Canva link(s) | Use `Upload` as the job root, join `CanvaArtifact`, keep 1 row per upload/job, and derive history status from persisted artifact state. |
| HIST-02 | Logged-in user can revisit previous jobs and reopen generated Canva links | Reuse `/review/[id]`, but remove current owner-only lookup for read access so any authenticated team member can reopen persisted outputs from history. |
| ADMIN-01 | Admin or authorized user can manage Canva template mappings for supported tour types | Add `User.role`, server-side admin guard, Prisma-backed `CanvaTemplate` table, Canva verification on save, and JSON field mappings editable from the app. |
| ADMIN-02 | System stores company formatting rules in a maintainable way so they can evolve without rewriting the entire pipeline | Keep `CompanyRule` in DB as the metadata source, protect the seeded rules from deletion, and clearly separate editable metadata from code-enforced rule behavior. |
</phase_requirements>

## Summary

Phase 5 fits the existing stack well, but there are two architectural changes the planner must treat as first-class work rather than UI polish: authorization model expansion and configuration migration. The current codebase already persists the right raw history data in `Upload` and `CanvaArtifact`, and the current review page already hydrates persisted Canva links. That means history is mostly a read-model problem, not a new workflow. The bigger risk is that the current read path is owner-scoped (`where: { id, userId: session.user.id }`), while Phase 5 explicitly requires team-wide visibility. If that is not changed deliberately, `/history` can list shared jobs but row clicks to `/review/[id]` will fail for non-owners.

For admin control, the project already has the right foundation: `CompanyRule` exists in Prisma, rules are seeded, Canva generation is behind an adapter, and field payload building is centralized. The right Phase 5 move is to keep those boundaries and replace env-driven template resolution with a DB-backed template registry. Use a simple `role` field, propagate it through Auth.js JWT/session callbacks, and enforce admin access on the server. Do not add a permissions matrix, and do not move business-rule enforcement logic into database-configured JSON in v1; the user explicitly chose metadata-editable rules, not fully dynamic rule execution.

The most important planning insight is migration order. The app currently requires `CANVA_TEMPLATE_*` env vars at runtime. Phase 5 says env fallback must be removed. Therefore the implementation must seed/backfill DB templates before switching resolver reads, update tests that currently inject template env vars, and avoid destructive seed behavior that would overwrite admin edits. The current `seedCompanyRules()` implementation resets names/descriptions/`isActive` on every upsert update, which directly conflicts with admin-managed rule editing and toggling.

**Primary recommendation:** Plan this phase as two coordinated tracks: (1) team-readable history backed by `Upload` + `CanvaArtifact`, and (2) admin-only config management backed by `User.role`, a new `CanvaTemplate` table, and non-destructive seed/migration logic.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | Project: 15.3.1 / Latest: 16.2.1 (npm verified 2026-03-25) | Server-rendered app pages, route groups, Server Actions | Already established across the app; Phase 5 is mostly authenticated page + mutation work. |
| React | Project: 19.1.0 / Latest: 19.2.4 (npm verified 2026-03-25) | UI composition for history/admin pages | Already the rendering baseline; no reason to introduce another UI layer. |
| Prisma ORM + PostgreSQL | Project: 6.6.0 / Latest: 7.5.0 (npm verified 2026-03-25) | Persistence for users, uploads, artifacts, rules, new template registry | Existing DB access layer; Prisma `Json` is appropriate for editable field mappings. |
| Auth.js (`next-auth`) Credentials | Project: 5.0.0-beta.25 / Latest beta: 5.0.0-beta.30 (npm verified 2026-03-22) | Session auth and role propagation | Already in use with JWT/session callbacks; Phase 5 should extend, not replace, this pattern. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | Project: 3.24.0 / Latest: 4.3.6 (npm verified 2026-01-25) | Schema-derived field list for template mapping UI and validation | Use to derive canonical draft field keys and validate admin input shape. |
| shadcn/ui building blocks | In-repo components | Tables, dialogs, forms, badges, alerts | Reuse for history/admin CRUD instead of adding a data-grid package. |
| Vitest | Project/Latest: 4.1.1 (npm verified 2026-03-23) | Fast unit/integration tests for actions, resolver, admin guards | Use for page/action logic and schema-backed mapping tests. |
| Playwright | Project: 1.52.0 / Latest: 1.58.2 (npm verified 2026-03-25) | End-to-end auth/history/admin flows | Use for route protection and reopen-from-history behavior. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `User.role` string enum | Separate permissions table | More flexible later, but unnecessary complexity for a 2-role internal app. |
| Prisma `Json` for field mappings | Separate relational mapping rows | Relational modeling is stricter, but overkill for a small fixed 4-template v1 matrix. |
| Server-rendered history list with Prisma `skip/take` | Client fetch + in-memory slicing | Client fetch adds needless state and duplicates server auth logic. |
| Reusing `/review/[id]` for reopen | New history detail page | New page duplicates the review/result hydration flow already implemented in Phase 4. |

**Installation:**
```bash
# No new runtime package is required for the recommended Phase 5 approach.
# Reuse the existing Next.js + Prisma + Auth.js + shadcn/ui stack.
```

**Version verification:** Verified against npm registry on 2026-03-26 with:
```bash
npm view next version
npm view react version
npm view @prisma/client version
npm view prisma version
npm view next-auth@beta version
npm view zod version
npm view vitest version
npm view @playwright/test version
```

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/
│   └── (app)/
│       ├── history/
│       │   ├── page.tsx              # Server-rendered paginated job history
│       │   └── _components/          # Table, empty state, pagination
│       └── admin/
│           ├── rules/
│           │   ├── page.tsx          # Admin rules table + edit UI
│           │   └── actions.ts        # CRUD + soft-delete server actions
│           └── templates/
│               ├── page.tsx          # Admin template table + edit UI
│               └── actions.ts        # Save + Canva verification actions
├── components/
│   ├── app-sidebar.tsx               # Role-aware navigation
│   ├── history/                      # History UI-only components
│   └── admin/                        # Rules/template form components
└── lib/
    ├── auth.ts / auth.config.ts      # Add role propagation
    ├── canva/
    │   ├── template-registry.ts      # DB-backed template resolution + verification
    │   └── adapter.ts                # Reads DB templates instead of env
    └── rules/                        # Keep enforcement logic here
```

### Pattern 1: Upload-Centric History Read Model
**What:** Treat `Upload` as the generation job root and `CanvaArtifact` as child records. Build 1 history row per upload, not per artifact.
**When to use:** For `/history` and any reopen/revisit behavior.
**Example:**
```typescript
const page = Number(searchParams.page ?? 1);
const take = 20;
const skip = (page - 1) * take;

const jobs = await prisma.upload.findMany({
  orderBy: { createdAt: "desc" },
  skip,
  take,
  select: {
    id: true,
    originalFileName: true,
    createdAt: true,
    tourDuration: true,
    canvaArtifacts: {
      select: {
        artifactType: true,
        status: true,
        designId: true,
      },
      orderBy: { artifactType: "asc" },
    },
  },
});
```
Source: existing Prisma access pattern in `/home/minhnhut_dev/projects/siletravel/src/app/(app)/review/[id]/page.tsx` and Prisma pagination docs.

### Pattern 2: Role Propagation Through User -> JWT -> Session -> Server Guard
**What:** Add `role` to the Prisma `User` model, NextAuth authorize result, JWT callback, session callback, and TS module augmentation.
**When to use:** Any admin-only page, action, or role-aware sidebar rendering.
**Example:**
```typescript
callbacks: {
  jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.username = user.username;
      token.role = user.role;
    }
    return token;
  },
  session({ session, token }) {
    session.user.id = token.id as string;
    session.user.username = token.username as string;
    session.user.role = token.role as "admin" | "member";
    return session;
  },
}
```
Source: existing callback pattern in `/home/minhnhut_dev/projects/siletravel/src/lib/auth.config.ts` extended for role propagation.

### Pattern 3: DB-Backed Template Registry With JSON Mapping
**What:** Store one row per `(tourType, artifactType)` template and keep field mappings in a `Json` column.
**When to use:** Template admin UI, generation resolver, initial env-to-DB migration.
**Example:**
```typescript
model CanvaTemplate {
  id           String   @id @default(cuid())
  tourDuration String   // ONE_DAY | TWO_DAY
  artifactType String   // ITINERARY | MENU
  templateId   String
  fieldMapping Json
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([tourDuration, artifactType])
  @@map("canva_templates")
}
```
Source: Phase 5 locked decision D-17 and Prisma JSON field guidance.

### Pattern 4: Rules as Editable Metadata, Enforcement as Code
**What:** Keep `CompanyRule` as the DB metadata source, but keep actual correction logic in `src/lib/rules/definitions.ts` and `engine.ts`.
**When to use:** Admin rule CRUD and seeded-rule protections.
**Example:**
```typescript
export function applyRules(draft: StructuredDraft): RuleResult {
  let currentDraft = structuredClone(draft);
  const allViolations: RuleViolation[] = [];

  for (const rule of V1_RULES) {
    const result = rule.check(currentDraft);
    currentDraft = result.draft;
    allViolations.push(...result.violations);
  }

  return {
    correctedDraft: currentDraft,
    violations: allViolations,
    autoFixCount: allViolations.filter(v => v.severity === "auto_fixed").length,
    needsReviewCount: allViolations.filter(v => v.severity === "needs_review").length,
  };
}
```
Source: `/home/minhnhut_dev/projects/siletravel/src/lib/rules/engine.ts`

### Anti-Patterns to Avoid
- **Per-artifact history rows:** History is about jobs users can revisit; showing two rows per upload makes the table noisy and breaks row-click semantics.
- **Client-only admin hiding:** Sidebar hiding is useful UX, but server pages/actions must reject non-admin users independently.
- **Hard-delete seeded rules:** D-12 and D-14 explicitly forbid this.
- **Seed scripts that overwrite admin edits:** Current `seedCompanyRules()` update path resets editable fields and `isActive`; that must be changed before admin UI ships.
- **Manual left-column field lists for template mapping:** Derive canonical field names from the structured draft schema or a schema-backed manifest, not hardcoded strings that can drift.
- **Switching resolver to DB before seeding templates:** That causes immediate runtime failures because current code requires env-based template resolution.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Role-based access | Custom permission matrix or ACL engine | Simple `User.role` + session/JWT propagation + server guard | Phase scope is only `admin` vs `member`; anything more is needless complexity. |
| Template mapping storage | Delimited strings or ad-hoc serialized blobs | Prisma `Json` column | JSON is the natural fit for key/value field mappings and is officially supported by Prisma. |
| Pagination | Client-side fetch-all then slice in memory | Prisma `skip/take` page queries | Dataset is small and page-number UI is explicitly chosen. Server pagination keeps auth and sorting centralized. |
| Template existence verification | Regex checks on template IDs | Real Canva API verification before save | Only the API can tell you whether the template exists and is accessible to this token. |
| Rule engine configurability | Dynamic code execution from DB | Keep rule enforcement in TypeScript, edit metadata in DB | Dynamic rule execution is unsafe and far outside v1 scope. |
| Review reopen flow | A second “history detail” page | Reuse `/review/[id]` | Existing page already knows how to load draft + persisted Canva artifacts. |

**Key insight:** The deceptively hard problems here are authorization propagation and config lifecycle, not table rendering. The planner should spend effort on data ownership, seed safety, and resolver migration order.

## Runtime State Inventory

> This phase includes a real configuration migration (env-based Canva templates -> DB-based templates), so runtime state must be audited explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `Upload` and `CanvaArtifact` already persist the history data Phase 5 needs. `CompanyRule` rows already exist in DB. New stored data needed: `User.role` and `CanvaTemplate` rows for the 4 supported v1 template slots. | **Code edit + data migration**: add schema fields/tables, backfill existing users to `member` by default, seed or backfill the 4 template rows from current env values before switching runtime reads. |
| Live service config | Canva template designs themselves live in Canva, not git. No evidence in repo of another external config store that must be updated for Phase 5. | **Manual verification only**: admin save flow should validate the provided Canva template ID against the Canva API so inaccessible templates are rejected before persistence. |
| OS-registered state | None found in repo research. No systemd/launchd/pm2/task-scheduler registration pattern is evident. | None — verified by repository inspection only. |
| Secrets/env vars | Current runtime and Playwright config still require `CANVA_TEMPLATE_1DAY_ITINERARY`, `CANVA_TEMPLATE_1DAY_MENU`, `CANVA_TEMPLATE_2DAY_ITINERARY`, `CANVA_TEMPLATE_2DAY_MENU`. | **Code edit + deployment config cleanup**: use env vars one last time for migration/seed input, then remove them from runtime validation and tests after DB seeding succeeds. Keep Canva OAuth secrets intact. |
| Build artifacts | Prisma schema changes will require a new migration and regenerated Prisma client. Existing tests/mocks also assume env-backed template resolution. | **Code edit + regenerate artifacts**: run Prisma migrate/generate and update tests/mocks to use DB-backed resolver behavior. |

**Nothing found in category:** No OS-registered state found from repository inspection. No non-git external admin config store besides Canva itself was identified.

## Common Pitfalls

### Pitfall 1: Team-visible history but owner-only review route
**What goes wrong:** `/history` shows jobs from the whole team, but clicking a row fails for everyone except the original uploader.
**Why it happens:** Current review page and actions look up uploads with `where: { id, userId: session.user.id }`.
**How to avoid:** Split permissions by operation. Team-wide authenticated users may read/reopen uploads; mutation paths can remain more restrictive if needed. Add one shared server helper for “can read upload” vs “can mutate upload”.
**Warning signs:** History row appears, but `/review/[id]` returns 404 after click for non-owner accounts.

### Pitfall 2: Adding `role` to Prisma but not to the session pipeline
**What goes wrong:** Admin UI is hidden or mis-guarded because `session.user.role` is missing in server components and actions.
**Why it happens:** Auth.js currently propagates `id`, `username`, `name`, and `mustChangePassword`, but not `role`.
**How to avoid:** Update all four points together: Prisma `User`, credentials authorize return, JWT callback, session callback, and `src/types/next-auth.d.ts`.
**Warning signs:** TypeScript errors around `session.user.role`, or runtime behavior where all users look like members.

### Pitfall 3: Seed scripts overwrite admin-managed rules
**What goes wrong:** Admin edits a rule name/description or toggles it inactive, then the next seed run silently resets it.
**Why it happens:** Current `seedCompanyRules()` upsert update path always writes `name`, `description`, `category`, and `isActive: true`.
**How to avoid:** Treat seed as bootstrap-only for RULE-01..RULE-07. On existing rows, preserve editable fields or only fill immutable identifiers. Do not force `isActive` back to `true`.
**Warning signs:** Admin changes disappear after `prisma db seed` or test setup.

### Pitfall 4: DB-first resolver switched on before template backfill
**What goes wrong:** Canva generation fails immediately after deploy because the DB has no template rows yet.
**Why it happens:** Phase 5 explicitly removes env fallback, while current runtime depends on env vars.
**How to avoid:** Plan migration order explicitly: schema -> seed/backfill from env -> verify rows -> switch resolver -> remove env validation -> update tests.
**Warning signs:** Errors equivalent to “missing template config” after migration.

### Pitfall 5: History status is derived incorrectly from two artifact records
**What goes wrong:** A job row shows misleading status because itinerary and menu can succeed/fail independently.
**Why it happens:** Phase 4 supports partial success, but history table wants a single status cell.
**How to avoid:** Define a deterministic row-status rule up front. Recommended v1 rule: show `success` if at least one Canva artifact succeeded and show a separate Canva-link-status badge/count; show `error` only when no artifact succeeded.
**Warning signs:** Users can reopen a Canva link from a row labeled “error”, or a row labeled “success” has no links.

### Pitfall 6: Field mapping keys drift from the structured draft schema
**What goes wrong:** Admin saves a mapping that looks valid in UI, but generation payload builders no longer match the stored keys.
**Why it happens:** Left-column source fields are manually maintained rather than schema-derived.
**How to avoid:** Generate the admin-visible source field list from `structuredDraftSchema` or from a single canonical manifest produced from that schema.
**Warning signs:** Template mapping UI lists keys that do not exist in payload builders or misses new schema fields.

## Code Examples

Verified patterns from official sources and the current codebase:

### Role-aware Auth.js session propagation
```typescript
// Extend the existing callback pattern in src/lib/auth.config.ts
callbacks: {
  jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.username = user.username;
      token.name = user.name;
      token.mustChangePassword = user.mustChangePassword;
      token.role = user.role;
    }
    return token;
  },
  session({ session, token }) {
    session.user.id = token.id as string;
    session.user.username = token.username as string;
    session.user.name = token.name as string;
    session.user.mustChangePassword = token.mustChangePassword as boolean;
    session.user.role = token.role as "admin" | "member";
    return session;
  },
}
```
Source: `/home/minhnhut_dev/projects/siletravel/src/lib/auth.config.ts`

### Non-destructive DB template lookup
```typescript
export async function resolveTemplateFromDb(
  duration: "ONE_DAY" | "TWO_DAY",
  artifactType: "ITINERARY" | "MENU",
) {
  const template = await prisma.canvaTemplate.findUnique({
    where: {
      tourDuration_artifactType: {
        tourDuration: duration,
        artifactType,
      },
    },
  });

  if (!template || !template.isActive) {
    throw new Error(`Missing active Canva template for ${duration}_${artifactType}`);
  }

  return template;
}
```
Source: recommended replacement for `/home/minhnhut_dev/projects/siletravel/src/lib/canva/template-resolver.ts`

### History query with server-side pagination
```typescript
const take = 20;
const page = Number(searchParams.page ?? 1);
const skip = (page - 1) * take;

const [rows, total] = await Promise.all([
  prisma.upload.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: {
      canvaArtifacts: {
        select: {
          artifactType: true,
          status: true,
          designId: true,
        },
      },
    },
  }),
  prisma.upload.count(),
]);
```
Source: Prisma pagination pattern and existing upload/artifact schema.

### Preserve seeded-rule protections in admin delete flow
```typescript
const SEEDED_RULE_IDS = new Set([
  "RULE-01",
  "RULE-02",
  "RULE-03",
  "RULE-04",
  "RULE-05",
  "RULE-06",
  "RULE-07",
]);

export async function softDeleteRule(ruleId: string) {
  if (SEEDED_RULE_IDS.has(ruleId)) {
    throw new Error("Quy tắc gốc không được xóa. Chỉ có thể tắt hoạt động.");
  }

  await prisma.companyRule.update({
    where: { ruleId },
    data: { isActive: false },
  });
}
```
Source: Phase 5 locked decisions D-12 and D-14, plus existing seeded rule IDs in `/home/minhnhut_dev/projects/siletravel/src/lib/rules/seed.ts`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Template IDs resolved from env vars at runtime | DB-backed template registry with admin editing and API verification | Phase 5 | Template changes stop requiring redeploys, but migration order becomes critical. |
| Owner-only review access | Team-readable history + reopen through existing review page | Phase 5 | Read authorization must no longer assume uploader ownership. |
| Rules seeded once and effectively code-owned | Rules remain code-enforced but metadata becomes admin-editable in DB | Phase 5 | Safer operational editing without pretending rules are fully dynamic. |
| Disabled sidebar placeholders for History/Settings | Real `/history` plus admin-only management section | Phase 5 | Sidebar becomes role-aware and route-aware instead of static. |

**Deprecated/outdated:**
- `CANVA_TEMPLATE_*` runtime resolution in `/home/minhnhut_dev/projects/siletravel/src/lib/env.ts` and `/home/minhnhut_dev/projects/siletravel/src/lib/canva/server-client.ts`: outdated after DB migration.
- Destructive rule reseeding in `/home/minhnhut_dev/projects/siletravel/src/lib/rules/seed.ts`: outdated once admins can edit/toggle rules.
- Owner-only read checks in `/home/minhnhut_dev/projects/siletravel/src/app/(app)/review/[id]/page.tsx` and `/home/minhnhut_dev/projects/siletravel/src/app/(app)/review/[id]/actions.ts`: outdated for team history reopen behavior.

## Open Questions

1. **What exact Canva API call should be the authoritative “verify template exists and is accessible” check for regular designs?**
   - What we know: the current adapter already uses `POST /designs`, `PATCH /designs/{id}`, and `GET /designs/{id}` against the Canva REST API pattern in code and E2E mocks.
   - What's unclear: official Canva documentation was not fully retrievable during research, so the safest supported verification endpoint for regular design IDs vs brand-template autofill IDs remains only partially verified.
   - Recommendation: implement verification using the same production path the app already trusts for generation compatibility, and add mocked integration coverage around both success and inaccessible-template failures.

2. **Should admin-created metadata-only rules ever appear in the enforcement engine UI as “active”?**
   - What we know: D-13 says new admin-created rules are metadata-only and do not auto-enforce.
   - What's unclear: the best UX wording so admins do not confuse “active metadata” with “actively enforced by code”.
   - Recommendation: planner should include explicit UI copy such as “Theo dõi / chưa tự động áp dụng” or a badge that distinguishes informational rules from code-enforced v1 seeded rules.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 (unit/integration) + Playwright 1.52.0 project baseline |
| Config file | `/home/minhnhut_dev/projects/siletravel/vitest.config.ts`, `/home/minhnhut_dev/projects/siletravel/playwright.config.ts` |
| Quick run command | `npm run test -- src/app/(app)/review/[id]/__tests__/actions.test.ts src/lib/canva/__tests__/template-resolver.test.ts` |
| Full suite command | `npm test && npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HIST-01 | Paginated team history lists one row per upload with file name, timestamp, status, tour type, and Canva-link status | integration | `npm run test -- src/app/(app)/history/__tests__/page.test.tsx` | ❌ Wave 0 |
| HIST-02 | User can open `/history`, click a row, land on `/review/[id]`, and reopen persisted Canva links without regeneration | e2e | `npx playwright test tests/e2e/history.spec.ts` | ❌ Wave 0 |
| ADMIN-01 | Admin can create/update/disable template mappings and non-admin users are blocked server-side | integration | `npm run test -- src/app/(app)/admin/templates/__tests__/actions.test.ts` | ❌ Wave 0 |
| ADMIN-02 | Admin can CRUD rule metadata, seeded rules cannot be deleted, and reseeding does not clobber edits | integration | `npm run test -- src/app/(app)/admin/rules/__tests__/actions.test.ts src/lib/rules/__tests__/seed.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test -- src/app/(app)/review/[id]/__tests__/actions.test.ts src/lib/canva/__tests__/template-resolver.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test && npm run test:e2e` green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `/home/minhnhut_dev/projects/siletravel/src/app/(app)/history/__tests__/page.test.tsx` — covers HIST-01 server pagination and row aggregation
- [ ] `/home/minhnhut_dev/projects/siletravel/tests/e2e/history.spec.ts` — covers HIST-02 history-to-review reopen path
- [ ] `/home/minhnhut_dev/projects/siletravel/src/app/(app)/admin/templates/__tests__/actions.test.ts` — covers ADMIN-01 save, validation, and role guard
- [ ] `/home/minhnhut_dev/projects/siletravel/src/app/(app)/admin/rules/__tests__/actions.test.ts` — covers ADMIN-02 CRUD + seeded-rule protections
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/rules/__tests__/seed.test.ts` — prevents future destructive reseed regressions
- [ ] `/home/minhnhut_dev/projects/siletravel/src/lib/auth/__tests__/role-propagation.test.ts` — verifies `role` reaches JWT/session types and callbacks

## Sources

### Primary (HIGH confidence)
- npm registry via `npm view` - verified current versions and publish timestamps for Next.js, React, Prisma, Auth.js beta, Zod, Vitest, Playwright
- [Prisma docs: Working with Json fields](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) - verified `Json` suitability for object/array mapping storage
- `/home/minhnhut_dev/projects/siletravel/prisma/schema.prisma` - verified current data model and available persistence points
- `/home/minhnhut_dev/projects/siletravel/src/app/(app)/review/[id]/page.tsx` - verified current owner-only review lookup and reuse target for history reopen
- `/home/minhnhut_dev/projects/siletravel/src/app/(app)/review/[id]/actions.ts` - verified owner-only mutation/read helpers and Canva persistence flow
- `/home/minhnhut_dev/projects/siletravel/src/lib/rules/seed.ts` - verified destructive reseed risk against admin-managed rules
- `/home/minhnhut_dev/projects/siletravel/src/lib/canva/template-resolver.ts` and `/home/minhnhut_dev/projects/siletravel/src/lib/canva/server-client.ts` - verified current env-driven template resolution

### Secondary (MEDIUM confidence)
- [Prisma docs: Pagination](https://www.prisma.io/docs/orm/prisma-client/queries/pagination) - used as official reference point for server-side pagination planning, though the fetched excerpt was limited
- `/home/minhnhut_dev/projects/siletravel/src/lib/auth.config.ts` and `/home/minhnhut_dev/projects/siletravel/src/types/next-auth.d.ts` - verified the current JWT/session extension pattern that Phase 5 should extend for `role`
- `/home/minhnhut_dev/projects/siletravel/playwright.config.ts` - verified current test environment still injects template env vars, which migration must remove
- `/home/minhnhut_dev/projects/siletravel/tests/e2e/review-canva-generation.spec.ts` - verified persisted Canva links already survive revisit on the review page

### Tertiary (LOW confidence)
- Canva official API verification specifics for template accessibility - partially inferred from the current code and mocks because official Canva docs could not be fully fetched during research; validate during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - based on current codebase, npm registry verification, and Prisma official docs
- Architecture: MEDIUM-HIGH - codebase patterns are clear, but Canva verification endpoint details need implementation-time validation
- Pitfalls: HIGH - directly supported by code inspection of auth scope, seeding behavior, and env-backed template resolution

**Research date:** 2026-03-26
**Valid until:** 2026-04-25
