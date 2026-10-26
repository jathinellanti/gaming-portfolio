# UI Spec: Professional site

The owner asked for continuous building without approval stops (2026-10-26). For each key component, three candidates were considered and one was picked. The alternatives are recorded below, so a different pick can be swapped in later.

## Product references (project-scoped)

| Reference | Captured in `~/.claude/design-library/` | Used for |
|---|---|---|
| Brittany Chiang (brittanychiang.com) | `captures/brittanychiang-home.png`, `notes/brittanychiang.md` | Recruiter-first portfolio structure, experience rows, tag pills, pointer spotlight |
| Linear Method | `captures/linear-method-dark.png`, `notes/linear.md` | Dark text ladder, whitespace-only section separation, body measure |
| SpaceX Starship | `captures/spacex-starship.png`, `notes/spacex.md` | Hero restraint: two type sizes, nothing boxed, one framed "instrument" |
| Magic UI Bento Grid (registry) | `captures/magicui-bento-grid.png`, `notes/magicui.md` | Uneven-span skills bento, masked visual area, hover lift |
| Aceternity Tracing Beam (registry) | `captures/aceternity-tracing-beam.png`, `notes/aceternity.md` | Timeline rail with a scroll-driven head |
| 21st.dev (searched via Magic MCP) | Timeline-01/02 (shadcnui-blocks), Bento Grid (kokonutd), Portfolio Hero | Confirmed patterns; no paid retrieval needed |

## REFERENCE NOTES

| Source | What is replicated |
|---|---|
| Brittany Chiang | The name is the biggest thing on screen; role and one-line pitch beneath. Only three sizes in the hero text column. |
| Brittany Chiang | Experience and education are **date-column rows**: a narrow mono uppercase date (`JUL 2022 — MAY 2026`) on the left, content on the right. No cards around rows. |
| Brittany Chiang | Tech tags are **tinted pills**: `--primary-soft` background with `--primary-text`. They are the only colour besides links and CTAs. |
| Brittany Chiang | A pointer-follow radial spotlight in the hero background. It is off on touch and on reduced motion. |
| Linear | Sections are separated by whitespace (96–128 px), never by boxes. A hairline appears only where two different kinds of thing meet. |
| Linear | Three-step text ladder: `--text` / `--text-dim` / `--text-faint`. Emphasis comes from weight and size, not colour. |
| Linear | Body measure is capped at 66ch, even on 1920 px screens. |
| SpaceX | Hero type uses two sizes only: display serif name plus a wide-tracked mono eyebrow. The one framed element is the "Realm" CTA (an instrument-like pill with a live dot). |
| Magic UI | Skills bento uses uneven spans (2+1, 1+2). Each tile: label on top, chip cloud fading out through a mask gradient, count at the bottom. |
| Aceternity | The education/experience rail is a hairline, and a scroll-progress head travels along it. |

## Picks (3 candidates each)

| Component | Picked | Alternatives considered | Why |
|---|---|---|---|
| Hero | **Split**: name, title, intro and CTAs left; isometric SVG poster of the three worlds right. Stacked below 1024 px. | (B) Name centred over a full-bleed poster (SpaceX); (C) whole page as a sticky left identity column with scrolling right column (Brittany) | Recruiters read name and title in under a second, and the poster sells the Realm without competing. (C) is too similar to a known template; (B) hides the CTAs. |
| Project card | **Large case-study rows**: visual left (stack mosaic, since no screenshots exist yet), text right. | (B) Bento tiles; (C) editorial list rows (number, title, year, arrow) | With two projects, big rows feel substantial. Bento with two items looks empty; list rows undersell the work. |
| Nav | **Full-width bar**: transparent at the top, blurred surface and hairline after scrolling. Links centred (≥1024 px), actions right; a sheet menu below. | (B) Floating centred pill; (C) sticky left rail | The floating pill is the most generic 2025 pattern. The left rail fights the split hero. |
| Skills | **Bento by category**, uneven spans | (B) Flat chip cloud; (C) table of category to skills | Bento shows grouping at a glance and lets the Engines tile carry the Unity certificate badge. |
| Timeline | **Date-column rows on a hairline rail** with a scroll head | (B) Alternating left/right timeline; (C) cards | (B) breaks on mobile; cards add boxes that Linear's notes rule out. |

## Tokens

These are defined in `src/site/styles/index.css` and exposed to Tailwind via `@theme inline`.

- **Colour roles:** `bg`, `surface-1/2/3`, `line`, `line-strong`, `ink`, `ink-dim`, `ink-faint`, `primary`, `primary-hover`, `on-primary`, `primary-soft`, `primary-text`, `success`, `danger`, `warning`, `focus`.
- **Accent:** a single **ember** accent: `#ff7a45` (dark theme) and `#c2410c` (light theme). Semantic colours are used only for states.
- **Type:**
  - Display: Instrument Serif 400.
  - Body: Geist Variable.
  - Mono and labels: Geist Mono Variable.
  - Fluid scale from `--step--1` to `--step-5`.
- **Spacing:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128.
- **Radius:** card 18, control 10, pill 999.
- **Shadow:** two levels, each with a 1 px inset top highlight.
- **Motion:** one easing curve, `cubic-bezier(0.2, 0, 0, 1)`, with durations of 150 / 200 / 250 ms. Reduced motion disables animation entirely.

### Measured contrast (WCAG 2.x)

| Pair | Dark | Light |
|---|---|---|
| text on bg / s1 / s2 / s3 | 17.0 / 16.1 / 15.2 / 13.9 | 15.9 / 17.4 / 14.7 / 13.4 |
| text-dim on bg / s1 / s2 / s3 | 7.8 / 7.4 / 7.0 / 6.4 | 7.2 / 7.9 / 6.7 / 6.1 |
| text-faint on bg / s1 / s2 / s3 | 6.0 / 5.7 / 5.4 / 4.9 | 5.8 / 6.4 / 5.4 / 4.9 |
| primary-text on bg / s1 / s2 / s3 | 9.5 / 8.9 / 8.4 / 7.7 | 6.1 / 6.7 / 5.6 / 5.1 |
| on-primary on primary | 7.4 | 5.0 |
| primary (UI) on bg | 7.6 | 4.6 |

Every text pair is ≥ 4.5. UI graphics are ≥ 3.

## Realm (World Select) visual language

The World Select screen is a game launcher. It shows three world cards, each with its own art direction. Card chrome uses the site tokens; the art inside each card uses the world palettes in `src/site/art/palette.ts`. Those are illustration colours, not UI tokens.
