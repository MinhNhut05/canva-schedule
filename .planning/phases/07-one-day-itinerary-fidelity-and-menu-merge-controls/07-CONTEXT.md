# Phase 7: One-day itinerary fidelity and menu merge controls - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Tighten the 1-day tour output path so the reviewed content and Canva result stay closer to the approved SOHA wording. This phase covers the 1-day flow only, across extraction prompt, deterministic rules, review UX, and Canva payload generation. It adds a per-upload choice to merge concise meal/menu lines into the itinerary and warns when merged content is likely too long for the template.

This phase does **not** introduce a new template-family architecture, does **not** redesign 2-day behavior, and does **not** add a new Canva template registry model beyond the existing 4 slots.

</domain>

<decisions>
## Implementation Decisions

### Scope and Routing
- **D-01:** Scope is the full `extract -> rules -> review -> Canva` path for **1-day tours**, not just the final Canva payload.
- **D-02:** The new behavior must work for both `SCHOOL` and `GROUP` 1-day tours. The canonical sample is a school PDF, but the runtime logic must branch by `clientType`, not by one hardcoded school template.
- **D-03:** Keep the current 4-template architecture (`ONE_DAY/TWO_DAY × ITINERARY/MENU`). Do not add `template family` or `variant` models in this phase.

### Wording Fidelity
- **D-04:** Condensation strategy is **hybrid**: keep source-near wording for sensitive lines, destinations, and client-facing phrasing; standardize only where the approved SOHA wording is clear and repeatable.
- **D-05:** Travel and return lines must keep their destination in full. A shortening like `Khởi hành về` is not acceptable when the reviewed wording should be `Khởi hành về Trường tiểu học Long Tuyền 2`.
- **D-06:** If the system is unsure how to shorten an activity correctly, it must stay closer to the source and/or flag review instead of inventing broader or flashier phrasing.
- **D-07:** For large destination blocks such as Suối Tiên, keep the opening line plus the primary bullets only. Drop deep nested detail when needed, but do not add new bullets that were not approved by the user.
- **D-08:** For the canonical 13:00 Suối Tiên line, the approved condensed wording does **not** force `Sau khi dùng bữa trưa`. The system must support the shorter approved version when that is the review choice.

### Program Label and Title
- **D-09:** `program_label` must come from the reviewed `programName` nearly verbatim when the source provides a clear heading, for example `CHƯƠNG TRÌNH TRẢI NGHIỆM NGOẠI KHÓA`.
- **D-10:** `program_label` and the left-side `title` are separate concerns. The short left title for the 1-day template should default to a concise, review-friendly form rather than the full route dump, but review remains the final authority.

### Menu Merge Option
- **D-11:** There must be a user-facing option to decide whether concise meal/menu lines are merged into the 1-day itinerary.
- **D-12:** The menu-merge choice lives in the review flow and is saved per upload so regenerate/retry reuses the same option.
- **D-13:** Menu merge uses a fit heuristic. If merged content looks too long for the template, the app should warn and recommend adjustment rather than silently overfilling the layout.
- **D-14:** The menu-merge choice is a generation preference, not source content. Store it separately from the reviewed itinerary/menu facts.

### Validation Inputs
- **D-15:** Canonical acceptance example:
  - PDF: `/home/minhnhut_dev/Downloads/TH LONG TUYỀN 2 - BT CHỨNG TÍCH CHIẾN TRANH - DINH - BẾN NHÀ RỒNG - SUỐI TIÊN - METRO - 1803.pdf`
  - User-corrected Canva screenshot: thread image #2
- **D-16:** The user-designated Day 1 brand template URL is a source-of-truth reference for intended layout, but this planning pass relies on the user's screenshots and textual corrections because the live Canva page was not inspected from the terminal session.

### the agent's Discretion
- Exact persistence shape for per-upload Canva options (`Upload` JSON field vs equivalent)
- Exact heuristic thresholds for warning about merged 1-day content length
- Exact algorithm for deriving the short left title from reviewed 1-day content
- Whether a missing `programName` should render blank, use a controlled fallback, or force review
- Exact review UI copy and warning phrasing in Vietnamese

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Core value and company formatting constraints
- `.planning/REQUIREMENTS.md` — Existing requirements plus new Phase 7 requirement IDs
- `.planning/ROADMAP.md` — Phase 7 goal, success criteria, and dependency position

### Prior phase decisions
- `.planning/phases/03-structured-ai-extraction-rules-human-review/03-CONTEXT.md` — Review flow, structured draft contract, rules pipeline
- `.planning/phases/04-editable-canva-generation/04-CONTEXT.md` — Current Canva adapter boundary, template resolver, payload design
- `.planning/phases/04-editable-canva-generation/04-VERIFICATION.md` — Verified current behavior and its limits

### Code areas that will likely change
- `src/lib/ai/extraction-prompt.ts` — Current 1-day shortening instructions
- `src/lib/rules/definitions.ts` — Current deterministic rules; missing fidelity rules
- `src/lib/rules/engine.ts` — Rules orchestration
- `src/lib/canva/payload.ts` — Current 1-day block payload generation
- `src/app/(app)/review/[id]/actions.ts` — Review save/re-extract/generate actions
- `src/app/(app)/review/[id]/page.tsx` — Review page loader
- `src/components/review/review-page.tsx` — Review UI, Canva generate path
- `prisma/schema.prisma` — Candidate home for persistent per-upload Canva generation options

</canonical_refs>

<code_context>
## Existing Code Insights

### Current Gaps
- `src/lib/ai/extraction-prompt.ts` currently teaches the model to shorten travel lines aggressively and to inject phrases like `Sau khi dùng bữa trưa`, which does not match the user's approved canonical wording.
- `src/lib/rules/definitions.ts` only covers layout, greeting, school-name integrity, return-to-school wording, and menu presence. It has no deterministic rule for 1-day wording fidelity, no check for `program_label`, and no protection against over-shortening.
- `src/lib/canva/payload.ts` always falls back to a generic program label and has no notion of saved per-upload menu merge options or fit warnings.
- The review/generate flow has no saved toggle for `merge menu into itinerary`.

### Stable Foundations To Reuse
- `StructuredDraft` already separates `programName`, `title`, itinerary activities, and menu items.
- Activity items already carry `sourceConfidence` and `needsReview`, which can support conservative shortening behavior.
- The review page already supports inline edit, re-extract, approve, and regenerate patterns that can absorb a new per-upload generation option.
- The Canva adapter boundary is already in place; this phase only needs to change what reviewed data is sent into the 1-day itinerary payload.

</code_context>

<specifics>
## Specific Ideas

- Canonical approved `program_label` example:
  `CHƯƠNG TRÌNH TRẢI NGHIỆM NGOẠI KHÓA`
- Canonical approved 13:00 wording:
  `Quý thầy cô và các bạn học sinh tự do tham quan và vui chơi tại Công viên văn hóa Suối Tiên:`
  followed by the main bullets only.
- Canonical approved 15:30 wording:
  `Khởi hành về Trường tiểu học Long Tuyền 2.`
- Menu merge should place concise menu lines after the relevant meal sentence when the saved option is enabled and the heuristic allows it.

</specifics>

<deferred>
## Deferred Ideas

- 2-day wording-fidelity tuning
- Template-family or template-variant architecture
- Live brand-template validation inside this planning phase

</deferred>

---

*Phase: 07-one-day-itinerary-fidelity-and-menu-merge-controls*
*Context gathered: 2026-04-11*
