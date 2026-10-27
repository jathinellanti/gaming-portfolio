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
| Robin Noguier (robin-noguier.com) | `captures/robinnoguier-home.png`, `notes/portfolios-2026-10.md` | Project images as large planes tilted in perspective |
| Dennis Snellenberg (dennissnellenberg.com) | `captures/dennissnellenberg-home.png`, `captures/dennissnellenberg-work.png`, `notes/portfolios-2026-10.md` | Image-led work presentation; photography carries the mood |
| Linear home (linear.app) | `captures/linear-features.png`, `notes/portfolios-2026-10.md` | Mono `FIG 0.1` captions on figures |
| Pinterest portfolio boards + the owner's two reference images (2026-10-27) | `captures/pinterest-portfolios-0..3.jpg`, `notes/pinterest-portfolios.md` | **The current layout**: condensed chrome headlines, stat strip, featured-work cards, capabilities + tools grid, table of contents, character cards, CTA banner |
| Henry Heffernan, Bruno Simon, Jesse Zhou (3D portfolios) | `captures/henryheffernan-home.png`, `captures/bruno-simon-home.png`, `captures/jessezhou-home.png` | All three gate the 3D behind a Start screen. We keep the CV readable first and put the worlds behind the Realm CTA. |

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
| Robin Noguier | Projects lead with big image planes in perspective (`rotateX/Y`), which straighten on hover. Here: real screenshots in browser windows, tilted over a tinted photo. |
| Dennis Snellenberg | Photography sets the mood, not decoration boxes. Here: each section gets its own duotoned, masked photo, fading out under the text column. |
| Linear | Figures carry a mono `FIG 01` caption. Here: the project page's Screens gallery. |
| Owner ref "DIGITAL DESIGNER" | Hero: the name in 2 lines of condensed uppercase (Anton) with a brushed-chrome fill, over the key-art carousel. A 4-tile stat strip overlaps the hero's foot; every number is counted from content. |
| Owner ref "DIGITAL DESIGNER" | Section headers are a label row (`02 / PROJECTS` + hairline + action) above a condensed chrome title. Cards are `panel`s: tinted surface, hairline border, top highlight, no backdrop blur. |
| Owner ref "DIGITAL DESIGNER" | Featured work = equal cards (art on top, eyebrow, condensed title, summary, stack chips, links) + a Realm card. Skills = capabilities list beside a logo-tile grid. Education timeline beside a Certifications panel. Contact = full-width banner over the neon key art. |
| Owner ref "PORTFOLIO" | About carries a numbered table of contents (links to every section) and a Realm card. |
| Pinterest #30/#31 game sites | "Three worlds. One CV.": tall character cards cut from the key art (`tools/crop-art.mjs`), world glow colour on hover, status badge, Play. |
| Pinterest (many) | A technology strip after the stats: every CV skill as logo + name, scrolling at a constant pace (it does not stop under the cursor, owner request 2026-10-27); still under reduced motion. |
| (owner feedback) | The background should change colour down the page, like the hero carousel does. Here: each section has three tones; the aurora cross-fades to them as the section reaches mid-screen (`src/site/moods.ts`). |

## Picks (3 candidates each)

| Component | Picked | Alternatives considered | Why |
|---|---|---|---|
| Hero | **Full-bleed background carousel** of original anime-style key art for each world (block → city → neon, 7 s, pausable), text left over a gradient, carousel controls bottom-right. Replaced the earlier split hero with an SVG poster, at the owner's request (2026-10-26). | (B) Name centred over a full-bleed poster (SpaceX); (C) whole page as a sticky left identity column with scrolling right column (Brittany) | The owner wanted the front page to show the three worlds as 2D anime art, changing like a carousel. Name and title stay first on the left; the art carries the Realm. (C) is too similar to a known template; (B) hides the CTAs. |
| Project card | **Equal featured-work cards** (owner refs, 2026-10-27): showcase cover on top (real screenshots in tilted browser windows over a tinted photo; an illustration where none exist), then context, condensed title, summary, stack, links. Replaced the earlier large rows. | (B) Bento tiles; (C) editorial list rows (number, title, year, arrow) | With two projects, big rows feel substantial. Bento with two items looks empty; list rows undersell the work. |
| Nav | **Full-width bar**: transparent at the top, blurred surface and hairline after scrolling. Links centred (≥1024 px), actions right; a sheet menu below. | (B) Floating centred pill; (C) sticky left rail | The floating pill is the most generic 2025 pattern. The left rail fights the split hero. |
| Skills | **Bento by category**, uneven spans | (B) Flat chip cloud; (C) table of category to skills | Bento shows grouping at a glance and lets the Engines tile carry the Unity certificate badge. |
| Timeline | **Date-column rows on a hairline rail** with a scroll head | (B) Alternating left/right timeline; (C) cards | (B) breaks on mobile; cards add boxes that Linear's notes rule out. |

