# Phase 1: Capability Gate & Secure Access — Research

**Researched:** 2026-03-22
**Covers Plans:** 01-01, 01-02, 01-03
**Requirements:** AUTH-01, AUTH-02, AUTH-03, CANVA-07, SAFE-01
**Confidence:** HIGH (NextAuth.js v5, Next.js env vars), HIGH (Canva API endpoints confirmed from live docs)

---

## Table of Contents

1. [NextAuth.js v5 — Credentials Provider + App Router](#1-nextauthjs-v5--credentials-provider--app-router)
2. [Route Protection — Middleware Pattern](#2-route-protection--middleware-pattern)
3. [Session Configuration — 7-Day Persistence](#3-session-configuration--7-day-persistence)
4. [Password Hashing — bcrypt Recommendation](#4-password-hashing--bcrypt-recommendation)
5. [Environment Variable Patterns — Keeping Secrets Server-Side](#5-environment-variable-patterns--keeping-secrets-server-side)
6. [Canva Connect API — Plan Requirements (The Critical Finding)](#6-canva-connect-api--plan-requirements-the-critical-finding)
7. [Canva Connect API — Autofill Endpoints Reference](#7-canva-connect-api--autofill-endpoints-reference)
8. [Canva Connect API — OAuth 2.0 + PKCE Flow](#8-canva-connect-api--oauth-20--pkce-flow)
9. [Canva Probe Script — Approach & Call Sequence](#9-canva-probe-script--approach--call-sequence)
10. [Gotchas & Risks](#10-gotchas--risks)
11. [Sources](#11-sources)

---

## 1. NextAuth.js v5 — Credentials Provider + App Router

### Installation

```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

> **Note:** NextAuth.js v5 (Auth.js) is installed as `next-auth@beta`. The package `@auth/core`
> does **not** need to be installed directly — it is a peer dependency managed by next-auth.

### Core Config File

Create `src/lib/auth.ts` at the project root (or at `/auth.ts` — must be importable as `@/auth`):

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"          // Prisma client singleton
import { z } from "zod"

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { username, password } = parsed.data

        const user = await db.user.findUnique({ where: { username } })
        if (!user) return null

        const passwordMatch = await compare(password, user.passwordHash)
        if (!passwordMatch) return null

        return { id: user.id, name: user.name, username: user.username }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  callbacks: {
    jwt({ token, user }) {
      // Persist username into the JWT on first sign-in
      if (user) {
        token.id = user.id
        token.username = (user as any).username
      }
      return token
    },
    session({ session, token }) {
      // Expose safe fields to the session object
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).username = token.username
      }
      return session
    },
  },
  pages: {
    signIn: "/login",         // use custom login page, not NextAuth default
  },
})
```

### App Router API Route Handler

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
// src/app/api/auth/[...nextauth]/route.ts
export { GET, POST } from "@/lib/auth"
// re-exports the handlers from the auth config
```

> Note: the `handlers` export from `NextAuth(...)` exposes `{ GET, POST }` — the App Router
> route file re-exports them exactly. No extra logic is needed here.

### Key v5 Changes vs v4

| v4 Behavior | v5 (Auth.js) Behavior |
|-------------|----------------------|
| `getServerSession(authOptions)` | `auth()` — same helper, called without args |
| `NEXTAUTH_SECRET` env var | `AUTH_SECRET` env var |
| `NEXTAUTH_URL` required | Auto-detected in most cases; still set for production |
| `middleware.ts` with `withAuth` | `proxy.ts` with `auth` wrapper (Next.js 16+) |
| Adapter from `next-auth/adapters` | Adapter from `@auth/prisma-adapter` |

---

## 2. Route Protection — Middleware Pattern

### Next.js 16+ Pattern (proxy.ts)

Per Auth.js v5 docs, Next.js 16 renamed `middleware.ts` → `proxy.ts`. For Next.js 15 (this project),
use `middleware.ts` — the pattern is identical.

Create `middleware.ts` at project root:

```typescript
// middleware.ts (project root — Next.js 15)
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isLoginPage = req.nextUrl.pathname === "/login"
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth")

  // Always allow the auth API routes (sign-in, sign-out callbacks)
  if (isApiAuthRoute) return NextResponse.next()

  // Allow access to login page
  if (isLoginPage) {
    // If already logged in, redirect to dashboard
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
    }
    return NextResponse.next()
  }

  // All other routes: require authentication
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.nextUrl.origin)
    )
  }

  return NextResponse.next()
})

export const config = {
  // Run middleware on all routes EXCEPT Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
```

### Post-Login Redirect Back

In the login page's submit handler, read `callbackUrl` from the query string and pass it
to `signIn`:

```typescript
// src/app/login/page.tsx (or login action)
import { signIn } from "@/lib/auth"

async function handleLogin(formData: FormData) {
  "use server"
  const callbackUrl = formData.get("callbackUrl") as string | undefined
  await signIn("credentials", {
    username: formData.get("username"),
    password: formData.get("password"),
    redirectTo: callbackUrl || "/dashboard",
  })
}
```

### Toast on Redirect (D-06)

Since the redirect happens in middleware (server-side), the toast must be triggered
**client-side after the redirect**. Two viable approaches:

**Option A — searchParam flag (recommended for simplicity):**
Middleware appends `?auth=required` to the login URL. The login page reads this param
and fires a toast on mount:

```typescript
// middleware.ts — modify redirect line:
return NextResponse.redirect(
  new URL(`/login?callbackUrl=${callbackUrl}&auth=required`, req.nextUrl.origin)
)

// login/page.tsx — Client Component section:
const searchParams = useSearchParams()
useEffect(() => {
  if (searchParams.get("auth") === "required") {
    toast("Vui lòng đăng nhập để tiếp tục")
  }
}, [])
```

**Option B — flash message via cookie:**
Set a short-lived `Set-Cookie` header in the middleware redirect response. The login
page reads and deletes the cookie on mount. More robust but more code.

> **Recommendation:** Use Option A. Simpler for an internal app with ~10 users.

---

## 3. Session Configuration — 7-Day Persistence

The `session.maxAge` in the NextAuth config above sets JWT expiry to 7 days.

Key behavior notes:
- With `strategy: "jwt"`, the session is stored in an **encrypted HTTP-only cookie** —
  no database session table needed in v1 (can add `@auth/prisma-adapter` later for
  session storage if desired).
- Auth.js v5 **rotates the session expiry** automatically on each request when the
  `auth()` function is called with the response object — meaning the 7-day window
  is a rolling expiry (resets on each active use), not a fixed 7 days from login.
- The `AUTH_SECRET` env var is required for JWT signing. Without it, auth crashes
  silently in production.

### Env var requirement

```bash
# .env.local
AUTH_SECRET="<generated 32+ byte random string>"
# Generate with: openssl rand -base64 32
```

---

## 4. Password Hashing — bcrypt Recommendation

**Decision (Claude's Discretion):** Use **bcrypt** via the `bcryptjs` package.

### Why bcrypt over argon2

| Factor | bcrypt (bcryptjs) | argon2 (argon2) |
|--------|-------------------|-----------------|
| Node.js native bindings | Pure JS — no native compile | Requires native C bindings |
| Installation on Fedora/Linux | `npm install bcryptjs` — zero issues | May need `node-gyp`, build tools |
| Next.js serverless/edge compat | Works in Node.js runtime (not edge) | Works in Node.js runtime (not edge) |
| Security for this use case | Excellent — more than sufficient for ~10 internal users | Marginally stronger in theory |
| Community + docs | Huge, battle-tested | Good, but smaller ecosystem |

**Recommendation:** bcryptjs with cost factor `12`. At 10 users, performance is irrelevant.
Cost factor 12 is a widely accepted default that balances security and compute time (~200ms
per hash on modern hardware).

### Seed Script Pattern

```typescript
// prisma/seed.ts
import { db } from "../src/lib/db"
import { hash } from "bcryptjs"

const USERS = [
  { username: "nguyen.van.a", name: "Nguyễn Văn A", password: "change-me-123" },
  { username: "tran.thi.b",   name: "Trần Thị B",   password: "change-me-456" },
  // ... up to ~10 users
]

async function seed() {
  for (const u of USERS) {
    const passwordHash = await hash(u.password, 12)
    await db.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, name: u.name, passwordHash },
    })
  }
  console.log("Seeded users ✓")
}

seed().catch(console.error).finally(() => db.$disconnect())
```

### User Schema (Prisma)

```prisma
// prisma/schema.prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## 5. Environment Variable Patterns — Keeping Secrets Server-Side

### The Core Rule in Next.js

> **Any variable WITHOUT the `NEXT_PUBLIC_` prefix is server-side only.**
> Next.js will never include it in the browser bundle — it stays in `process.env`
> on the Node.js runtime only.

### .env.local Structure (recommended)

```bash
# .env.local  — NEVER commit to git

# ── Auth ──────────────────────────────────────────────────
AUTH_SECRET="<32+ random bytes, generated with: openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"            # set to production URL in prod

# ── Database ──────────────────────────────────────────────
DATABASE_URL="postgresql://user:pass@localhost:5432/siletravel"

# ── AI API (server-side only — never NEXT_PUBLIC_) ────────
AI_API_URL="https://api.example.com/v1"
AI_API_KEY="sk-..."

# ── Canva (server-side only — never NEXT_PUBLIC_) ─────────
CANVA_CLIENT_ID="your-canva-client-id"
CANVA_CLIENT_SECRET="your-canva-client-secret"
CANVA_ACCESS_TOKEN="oauth-access-token"     # stored here for probe script
CANVA_REFRESH_TOKEN="oauth-refresh-token"   # rotated on each refresh
```

### .gitignore Verification

Ensure these lines exist in `.gitignore` (Next.js scaffolds them by default):

```gitignore
# env files — NEVER commit
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### How to Access Secrets Safely

```typescript
// ✅ SAFE — server-side only (Route Handler, Server Component, lib/ function)
const aiKey = process.env.AI_API_KEY         // available on server
const canvaSecret = process.env.CANVA_CLIENT_SECRET

// ❌ DANGEROUS — do NOT prefix secrets with NEXT_PUBLIC_
// process.env.NEXT_PUBLIC_AI_API_KEY   ← would leak to browser bundle

// ✅ SAFE — reading secrets in a Route Handler
// src/app/api/generate/route.ts
export async function POST(req: Request) {
  const apiKey = process.env.AI_API_KEY   // always server-side in route handlers
  // ...
}
```

### Load Order (Next.js env file priority)

Next.js loads env files in this order (first match wins):

```
1. process.env          (runtime injection — Docker / CI / hosting platform)
2. .env.local           (local override — highest priority for local dev)
3. .env.development     (only in dev)  /  .env.production  (only in prod)
4. .env                 (base defaults — safe to commit if no secrets)
```

**Pattern for this project:**
- `.env` — commit with non-secret defaults (e.g., `AUTH_URL=http://localhost:3000`)
- `.env.local` — all secrets, gitignored
- Production: inject via platform env vars (Vercel dashboard / Docker env / server env)

### Multiline secrets (e.g., private keys)

```bash
# .env.local — multiline value example
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
Kh9NV...
-----END RSA PRIVATE KEY-----"
# OR with escaped newlines:
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nKh9NV...\n-----END RSA PRIVATE KEY-----\n"
```

### Anti-patterns to avoid

```typescript
// ❌ NEVER do this in a Client Component or any file that runs in the browser
"use client"
const secret = process.env.AI_API_KEY   // will be undefined in browser — and
                                         // if accidentally prefixed NEXT_PUBLIC_,
                                         // it leaks to all users

// ❌ NEVER call AI or Canva APIs from client components directly
// ❌ NEVER pass secrets as props from Server → Client Components
// ❌ NEVER log secrets in console.log (they may appear in Vercel/server logs)
```

---

## 6. Canva Connect API — Plan Requirements (The Critical Finding)

### Summary Table

| Feature | Canva Free | Canva Pro | Canva for Teams | Canva Enterprise |
|---------|-----------|-----------|-----------------|-----------------|
| Regular designs (manual) | ✓ | ✓ | ✓ | ✓ |
| Brand Kit | — | ✓ | ✓ | ✓ |
| Brand Templates (shared) | — | — | Limited | **✓ Full** |
| Connect API: Public integration | — | — | — | Required |
| Connect API: Private integration | — | — | — | **Required** |
| Autofill API (`POST /v1/autofills`) | — | — | — | **Required** |
| Brand Templates API (`GET /v1/brand-templates`) | — | — | — | **Required** |

### Exact Confirmation from Canva Docs (direct quotes)

From `GET /v1/brand-templates` (List Brand Templates):
> "To use this API, your integration must act on behalf of a user that's a **member of a Canva Enterprise organization**."

From `POST /v1/autofills` (Create Design Autofill Job):
> "your integration must act on behalf of a user that's a **member of a Canva Enterprise organization**."

From `GET /v1/brand-templates/{brandTemplateId}/dataset`:
> Required plan: **"Canva Enterprise"**

From Canva Connect quickstart (private integrations):
> "Private integrations can only be used by your team on a **Canva Enterprise plan**."

### Implication for This Project

**The user currently has Canva Pro. Canva Pro does NOT support:**
- The Canva Connect API autofill workflow
- Brand Templates API
- Private integrations

**To proceed with the intended autofill workflow, the team needs:**
1. **Canva Enterprise account** — for the Canva Connect API Brand Templates & autofill endpoints
2. **Private integration** registered under that Enterprise org (Client ID + Client Secret)
3. **Templates must be Brand Templates** — not regular Canva designs. Regular designs cannot be autofilled.

### Brand Template vs Regular Design — Critical Distinction

| Type | Created how | Autofillable | API endpoint |
|------|------------|-------------|-------------|
| Regular Design | Normal Canva editing | **No** | N/A |
| Brand Template | Published as Brand Template from an Enterprise org | **Yes** | `/v1/brand-templates` |

Templates must be **re-published as Brand Templates** in the Enterprise account. The existing
SOHA Travel Canva templates (created under a Pro account) would need to be **migrated or
recreated** as Brand Templates under an Enterprise org to be autofillable.

> **Note (September 2025):** Canva migrated Brand Template IDs to a new format in Sept 2025.
> Any IDs stored before that date are now invalid — always fetch template IDs via API at
> probe time rather than hardcoding them.

### Go/No-Go Criteria Mapping (D-10)

| Step | What to verify | Failure condition |
|------|---------------|------------------|
| Step 1: API Connection | Canva OAuth token works, list brand templates succeeds | 401, 403, empty list |
| Step 2: Fill template fields | POST autofill job with real SOHA template ID + test data | job status = `failed`, 403 |
| Step 3: Receive editable link | Poll job until `success`, extract `result.design.urls.edit_url` | No edit_url, status stays `in_progress` for >2min |

---

## 7. Canva Connect API — Autofill Endpoints Reference

### Full Endpoint Map

```
BASE URL: https://api.canva.com/rest/v1
```

#### Brand Templates

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| `GET` | `/v1/brand-templates` | `brandtemplate:meta:read` | List all brand templates in the org |
| `GET` | `/v1/brand-templates/{brandTemplateId}` | `brandtemplate:meta:read` | Get a single brand template |
| `GET` | `/v1/brand-templates/{brandTemplateId}/dataset` | `brandtemplate:content:read` | Get autofill field definitions |

#### Autofill Jobs

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| `POST` | `/v1/autofills` | `design:content:write` | Create an autofill job |
| `GET` | `/v1/autofills/{jobId}` | `design:meta:read` | Poll job status + get result |

#### OAuth Endpoints (not under /rest/v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `https://www.canva.com/api/oauth/authorize` | Authorization (PKCE redirect) |
| `POST` | `https://api.canva.com/rest/v1/oauth/token` | Exchange code for tokens / Refresh |

---

### POST /v1/autofills — Create Autofill Job

**Request:**
```http
POST https://api.canva.com/rest/v1/autofills
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "brand_template_id": "DABcde12345",
  "title": "THPT Cai Nuoc - Chuong trinh rut gon",
  "data": {
    "tour_title": {
      "type": "text",
      "text": "CHƯƠNG TRÌNH THAM QUAN HỌC SINH THPT CÁI NƯỚC"
    },
    "greeting": {
      "type": "text",
      "text": "Kính chào Quý thầy cô và các bạn học sinh"
    },
    "col1_content": {
      "type": "text",
      "text": "Buổi sáng\n- 07:00 Tập trung tại trường\n- 08:00 Khởi hành"
    },
    "cover_image": {
      "type": "image",
      "asset_id": "Mcc1234abcd"
    }
  }
}
```

> **Important:** The `data` object keys (e.g., `"tour_title"`, `"col1_content"`) must
> **exactly match the element names** set in the Brand Template editor inside Canva.
> Fetch the dataset first (`GET /v1/brand-templates/{id}/dataset`) to see available field keys.

**Response (200 — job created):**
```json
{
  "job": {
    "id": "job_abc123",
    "status": "in_progress"
  }
}
```

---

### GET /v1/autofills/{jobId} — Poll Job Status

**Request:**
```http
GET https://api.canva.com/rest/v1/autofills/{jobId}
Authorization: Bearer {access_token}
```

**Response — in_progress:**
```json
{ "job": { "id": "job_abc123", "status": "in_progress" } }
```

**Response — success:**
```json
{
  "job": {
    "id": "job_abc123",
    "status": "success",
    "result": {
      "type": "create_design",
      "design": {
        "id": "DABnewdesign",
        "title": "THPT Cai Nuoc - Chuong trinh rut gon",
        "url": "https://www.canva.com/design/DABnewdesign/view",
        "urls": {
          "edit_url": "https://www.canva.com/design/DABnewdesign/edit",
          "view_url": "https://www.canva.com/design/DABnewdesign/view"
        },
        "thumbnail": {
          "width": 595,
          "height": 842,
          "url": "https://...thumbnail... (expires in 15 min)"
        },
        "created_at": 1740000000,
        "updated_at": 1740000000
      }
    }
  }
}
```

**Response — failed:**
```json
{
  "job": {
    "id": "job_abc123",
    "status": "failed",
    "error": {
      "code": "autofill_error",
      "message": "The brand template could not be autofilled."
    }
  }
}
```

**Possible error codes:** `autofill_error`, `thumbnail_generation_error`, `create_design_error`

---

### GET /v1/brand-templates/{id}/dataset — Inspect Field Keys

Before running the autofill job, call this to discover the exact field key names:

**Request:**
```http
GET https://api.canva.com/rest/v1/brand-templates/{brandTemplateId}/dataset
Authorization: Bearer {access_token}
```

**Response (example):**
```json
{
  "dataset": {
    "tour_title":  { "type": "text" },
    "greeting":    { "type": "text" },
    "col1_content": { "type": "text" },
    "col2_content": { "type": "text" },
    "cover_image": { "type": "image" }
  }
}
```

---

### Rate Limits (from docs)

| Endpoint | Limit |
|----------|-------|
| `POST /v1/autofills` | 60 requests/minute per user |
| `GET /v1/autofills/{jobId}` | 60 requests/minute per user |
| `GET /v1/brand-templates` | 100 requests/minute per user |

At ~10 tours/week, rate limits are not a concern in v1.

---

## 8. Canva Connect API — OAuth 2.0 + PKCE Flow

The Canva Connect API uses **Authorization Code flow with PKCE** (Proof Key for Code Exchange).
This is the only supported OAuth method — there is no API Key or service account option.

### Step-by-Step

```
1. Generate PKCE pair:
   code_verifier = random string (43–128 chars, high entropy)
   code_challenge = BASE64URL(SHA256(code_verifier))

2. Send user to Canva authorization:
   GET https://www.canva.com/api/oauth/authorize
     ?client_id=YOUR_CLIENT_ID
     &response_type=code
     &scope=brandtemplate:meta:read brandtemplate:content:read design:content:write design:meta:read
     &code_challenge=GENERATED_CHALLENGE
     &code_challenge_method=S256
     &state=RANDOM_CSRF_TOKEN
     &redirect_uri=http://localhost:3000/api/canva/callback

3. User approves → Canva redirects to your redirect_uri:
   /api/canva/callback?code=AUTH_CODE&state=CSRF_TOKEN

4. Exchange code for tokens (backend, never browser):
   POST https://api.canva.com/rest/v1/oauth/token
   Authorization: Basic BASE64(client_id:client_secret)
   Content-Type: application/x-www-form-urlencoded
   Body: grant_type=authorization_code&code=AUTH_CODE&code_verifier=PKCE_VERIFIER

   Response:
   {
     "access_token": "...",
     "refresh_token": "...",
     "expires_in": 3600,
     "token_type": "Bearer"
   }

5. Refresh when expired (each refresh token can only be used ONCE):
   POST https://api.canva.com/rest/v1/oauth/token
   Authorization: Basic BASE64(client_id:client_secret)
   Content-Type: application/x-www-form-urlencoded
   Body: grant_type=refresh_token&refresh_token=STORED_REFRESH_TOKEN
```

### Required Scopes for Phase 1 Probe

```
brandtemplate:meta:read      → list + get brand templates
brandtemplate:content:read   → get template dataset (field names)
design:content:write         → create autofill job
design:meta:read             → poll autofill job status
```

### Token Storage for Probe Script

For the Phase 1 probe, the simplest approach is:

1. Run a one-time OAuth flow (manually or via a small CLI redirect server)
2. Store `access_token` and `refresh_token` in `.env.local`
3. Probe script reads from `process.env.CANVA_ACCESS_TOKEN`
4. If expired, probe script uses `refresh_token` to get a new one

> **Note:** "Each refresh token can only be used once." After refreshing, update `.env.local`
> with the new `refresh_token` from the response.

---

## 9. Canva Probe Script — Approach & Call Sequence

### What the Probe Must Do (D-10)

The probe is an **automated Node.js/TypeScript script** that:

1. Connects to the Canva API using credentials from `.env.local`
2. Lists brand templates to confirm account access
3. Finds the real SOHA Travel template by name/ID
4. Fetches the dataset to see available field keys
5. Creates an autofill job with sample tour data
6. Polls the job until `success` or `failed`
7. Reports pass/fail with full details

### Recommended Script Location

```
scripts/canva-probe.ts   ← run with: npx tsx scripts/canva-probe.ts
```

### Probe Script Logic (pseudocode)

```typescript
// scripts/canva-probe.ts
import { loadEnvConfig } from "@next/env"
loadEnvConfig(process.cwd())  // loads .env.local

const BASE = "https://api.canva.com/rest/v1"
const TOKEN = process.env.CANVA_ACCESS_TOKEN!

async function canvaFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Canva API ${res.status}: ${body}`)
  }
  return res.json()
}

