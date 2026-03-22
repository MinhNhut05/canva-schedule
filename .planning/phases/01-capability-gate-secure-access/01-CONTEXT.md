# Phase 1: Capability Gate & Secure Access - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Team members can securely access a protected app, and the project has a verified Canva autofill path before downstream work depends on it. This phase delivers internal authentication, server-side secret management, and a go/no-go Canva autofill feasibility check.

</domain>

<decisions>
## Implementation Decisions

### Authentication Strategy
- **D-01:** Username/password authentication for internal team (~10 users)
- **D-02:** Accounts created via seed/manual process — admin or dev creates accounts directly in database or seed script. No self-registration.
- **D-03:** Use NextAuth.js with credentials provider for Next.js integration
- **D-04:** Passwords hashed (bcrypt/argon2) with user-accessible change password functionality. No forgot-password email flow — admin resets if needed.

### Session & Protection UX
- **D-05:** Session duration: 7 days from last login, then auto-expire
- **D-06:** Unauthenticated access to protected routes triggers redirect to /login with a toast notification ("Vui lòng đăng nhập"). After login, redirect back to originally requested page.
- **D-07:** Login page: simple minimal form — company logo, username/password fields, login button. No landing page or branding sidebar.
- **D-08:** All routes protected except /login. No public pages.

### Canva Verification
- **D-09:** Automated probe script to verify Canva autofill feasibility — repeatable, not manual one-off test
- **D-10:** Go/no-go criteria: all 3 steps must pass — (1) Connect to Canva API successfully, (2) Fill data into template text fields, (3) Receive editable Canva link back. Any step failure = documented blocker.
- **D-11:** If verification fails, document the blocker in detail (e.g., needs Brand Templates, needs Enterprise plan). No auto-fallback to alternative output — team decides next steps based on findings.
- **D-12:** Use real SOHA Travel Canva template for verification test — results must reflect actual production conditions

### Claude's Discretion
- Exact password hashing algorithm choice (bcrypt vs argon2)
- Toast notification library/implementation
- Probe script structure and output format
- Database schema for user accounts
- Middleware implementation pattern for route protection

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above. Key source documents:

### Project context
- `.planning/PROJECT.md` — Project overview, company formatting rules, Canva setup details, constraints
- `.planning/REQUIREMENTS.md` — AUTH-01, AUTH-02, AUTH-03, CANVA-07, SAFE-01 requirement definitions
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, notes on Canva Pro limitations

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing codebase

### Established Patterns
- None yet — Phase 1 establishes the foundational patterns (Next.js project structure, auth middleware, environment variable handling)

### Integration Points
- Next.js App Router or Pages Router (to be established)
- NextAuth.js credentials provider integration
- Canva Connect API for autofill probe
- Environment variables for server-side secrets (AI API key, Canva credentials)

</code_context>

<specifics>
## Specific Ideas

- Internal tool for ~10 users at SOHA Travel — keep auth simple, no over-engineering
- Canva Pro may be insufficient per research — Brand Templates or Enterprise may be required. This is the core risk this phase validates.
- Probe script must test with real SOHA Travel template to catch account/plan-specific limitations early

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-capability-gate-secure-access*
*Context gathered: 2026-03-22*
