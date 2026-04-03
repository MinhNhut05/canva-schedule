# Phase 4: Editable Canva Generation - Discussion Log

**Date:** 2026-03-25
**Participants:** User (Leminho) + Claude

## Gray Areas Identified

1. Template Selection & Mapping
2. Generation Flow & UX sau Approve
3. Kết quả & Canva Links
4. Token Lifecycle & Error Recovery
5. Canva API & Template Structure (emerged during discussion)

## Discussion Summary

### Round 1: Area Selection
- User chose to discuss all 4 original areas

### Round 2: Template Selection & Mapping (4 questions)
- 4 templates for v1 (1-day/2-day × Itinerary/Menu)
- Auto-detect + confirm (not manual dropdown)
- Store template IDs in env vars
- User will provide field names later → Claude recommends from structuredDraft schema

### Round 3: Field names clarification
- User asked "field name la gi" → explained concept of Canva placeholder fields
- Templates exist but not yet configured for API data fields
- User will setup API fields following Claude's recommendations

### Round 4: Generation Flow & UX (4 questions)
- 2-step: Approve then Generate (separate actions)
- Wait on page with spinner during generation
- Re-generation allowed
- Both Itinerary + Menu generate in parallel

### Round 5: Canva Links & Results (4 questions)
- Display links on review page (no redirect)
- Actions: Open + Copy + Thumbnail preview
- 2 separate cards (Itinerary + Menu)
- Links persist on review page

### Round 6: Token Lifecycle & Error Recovery (4 questions)
- Auto refresh + persist to DB
- Error message (Vietnamese) + Retry button
- Partial success: show successful link + retry failed one
- Rate limit: message + cooldown timer

### Round 7: Critical new info — Canva workflow details
User revealed important context:
- Has Canva Pro (not Teams/Enterprise)
- Templates are regular designs (not Brand Templates)
- Current manual flow: copy template + edit text by hand
- Each line is a separate text box in Canva
- User manually adjusts letter spacing (-50 to 0) and line height (1.05 to 1.2) to fit text
- Wants API to: copy template → fill text → return editable link. User fine-tunes in Canva.

### Round 8: Template structure details
- Fixed max boxes per section (~5-7 lines)
- Extra boxes left empty for shorter tours
- 1 page per template
- User unsure if text boxes can be named in Canva → Claude to research
- Target: 80-90% correct, user fine-tunes rest

### Final Confirmation
- All 27 decisions confirmed by user

## Key Insight
The Canva Autofill API primarily works with Brand Templates, but user has regular designs on Canva Pro. This means Claude MUST research Canva Connect API to find the right approach (autofill vs copy+update elements) before planning can proceed. This is a critical research prerequisite for Phase 4.

---
*Discussion completed: 2026-03-25*