// STEP 1 — List brand templates (proves account can access brand templates)
console.log("\n── STEP 1: List Brand Templates ──")
const { items } = await canvaFetch("/brand-templates")
// Expected: non-empty array for Enterprise account with Brand Templates
// Actual Canva Pro: will likely return 403 or empty []

// STEP 2 — Find real SOHA Travel template
const TEMPLATE_ID = process.env.CANVA_TEMPLATE_ID!
console.log("\n── STEP 2: Get Template Dataset ──")
const { dataset } = await canvaFetch(`/brand-templates/${TEMPLATE_ID}/dataset`)
// Expected: object with field keys matching template element names

// STEP 3 — Create autofill job
console.log("\n── STEP 3: Create Autofill Job ──")
const { job: created } = await canvaFetch("/autofills", {
  method: "POST",
  body: JSON.stringify({
    brand_template_id: TEMPLATE_ID,
    title: "[PROBE] Test Autofill - " + new Date().toISOString(),
    data: buildTestPayload(dataset),  // maps dataset keys to dummy Vietnamese tour text
  }),
})

// STEP 4 — Poll for result
console.log("\n── STEP 4: Poll Job Status ──")
const result = await pollJob(created.id)
// Expected: status = "success", result.design.urls.edit_url present

// STEP 5 — Report
if (result.status === "success") {
  console.log("\n✅ GO — All 3 steps passed")
  console.log("Edit URL:", result.result.design.urls.edit_url)
} else {
  console.log("\n❌ NO-GO — Autofill failed")
  console.log("Error:", result.error)
}

