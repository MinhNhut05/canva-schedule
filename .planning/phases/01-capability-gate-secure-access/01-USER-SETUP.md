# Phase 1 — Canva Probe User Setup

**Status:** Incomplete
**Service:** Canva Connect API

## Environment Variables

| Variable | Source | Status |
|----------|--------|--------|
| `CANVA_CLIENT_ID` | Canva developer/integration settings for the real SOHA Travel Canva workspace | Not set |
| `CANVA_CLIENT_SECRET` | Canva developer/integration settings for the real SOHA Travel Canva workspace | Not set |
| `CANVA_ACCESS_TOKEN` | OAuth/token flow for the real SOHA Travel Canva workspace | Not set |
| `CANVA_REFRESH_TOKEN` | OAuth/token flow for the real SOHA Travel Canva workspace | Not set |
| `CANVA_TEMPLATE_ID` | The real SOHA Travel Brand Template ID used for production verification | Not set |

## Account Setup Checklist

- [ ] Obtain Canva Enterprise access for the SOHA Travel workspace
- [ ] Register a private Canva Connect integration under the Enterprise org
- [ ] Publish SOHA Travel itinerary/menu templates as Brand Templates
- [ ] Complete the OAuth 2.0 + PKCE flow to obtain access and refresh tokens
- [ ] Add all 5 env vars to `.env.local`

## Dashboard Configuration

- [ ] Ensure the target SOHA itinerary/menu template is published as a real Brand Template in the connected workspace (Canva workspace → Brand Template management)

## Local Development Notes

1. Copy the env vars into `.env.local` (gitignored)
2. Run the probe: `npx tsx scripts/canva-probe.ts`
3. All 3 steps must pass for GO verdict

## Verification Commands

```bash
# Run the probe
npx tsx scripts/canva-probe.ts

# Quick env check
bash -c 'test -n "$CANVA_ACCESS_TOKEN" && echo "token set" || echo "token missing"'
```

---
*Phase: 01-capability-gate-secure-access*
*Created: 2026-03-28*
