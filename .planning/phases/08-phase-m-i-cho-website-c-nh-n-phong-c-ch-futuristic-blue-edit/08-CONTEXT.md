# Phase 8: Personal Website Visual System - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Define the visual system for a personal website that adapts the approved futuristic blue editorial tech poster style into web-ready design rules. This phase covers color, typography, surfaces, effects, component styling, and usage rules needed for downstream UI specification. It does not define page layout, content strategy, portfolio information architecture, or personal-brand copy.

</domain>

<decisions>
## Implementation Decisions

### Visual Tone
- **D-01:** Overall direction is **dark hero + light body** rather than fully dark or fully light.
- **D-02:** Hero keeps the strongest cinematic style with dark navy, electric blue gradient, and soft glow.
- **D-03:** Content sections shift to cooler light surfaces for readability while preserving blue accents.

### Color System
- **D-04:** Core brand colors stay centered on dark navy `#08101E`, deep blue `#0B2FAE`, electric blue `#1464F4`, and soft white `#F6F8FB`.
- **D-05:** Light sections should use cool white / blue-tinted whites such as `#EEF4FF` or `#F3F7FF`, not warm white.
- **D-06:** Electric blue remains accent color for CTA, active states, focus, hover glow, and key emphasis — not for long body copy.

### Typography
- **D-07:** Typography pairing is locked to **Space Grotesk** for headlines and **Inter** for body/UI text.
- **D-08:** Headlines use **mixed case**, not full uppercase, to keep the site premium and personal rather than overly aggressive.
- **D-09:** Headline weights should stay in the bold range (`700-800`), while body copy remains clean and readable.

### Texture and Effects
- **D-10:** Texture/effects level is **subtle**.
- **D-11:** Approved texture language: very light grain, faint grid, soft glow fields, and restrained digital overlays.
- **D-12:** Strong visual effects belong mainly in hero or accent zones, not across the whole website.
- **D-13:** Avoid neon-heavy glow, dense noise, hard shadows, or effect stacking that harms readability.

### UI Component Translation
- **D-14:** Component direction is **glass-dark** rather than solid-clean or bright-accent.
- **D-15:** Cards should use translucent or dark-tinted surfaces, soft borders, and soft shadow rather than flat solid blocks.
- **D-16:** Buttons should use `14-16px` radius for a modern but still controlled feel.
- **D-17:** Links, nav states, cards, and buttons should use subtle glow/fade motion only.

### Motion Rules
- **D-18:** Hover/motion intensity is **subtle**.
- **D-19:** Motion should be limited to small glow shifts, soft fade, and minimal translate/scale to preserve premium feel.
- **D-20:** Avoid exaggerated motion language that feels playful, noisy, or product-marketing heavy.

### Design Tokens
- **D-21:** Spacing scale should follow a simple web rhythm: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`.
- **D-22:** Radius direction should be moderately soft: buttons `14-16px`, cards around `20px`, pills fully rounded.
- **D-23:** Shadow system should stay soft and blurred rather than sharp: dark cards use deep soft shadow, light sections use lighter elevation only.
- **D-24:** Border language should be low-contrast and cool-toned, using blue-tinted translucent borders instead of hard gray lines.
- **D-25:** Glass surfaces should rely on subtle transparency and blur only where contrast remains safe; opacity and blur must stay restrained.
- **D-26:** Primary gradient direction should favor navy-to-electric-blue transitions, with radial glow overlays used only as support layers.

### Component Contract
- **D-27:** Navigation should feel minimal and premium: transparent or semi-transparent dark overlay above hero, calmer light treatment on body sections.
- **D-28:** Primary buttons use electric blue fill, white text, soft glow-on-hover, and no aggressive animation.
- **D-29:** Secondary buttons use glass/light-outline styling with cool borders and avoid competing with the primary CTA.
- **D-30:** Cards should carry the main glass-dark identity: soft shadow, subtle border, restrained highlight edge, and readable content contrast.
- **D-31:** Links should use cool blue or dark text depending on surface, with underline fade or glow-on-hover rather than bold color jumps.
- **D-32:** Input or form-like elements, if introduced later, should stay clean and low-noise — mostly light or lightly tinted surfaces, not heavy glass effects that reduce readability.
- **D-33:** Badges and micro-labels should feel technical/editorial through spacing and casing, not through loud fills or novelty colors.

### Readability Guardrails
- **D-34:** Long-form text must sit on stable high-contrast surfaces; never place paragraphs directly over strong glow fields.
- **D-35:** Hero can carry the highest visual energy, but downstream sections must step down in glow, texture, and contrast intensity.
- **D-36:** Texture must never compete with content — grain should be almost invisible, grid should stay faint, and halftone should remain accent-only.
- **D-37:** White text should primarily live on dark hero/dark surfaces; dark text should dominate on light body sections.
- **D-38:** Accent blue should guide focus, not flood the interface; avoid turning multiple adjacent elements into competing accents.
- **D-39:** Any decorative sparkle, cross marks, or micro-ornaments must remain sparse and geometric, never illustrative or playful.

### Component Priority List
- **D-40:** Component emphasis order is locked to **hero > nav > button > card > tag > input**.
- **D-41:** Hero is the primary visual anchor and carries the strongest combination of gradient, glow, editorial typography, and brand energy.
- **D-42:** Navigation is the second-priority layer: it must feel premium and precise, but visually calmer than hero so it frames rather than competes.
- **D-43:** Buttons are the third-priority emphasis point and carry the clearest accent-blue interaction signal after hero/nav.
- **D-44:** Cards are supportive structure, not the main spectacle — they should inherit polish from surface, border, and shadow rather than loud color.
- **D-45:** Tags/badges are micro-information only and should stay visually lighter than buttons and cards.
- **D-46:** Inputs are the lowest-priority component in this phase and should stay intentionally quiet, clean, and readability-first.

### Token Seed
- **D-47:** Token seed mode is **code-safe premium** — values should be implementation-ready while still preserving futuristic editorial polish.
- **D-48:** Seed color tokens should include: `bg-dark: #08101E`, `bg-deep: #0B2FAE`, `bg-accent: #1464F4`, `bg-light: #F6F8FB`, `bg-light-cool: #EEF4FF`, `text-strong: #0C172A`, `text-body: rgba(12,23,42,0.78)`, `text-on-dark: #F6F8FB`, `accent-soft: #7CB8FF`, `accent-light: #A9D0FF`.
- **D-49:** Seed border tokens should stay cool and subtle: dark-surface border around `rgba(169,208,255,0.18)` and light-surface border around `rgba(20,100,244,0.14)`.
- **D-50:** Seed shadow tokens should include one dark card shadow (`0 12px 30px rgba(0,0,0,0.22)`), one light elevation shadow (`0 10px 30px rgba(11,47,174,0.08)`), and one glow shadow (`0 0 40px rgba(124,184,255,0.18)`).
- **D-51:** Seed radius tokens should include `button: 16px`, `card: 20px`, `pill: 999px`, and no ultra-sharp corner style.
- **D-52:** Seed surface tokens should include a dark glass surface near `rgba(8,16,30,0.72)` and a light glass surface near `rgba(255,255,255,0.72)` only where contrast remains safe.
- **D-53:** Seed gradient tokens should prioritize a hero gradient close to `linear-gradient(135deg, #08101E 0%, #0B2FAE 48%, #1464F4 100%)` plus a restrained glow overlay rather than multi-color gradients.
- **D-54:** Seed motion tokens should stay subtle: hover translate around `-2px` max, transition duration around `180-240ms`, and no springy/bouncy interaction language.