async function pollJob(jobId: string, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    const { job } = await canvaFetch(`/autofills/${jobId}`)
    if (job.status === "success" || job.status === "failed") return job
    const wait = Math.min(1000 * 2 ** i, 10000) // exponential backoff, max 10s
    console.log(`  polling... (attempt ${i + 1}, waiting ${wait}ms)`)
    await new Promise(r => setTimeout(r, wait))
  }
  throw new Error("Job timed out after max retries")
}
```

### Expected Outcomes

| Account Type | Step 1 Result | Step 2 Result | Step 3 Result |
|-------------|-------------|---------------|---------------|
| **Canva Pro** (current) | ❌ 403 or empty list | ❌ 403 | ❌ N/A |
| **Canva Enterprise** (needed) | ✅ Template list | ✅ Dataset with field keys | ✅ Edit URL returned |

### Failure Documentation Format (D-11)

If probe fails, output must include:

```
❌ NO-GO — Phase 1 Canva Autofill Probe Failed

STEP FAILED: Step 1 — List Brand Templates
HTTP Status: 403
Error Body: { "code": "permission_denied", "message": "..." }

ROOT CAUSE: Canva Pro account does not support Brand Templates API.
Enterprise organization membership is required.

BLOCKER: Canva autofill workflow cannot proceed without:
  1. Upgrading to Canva Enterprise
  2. Re-publishing templates as Brand Templates under Enterprise org
  3. Registering a private integration under the Enterprise org

