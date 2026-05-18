# Phase 8: Personal Website Visual System - Research

**Researched:** 2026-04-22
**Domain:** Next.js App Router visual system implementation on top of existing shadcn/ui + Tailwind CSS v4 stack [VERIFIED: package.json] [VERIFIED: components.json]
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)
- Page layout exploration for homepage/about/projects/contact sections.
- Content strategy, portfolio structure, and copywriting voice.
- Personal brand messaging and section ordering.
- Full website implementation and responsive layout build.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PW-UI-01 | Lock the visual direction around dark hero + light body sections, cool white surfaces, and electric-blue accents. [VERIFIED: .planning/ROADMAP.md] | Token strategy, semantic color mapping, and component surface rules below define exactly where this split lives (`globals.css` tokens first, primitives second). [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md] |
| PW-UI-02 | Lock typography to Space Grotesk for headlines and Inter for body copy, with clear casing, weight, and readability rules. [VERIFIED: .planning/ROADMAP.md] | Root layout font loading via `next/font/google` plus semantic font tokens is the standard implementation path in this stack. [VERIFIED: Context7 /vercel/next.js docs] |
| PW-UI-03 | Define reusable component behavior for navigation, buttons, cards, links, and hover states. [VERIFIED: .planning/ROADMAP.md] | Existing shadcn primitives (`button`, `card`, `badge`, `input`, `sheet`, `tooltip`, `alert`) are already present and should be restyled instead of replaced. [VERIFIED: components.json] [VERIFIED: src/components/ui/*] |
| PW-UI-04 | Specify restrained rules for texture, glow, gradients, borders, and shadows so the UI stays premium and readable. [VERIFIED: .planning/ROADMAP.md] | Tailwind v4 theme variables + semantic CSS tokens let the phase centralize effects in one system instead of scattering values through page-level classes. [CITED: https://tailwindcss.com/docs/theme] [CITED: https://ui.shadcn.com/docs/theming] |
| PW-UI-05 | Produce enough visual/system detail for `/gsd-ui-phase 8` and later UI planning without re-opening foundational style questions. [VERIFIED: .planning/ROADMAP.md] | Planner should split work into token layer, font/layout wiring, primitive restyling, proof surface, and verification tasks. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-CONTEXT.md] [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md] |
| PW-UI-06 | Keep layout composition, content strategy, and personal-brand copywriting out of scope. [VERIFIED: .planning/ROADMAP.md] | Research explicitly scopes changes to tokens, fonts, primitives, and proofing; page IA and marketing copy remain deferred. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-CONTEXT.md] |
</phase_requirements>

## Summary

Phase 8 should be planned as a design-system implementation pass on the existing Next.js App Router stack, not as a new frontend architecture or page-build phase. The repo already has the right baseline for this work: Next.js App Router, React 19, Tailwind CSS v4, shadcn/ui with CSS variables enabled, and Radix-backed primitives already checked into `src/components/ui`. [VERIFIED: package.json] [VERIFIED: components.json] [VERIFIED: src/components/ui/button.tsx] [VERIFIED: src/components/ui/card.tsx] [VERIFIED: src/components/ui/badge.tsx] [VERIFIED: src/components/ui/input.tsx]

The approved phase artifacts already lock almost every visual decision that matters: dark hero + light body, Space Grotesk + Inter, restrained texture/motion, semantic token seed values, and component emphasis order. Planning should therefore focus on implementation sequencing, file ownership, and verification strategy rather than more design exploration. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-CONTEXT.md] [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md]

The cleanest implementation path is: wire fonts in `src/app/layout.tsx`, replace the current neutral/light semantic tokens in `src/app/globals.css`, then restyle the existing shadcn primitives so buttons/cards/badges/inputs express the locked visual system consistently. This avoids new dependencies, preserves accessible Radix behavior, and keeps downstream UI phases on a stable base. [VERIFIED: src/app/layout.tsx] [VERIFIED: src/app/globals.css] [CITED: https://ui.shadcn.com/docs/theming] [CITED: https://www.radix-ui.com/primitives/docs/guides/styling] [VERIFIED: package.json]

**Primary recommendation:** Plan Phase 8 as five deliverables in order: token layer, font/layout wiring, shared primitive restyling, optional proof surface, and verification coverage. [VERIFIED: src/app/layout.tsx] [VERIFIED: src/app/globals.css] [VERIFIED: src/components/ui/*]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Semantic design tokens and surface colors | Browser / Client [ASSUMED] | Frontend Server (SSR) [ASSUMED] | Tokens are consumed by CSS in the browser, but the root stylesheet is emitted by the Next.js app shell. [VERIFIED: src/app/globals.css] |
| Font loading and global font variables | Frontend Server (SSR) [VERIFIED: Context7 /vercel/next.js docs] | Browser / Client [ASSUMED] | `next/font/google` is configured in App Router layout and applied at the root HTML/body boundary. [VERIFIED: Context7 /vercel/next.js docs] |
| Shared primitive visual styling | Browser / Client [VERIFIED: src/components/ui/button.tsx] | Frontend Server (SSR) [ASSUMED] | Button/card/badge/input class output ultimately styles client-visible DOM; the shared source lives in server-rendered React components. [VERIFIED: src/components/ui/button.tsx] [VERIFIED: src/components/ui/card.tsx] [VERIFIED: src/components/ui/badge.tsx] [VERIFIED: src/components/ui/input.tsx] |
| Motion, focus, hover, and interactive states | Browser / Client [CITED: https://www.radix-ui.com/primitives/docs/guides/styling] | — | Radix exposes state via `data-state` and native interaction semantics are expressed in browser-rendered UI. [CITED: https://www.radix-ui.com/primitives/docs/guides/styling] |
| Visual proof page / showcase validation | Frontend Server (SSR) [ASSUMED] | Browser / Client [ASSUMED] | A proof route would be rendered by Next.js and inspected in the browser; this is a planning convenience, not a separate backend concern. [ASSUMED] |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | Repo: `^15.3.1`; latest npm: `16.2.4` published 2026-04-15. [VERIFIED: package.json] [VERIFIED: npm registry] | App Router shell, root layout, global CSS, metadata, and `next/font` integration. [VERIFIED: src/app/layout.tsx] [VERIFIED: Context7 /vercel/next.js docs] | The project already runs on Next.js App Router, and official docs show font + metadata wiring belongs in layout instead of ad hoc page code. [VERIFIED: package.json] [VERIFIED: Context7 /vercel/next.js docs] |
| React | Repo: `^19.1.0`; latest npm: `19.2.5` published 2026-04-08. [VERIFIED: package.json] [VERIFIED: npm registry] | Component composition for shared UI primitives and any proof surface. [VERIFIED: package.json] | Existing primitives and app shell are already React-based, so Phase 8 should restyle rather than re-platform. [VERIFIED: src/components/ui/button.tsx] |
| Tailwind CSS v4 | Repo: `^4.2.2`; latest npm: `4.2.4` published 2026-04-21. [VERIFIED: package.json] [VERIFIED: npm registry] | CSS-first token system through `@theme` and utility generation. [VERIFIED: src/app/globals.css] [CITED: https://tailwindcss.com/docs/theme] | Tailwind v4 makes theme variables a first-class token layer, which matches this phase’s semantic-token-first goal. [CITED: https://tailwindcss.com/docs/theme] |
| shadcn/ui | Registry-based setup; `components.json` confirms `new-york`, `neutral`, `cssVariables: true`, `lucide`. [VERIFIED: components.json] | Shared design-system primitive source for button/card/badge/input/sheet/tooltip/alert. [VERIFIED: components.json] | Official theming guidance expects token overrides in CSS, so this phase can restyle centrally without replacing primitives. [CITED: https://ui.shadcn.com/docs/theming] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-slot` | Repo: `^1.2.4`; latest npm: `1.2.4` published 2025-11-04. [VERIFIED: package.json] [VERIFIED: npm registry] | `asChild` composition in buttons and other primitive wrappers. [VERIFIED: src/components/ui/button.tsx] | Keep when extending shared primitives without changing semantics. [VERIFIED: src/components/ui/button.tsx] |
| `@radix-ui/react-dialog` | Repo: `^1.1.15`; latest npm: `1.1.15` published 2025-08-13. [VERIFIED: package.json] [VERIFIED: npm registry] | Base behavior for overlays such as sheet/dialog if nav overlay proofing is needed. [VERIFIED: package.json] | Reuse for future premium nav/surface overlays instead of custom dialog logic. [CITED: https://www.radix-ui.com/primitives/docs/guides/styling] |
| `lucide-react` | Repo: `^1.7.0`; latest npm: `1.8.0` published 2026-04-09. [VERIFIED: package.json] [VERIFIED: npm registry] | Consistent icon set for nav, CTAs, and technical micro-labels. [VERIFIED: package.json] | Keeps icon language aligned with the existing shadcn preset and avoids ad hoc SVG drift. [VERIFIED: components.json] |
| `sonner` | Repo: `^2.0.3`. [VERIFIED: package.json] | Existing toast surface already mounted in root layout. [VERIFIED: src/app/layout.tsx] | Use only if Phase 8 touches global feedback styling; do not introduce a second feedback system. [VERIFIED: src/app/layout.tsx] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing shadcn/Radix primitives [VERIFIED: src/components/ui/*] | A second component library such as MUI or Chakra [ASSUMED] | Adds migration cost, duplicate design APIs, and breaks the repo’s current primitive baseline without solving a Phase 8 requirement. [VERIFIED: src/components/ui/*] [ASSUMED] |
| `next/font/google` in root layout [VERIFIED: Context7 /vercel/next.js docs] | Manual `<link>`/`@import` webfont loading [ASSUMED] | Official Next.js guidance already supports self-hosted font loading via layout wiring, which is cleaner and more deterministic for this stack. [VERIFIED: Context7 /vercel/next.js docs] |
| Tailwind v4 `@theme` + shadcn CSS variables [CITED: https://tailwindcss.com/docs/theme] [CITED: https://ui.shadcn.com/docs/theming] | Scattered hex values in component classes [ASSUMED] | Central tokens keep the visual system reusable and prevent value drift across primitives. [CITED: https://ui.shadcn.com/docs/theming] |

**Installation:**
```bash
# No new npm dependencies are required for the planned Phase 8 implementation.
# Reuse the existing Next.js + Tailwind v4 + shadcn/ui stack already in the repo.
```

**Version verification:** Current recommended upstream versions were verified from the npm registry during this research: Next.js `16.2.4` (2026-04-15), React `19.2.5` (2026-04-08), Tailwind CSS `4.2.4` (2026-04-21), lucide-react `1.8.0` (2026-04-09), `@radix-ui/react-slot` `1.2.4` (2025-11-04), and `@radix-ui/react-dialog` `1.1.15` (2025-08-13). [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Locked decisions (08-CONTEXT.md + 08-UI-SPEC.md)
                |
                v
      src/app/globals.css
  semantic tokens + @theme bridge
                |
                +--------------------+
                |                    |
                v                    v
      src/app/layout.tsx      src/components/ui/*
   root fonts + html/body      shared primitives
                |                    |
                +---------+----------+
                          |
                          v
            Proof surface / downstream pages
          consume tokens, fonts, variants, states
                          |
                          v
             Playwright + review verification
```

The primary data flow for this phase is decision artifacts -> token layer -> root layout + primitives -> proof surface -> verification. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-CONTEXT.md] [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md] [VERIFIED: src/app/layout.tsx] [VERIFIED: src/app/globals.css]

### Recommended Project Structure
```text
src/
├── app/
│   ├── layout.tsx          # Root font variables, html/body hooks, metadata-safe shell
│   └── globals.css         # Semantic tokens, @theme mapping, global surfaces/effects
├── components/
│   ├── ui/                 # Restyled shadcn primitives: button/card/badge/input/sheet/tooltip/alert
│   └── personal-site/      # Optional proof-only showcase surface for Phase 8 verification [ASSUMED]
└── tests/
    └── e2e/                # Playwright checks for token application and component state behavior [ASSUMED]
```

### Pattern 1: Semantic token override in `globals.css`
**What:** Keep shadcn semantic tokens as the contract, but replace their values with the locked premium futuristic-blue system. [CITED: https://ui.shadcn.com/docs/theming] [VERIFIED: src/app/globals.css]
**When to use:** First task in the phase, before any primitive-specific restyling. [VERIFIED: src/app/globals.css]
**Example:**
```css
/* Source: https://tailwindcss.com/docs/theme */
@import "tailwindcss";

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
}
```

### Pattern 2: Root font variables in App Router layout
**What:** Load Inter and Space Grotesk through `next/font/google` and expose them as CSS variables at the root layout. [VERIFIED: Context7 /vercel/next.js docs]
**When to use:** As part of the root shell update in `src/app/layout.tsx`. [VERIFIED: src/app/layout.tsx]
**Example:**
```tsx
// Source: https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/02-components/font.mdx
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})
```

### Pattern 3: Restyle primitives without replacing Radix behavior
**What:** Keep primitive structure and target classes/state attributes for visuals. [CITED: https://www.radix-ui.com/primitives/docs/guides/styling]
**When to use:** For buttons, overlays, hover/focus states, and any future nav overlay using Radix-backed primitives. [VERIFIED: src/components/ui/button.tsx] [VERIFIED: package.json]
**Example:**
```css
/* Source: https://www.radix-ui.com/primitives/docs/guides/styling */
.Trigger[data-state="open"] {
  border-color: var(--color-accent);
}
```

### Anti-Patterns to Avoid
- **Per-page hardcoded colors:** Do not sprinkle raw hex values across hero/card/button instances; centralize them in semantic tokens. [CITED: https://ui.shadcn.com/docs/theming]
- **New component-library churn:** Do not introduce a second UI library just to style hero/button/card surfaces. [VERIFIED: src/components/ui/*] [ASSUMED]
- **Font wiring outside layout:** Do not mix Google Font `<link>` tags with App Router font variables when official Next.js docs already support layout-level font loading. [VERIFIED: Context7 /vercel/next.js docs]
- **Effect stacking in one component:** The UI contract already forbids stacking grain + strong grid + strong glow + heavy shadow in one local area. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md]
- **Scope drift into page IA/copy:** Layout composition and personal-brand messaging are explicitly deferred. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webfont loading | Manual `<link>` + preload + fallback management [ASSUMED] | `next/font/google` in `src/app/layout.tsx` [VERIFIED: Context7 /vercel/next.js docs] | Next.js App Router docs already provide the supported path for self-hosted font variables at the root. [VERIFIED: Context7 /vercel/next.js docs] |
| Accessible interactive primitives | Custom button/dialog/sheet accessibility logic [ASSUMED] | Existing shadcn + Radix primitives already in `src/components/ui` [VERIFIED: src/components/ui/*] | Radix keeps accessibility and state semantics while Phase 8 focuses on visuals. [CITED: https://www.radix-ui.com/primitives/docs/guides/styling] |
| Token-to-utility plumbing | A bespoke token compiler or separate design-token runtime [ASSUMED] | Tailwind v4 `@theme` plus shadcn semantic CSS variables [CITED: https://tailwindcss.com/docs/theme] [CITED: https://ui.shadcn.com/docs/theming] | The stack already supports CSS-first token generation and semantic utility mapping. [CITED: https://tailwindcss.com/docs/theme] |
| Icon system | One-off inline SVGs for each proof component [ASSUMED] | `lucide-react` already aligned with the repo preset [VERIFIED: components.json] [VERIFIED: package.json] | Keeps icon language consistent and lowers visual drift. [VERIFIED: components.json] |

**Key insight:** This phase is mostly translation, not invention: translate locked visual decisions into the repo’s existing token + primitive system, and avoid solving solved infrastructure again. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-CONTEXT.md] [VERIFIED: components.json]

## Common Pitfalls

### Pitfall 1: Token drift between `:root` and `@theme inline`
**What goes wrong:** Colors/radii/fonts look correct in some utilities but not others because semantic HSL variables and Tailwind-generated utilities stop matching. [VERIFIED: src/app/globals.css] [CITED: https://tailwindcss.com/docs/theme]
**Why it happens:** Tailwind v4 utilities are generated from `@theme`, while the repo also keeps semantic CSS variables in `:root`. [VERIFIED: src/app/globals.css] [CITED: https://tailwindcss.com/docs/theme]
**How to avoid:** Update semantic values and the `@theme inline` bridge together in the same task. [VERIFIED: src/app/globals.css]
**Warning signs:** `bg-background` and direct CSS variable usage stop matching visually. [ASSUMED]

### Pitfall 2: Restyling primitives instance-by-instance
**What goes wrong:** Buttons/cards/badges drift into inconsistent radii, shadows, and focus treatments across the site. [ASSUMED]
**Why it happens:** Developers patch individual screens instead of the shared primitive source files already present in `src/components/ui`. [VERIFIED: src/components/ui/*]
**How to avoid:** Treat `src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, and `input.tsx` as the implementation center of gravity. [VERIFIED: src/components/ui/button.tsx] [VERIFIED: src/components/ui/card.tsx] [VERIFIED: src/components/ui/badge.tsx] [VERIFIED: src/components/ui/input.tsx]
**Warning signs:** Repeated long `className` overrides appear on consuming pages just to recover the same premium look. [ASSUMED]

