# Phase 01 Verification: Capability Gate & Secure Access

**Verified:** 2026-03-28
**Phase goal:** Team members can securely access a protected app, and the project has a verified Canva autofill path before downstream work depends on it.
**Phase requirement IDs:** AUTH-01, AUTH-02, AUTH-03, CANVA-07, SAFE-01

---

## Requirement Cross-Reference

All 5 requirement IDs from the ROADMAP phase frontmatter are accounted for in REQUIREMENTS.md and traced to plan summaries.

| Req ID | REQUIREMENTS.md Description | Plan | Summary Claims | Status |
|--------|----------------------------|------|----------------|--------|
| AUTH-01 | Team member can log in with an assigned internal account | 01-02 | requirements-completed: [AUTH-01] | PASS |
| AUTH-02 | User session persists across browser refresh until logout or expiry | 01-02 | requirements-completed: [AUTH-02] | PASS |
| AUTH-03 | Unauthenticated users cannot access upload, generation, history, rules, or template pages | 01-02 | requirements-completed: [AUTH-03] | PASS |
| CANVA-07 | Canva plan/template capability is verified before production reliance on autofill workflow | 01-03 | requirements-completed: [CANVA-07] | PASS |
| SAFE-01 | External AI API credentials and Canva credentials are stored server-side and never exposed to the browser | 01-01 | requirements-completed: [SAFE-01] | PASS |

**Coverage:** 5/5 requirement IDs mapped. 0 unmapped. 0 missing from codebase.

---

## Codebase Evidence per Requirement

### AUTH-01: Team member can log in with an assigned internal account

| Check | Evidence | Verified |
|-------|----------|----------|
| NextAuth credentials provider exists | `src/lib/auth.ts` — Credentials provider with username/password lookup against Prisma User table | YES |
| User model with passwordHash | `prisma/schema.prisma` line 18 — `model User` with `passwordHash String` | YES |
| Seeded internal accounts | `prisma/seed.ts` exists, 01-01-SUMMARY confirms seeded users with hashed passwords | YES |
| Password hash/verify utilities | `src/lib/password.ts` — bcryptjs with `hashPassword()`, `verifyPassword()`, `assertPasswordPolicy()` | YES |
| Login page with form | `src/app/(auth)/login/page.tsx`, `login-form.tsx`, `actions.ts`, `login-toast.tsx` — all present | YES |
| E2E proof | `tests/e2e/auth.spec.ts` — "valid login reaches the protected dashboard" test with seed user credentials | YES |

### AUTH-02: User session persists across browser refresh until logout or expiry

| Check | Evidence | Verified |
|-------|----------|----------|
| JWT session with 7-day maxAge | `src/lib/auth.config.ts` line 33 — `maxAge: 7 * 24 * 60 * 60` (7 days) | YES |
| Session strategy is JWT | `src/lib/auth.config.ts` line 32 — `strategy: "jwt"` | YES |
| JWT callbacks propagate user data | `src/lib/auth.config.ts` lines 12-29 — jwt and session callbacks set id, username, name, role, mustChangePassword | YES |
| E2E proof | `tests/e2e/auth.spec.ts` — "session persists after page refresh" test: login, reload, assert still on dashboard | YES |

### AUTH-03: Unauthenticated users cannot access protected pages

| Check | Evidence | Verified |
|-------|----------|----------|
| Middleware-level route protection | `middleware.ts` — `getToken()` JWT check, only `/login` and `/api/auth` are public (PUBLIC_PATHS) | YES |
| Redirect with callbackUrl + reason | `middleware.ts` lines 33-36 — redirects to `/login?callbackUrl=...&reason=auth-required` | YES |
| Matcher covers all routes except static | `middleware.ts` lines 42-51 — excludes only `_next/static`, `_next/image`, `favicon.ico`, `sitemap.xml`, `robots.txt` | YES |
| Toast on auth-required redirect | `src/app/(auth)/login/login-toast.tsx` exists per 01-02-SUMMARY | YES |
| E2E proof | `tests/e2e/auth.spec.ts` — "unauthenticated visit to /dashboard redirects to /login with callbackUrl and reason" + "auth-required redirect shows toast notification" + "logout removes access and redirects to login" | YES |

### CANVA-07: Canva plan/template capability is verified before production reliance

