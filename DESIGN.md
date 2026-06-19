# Design system

## Physical scene

A recruiter opens the portfolio on a laptop in a bright office between interviews; the page should feel like a precise instrument with strong contrast, immediate hierarchy, and no visual theatre delaying the facts.

## Direction

The “engineering observatory” identity remains: a dark, slightly tinted technical field, neutral light work surface, thin structural rules, and one coral signal color. The redesign removes cramped typography, ornamental grain, and reflexive motion.

## Tokens

- Background: near-black with a trace of the signal hue.
- Light surface: chroma-neutral off-white, never cream or beige.
- Text: high-contrast neutral white/black.
- Accent: coral signal used for actions, focus, current state, and live status.
- Lines: low-contrast structural separators rather than card shadows.
- Shape: square/technical geometry; radii stay at 0–12px.

## Typography

- Geist Sans for content and Geist Mono for technical labels and tools.
- Display ceiling: 6rem.
- Display tracking floor: -0.04em.
- Body measure: 65–75 characters.
- Headings use balanced wrapping; prose uses pretty wrapping.

## Motion

- Marketing entrance only: subtle 12–16px translation plus opacity, strong ease-out.
- Buttons: 120–160ms press feedback at scale(0.97).
- Repeated navigation and dashboard filtering: instant or color-only.
- Orbit motion is decorative and slow; reduced-motion disables it.
- Hover effects only for fine pointers.

## Public layout

Open editorial rails and full-width tools, not repeated card grids. Selected projects form one intentional numbered sequence because their order communicates priority. The repository explorer, compiler, and GPT remain functional tools rather than screenshots.

## Admin layout

A compact authenticated operations console: strong summary strip, readable time-series bars, sortable-looking tables, and distinct encrypted activity records. No decorative animation beyond a live-status pulse.

## Accessibility

- WCAG AA contrast for all body and placeholder text.
- Visible keyboard focus.
- Semantic headings and landmarks.
- Reduced-motion alternatives.
- 44px minimum touch targets where practical.
- No information communicated by color alone.