NEXT STEPS (team decision required):
  Option A: Upgrade to Canva Enterprise → re-run probe
  Option B: Change output strategy (e.g., generate Canva URL via design duplication
            instead of autofill, or switch to a PDF generation approach)
```

---

## 10. Gotchas & Risks

### Risk 1 — Canva Plan is Almost Certainly Insufficient (HIGH SEVERITY)

**Status:** Likely blocker based on research
**Evidence:** Every Brand Template and autofill API endpoint explicitly states
"Canva Enterprise organization" in its availability note. Pro is not mentioned once.

**What will happen:** Probe script will receive `403 permission_denied` on Step 1
(list brand templates). The rest of the probe will not even be reachable.

**Mitigation:** Run probe script immediately with real account. Do not invest in
Phase 4 (Canva generation) work until this is resolved.

---

### Risk 2 — Brand Template ID Format Changed September 2025

**Status:** Confirmed change (from Canva docs)
**Evidence:** "Brand templates were migrated to use a new ID format in September 2025."

**Impact:** Any template IDs found in older screenshots, bookmarks, or docs are invalid.
Always retrieve IDs dynamically via `GET /v1/brand-templates`.

**Mitigation:** Probe script and production code must **never hardcode template IDs**.
Fetch from API. Store in DB with an admin UI for updates (Phase 5).

---

### Risk 3 — Regular Canva Templates ≠ Brand Templates

**Status:** Confirmed architecture constraint
**Evidence:** Canva has two separate concepts. The `/v1/autofills` endpoint only accepts
a `brand_template_id` — a design ID will return an error.

**Impact:** The existing SOHA Travel templates (created in Canva Pro as regular designs)
cannot be used directly for autofill. They must be **republished as Brand Templates**
inside an Enterprise org.

**Mitigation:** Confirm with team whether templates can be migrated, or if new Brand
Templates need to be created from scratch in the Enterprise account.

---

### Risk 4 — OAuth Refresh Token Single-Use

**Status:** Confirmed (from Canva docs)
**Evidence:** "Each refresh token can only be used once."

**Impact:** In production, if two concurrent requests both try to refresh the token,
one will succeed and one will get an invalid token error. The second refresh token
received by the first request must be stored and used next time.

**Mitigation:** For Phase 1 probe, this is not a concern (sequential script). For
Phase 4 production code, use a mutex/lock around the token refresh operation. Store
the latest refresh token in DB immediately after each use.

---

### Risk 5 — NextAuth.js v5 is Still Beta

**Status:** Ongoing (as of 2026-03-22)
**Evidence:** Installed via `next-auth@beta`

**Impact:** API surface can change between beta releases. The `proxy.ts` rename
(middleware → proxy in Next.js 16+) shows that breaking changes do occur.

**Mitigation:**
- Pin the exact version in `package.json` after install: `"next-auth": "5.x.x"` (no `^` or `~`)
- Read the migration guide before each update
- The credentials provider pattern is stable — this is a low-risk integration

---

### Risk 6 — `AUTH_SECRET` Must Be Set or App Breaks Silently

**Status:** Common pitfall with NextAuth v5
**Evidence:** From v5 migration docs: "The AUTH_SECRET environment variable is the only
variable that is really necessary."

**Impact:** Without `AUTH_SECRET`, JWT signing fails, sessions are not persisted, and
auth will silently fail in confusing ways (redirects work but sessions don't persist).

**Mitigation:** Add `AUTH_SECRET` validation on app startup. Generate with:
```bash
openssl rand -base64 32
```

---

### Risk 7 — Credentials Provider + Edge Runtime Incompatibility

**Status:** Known NextAuth.js limitation
**Evidence:** `bcryptjs` and Prisma do not run in the Edge runtime.

**Impact:** If `middleware.ts` imports anything from `@/lib/auth` that transitively
imports `bcryptjs` or Prisma, Next.js will throw "Module not supported in Edge runtime".

**Mitigation:**
- The middleware must only call `auth()` from a **separate lightweight config** that does
  not import bcrypt or Prisma. Split auth config into two files:
  - `src/lib/auth.ts` — full config (bcrypt + Prisma, Node.js only, used in API routes)
  - `src/lib/auth.config.ts` — minimal config (no DB imports, safe for Edge/middleware)

```typescript
// src/lib/auth.config.ts — Edge-safe (no bcrypt, no Prisma)
import type { NextAuthConfig } from "next-auth"
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  providers: [], // providers are added in the full auth.ts only
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname === "/login"
      if (isLoginPage) return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true
      return isLoggedIn
    },
  },
}

