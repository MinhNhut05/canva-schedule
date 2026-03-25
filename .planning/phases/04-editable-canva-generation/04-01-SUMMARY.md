---
plan: 04-01
status: completed
completed_at: "2026-03-25T20:29:30.000Z"
duration_min: 15
tasks_completed: 3
files_changed: 9
tests_added: 25
tests_passed: 25
---

# Summary: Plan 04-01 — Schema Extensions, Env Config & Externalized Template Resolver

## What Was Done

All three tasks executed and committed atomically.

### Task 1.1 — Prisma schema extended
- Added `CanvaToken` model: stores OAuth tokens with `accessToken`, `refreshToken`, `expiresAt`, `scope`, `tokenType` fields. Mapped to `canva_tokens` table.
- Added `CanvaArtifact` model: tracks each generation output (ITINERARY/MENU) independently with `uploadId`, `artifactType`, `status`, `templateId`, `jobId`, `designId`, `errorMessage` fields. Unique constraint on `[uploadId, artifactType]`. Mapped to `canva_artifacts` table.
- Added `canvaArtifacts CanvaArtifact[]` relation to `Upload` model.
- `npx prisma validate` exits 0 and `npx prisma generate` succeeded.

### Task 1.2 — Env validation extended
- Replaced single `CANVA_TEMPLATE_ID` with four per-template env vars: `CANVA_TEMPLATE_1DAY_ITINERARY`, `CANVA_TEMPLATE_1DAY_MENU`, `CANVA_TEMPLATE_2DAY_ITINERARY`, `CANVA_TEMPLATE_2DAY_MENU`.
- Added all four `NEXT_PUBLIC_CANVA_TEMPLATE_*` variants to `FORBIDDEN_PUBLIC_PREFIXES` for SAFE-01 enforcement.
- Updated `getCanvaConfig()` in `server-client.ts` to return `templates` map with keys `ONE_DAY_ITINERARY`, `ONE_DAY_MENU`, `TWO_DAY_ITINERARY`, `TWO_DAY_MENU`.
- Updated `.env.example` with all four template env var entries.

### Task 1.3 — Template resolver, field-map, payload builders + tests
- **`template-resolver.ts`**: Exports `resolveTemplateId(duration, kind)`, `resolveTemplatePair(duration)`, `getTemplatePairLabel(duration)`. Reads from `getCanvaConfig().templates` with key `${duration}_${kind}`. Labels: "Tour 1 ngày" / "Tour 2 ngày".
- **`field-map.ts`**: Canonical field-name manifest for all 4 template types. `MAX_SLOTS_PER_SECTION = 7`. Each template's fields array includes shared fields + type-specific numbered slots.
- **`payload.ts`**: Four typed payload builders (`buildOneDayItineraryPayload`, `buildOneDayMenuPayload`, `buildTwoDayItineraryPayload`, `buildTwoDayMenuPayload`). Uses `toFixedSlots()` for padding/truncating to exactly 7 slots per section. All values are `{ type: "text", text: string }` format.
- **Tests**: 9 resolver tests + 16 payload tests = 25 total, all passing.

## Key Decisions

- Used `vi.mocked()` with ESM imports for mock override instead of `require()` in resolver tests (ESM compatibility).
- `template-resolver.ts` keeps `import "server-only"` guard, mocked in test environment.
- Payload builders use `any` typed input to stay API-path-agnostic — adapter boundary preserved for Plan 04-02.

## Files Changed

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Extended — CanvaToken, CanvaArtifact models, Upload relation |
| `src/lib/env.ts` | Extended — 4 template env vars, updated FORBIDDEN_PUBLIC_PREFIXES |
| `src/lib/canva/server-client.ts` | Updated — getCanvaConfig() returns templates map |
| `.env.example` | Updated — 4 template env var entries |
| `src/lib/canva/template-resolver.ts` | Created |
| `src/lib/canva/field-map.ts` | Created |
| `src/lib/canva/payload.ts` | Created |
| `src/lib/canva/__tests__/template-resolver.test.ts` | Created — 9 tests |
| `src/lib/canva/__tests__/payload.test.ts` | Created — 16 tests |

## Verification Criteria Met

- [x] Prisma schema validates with both new models
- [x] Env validation covers 4 template env vars
- [x] Template resolver returns correct template ID for each duration/kind combo
- [x] Payload builders produce correctly named fields with fixed slot count
- [x] All unit tests pass (25/25)