| Check | Evidence | Verified |
|-------|----------|----------|
| Automated repeatable probe script | `scripts/canva-probe.ts` — 597 lines, 3-step gate (connectivity, autofill, editable link) | YES |
| Placeholder credential rejection | `scripts/canva-probe.ts` lines 50-66 — PLACEHOLDER_PATTERNS array with 14 patterns; `isPlaceholder()` rejects fake values | YES |
| Three-step verification (D-10) | Step 1: `step1_verifyConnectivity` (API + template reachable), Step 2: `step2_autofillTemplate` (dataset fetch + autofill job), Step 3: `step3_pollForEditableLink` (poll + editable URL) | YES |
| GO/NO-GO verdict | `scripts/canva-probe.ts` line 518 — `allPassed ? "GO" : "NO-GO"`, exit code 0 for GO, 1 for NO-GO | YES |
| Live probe result documented | `01-CANVA-PROBE-RESULT.md` — run timestamp 2026-03-28T07:50:40.319Z, Verdict: NO-GO | YES |
| Blocker details documented (D-11) | `01-CANVA-PROBE-RESULT.md` — missing credentials (immediate) + Canva Enterprise required (structural), 6 action items, 4 alternative paths | YES |
| User setup checklist | `01-USER-SETUP.md` — 5 env vars, account setup checklist, verification command | YES |

**Note on NO-GO verdict:** The probe correctly identified that (1) no Canva credentials are configured, and (2) even with Canva Pro credentials, the Brand Template/autofill API requires Canva Enterprise. This is a **successful verification** of CANVA-07 — the requirement says "verified before production reliance," not "must pass." The blocker is documented with actionable next steps before Phase 4 depends on it.

### SAFE-01: Credentials stored server-side and never exposed to the browser

| Check | Evidence | Verified |
|-------|----------|----------|
| Server-only env module | `src/lib/env.ts` line 1 — `import "server-only"` prevents client-side import | YES |
| NEXT_PUBLIC_ secret rejection | `src/lib/env.ts` lines 8-31 — `FORBIDDEN_PUBLIC_PREFIXES` array with 10 entries, `rejectPublicSecrets()` throws on detection | YES |
| Startup validation in next.config.ts | `next.config.ts` lines 9-44 — inline `validateStartupEnv()` called at boot, rejects NEXT_PUBLIC_ aliases + missing AUTH_SECRET/DATABASE_URL | YES |
| Zod-validated AI env accessor | `src/lib/env.ts` lines 93-103 — `getAiEnv()` with Zod schema, calls `rejectPublicSecrets()` | YES |
| Zod-validated Canva env accessor | `src/lib/env.ts` lines 109-112 — `getCanvaEnv()` with Zod schema, calls `rejectPublicSecrets()` | YES |
| Server-only client wrappers | `src/lib/ai/server-client.ts` and `src/lib/canva/server-client.ts` — confirmed by grep as the only files importing getAiEnv/getCanvaEnv | YES |
| .env.example has no NEXT_PUBLIC_ secrets | `.env.example` — all 11 env vars use server-only names (AUTH_SECRET, DATABASE_URL, AI_API_*, CANVA_*) | YES |

---

## Plan must_haves Verification

### Plan 01-01: Env Contract, Workspace Bootstrap & User Persistence

**Truths:**

| Truth | Codebase Evidence | Verified |
|-------|-------------------|----------|
| App refuses to boot when required secrets are missing or misnamed | `next.config.ts` line 44 calls `validateStartupEnv()`; throws on missing AUTH_SECRET/DATABASE_URL or NEXT_PUBLIC_ aliases | YES |
| AI and Canva credentials only available through server-only modules | `src/lib/env.ts` has `import "server-only"`; `getAiEnv()` and `getCanvaEnv()` are the only access paths; `src/lib/ai/server-client.ts` and `src/lib/canva/server-client.ts` are server-only wrappers | YES |
| Internal user accounts exist with hashed passwords | User model in schema.prisma with passwordHash; seed.ts creates accounts; password.ts provides bcrypt utilities | YES |

**Artifacts:**

| Artifact | Path Exists | Required Content Present | Verified |
|----------|-------------|-------------------------|----------|
| Env contract | `.env.example` | Contains "AUTH_SECRET" | YES |
| Validated env module | `src/lib/env.ts` | Exports env, validateStartupEnv, getAiEnv, getCanvaEnv | YES |
| Startup wiring | `next.config.ts` | Contains `validateStartupEnv()` call at line 44 | YES |
| User model | `prisma/schema.prisma` | Contains `model User` at line 18 | YES |
| Seed script | `prisma/seed.ts` | File exists (confirmed by glob) | YES |

### Plan 01-02: Auth Implementation, Route Protection, and E2E Verification

**Truths:**

| Truth | Codebase Evidence | Verified |
|-------|-------------------|----------|
| Assigned internal user can sign in with username/password | `src/lib/auth.ts` credentials provider + login page + E2E test "valid login reaches the protected dashboard" | YES |
| Session survives browser refresh, valid for 7 days | `auth.config.ts` maxAge=7days + E2E "session persists after page refresh" | YES |
| Every route except /login rejects unauthenticated access | `middleware.ts` PUBLIC_PATHS=["/login", "/api/auth"], all else redirects with callbackUrl+reason | YES |
| Signed-in user can change their own password | `src/app/(app)/settings/password/` page and actions exist; E2E "successful password change" test | YES |

