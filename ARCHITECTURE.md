# Architecture

Read this before changing anything, and update it in the same change when it stops being true. The design spec it implements is `docs/superpowers/specs/2026-10-26-dual-realm-portfolio-design.md`.

## What this is

A Vite + React 19 single-page app with two experiences:
- **Professional site** (`/`, `/cv`, `/projects/:slug`): recruiter-first. No 3D on its first paint.
- **The Developer's Realm** (`/play` and later `/play/block|neon|city`): three separate 3D games that present the same CV. Phase 1 ships World Select only; the games arrive in Phases 2–4.

## File map: what owns what

| Path | Owns |
|---|---|
| `src/main.tsx` | Boot: loads content through `ContentSource`, then mounts `RouterProvider` inside `MotionConfig reducedMotion="user"` and `LazyMotion strict`. Motion's animation engine (`src/motionFeatures.ts`) loads after first render, so components must use `m.*` from `motion/react-m`, never `motion.*`; strict mode throws otherwise. A content failure renders `ContentErrorPage`. |
| `src/router.tsx` | The route table. `/play` is lazy, with `HydrateFallback: RealmLoading`. |
| `src/content/schema.ts` | Zod schemas, types and cross-reference checks; `validateContent`. Pages import **types only** from here; zod must stay off first paint. |
| `src/content/model.ts` | Zod-free runtime helpers: `SKILL_CATEGORIES`, `SKILL_CATEGORY_LABELS`, `publicView` (drops unverified case studies), `skillById`. |
| `src/content/data/*.ts` | **The only place personal data lives.** One file per collection. |
| `src/content/source.ts` | `ContentSource` interface + `StaticContentSource`. **The backend seam.** Dev and test builds validate on load. Production trusts the static data, because `npm test` validates it before any deploy; an API source must validate at runtime. |
| `src/content/useContent.tsx` | `ContentProvider` / `useContent()`. |
| `src/platform/faults.ts` | Fault registry (`what` / `why` / `action`) and `raise()`. `FaultId` is a union, so raising an unknown id fails `tsc`. |
| `src/platform/log.ts` | The single logger. Dev: POST batches to `/__log`, which `tools/vite-dev-log.ts` appends to `logs/app.log`. Prod: 200-entry ring buffer mirrored to `localStorage["jp.log"]`. |
| `src/platform/storage.ts` | `versionedStore`: schema-checked, versioned localStorage that never throws. An optional `migrate` upgrades older versions; without one (or if it throws), old data counts as corrupt and resets. |
| `src/platform/settings.ts` | Zustand settings store (theme, sound, music, quality, lite, welcomeDismissed), persisted under the key `jp.settings.v1` at data version 2. `migrateSettings` upgrades v1 (sound on once: it had only ever been the default, and the games were silent). |
| `src/platform/theme.ts` | `applyTheme()`: sets `data-theme` and `color-scheme`. `index.html` repeats this before paint. |
| `src/platform/webgl.ts` | `hasWebGL2`, `prefersReducedMotion`, `saveDataOn`. |
| `src/platform/globalErrors.ts` | Global `error` / `unhandledrejection` logging; `vite:preloadError` raises `chunk.load_failed`. |
| `src/platform/ExitBar.tsx` | The always-visible mute switch, CV and Exit controls for every Realm screen. |
| `src/site/styles/index.css` | Design tokens (light and dark), Tailwind 4 `@theme inline` mapping, registered `--tone-a/b/c` colour properties (so the aurora cross-fades), aurora, section-photo, hero-carousel and showcase-cover styles, print styles. |
| `src/site/layout/*` | `RootLayout` (theme + scroll restoration), `SiteLayout` (skip link, nav, footer, realm transition, and the Ctrl/⌘+K listener that lazy-loads `Palette`), `Nav` (lazy-loads `MobileMenu` on first open), `Footer`. Radix and cmdk therefore never load on first paint. |
| `src/site/sections/*` | Home page, in order: `Hero`, `StatsStrip` (figures counted from content), `Marquee` (decorative ticker), then the `SECTIONS` (`src/site/nav-items.ts`): About (with a table of contents), Projects (featured-work cards + a Realm card), Skills (capabilities + logo tiles), `Realm` (world character cards; not a nav section), Experience, Education (with the `Certifications` panel, still its own `section#certifications`), Contact (banner). `Hero` is a full-bleed background carousel (`HeroCarousel.tsx`: `SLIDES`, `useCarousel`, `HeroBackdrop`, `CarouselControls`) of original anime-style key art in `public/hero/` (made by `tools/optimize-images.mjs` from `art/hero/`). |
| `src/site/moods.ts` | Per-section atmosphere: `MOODS[sectionId]` = three tones. `setSectionActive` writes the active section's tones to `<html>`; the most recently entered section wins, and with none active (hero, other pages) `DEFAULT_MOOD` returns. |
| `src/site/intro.ts`, `components/Intro.tsx` | The monogram intro: decided once at load (home page, no `#section` deep link, once per session via `sessionStorage["jp.intro.v1"]`, skipped if storage is blocked). Click / Enter / Esc dismisses it; the hero's entrance waits for it (`useIntro`). Tests start past it (`tests/unit/setup.ts`, `tests/e2e/fixtures.ts`). |
| `src/site/components/Monogram.tsx` | The EJ mark: interlaced italic initials (Playfair Display) in champagne foil inside a double-ruled frame; `lockup` adds the name above/below; `animate` draws it in. Used in the nav and the intro. |
| `src/site/pages/*` | `Home`, `CvPage`, `ProjectPage`, `NotFound`, `RouteError`, `ContentErrorPage`. |
| `src/site/components/*` | Shared UI: Button, Chip, Section, Timeline, CvLink, CopyButton, EmptyState, Palette, ThemeToggle, BrandIcon, Monogram, Intro, `Aurora` (fixed page background; soft radial gradients, no blur filter), `Reveal` (IntersectionObserver fade-up). `Section` reports itself to `setSectionActive` while it holds the viewport's middle. |
| `src/site/art/covers/*` | Project covers: designed UI illustrations, always labelled "Illustration" (`WeatherCover`: glass weather app for the four real city pages; `ElmsCover`: HR leave dashboard); `GenerativeCover` for projects without one. Real screenshots (`project.images`) appear only in the project page's Screens gallery (`BrowserFrame`). |
| `src/site/useCv.ts` | Probes the CV PDF once; a missing PDF swaps "Download CV" for "View CV" and raises `cv.missing`. |
| `src/play/*` | `WorldSelect` (cards use the hero key art), the `worlds.ts` metadata (`status`, `art`), `RealmTransition`, `RealmLoading`. |
| `src/platform/audio/*` | Synthesised game audio, no files. `engine.ts`: one AudioContext, sfx/ambience/music buses into a master gain that follows `settings.sound` (music also `settings.music`), a generated reverb, unlock on first gesture, suspend while the tab is hidden. `sfx.ts`: one-shots and `footstep(surface)`/`land()` (skipped entirely while muted). `ambience.ts`: Block (wind, leaves, birds by day, crickets by night) Neon (rain, drops, hum, neon buzz, traffic, sirens, fly-bys) and City (surf, gulls, city bed, horns). `music.ts`: generative Block piano phrases, a Neon synthwave loop and the Sunset Bay "radio", lookahead-scheduled. `vehicle.ts`: the car engine voice. `scene.ts`: shared fade/timer/stop lifecycle. `steps.ts`: pure step/jump/landing cadence. `useWorldAudio(kind, daylight?)`: a world's ambience + music while mounted. |
| `src/platform/TouchControls.tsx` | Shared touch layer for the games: joystick, drag-to-look, action buttons. |
| `src/site/components/NoticeBanner.tsx` | `?notice=webgl` banner, shown when a game redirects here because WebGL2 is missing. Uses the fault's own text. |
| **`src/games/block/`** | **Block World (JATHINCRAFT)**, route `/play/block` (lazy). Minecraft-style first-person voxel game. |
| `games/block/world/blocks.ts`, `tiles.ts`, `atlas.ts` | Block registry (render bucket, solid, breakable), tile list, and procedural 16×16 pixel textures painted into one atlas. |
| `games/block/world/noise.ts`, `generate.ts` | Seeded simplex/fbm; chunk terrain (16×16×96) with beach/ocean, ores, trees and flowers, flattened under the village. |
| `games/block/world/structures.ts` | The village: one building per CV region (A–H), as block programs. Holds `REGIONS` (fast-travel spawn, protected box, sign), `TROPHY_FRAMES`, `PORTAL_BOX`, `GUIDE_POS`, `isProtected`, `regionAt`. |
| `games/block/world/mesher.ts` | Chunk → geometry: per-face culling, per-vertex AO, fixed face shading; buckets opaque / cutout / water / emissive. Pure, and runs in the worker. |
| `games/block/world/world.worker.ts`, `ChunkManager.ts` | Off-thread generation and meshing; streaming rings around the player, edits, unload. Falls back to synchronous work and raises `worker.failed`. |
| `games/block/world/WorldView.tsx`, `Signs.tsx`, `Particles.tsx`, `blockMesh.ts` | R3F mounting, unlit materials scaled by daylight, building signs, break debris, held-block geometry. |
| `games/block/sky/Sky.tsx` | Day/night: sky-dome shader, square sun and moon, stars, cloud layer, fog matched to the horizon. Advances `runtime.time`. |
| `games/block/player/physics.ts`, `raycast.ts` | Pure AABB-vs-voxel movement (sub-stepped) and DDA raycast. Unit-tested. |
| `games/block/player/Player.tsx`, `Avatar.tsx`, `Guide.tsx`, `input.ts`, `interact.ts` | Camera modes (F5), hand and held block, breaking, placing, protection, region titles, portal, guide NPC; input polling; block → screen mapping. |
| `games/block/store.ts`, `runtime.ts` | Zustand UI state persisted as `jp.block.v1` (versioned, zod-validated), plus a mutable per-frame runtime outside React. |
| `games/block/content.ts` | CV → game mapping: recipes (project tech → grid), book pages, advancement layout. Pure, and unit-tested. |
| `games/block/ui/*` | Minecraft-style GUI (`gui.css`, Pixelify Sans), HUD, item icons (atlas isometric blocks, rasterised brand marks), screens (Armory, Crafting, Advancements, Book, Trophies, Dungeon, Exit, Pause, Options, Map, Chat, Guide), chat command parser. |
| **`src/games/city/`** | **Open City (SUNSET BAY)**, route `/play/city` (lazy). GTA-style third person: run, get into parked cars (F), drive (arcade grip/handbrake drift), traffic that yields, mission markers = CV sections, phone (↑/P), map with fast travel (M). `world/layout.ts` (pure grid, buildings, palms, markers, kerb parking, `groundY`, `placeName`), `world/World.tsx` (sky/ocean shaders, roads, art-deco buildings, palms), `world/Traffic.tsx`, `world/Markers.tsx`, `player/physics.ts` (pure walker + car, unit-tested), `player/Player.tsx` (controls, cameras, triggers), `player/CarModel.tsx`, `content.ts` (missions), `store.ts` (`jp.city.v1`), `ui/*` (HUD, minimap via `mapDraw.ts`, screens). Plan: `docs/superpowers/plans/2026-10-27-phase4-open-city.md`. |
| **`src/games/neon/`** | **Neon City (NEON//SPRAWL)**, route `/play/neon` (lazy). Cyberpunk-style first-person walk. `world/city.ts` (towers, POIs, colliders, billboards), `world/*.tsx` (buildings with real-scale procedural facades: 16 bays × 12 floors per 24 × 48 m tile; ground, storefronts, sky/rain/traffic, post effects), `world/props.ts` + `world/StreetLife.tsx` (lamps with light pools, kerbside cars, a walking crowd, overhead cables, steam vents, the elevated monorail; cars and monorail legs collide), `player/walker.ts` (circle-vs-AABB, sub-stepped), `store.ts` (`jp.neon.v1`), `content.ts` (CV → POIs), `ui/*` (HUD, hub, menus). |
| `tools/vite-dev-log.ts` | Dev-only middleware that writes the one log file. |
| `tools/crop-art.mjs` | Cuts the worlds' character-card crops out of `art/hero/*.jpg` into `public/art/`. |
| `tools/optimize-images.mjs` | Source image → responsive WebP widths (`node tools/optimize-images.mjs <srcDir> <outDir> [widths]`). Sources live in `art/` (not served). |
| `tests/unit/*` | Vitest + Testing Library against the real route table and real content. |
| `tests/e2e/*` | Playwright against the production build: layout at 360/768/1280/1920 px in both themes, keyboard, routes, bundle invariant. |

## Invariants (a rewrite must keep these)

1. **The CV is always one click away.** Every Realm screen renders `ExitBar` (CV + Exit). Tested in `play.test.tsx` and e2e.
2. **Isolation.** `src/games/X` never imports `src/games/Y`. The site, content, platform and play layers never import `three` or `@react-three/*` eagerly. ESLint `no-restricted-imports` enforces both; the e2e bundle test checks that the built entry chunk contains no WebGL renderer.
3. **A single content path.** Components hold no personal strings. Everything comes from `useContent()`.
4. **No fabrication.**
   - Content comes only from the owner's resume and repositories.
   - Case studies render only with `verified: true`.
   - No proficiency levels unless supplied.
   - The certificate name is exact: "Unity Certified User: Programmer".
   - ELMS is never credited with JWT or Nodemailer.
   - Phone and street address are never published.

   Several of these have tests in `content.test.ts`.
5. **Registered faults.** Every failure path calls `raise(<FaultId>)` or renders a fault's `what` / `why` / `action`. The registry is complete and concrete (`faults.test.ts`).
6. **No 3D on the first paint of `/`, and first-paint JS ≤ 200 KB gzip** (Phase 1 measured ~160 KB). The hero is an image carousel: only the first slide loads eagerly, the next one when it is up. `tests/e2e/bundle.spec.ts` enforces both.
7. **Honest imagery.** A picture labelled "Real screenshots" comes from the project's own code; anything else is labelled "Illustration". Backdrop photos are decorative (`alt=""`), licensed (Unsplash License), and credited in `public/assets/LICENSES.md`. No game screenshots, logos or names from Minecraft, Cyberpunk 2077 or GTA.

## Fault registry

| id | Where it's raised | What the visitor sees |
|---|---|---|
| `cv.missing` | `useCv.probeCv` | "Download CV" becomes "View CV" (`/cv`); hidden on `/cv` itself |
| `chunk.load_failed` | `RouteError`, `vite:preloadError` | Reload button, plus a CV link |
| `content.invalid` | `StaticContentSource.load` | `ContentErrorPage` listing `path: problem` |
| `storage.unavailable`, `save.corrupt` | `versionedStore` | Settings fall back to defaults |
| `webgl.unsupported` | `games/*/index.tsx` route entry | Redirected to `/?notice=webgl`, where a banner explains |
| `webgl.context_lost` | `BlockGame` / `NeonGame` canvas listener (ignored once the canvas has left the DOM: R3F drops the context on teardown, and the browser may reclaim it first) | "Restore graphics" remounts the canvas |
| `worker.failed` | `ChunkManager` | World keeps building on the main thread |
| `audio.blocked` | `platform/audio/engine.ts` (resume refused) | Silent until the next click; the speaker button retries |
| `audio.unsupported` | `platform/audio/engine.ts` (no Web Audio) | Silent; every audio call is a no-op |
| `asset.load_failed` | Reserved for Phases 3–4 (CC0 models) | |

## Real failure modes

| Failure | Mechanism | What the app does |
|---|---|---|
| CV PDF not deployed | Dev servers and SPAs answer a missing file with `index.html` (200, `text/html`), so the probe checks `content-type` | "View CV" fallback |
| Stale tab after a redeploy | Hashed lazy chunks are gone | `chunk.load_failed` → Reload |
| Private mode | `localStorage` throws | `storage.unavailable`, raised once; defaults are used |
| Port clash in dev | Another app on 5173 | The dev server uses 5317 (`npm run dev -- --port 5317` if needed); preview uses 4317 |
| Esc while the pointer is locked | Most browsers swallow Esc to release the lock, but some (headless Chromium) deliver it to the page | The Block keydown handler releases the lock itself and opens the Game Menu, so the menu is always one key away |
| Slow first load in dev | The module worker fetches its imports one by one under the Vite dev server | Production bundles the worker; e2e runs against the production build |
| False `webgl.context_lost` when leaving a game | The canvas leaves the DOM in the commit that navigates away, but passive effect cleanups run after the next page paints. A heavy page (photos, blends, blurs) can make the browser reclaim the detached context during that paint | `mounted` is cleared in a **layout** cleanup (`BlockGame`, `NeonGame`), so any loss after the canvas is removed counts as teardown |
| Slow WebGL e2e | Headless Chromium renders WebGL in software (SwiftShader); trace screenshots of a live canvas on every action pushed tests past 30 s | `block.spec.ts` keeps DOM traces but no trace screenshots, with a 60 s timeout. Realm-entry tests assert behaviour (overlay shown or not), not wall-clock time |
| No `@property` support | Older browsers can't interpolate custom properties | Section tones snap instead of cross-fading. Nothing else changes. |

## How to add a project

1. Append an entry to `src/content/data/projects.ts`. Every `tech` id must exist in `skills.ts`.
2. Optionally put real screenshots in `art/projects/<slug>/`, run `node tools/optimize-images.mjs art/projects/<slug> public/projects/<slug> 960,1440`, and list them in `images` with `alt`, `width`, `height` and a short `caption`. `content.test.ts` checks each file exists at its declared size. The first two become the cover's browser windows; all of them appear under **Screens** on the project page.
3. Optionally give the project a backdrop in `STAGES` (`src/site/art/covers/ProjectCover.tsx`), using a licensed photo in `public/photos/` credited in `LICENSES.md`.
4. Run `npm test`. A broken reference fails with the exact `path: problem`.

## How to swap in a backend later

Implement `ContentSource` (for example `ApiContentSource.load()`, which fetches JSON and runs it through `validateContent`), then assign it in `src/content/source.ts`. Pages and games don't change.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | `eslint . && tsc -b && vitest run` (the gate) |
| `npm run e2e` | Builds, previews on 4317, runs Playwright |
| `npm run build` | Production build to `dist/` (hashed bundles in `dist/static/`) |