### Pitfall 3: Beautiful but unreadable dark surfaces
**What goes wrong:** Glow, blur, and glass effects reduce paragraph contrast or make inputs feel decorative instead of usable. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-CONTEXT.md] [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md]
**Why it happens:** The approved poster inspiration is stronger than normal product UI, so over-translation into every component is tempting. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-CONTEXT.md]
**How to avoid:** Keep the hero as the highest-energy zone and make inputs/body-reading surfaces intentionally quieter. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md]
**Warning signs:** White body text appears on bright glow blooms, or inputs start using dark glass by default. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md]

### Pitfall 4: Phase validation coverage is weaker than normal UI work
**What goes wrong:** The team ships token/component changes without a dependable way to confirm hero/body split, font wiring, focus states, and component hierarchy. [VERIFIED: vitest.config.ts] [VERIFIED: playwright.config.ts]
**Why it happens:** Current Vitest config is `environment: "node"`, so it is not ready for DOM-heavy component rendering assertions by itself. [VERIFIED: vitest.config.ts]
**How to avoid:** Use Playwright for phase-level UI smoke checks and keep Vitest for non-DOM helpers only unless the test stack is expanded. [VERIFIED: playwright.config.ts] [VERIFIED: vitest.config.ts]
**Warning signs:** Verification relies only on eyeballing `globals.css` diffs. [ASSUMED]