// middleware.ts
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
export default NextAuth(authConfig).auth
```

---

### Risk 8 — callbackUrl Redirect Vulnerability

**Status:** Standard web security concern
**Evidence:** Open redirect is a OWASP-documented vulnerability.

**Impact:** If `callbackUrl` is not validated, an attacker could construct a link like
`/login?callbackUrl=https://evil.com` and redirect the user after login.

**Mitigation:** NextAuth.js v5 handles this automatically — it validates that `callbackUrl`
is a relative path on the same origin and rejects external URLs. No custom validation needed.

---

## 11. Sources

- [Auth.js v5 Installation](https://authjs.dev/getting-started/installation)
- [Auth.js v5 Credentials Provider](https://authjs.dev/getting-started/authentication/credentials)
- [Auth.js v5 Route Protection](https://authjs.dev/getting-started/session-management/protecting)
- [Auth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Next.js Environment Variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Canva Connect API — Brand Templates: List](https://www.canva.dev/docs/connect/api-reference/brand-templates/list-brand-templates/)
- [Canva Connect API — Brand Templates: Get Dataset](https://www.canva.dev/docs/connect/api-reference/brand-templates/get-brand-template-dataset/)
- [Canva Connect API — Autofills: Create Job](https://www.canva.dev/docs/connect/api-reference/autofills/create-design-autofill-job/)
- [Canva Connect API — Autofills: Get Job](https://www.canva.dev/docs/connect/api-reference/autofills/get-design-autofill-job/)
- [Canva Connect API — OAuth Scopes](https://www.canva.dev/docs/connect/appendix/scopes/)
- [Canva Connect API — Authentication](https://www.canva.dev/docs/connect/authentication/)
- [Canva Connect Quickstart](https://www.canva.dev/docs/connect/quickstart/)
- `.planning/research/PITFALLS.md` — project-specific Canva/PDF/AI pitfalls
- `.planning/research/ARCHITECTURE.md` — recommended project structure and patterns

---

*Phase: 01-capability-gate-secure-access*
*Research completed: 2026-03-22*
*Status: Ready for planning (01-PLAN.md)*
