# Phase 7: One-day itinerary fidelity and menu merge controls - Discussion Log

**Date:** 2026-04-11
**Participants:** User + Codex

## Discussion Summary

### Round 1
- Scope is not Canva-only. The phase must tighten the whole `extract -> rules -> review -> Canva` path for 1-day tours.
- The user-designated Day 1 brand template is the visual source of truth.
- Condensation strategy is hybrid: sensitive wording stays close to source, other lines may be standardized when clearly safe.
- Return/arrival wording must keep the destination in full, for example `Khởi hành về Trường tiểu học Long Tuyền 2`.
- There must be an option to merge concise menu lines into the itinerary.

### Round 2
- `program_label` should come from the source program heading, nearly verbatim.
- The left title should default to a concise version suited to the 1-day layout, but remain editable in review.
- For large destination blocks, keep the opening line plus the main bullets only.
- For the canonical 13:00 Suối Tiên example, do not force the phrase `Sau khi dùng bữa trưa` when the approved condensed wording omits it.
- The menu-merge option should live in the review flow, not only in the final confirmation step.

### Round 3
- The user explicitly rejected a `template family` architecture for this phase.
- The new logic should still work for both `SCHOOL` and `GROUP` 1-day tours; it must not be hardcoded only for the school sample.
- The menu-merge choice must persist per upload/draft.
- Length/overflow handling should use a heuristic instead of blind merging.
- If the system is unsure how to shorten correctly, it should stay closer to the source and flag review instead of inventing wording.

## Canonical Reference Inputs

- Canonical PDF sample:
  `/home/minhnhut_dev/Downloads/TH LONG TUYỀN 2 - BT CHỨNG TÍCH CHIẾN TRANH - DINH - BẾN NHÀ RỒNG - SUỐI TIÊN - METRO - 1803.pdf`
- User-approved corrected Canva screenshot:
  thread image #2
- User-designated Day 1 brand template URL:
  `https://www.canva.com/brand/brand-templates/EAHFbrlKx9s`

## Locked Assumption For Planning

The user said there is no template-family concept for this work. Planning therefore keeps the existing 4-template model and treats the new behavior as 1-day logic with `clientType` branching rather than a new template-variant system.

---

*Discussion completed: 2026-04-11*