### Component-Specific Priority Notes
- **D-55:** Hero styling should receive first-class token richness: strongest gradient, largest headline scale, most visible glow support, and strict readability separation for body text.
- **D-56:** Nav styling should use premium restraint: semi-transparent dark overlay on hero, calmer light adaptation on body sections, subtle active-state glow or underline only.
- **D-57:** Button styling should split clearly: primary = electric blue emphasis, secondary = outline/glass restraint, tertiary/text = minimal and low-drama.
- **D-58:** Card styling should emphasize polished container quality: readable surface contrast, subtle border, restrained shadow, and optional soft top-edge highlight only.
- **D-59:** Tag styling is locked to **thin technical label** — light border, compact padding, editorial-tech casing, minimal fill, no playful pill-heavy look.
- **D-60:** Input styling is locked to **low-priority clean-light** — mostly light surface, dark readable text, subtle blue focus ring, and no strong glow/glass treatment.

### Claude's Discretion
- Exact token naming scheme for CSS/Tailwind variables.
- Exact opacity values for borders, glow layers, and glass surfaces, as long as readability guardrails hold.
- Exact scale values for hover transforms as long as they remain subtle.
- Exact shadcn component mapping for later implementation, as long as it follows the component contract above.
- Exact token alias layering (`primitive` vs `semantic`) as long as the seed values above remain the default visual source of truth.

</decisions>

<specifics>
## Specific Ideas

- Approved design formula: **dark cinematic hero + light clean content + electric blue accents + subtle digital texture + editorial headline + soft motion**.
- User wants the website to feel modern, creative, premium, digital-first, and personal — not cyberpunk, not noisy, not layout-driven.
- Style source is a futuristic blue editorial tech poster / personal branding visual translated into a reusable website system.
- Focus explicitly excludes layout, content hierarchy, human analysis, and component arrangement strategy.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase definition
- `.planning/ROADMAP.md` — Phase 8 goal, success criteria, and out-of-scope boundary for the personal website visual system.
- `.planning/STATE.md` — Records why Phase 8 was added and how it is scoped.

### Style decisions captured from discussion
- `.planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-CONTEXT.md` — Locked visual decisions for color, typography, effects, and UI translation.

### UI contract reference pattern
- `.planning/phases/03-structured-ai-extraction-rules-human-review/03-UI-SPEC.md` — Existing example of how this project structures a UI design contract.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing `.planning/phases/*/*-UI-SPEC.md` files: reference format for UI contracts, spacing tables, typography sections, and interaction rules.
- Current project uses Next.js + TypeScript + shadcn/ui patterns per existing planning artifacts, which gives downstream UI work a known component baseline.

### Established Patterns
- UI phases in this repo define visual direction through `UI-SPEC.md` documents before implementation.
- Design rules in this project are typically captured as explicit tokens, component rules, copy rules, and state contracts rather than vague inspiration.

### Integration Points
- `/gsd-ui-phase 8` should use this context to generate `08-UI-SPEC.md` inside `.planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/`.
- Any later implementation phase should treat Phase 8 as the source of truth for tokens, component styling, and effect intensity.

</code_context>

<deferred>
## Deferred Ideas

- Page layout exploration for homepage/about/projects/contact sections.
- Content strategy, portfolio structure, and copywriting voice.
- Personal brand messaging and section ordering.
- Full website implementation and responsive layout build.

</deferred>

---

*Phase: 08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit*
*Context gathered: 2026-04-22*