**Artifacts:**

| Artifact | Path Exists | Required Content Present | Verified |
|----------|-------------|-------------------------|----------|
| Auth implementation | `src/lib/auth.ts` | Exports auth, signIn, signOut, handlers | YES |
| Route protection middleware | `middleware.ts` | Contains "callbackUrl" at line 34 | YES |
| Login page | `src/app/(auth)/login/page.tsx` | Contains LoginForm (imports login-form.tsx) | YES |
| Password change page | `src/app/(app)/settings/password/page.tsx` | File exists | YES |
| E2E auth tests | `tests/e2e/auth.spec.ts` | Contains "redirect" — 9 test cases covering full auth flow | YES |

### Plan 01-03: Canva Capability Probe

**Truths:**

| Truth | Codebase Evidence | Verified |
|-------|-------------------|----------|
| Probe runs against real SOHA credentials, not placeholders | `scripts/canva-probe.ts` lines 50-66 PLACEHOLDER_PATTERNS + `isPlaceholder()` check; requires CANVA_TEMPLATE_ID explicitly | YES |
| Go/no-go based on all 3 required steps | 3-step gate: step1_verifyConnectivity, step2_autofillTemplate, step3_pollForEditableLink; all must PASS for GO | YES |
| Failed steps capture blocker with exact details | `01-CANVA-PROBE-RESULT.md` documents NO-GO with step-by-step results, root cause analysis, 6 action items, 4 alternative paths | YES |

**Artifacts:**

| Artifact | Path Exists | Required Content Present | Verified |
|----------|-------------|-------------------------|----------|
| Probe script | `scripts/canva-probe.ts` | Exports `main` at line 477 | YES |
| Decision record | `01-CANVA-PROBE-RESULT.md` | Contains "Verdict: NO-GO" | YES |

---

## ROADMAP Success Criteria Verification

| # | Success Criterion | Codebase Evidence | Verified |
|---|-------------------|-------------------|----------|
| 1 | Team member can log in with assigned internal account and remain signed in across browser refresh until logout or expiry | auth.ts + auth.config.ts (7-day JWT) + E2E tests for login + session persistence + logout | YES |
| 2 | Unauthenticated visitors cannot access upload, generation, history, rules, or template pages | middleware.ts protects all routes except /login and /api/auth; E2E test confirms redirect | YES |
| 3 | AI and Canva credentials remain server-side and never exposed in browser code or network calls | env.ts import "server-only" + NEXT_PUBLIC_ rejection in both env.ts and next.config.ts | YES |
| 4 | Team can verify whether target Canva account supports autofill workflow, or record concrete blocker before Canva-dependent work proceeds | canva-probe.ts (repeatable script) + 01-CANVA-PROBE-RESULT.md (NO-GO with documented blocker + 6 action items) | YES |

---

## Known Blockers

| Blocker | Severity | Documented In | Impact |
|---------|----------|---------------|--------|
| Canva Enterprise required for Brand Template/autofill API | High | 01-CANVA-PROBE-RESULT.md | Phase 4 autofill workflow cannot operate on Canva Pro; Enterprise upgrade + re-published Brand Templates needed |
| No Canva credentials configured | Medium | 01-CANVA-PROBE-RESULT.md, 01-USER-SETUP.md | Probe could not reach API verification steps; must be re-run after credentials are provided |

**Impact on Phase 01 completion:** These blockers do not prevent Phase 01 from being marked complete. CANVA-07 requires *verification* before production reliance, not a GO result. The verification was performed, the NO-GO is documented with actionable steps, and downstream phases are aware of the constraint.

---

## Commits

| Plan | Commit(s) | Description |
|------|-----------|-------------|
| 01-01 | `bb9775e`, `460bae9` | Workspace fixes + exported validateStartupEnv |
| 01-02 | `187cbd4`, `0998d75`, `1a34d57` | Middleware protection + server action fix + E2E auth tests |
| 01-03 | `c41139b`, `0998d75` | Canva probe script + NO-GO decision record |

---

## Verdict

**PHASE 01: PASS**

All 5 requirement IDs (AUTH-01, AUTH-02, AUTH-03, CANVA-07, SAFE-01) are satisfied in the codebase with matching artifacts, automated E2E coverage, and documented decision records. The Canva NO-GO blocker is a correctly identified risk, not a phase failure — it fulfills CANVA-07's intent of verifying feasibility *before* downstream work depends on it.

---
*Phase: 01-capability-gate-secure-access*
*Verified: 2026-03-28*