## Code Examples

Verified patterns from official sources:

### Root layout font variables
```tsx
// Source: https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/02-components/font.mdx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})
```

### Tailwind v4 token declaration
```css
/* Source: https://tailwindcss.com/docs/theme */
@import "tailwindcss";

@theme {
  --font-poppins: Poppins, sans-serif;
  --color-mint-500: oklch(0.72 0.11 178);
}
```

### Radix state-based styling hook
```css
/* Source: https://www.radix-ui.com/primitives/docs/guides/styling */
.AccordionItem {
  border-bottom: 1px solid gainsboro;
}

.AccordionItem[data-state="open"] {
  border-bottom-color: blue;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Theme tokens defined mainly in JS config extensions [ASSUMED] | Tailwind CSS v4 defines theme variables in CSS through `@theme`. [CITED: https://tailwindcss.com/docs/theme] | Tailwind CSS v4. [CITED: https://tailwindcss.com/docs/theme] | Phase 8 token work should live in CSS next to `globals.css`, which matches the repo’s current setup. [VERIFIED: src/app/globals.css] |
| Ad hoc font loading patterns [ASSUMED] | App Router docs show root-layout font loading with `next/font`. [VERIFIED: Context7 /vercel/next.js docs] | Current App Router docs. [VERIFIED: Context7 /vercel/next.js docs] | Plan font work as a layout concern, not a component concern. [VERIFIED: src/app/layout.tsx] |

**Deprecated/outdated:**
- Tailwind-token planning that assumes `tailwind.config.js` is the only theme source is outdated for this repo’s Tailwind v4 setup. [VERIFIED: src/app/globals.css] [CITED: https://tailwindcss.com/docs/theme]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Semantic design tokens are best modeled as primarily Browser / Client responsibility with SSR as secondary. | Architectural Responsibility Map | Low — task sequencing still largely stays the same. |
| A2 | A proof-only showcase surface/route is optional but useful for this phase. | Architectural Responsibility Map; Recommended Project Structure | Medium — planner may instead choose pure primitive/token edits without a showcase route. |
| A3 | Repeated instance-level class overrides would be the main warning sign of primitive drift. | Common Pitfalls | Low — still a useful heuristic, but not the only one. |
| A4 | Some alternatives in the stack comparison (manual font links, second UI library, bespoke token compiler) are plausible options but were not observed in this repo. | Alternatives Considered; Don’t Hand-Roll | Low — recommendation to avoid them still stands. |

## Open Questions (RESOLVED)

1. **Does Phase 8 need an internal proof page/route, or only shared token/primitive changes? — RESOLVED**
   - Resolution: Có proof surface kỹ thuật để validate contract, nhưng tái sử dụng route hiện có (`src/app/(app)/history/page.tsx`) thay vì mở route marketing mới.
   - Scope guard: Proof surface chỉ phục vụ kiểm chứng design-system (tokens/primitives/nav-link states), không mở rộng IA/layout strategy/copywriting. [VERIFIED: 08-03-PLAN.md]

2. **Should `metadata.title` and `metadata.description` change in this phase? — RESOLVED**
   - Resolution: Không thay đổi metadata trong Phase 8; giữ nguyên vì đây là phase design-system-first.
   - Scope guard: Metadata/copy thương hiệu được defer sang phase website implementation/content riêng, chỉ sửa khi có user decision rõ ràng. [VERIFIED: 08-01-PLAN.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js/Tailwind build and local verification | ✓ [VERIFIED: local shell] | `v22.19.0` [VERIFIED: local shell] | — |
| npm | Install/test scripts | ✓ [VERIFIED: local shell] | `10.9.3` [VERIFIED: local shell] | — |
| npx | Context7 CLI fallback and local utility commands | ✓ [VERIFIED: local shell] | `10.9.3` [VERIFIED: local shell] | — |
| Git | Normal repo workflow | ✓ [VERIFIED: local shell] | `2.53.0` [VERIFIED: local shell] | — |
| Docker | Optional local environment parity only | ✓ [VERIFIED: local shell] | `29.3.1` [VERIFIED: local shell] | Not required for Phase 8 implementation. [VERIFIED: package.json] |

**Missing dependencies with no fallback:**
- None found in this research. [VERIFIED: local shell]

**Missing dependencies with fallback:**
- None found in this research. [VERIFIED: local shell]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright `^1.52.0` for UI validation; Vitest `^4.1.1` remains available for non-DOM unit checks. [VERIFIED: package.json] [VERIFIED: vitest.config.ts] [VERIFIED: playwright.config.ts] |
| Config file | `/home/minhnhut_dev/projects/siletravel/playwright.config.ts` [VERIFIED: playwright.config.ts] |
| Quick run command | `npx playwright test tests/e2e/personal-website-visual-system.spec.ts --project=chromium` [ASSUMED] |
| Full suite command | `npm run test && npm run test:e2e` [VERIFIED: package.json] |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PW-UI-01 | Hero/body surface split, cool whites, accent-blue semantics stay locked. [VERIFIED: .planning/ROADMAP.md] | e2e smoke [ASSUMED] | `npx playwright test tests/e2e/personal-website-visual-system.spec.ts -g "surface split"` [ASSUMED] | ❌ Wave 0 |
| PW-UI-02 | Space Grotesk/Inter root font wiring is applied through layout hooks. [VERIFIED: .planning/ROADMAP.md] | e2e smoke [ASSUMED] | `npx playwright test tests/e2e/personal-website-visual-system.spec.ts -g "font contract"` [ASSUMED] | ❌ Wave 0 |
| PW-UI-03 | Shared button/card/badge/input variants express the locked hierarchy consistently. [VERIFIED: .planning/ROADMAP.md] | e2e smoke [ASSUMED] | `npx playwright test tests/e2e/personal-website-visual-system.spec.ts -g "primitive variants"` [ASSUMED] | ❌ Wave 0 |
| PW-UI-04 | Focus, hover, glow, and shadow effects remain restrained and readable. [VERIFIED: .planning/ROADMAP.md] | e2e smoke [ASSUMED] | `npx playwright test tests/e2e/personal-website-visual-system.spec.ts -g "state effects"` [ASSUMED] | ❌ Wave 0 |
| PW-UI-05 | The phase ships enough visual-system detail for downstream UI work. [VERIFIED: .planning/ROADMAP.md] | manual review | Manual artifact review against `08-UI-SPEC.md` + proof surface [ASSUMED] | ❌ Wave 0 |
| PW-UI-06 | Layout/content/copywriting scope remains deferred. [VERIFIED: .planning/ROADMAP.md] | manual review | Manual diff review for scope boundaries [ASSUMED] | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Run the targeted Playwright spec for the touched visual-system area once a proof surface exists. [ASSUMED]
- **Per wave merge:** Run `npm run test && npm run test:e2e`. [VERIFIED: package.json]
- **Phase gate:** Full suite green plus manual contract review against `08-CONTEXT.md` and `08-UI-SPEC.md`. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-CONTEXT.md] [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md]

### Wave 0 Gaps
- [ ] `tests/e2e/personal-website-visual-system.spec.ts` — phase-specific visual-system smoke coverage is missing. [ASSUMED]
- [ ] A proof surface/route for deterministic UI assertions if the planner chooses that strategy. [ASSUMED]
- [ ] DOM-capable unit-test expansion if the team wants component-level assertions in Vitest; current Vitest config is Node-only. [VERIFIED: vitest.config.ts]

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no [VERIFIED: phase scope docs] | Existing auth stack remains untouched in this phase. [VERIFIED: .planning/ROADMAP.md] |
| V3 Session Management | no [VERIFIED: phase scope docs] | Existing session behavior remains untouched in this phase. [VERIFIED: .planning/ROADMAP.md] |
| V4 Access Control | no [VERIFIED: phase scope docs] | No new authorization surface is introduced by a visual-system-only phase. [VERIFIED: .planning/ROADMAP.md] |
| V5 Input Validation | yes [ASSUMED] | Preserve existing semantic error/destructive styles and do not weaken form/readability cues on shared inputs. [VERIFIED: src/components/ui/input.tsx] [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md] |
| V6 Cryptography | no [VERIFIED: phase scope docs] | No crypto changes belong to this phase. [VERIFIED: .planning/ROADMAP.md] |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Styling hides focus-visible state on custom controls [ASSUMED] | Spoofing [ASSUMED] | Keep visible accent focus rings with accessible contrast on both dark and light surfaces. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md] |
| Disabled/destructive states become visually ambiguous after restyling [ASSUMED] | Spoofing [ASSUMED] | Preserve separate destructive token semantics and native/Radix disabled behavior while adjusting visuals. [VERIFIED: src/components/ui/button.tsx] [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md] |
| Decorative dark-glass surfaces reduce readability of important content [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-CONTEXT.md] | Information Disclosure [ASSUMED] | Keep long-form text and inputs on stable high-contrast surfaces; reserve strongest effects for hero/accent zones. [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md] |

## Sources

### Primary (HIGH confidence)
- [Next.js App Router font + metadata docs via Context7](https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/02-components/font.mdx) - font variables in root layout; metadata export in App Router
- [Tailwind CSS v4 theme docs](https://tailwindcss.com/docs/theme) - `@theme`, CSS-first tokens, utility generation
- [shadcn/ui theming docs](https://ui.shadcn.com/docs/theming) - CSS variable theming and semantic token overrides
- [Radix Primitives styling guide](https://www.radix-ui.com/primitives/docs/guides/styling) - `className`, `data-state`, styling ownership
- [Next npm package](https://www.npmjs.com/package/next) - latest version + publish date verified via `npm view`
- [React npm package](https://www.npmjs.com/package/react) - latest version + publish date verified via `npm view`
- [Tailwind CSS npm package](https://www.npmjs.com/package/tailwindcss) - latest version + publish date verified via `npm view`
- [lucide-react npm package](https://www.npmjs.com/package/lucide-react) - latest version + publish date verified via `npm view`
- [@radix-ui/react-slot npm package](https://www.npmjs.com/package/@radix-ui/react-slot) - latest version + publish date verified via `npm view`
- [@radix-ui/react-dialog npm package](https://www.npmjs.com/package/@radix-ui/react-dialog) - latest version + publish date verified via `npm view`

### Secondary (MEDIUM confidence)
- Local codebase evidence: `package.json`, `components.json`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/ui/*`, `vitest.config.ts`, `playwright.config.ts`
- Local planning evidence: `08-CONTEXT.md`, `08-UI-SPEC.md`, `ROADMAP.md`, `STATE.md`

### Tertiary (LOW confidence)
- None. Low-confidence ideas are isolated in the Assumptions Log instead of being treated as sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - the stack is directly observable in the repo and cross-checked with official docs/npm registry. [VERIFIED: package.json] [VERIFIED: components.json] [VERIFIED: npm registry]
- Architecture: HIGH - file ownership and App Router/theming patterns are clear from repo structure plus official docs. [VERIFIED: src/app/layout.tsx] [VERIFIED: src/app/globals.css] [CITED: https://tailwindcss.com/docs/theme] [CITED: https://ui.shadcn.com/docs/theming]
- Pitfalls: MEDIUM - most pitfalls are strongly supported by the locked UI contract and current test setup, but a few warning signs remain heuristic. [VERIFIED: vitest.config.ts] [VERIFIED: .planning/phases/08-phase-m-i-cho-website-c-nh-n-phong-c-ch-futuristic-blue-edit/08-UI-SPEC.md] [ASSUMED]

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 for repo-structure findings; re-check npm/doc versions sooner if the phase starts after that. [VERIFIED: npm registry]