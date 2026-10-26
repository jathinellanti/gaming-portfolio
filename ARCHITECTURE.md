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
| `src/platform/storage.ts` | `versionedStore`: schema-checked, versioned localStorage that never throws. |
| `src/platform/settings.ts` | Zustand settings store (theme, sound, quality, lite, welcomeDismissed), persisted as `jp.settings.v1`. |
| `src/platform/theme.ts` | `applyTheme()`: sets `data-theme` and `color-scheme`. `index.html` repeats this before paint. |
| `src/platform/webgl.ts` | `hasWebGL2`, `prefersReducedMotion`, `saveDataOn`. |
| `src/platform/globalErrors.ts` | Global `error` / `unhandledrejection` logging; `vite:preloadError` raises `chunk.load_failed`. |
| `src/platform/ExitBar.tsx` | The always-visible CV + Exit control for every Realm screen. |
| `src/site/styles/index.css` | Design tokens (light and dark), Tailwind 4 `@theme inline` mapping, base styles, art keyframes, print styles. |
| `src/site/layout/*` | `RootLayout` (theme + scroll restoration), `SiteLayout` (skip link, nav, footer, realm transition, and the Ctrl/⌘+K listener that lazy-loads `Palette`), `Nav` (lazy-loads `MobileMenu` on first open), `Footer`. Radix and cmdk therefore never load on first paint. |
| `src/site/sections/*` | Home page sections, in `SECTIONS` order (`src/site/nav-items.ts`). |
| `src/site/pages/*` | `Home`, `CvPage`, `ProjectPage`, `NotFound`, `RouteError`, `ContentErrorPage`. |
| `src/site/components/*` | Shared UI: Button, Chip, Section, Timeline, CvLink, CopyButton, EmptyState, Palette, ThemeToggle, BrandIcon, StackMosaic, Monogram. |
| `src/site/art/*` | Code-drawn isometric SVG art (`iso.ts` helpers, three vignettes, `HeroPoster`, `WorldVignette`). |
| `src/site/useCv.ts` | Probes the CV PDF once; a missing PDF swaps "Download CV" for "View CV" and raises `cv.missing`. |
| `src/play/*` | `WorldSelect`, the `worlds.ts` metadata, `RealmTransition` (ember-bloom navigation), `RealmLoading`. |
| `src/platform/audio.ts` | WebAudio-synthesised sound effects (`sfx(kind)`). Silent unless `settings.sound` is on; raises `audio.blocked` once. |
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
| `tools/vite-dev-log.ts` | Dev-only middleware that writes the one log file. |
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
6. **No 3D on the first paint of `/`, and first-paint JS ≤ 200 KB gzip** (Phase 1 measured ~160 KB). The hero is an SVG poster. Any future live diorama must load via `lazy()` after the page is usable. `tests/e2e/bundle.spec.ts` enforces both.

## Fault registry

| id | Where it's raised | What the visitor sees |
|---|---|---|
| `cv.missing` | `useCv.probeCv` | "Download CV" becomes "View CV" (`/cv`); hidden on `/cv` itself |
| `chunk.load_failed` | `RouteError`, `vite:preloadError` | Reload button, plus a CV link |
| `content.invalid` | `StaticContentSource.load` | `ContentErrorPage` listing `path: problem` |
| `storage.unavailable`, `save.corrupt` | `versionedStore` | Settings fall back to defaults |
| `webgl.unsupported` | `games/*/index.tsx` route entry | Redirected to `/?notice=webgl`, where a banner explains |
| `webgl.context_lost` | `BlockGame` canvas listener (ignored during unmount, because R3F drops the context on teardown) | "Restore graphics" remounts the canvas |
| `worker.failed` | `ChunkManager` | World keeps building on the main thread |
| `audio.blocked` | `platform/audio.ts` | Silent; the sound toggle retries |
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

## How to add a project

1. Append an entry to `src/content/data/projects.ts`. Every `tech` id must exist in `skills.ts`.
2. Optionally put screenshots in `public/projects/<slug>/` and list them in `images` with `alt`, `width` and `height`.
3. Run `npm test`. A broken reference fails with the exact `path: problem`.

## How to swap in a backend later

Implement `ContentSource` (for example `ApiContentSource.load()`, which fetches JSON and runs it through `validateContent`), then assign it in `src/content/source.ts`. Pages and games don't change.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | `eslint . && tsc -b && vitest run` (the gate) |
| `npm run e2e` | Builds, previews on 4317, runs Playwright |
| `npm run build` | Production build to `dist/` (hashed bundles in `dist/static/`) |