## Tokens

These are defined in `src/site/styles/index.css` and exposed to Tailwind via `@theme inline`.

- **Colour roles:** `bg`, `surface-1/2/3`, `line`, `line-strong`, `ink`, `ink-dim`, `ink-faint`, `primary`, `primary-hover`, `on-primary`, `primary-soft`, `primary-text`, `secondary`, `secondary-soft`, `secondary-text`, `success`, `danger`, `warning`, `focus`.
- **Palette: Midnight + cyan/violet** (owner's pick, 2026-10-26; replaced ember). Dark: bg `#060a18`, primary `#22d3ee`, secondary `#8b5cf6`. Light: bg `#f5f7ff`, primary `#0e7490`, secondary `#6d28d9`. Semantic colours are used only for states.
- **Section tones (atmosphere only):** `MOODS` in `src/site/moods.ts` gives each section three tones (education amber/rose, experience sky/indigo, skills emerald/cyan, projects violet/fuchsia, certifications fuchsia/violet, contact indigo/cyan). They tint the aurora and the section photo only, never text or controls, so contrast doesn't depend on them.
- **Section photos:** duotone (`mix-blend-mode: color`) toward the section's tones, masked top and bottom, faded under the text column, opacity 0.5 dark / 0.2 light, with scroll-linked parallax where `animation-timeline: view()` is supported.
- **Type:**
  - The name (hero): Allura cursive in the site's silver chrome (`font-script` + `text-chrome` on the typed layer), typed out letter by letter with a caret (`TypedText`). The owner asked for "stylish, not bold… cursive", kept the original silver colour (not gold), and wanted the typing effect (2026-10-27). Generous padding keeps the swashes (the E) from being clipped.
  - Headings, stats, card titles, marquee: Playfair Display (`text-lux`), with the brushed-chrome fill on section titles (`text-chrome`; one gradient sweep per line via `background-size: 100% 1lh`).
  - The EJ monogram and wordmark: Playfair Display italic in foil (`components/Monogram.tsx`), after luxury two-letter monograms.
  - Anton (`text-condensed`) only on game-world cards, where a game feel is the point.
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
| text on bg / s1 / s2 / s3 | 16.8 / 15.8 / 14.7 / 13.2 | 17.4 / 18.6 / 16.5 / 15.2 |
| text-dim on bg / s1 / s2 / s3 | 9.2 / 8.7 / 8.0 / 7.3 | 8.0 / 8.6 / 7.6 / 7.0 |
| text-faint on bg / s1 / s2 / s3 | 6.9 / 6.5 / 6.0 / 5.4 | 6.0 / 6.4 / 5.7 / 5.2 |
| primary-text on bg / s1 / s2 / s3 | 13.6 / 12.8 / 11.9 / 10.7 | 5.8 / 6.2 / 5.5 / 5.0 |
| secondary-text on bg / s1 / s2 / s3 | 9.1 / 8.6 / 7.9 / 7.2 | 7.3 / 7.8 / 6.9 / 6.4 |
| on-primary on primary | 10.4 | 5.4 |

Measured 2026-10-26 against the token values in `index.css`. Text over a section photo sits on the masked, faded side, where the photo is at most 50% (dark) or 20% (light) opaque.

Every text pair is ≥ 4.5. UI graphics are ≥ 3.

## Realm (World Select) visual language

The World Select screen is a game launcher. It shows three world cards, each with its own art direction. Card chrome uses the site tokens; each card shows that world's hero key art (`/hero/<art>-960.webp`), so the launcher and the home carousel share one image set.
