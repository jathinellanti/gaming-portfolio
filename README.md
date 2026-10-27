# Ellanti Jathin: Dual-Realm Portfolio

A professional CV site, plus **The Developer's Realm**: three explorable game worlds (Block, Neon City and Open City) that present the same CV. Built with React 19, Vite, TypeScript, Tailwind CSS 4 and Motion.

> **Status:**
> - Phase 1 (professional site + World Select) is complete.
> - Phase 2 (**Block World / JATHINCRAFT**, `/play/block`) is complete and playable.
> - Phase 3 (**Neon City / NEON//SPRAWL**, `/play/neon`) is playable: a first-person walk through a rain-soaked megacity with the CV as districts. Further visual work is still to come.
> - Both playable worlds have synthesised sound: ambience, generative music, footsteps by surface and UI sounds, with a mute switch always on screen.
> - Phase 4 (**Open City / SUNSET BAY**, `/play/city`) is playable: third person on foot or driving, traffic, CV sections as missions, phone and map.
> - The professional site opens with an EJ monogram intro, then a luxury editorial layout: the name in script over the key-art carousel, Playfair headings, a stat strip, illustrated project cards, skills grid, world character cards and a contact banner over the cycling worlds. Project covers are labelled UI illustrations; the Weather case study keeps real screenshots, rendered from its own repository, in its gallery.

### Block World controls
| Keys | Action |
|---|---|
| WASD | Move |
| Mouse or arrow keys | Look |
| Space | Jump (double-tap to fly) |
| Shift / Ctrl | Sneak / sprint |
| Left click | Break a block |
| Right click | Use or place |
| 1–9 or scroll | Hotbar |
| E | Skills (Armory) |
| L | Skill tree |
| M | Map and fast travel |
| T or / | Chat (`/tp archive`, `/cv`, `/help`) |
| F5 | Camera view |
| F3 | Debug overlay |
| Esc | Game Menu, which opens every CV section directly |

On phones, touch controls appear automatically.

## Run it

Requires Node 20+ (developed on Node 24).

```bash
npm install
npm run dev          # http://localhost:5173 (if that port is busy: npm run dev -- --port 5317)
```

## Test it

```bash
npm test             # lint, type-check and unit tests. Must pass before any deploy.
npx playwright install chromium   # once
npm run e2e          # production build + browser tests at 360/768/1280/1920 px, both themes
```

## Edit your content

All personal content lives in **`src/content/data/`**. You never need to touch a component.

| File | What's in it |
|---|---|
| `profile.ts` | Name, title, intro, about paragraphs, email, links, CV path |
| `education.ts` | Degrees and schools (dates as `YYYY-MM`) |
| `experience.ts` | Internships and jobs |
| `skills.ts` | Skills by category. `evidence` links a skill to the project or certificate that proves it. |
| `projects.ts` | Projects (see "Add a project" below) |
| `achievements.ts` | Certifications and awards. Add `date` and `credentialUrl` when you have them. |
| `caseStudies.ts` | Technical case studies for the games' boss locations. Only `verified: true` entries are shown; drafts are in `docs/content-drafts/case-studies.md`. |
| `skillTree.ts` | Specialisations for the in-game skill trees. Each must cite evidence. |

Run `npm test` after editing. If something is wrong, the error names the exact file field, for example `projects.0.tech.3: "cobol" is not a skill id in skills.ts`.

### Things to fill in (the site works without them)
- **CV PDF:** save your resume as `public/cv/Ellanti_Jathin_CV.pdf`. Until then, "Download CV" automatically becomes "View CV".
- **LinkedIn / CodeChef:** add `linkedin` / `codechef` URLs under `links` in `profile.ts`. They appear automatically.
- **Unity certificate:** add `date` and `credentialUrl` in `achievements.ts`.
- **ELMS:** add what you personally built to `contribution` in `projects.ts`.
- **Screenshots:** put them in `public/projects/<slug>/` and list them under `images`.

### Add a project
1. Append an entry to `src/content/data/projects.ts`, copying an existing one.
2. Make sure every id in `tech` exists in `skills.ts`, adding a skill if needed.
3. Optionally add images in `public/projects/<slug>/`.
4. `npm test`

The project appears on the home page, gets its own page at `/projects/<slug>`, appears in the CV and the Ctrl+K palette, and will appear in all three games.

## Deploy (Vercel, static)

```bash
npm run build        # outputs dist/
```

`vercel.json` already handles SPA routing, long-term caching for hashed bundles (`/static/*`) and basic security headers. In Vercel:
1. Import the repo.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.

Any static host works, provided it rewrites unknown paths to `/index.html`.

## Project docs
- `ARCHITECTURE.md`: file map, invariants, failure handling. Read this first.
- `docs/superpowers/specs/`: the approved design spec.
- `docs/superpowers/plans/`: implementation plans, one per phase.
- `docs/UI_SPEC.md`: design references, tokens, contrast measurements, component choices.
- `public/assets/LICENSES.md`: every asset and its licence.
