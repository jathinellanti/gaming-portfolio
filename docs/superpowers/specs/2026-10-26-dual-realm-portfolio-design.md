# Dual-Realm Portfolio — Design Spec

- **Owner:** Ellanti Jathin
- **Date:** 2026-10-26
- **Status:** Approved in brainstorming (§1–§3). Awaiting the owner's review of this written spec.
- **Scope of this build:** frontend only. Backend (CMS / contact API) is a later project; this spec keeps a seam for it (§5.3).

---

## 1. Goal

A personal portfolio with two experiences:

1. **Professional site**: a premium, recruiter-first CV site that communicates competence in seconds.
2. **The Developer's Realm**: **three separate, fully 3D, explorable games**, each styled after a famous game. All three present the same real CV content through that game's own mechanics and menus:
   - **Block World**: Minecraft-style.
   - **Neon City**: Cyberpunk 2077-style.
   - **Open City**: GTA V/VI-style.

Success means:
- A recruiter on `/` can read the full CV and download the PDF in under 10 s, with no 3D in the way.
- A player in any game feels they are playing *that kind of game*: its camera, HUD, menus, lighting and feel. Every CV section stays one action away.
- Nothing about the owner is invented.

### 1.1 Non-goals (this build)
- No backend, accounts, contact-form sending, analytics or CMS.
- No combat, damage or fail states. The games are **exploration only**.
- No multiplayer, gamepad support or sound on by default.
- No copied game IP: no logos, textures, models, fonts, names or UI art from Minecraft, Cyberpunk 2077 or GTA. Every asset is original or CC0, made in the same *style*.
- No literal AAA fidelity. The realism budget goes to lighting, materials, post-processing, camera, HUD and game feel.

### 1.2 Decision log (owner-approved)
| Decision | Choice |
|---|---|
| Gameplay depth | Full 3D worlds |
| Relationship of themes | Three separate games (own world, controller, mechanics, HUD, menus). One shared content source. |
| Challenge | Exploration only |
| Professional look | "Studio dark + live 3D hero" (light theme supported) |
| 3D assets | Procedural / code-built, plus CC0 packs (Kenney, Quaternius, Poly Haven, ambientCG). Code-built stand-in if a pack is unavailable. |
| Architecture | One Vite app with three lazy-loaded games |
| Rendering | React Three Fiber + drei + postprocessing. No physics engine; each game has a custom kinematic controller. |
| Language / tooling | TypeScript, Vite, Tailwind CSS 4, Motion (formerly Framer Motion), react-router, zustand, Lucide |
| Sound | Off by default, visible toggle, synthesised in code (WebAudio) |
| Hosting | Static deploy on Vercel (SPA rewrites) |
| Build order | Foundation + Professional site → Block World → Neon City → Open City |

Versions verified on npm (2026-10-26):

| Package | Version |
|---|---|
| react | 19.3.1 |
| vite | 8.3.5 |
| three | 0.186.1 |
| @react-three/fiber | 9.8.2 |
| @react-three/drei | 10.7.9 |
| @react-three/postprocessing | 3.2.2 |
| motion | 14.6.0 |
| tailwindcss | 4.3.3 |
| react-router | 8.5.0 |
| zustand | 5.0.16 |
| lucide-react | 1.61.0 |

APIs are confirmed against current docs (context7) at implementation time, never assumed.

---

## 2. Content inventory (real data only)

Source: the owner's resume PDF and two public GitHub repos (read 2026-10-26).

**Profile**
- Name: Ellanti Jathin.
- Email: jathinellanti@gmail.com.
- GitHub: https://github.com/jathinellanti.
- LinkedIn and CodeChef: hyperlinked in the PDF, URLs pending (§2.1).
- Public location: Vijayawada, India. Street address and phone are **not shown on the site** (owner may opt in).

**Education**
| Institution | Programme | Dates | Result |
|---|---|---|---|
| KL University, Vijayawada | B.Tech, Computer Science and Engineering | Jul 2022 – May 2026 | CGPA 9.02 |
| Sri Bhavishya Junior College, Vijayawada | Intermediate (BiPC) | Jul 2020 – Jun 2022 | 89% |
| KKR's Gowtham High School, Vijayawada | SSC (CBSE) | Jul 2019 – Apr 2020 | 91% |

**Experience**
- Drone Entry: Intern. Bangkok, Thailand. Jul 2024.
- Hands-on experience with UAV (unmanned aerial vehicle) systems, in a fast-paced, innovative environment. This is the resume wording; no further claims are added.

**Skills, as grouped in the resume**
- Languages: C#, Python, C, Java.
- Libraries/Frameworks: JavaScript, React.
- Tools/Platforms: VS Code, SQL, Git.
- Databases: SQL, MongoDB.
- Evidenced elsewhere:
  - Unity (certification).
  - Django and SQLite (Weatherapp).
  - Node.js, Express and Mongoose (ELMS).
  - HTML/CSS (both projects).

No proficiency levels are given, so **none are displayed**.

**Projects** (neither is a game; both are shown as projects, never relabelled as games)
1. **Weather Information System** ([repo](https://github.com/jathinellanti/Weatherapp)).
   - Python/Django web app, Jan 2024. Personal project.
   - Fetches real-time weather from a weather API.
   - Has city pages (Bangalore, Delhi, Kolkata, Mumbai), a forecast view, login/register, and a Django model storing city temperature (SQLite).
2. **Employee Leave Management System** ([repo](https://github.com/jathinellanti/ELMS-sdp-s12-team-13)).
   - MERN, Apr 2024. Academic team project (repo name `ELMS-sdp-s12-team-13`; the course code is not expanded unless the owner supplies it).
   - Role-based dashboards for Admin (add, view and delete employees), HR (manage leave, leave history) and Employee (apply for leave, balances, leaves taken).
   - Express controllers and routes per role, with Mongoose models.
   - The owner's individual contribution is pending (§2.1). Until supplied, the site says "Team project" without claiming specific parts.

**Achievements**
- Unity Certified User: Programmer, Unity Technologies. Date or credential link pending.

**Case studies (Boss locations):** none supplied.
- I draft two from repo code into `docs/content-drafts/case-studies.md`, marked `verified: false`.
- Entries with `verified: false` **never render**.
- Until one is verified, boss locations show a designed in-world empty state.

### 2.1 Pending owner input. Each has a shipped default, so nothing blocks.
| Item | Default until supplied |
|---|---|
| Hero title | "Software Developer", with the subline "Unity Certified User: Programmer". This is the exact certificate name; "Unity Certified Programmer" is a different, higher certification and must not be used. |
| LinkedIn and CodeChef URLs | Links hidden (not broken). Read from the PDF's link annotations if its file path is supplied. |
| CV PDF file | `/cv/Ellanti_Jathin_CV.pdf`. If missing, the download button is replaced by the `/cv` print page, and a test flags it. |
| Unity cert date or link | Shown without date |
| ELMS individual contribution | "Team project", with no specific claims |
| Portrait | Generated monogram avatar, labelled as replaceable |
| Case studies | Empty-state arenas |

### 2.2 Owner action outside this project
`ELMS-sdp-s12-team-13` has `server/.env` (MONGODB_URI) committed publicly. The owner should:
1. Rotate the credentials.
2. Remove the file from the repo.

The portfolio links to this repo.

---

## 3. Professional site (`/`)

### 3.1 Sections (in order)
1. **Sticky nav**
   - Monogram, section links, theme toggle, "Download CV".
   - `Ctrl/⌘+K` jump-to-section palette.
   - Mobile: a sheet menu.
2. **Hero**
   - Name, title, two-line intro.
   - CTAs: **View My CV** (`/cv`), **Explore My Projects** (scroll to projects), and **▶ Enter the Developer's Realm** (`/play`).
   - Right side: the **3D turntable diorama** with three mini-worlds (block island, neon tower, coastal block). Hover or focus previews a world with a label and a tagline. Click enters that game.
   - A static poster image paints first. The 3D chunk loads on idle after the page is usable.
   - The poster stays permanently on reduced motion, without WebGL, or when `navigator.connection.saveData` is set.
3. **About.**
4. **Education**: a timeline.
5. **Experience**: entries with role, organisation, place, dates and description.
6. **Skills**: a bento grid by category, with a small "evidenced by" link to the project or cert that proves each skill where one exists.
7. **Projects**: case-study cards linking to `/projects/:slug` (summary, role, team/solo, status, stack, repo/live links, gallery). Missing images show a designed empty state that says why.
8. **Certifications.**
9. **Contact**: email (copy-to-clipboard plus mailto), GitHub, LinkedIn, CodeChef. Each is rendered only if its URL exists.
10. **Footer**: "Enter the Realm" again, a last-updated date, and asset credits.

### 3.2 Look
- Dark by default ("studio"): warm near-black, fine film grain, a soft light that follows the pointer in the hero. One accent colour.
- An editorial serif for display text, a highly legible sans for body and UI.
- A light theme with matched tokens.
- Tokens are defined first (colour, type scale, spacing, radius, shadow, motion), then components.
- The exact fonts and palette are chosen in the UI workflow (`frontend-ui` skill): references go in `docs/UI_SPEC.md`, and the owner picks from **three candidates** for each key component.
- Icons: Lucide SVG only, no emoji.
- Motion: 150–250 ms, one easing curve, honouring `prefers-reduced-motion`.
- Every interactive element has hover, focus-visible, active and disabled states. Every async panel has loading, empty (says why), error and stale states.

### 3.3 Other pages
- **`/cv`**: the full CV as a semantic, print-optimised page (`@media print`), plus PDF download.
- **`/projects/:slug`**: project detail with full description, role, stack, gallery (lazy images) and links. Unknown slug shows a 404 with links back.
- **404**: a styled page with links to `/`, `/cv` and `/play`.
- **Metadata**: per-route `<title>` and description (React 19 document metadata), Open Graph and Twitter tags, a favicon set, and `robots.txt`.

---

## 4. The Developer's Realm

### 4.1 Entry flow
1. **"Enter the Developer's Realm"** starts a ~600 ms Motion transition: the page dims, the hero diorama scales toward the camera and the screen cross-fades to `/play`. Reduced motion uses an instant cut.
2. **`/play` World Select** is a game-launcher screen.
   - Three large world cards, each with its live diorama (poster fallback), working title, one-line pitch, controls summary and **Play**.
   - Also on screen: **"Open CV instead"** and **"← Back to Professional"**.
   - An optional, dismissible welcome line, remembered once dismissed.
   - Keyboard: arrow keys move between cards, Enter plays.
3. **Themed loading screen** with real progress (asset manager) and tips that are real facts about the owner. On mobile, a "Lite mode" toggle is offered.
4. Inside a game, the **Exit/CV bar** (platform component) is always visible in a corner that doesn't clash with the HUD: "Exit to Professional" and "CV".

Working titles (renameable in config): **JATHINCRAFT**, **NEON//SPRAWL**, **SUNSET BAY**.

### 4.2 CV mapping (brief §5 regions A–H, per game)
| Brief region | Block World | Neon City | Open City |
|---|---|---|---|
| A Character's Archive | Library building + player profile screen | Character screen (identity, no invented stats) | Safehouse + pause "Stats" tab (identity only) |
| B Campaign Trail | Book & Quill on a lectern, plus waystone signposts along a path | Journal → "Life Path" timeline | Pause "Brief" tab (mission log timeline) |
| C Armory | Inventory screen (E) + chest room | Ripperdoc clinic: skills as installable cyberware in body slots | Gear shop + skills wheel (hold Tab, in the style of a weapon wheel) |
| D Skill Tree | Advancements screen (L) | Perk tree screen | "Skills" pause tab, as a node graph |
| E Questing Grounds | Crafting table: projects as recipes made of skill ingredients. Quest-giver NPCs. | Journal → Jobs, map markers, data terminals | Yellow mission markers with letter blips. Drive in → mission intro → panel → "MISSION PASSED". |
| F Boss Arena | Dungeon with boss bar (phases = case-study steps) | Gigs from a fixer | Heist planning board (setup / approach / crew = arsenal / finale = outcome) |
| G Hall of Achievements | Advancement toasts + trophy room with item frames | Data shards collection | Awards in the Stats tab, plus a trophy wall in the safehouse |
| H Exit Gate | Stone-arch portal + pause "Save & Quit to Portfolio" | Metro station + holo-call contact card | Phone → Contacts / Email / Internet, plus airport "Exit" |

**Rules that hold across every game:**
- Every region is reachable **without walking**: from the pause menu, the full-map screen and the game's fast travel.
- Map and menu screens are HTML (DOM), so they are accessible to keyboard and screen readers.
- Discovered locations, opened panels and the last position are saved per game, versioned.
- Skill-tree nodes appear only with evidence (a project slug, cert id or experience id). Locked nodes are decorative only and are labelled "Uncharted", with no skill claim.

### 4.3 Block World (Minecraft-style)

**World**
- Chunked voxel terrain: 16×16 columns, height 96.
- Seeded noise biomes: plains, forest, hills, beach, ocean.
- Trees, flowers and grass placed by rules.
- A hand-placed **spawn village**. Its fixed schematics hold the region buildings.
- Render distance by quality tier: 4 / 6 / 8 / 10 chunks.

**Rendering**
- A texture atlas of **16×16 pixel textures drawn in code**: grass, dirt, stone, cobble, ores, sand, gravel, logs, leaves, planks, glass, bookshelf, wool, water.
- Nearest-neighbour filtering.
- Faces merged into larger quads, built in a Web Worker.
- **Per-vertex ambient occlusion** (the signature soft block shading) and a directional face-shade factor.
- Day/night cycle: a 20-minute day, compressible in settings. Square sun and moon, a starfield, and a flat moving cloud layer.
- Distance fog that matches the sky colour.
- Translucent water drawn in its own pass, with slight waves.
- Leaves use cut-out transparency.

**Player**
- First-person; F5 cycles through third-person back and front views.
- Block-character model (code-built) with an **original skin**. The first-person arm and held item sway with movement.
- Walk, sprint (double-tap W or Ctrl), jump, crouch. Swimming. Fly toggle (double-tap Space) as a convenience.
- Collision: swept box against the voxel grid.

**Mechanics**
- Block targeting outline.
- Break: hold the mouse button, crack overlay in 10 stages, particles, item drop with pickup.
- Place: right click.
- Region buildings are **protected from breaking** so content stays reachable.
- **Hotbar** (1–9, scroll wheel) holds skill items.

**Screens** (pixel-art GUI, Minecraft-like panels, original art)
- Inventory (E).
- Crafting table: recipes = projects.
- Advancements (L).
- Book & Quill.
- Pause: Back to Game / Map / Settings / Save & Quit to Portfolio.
- Full map: top-down render of explored chunks, with markers.
- **Chat (T)** with commands: `/tp <region>`, `/cv`, `/help`, `/time set day|night`, `/seed`.
- Toasts for advancements.
- Original villager-style NPCs give one-line pointers.

**Font:** a pixel font under the OFL licence, chosen in the UI phase (candidate: Monocraft; licence verified before use).

### 4.4 Neon City (Cyberpunk-style)

**World**
- One dense, bounded district: about 6×6 blocks, ring-fenced by elevated highways.
- Procedural skyscrapers built from a kit of facade modules, with code-generated emissive window and sign textures.
- **Holographic billboards** that advertise the owner's real skills and projects (canvas-rendered text).
- Neon signs in original glyph-style art. Street props: vending machines, steam vents, cables, barriers.
- **Flying cars** move on splines overhead (instanced).
- Permanent night, constant rain.

**Rendering**
- Physically based materials. Wet streets: puddle reflections (reflector on High and Ultra; roughness-mapped environment reflections on Low).
- Rain: instanced streaks plus a splash decal pass.
- Exponential fog, with fake light shafts (additive cones) under signs.
- Post-processing: bloom, chromatic aberration (subtle), film grain, vignette, ambient occlusion (High and up).
- AgX tone mapping.

**Player**
- **First-person**, as in the original, so no full body model is needed.
- Walk, sprint, crouch, jump, with head-bob (reduced-motion turns it off).
- Box collision against buildings and props.

**Mechanics**
- **Scanner**: hold Tab. The world desaturates through a post-process pass. Interactables get outline highlights and data tags (name, category, linked content). Tags can be clicked.
- Data terminals and NPC fixers open content.
- The holo-call welcome message is optional and skippable.

**Screens**
- Angular yellow, red and cyan HUD (original): minimap circle, objective tracker, clock.
- Ripperdoc cyberware slots (Armory).
- Perk tree.
- Journal: Life Path, Jobs, Gigs.
- Shards.
- Map with fast-travel points.
- Pause.

**Fonts:** OFL sci-fi display plus a condensed sans, chosen in the UI phase.

### 4.5 Open City (GTA-style)

**World**
- A coastal city: about an 8×8 block grid, plus a beach strip and an ocean.
- Roads with lane markings, sidewalks, crossings, streetlights, palms. Varied buildings: procedural facades plus CC0 props.
- **Golden-hour lighting**: a CC0 sky image for environment light, a directional sun with layered shadows and a long-shadow sun angle.
- Ocean: animated water shader (three.js addon).

**Traffic**
- Instanced cars follow a lane graph, stop for the player car, and loop.
- A few CC0 animated pedestrians walk sidewalks (off on Low).

**Player**
- **Third-person on foot**: a CC0 rigged character with idle, walk, run and jump animations; over-the-shoulder chase camera.
- **Get into a car (F)**: arcade vehicle model (grip, slip, handbrake drift), chase cam, speed-based camera field of view.
- Cars are code-built: shaped body with clear-coat paint, glass, rims and tyres. CC0 car models are used if available.

**Mechanics**
- **Minimap** in the bottom-left: rotates with heading, has blips and a GPS route to the waypoint.
- **Mission markers**: yellow glowing cylinders. Entering one plays a short cinematic intro (camera cut plus title card), then the content panel. Closing it shows "MISSION PASSED".
- **Phone** (Up arrow or tap): Contacts (email, LinkedIn, GitHub), Email, Internet (project browser), Settings.
- **Skills wheel**: hold Tab.
- Pause map: full city map with legend, set-waypoint, and **taxi** fast travel (fade, then teleport).

**Screens:** a GTA-style pause menu with tabs: Map, Brief, Stats, Skills, Heists, Settings, Exit. Fonts are OFL, chosen in the UI phase.

### 4.6 Shared game platform behaviour
- **Input**
  - Keyboard plus pointer lock for mouse-look; Esc releases the pointer and pauses.
  - Touch: virtual left joystick, right-side drag-look, contextual action buttons.
  - Every action has a non-hover path.
- **Quality tiers:** Low, Medium, High, Ultra.
  - Auto-picked from a performance monitor, with resolution scaling (DPR 0.75–2).
  - The visitor can override in Settings. "Lite mode" forces Low.
- **Reduced motion:** no head-bob or camera shake, cuts instead of fly-throughs, slower ambient animation.
- **Sound:** off by default, toggle in the HUD and Settings. WebAudio-synthesised effects (footsteps, UI clicks, rain, engine).
- **Saves:** stored in the browser (localStorage) per game, versioned. A corrupt or old save is discarded with a notice.
- **Accessibility:** CV panels are real HTML dialogs with focus trap and restore, Esc closes them, and labels are correct. The canvas has an `aria-label` and a "Skip to menu" link.

---

## 5. Architecture

### 5.1 Folder map (becomes `ARCHITECTURE.md`)
```
src/
  main.tsx, App.tsx          router + providers
  content/                   ONLY place for personal data
    data/*.ts                profile, education, experience, skills, skillTree, projects, caseStudies, achievements
    schema.ts                zod schemas + types
    source.ts                ContentSource interface + StaticContentSource
    useContent.ts            hook
  platform/
    faults.ts                fault registry (id → what / why / action)
    log.ts                   single logger (dev: POST → logs/app.log; prod: ring buffer + localStorage)
    settings.ts              zustand: theme, sound, quality, reducedMotion, lite
    save.ts                  versioned per-game persistence
    webgl.ts                 capability check + context-loss handling
    ErrorBoundary.tsx, ExitBar.tsx, Dialog.tsx, TouchControls.tsx, audio.ts, input.ts
  site/                      professional site (tokens, sections, pages)
  play/                      world select, transition, loading screens
  games/
    block/  neon/  city/     each: index.tsx (lazy entry), world/, player/, mechanics/, ui/, store.ts, Diorama.tsx
public/
  cv/Ellanti_Jathin_CV.pdf
  projects/<slug>/*
  assets/<game>/*  + assets/LICENSES.md
logs/app.log                 dev-only log file (git-ignored)
```

### 5.2 Invariants (lint- and test-enforced where possible)
1. **CV is always one click away.** `ExitBar` renders on every `/play/*` route (Playwright check).
2. **Isolation.** `games/X` never imports `games/Y`. `site/` imports only `games/*/Diorama` and only through `lazy()`. ESLint `no-restricted-imports` enforces this.
3. **Single content path.** No personal strings in components. Content comes only via `useContent()`.
4. **No fabrication.** Every content entry is user-sourced. `verified: false` entries never render (unit test).
5. **Registered faults.** Every failure path calls `raise(faultId)`. Unregistered ids fail a static test.
6. **No three.js on first paint of `/`.** A bundle test asserts the entry chunk excludes `three`.

### 5.3 Backend seam
`ContentSource { load(): Promise<Content> }`. It is `StaticContentSource` today.
- A later `ApiContentSource` (headless CMS, Supabase or similar) can replace it in `source.ts` alone.
- Schemas validate API data at runtime the same way they validate static data in tests.

### 5.4 Fault registry (initial)
| id | What (visitor terms) | Why | What to do |
|---|---|---|---|
| `webgl.unsupported` | "This device can't run the 3D worlds." | No WebGL2 context | The visitor is sent to `/` with a banner. The CV is fully available. |
| `webgl.context_lost` | "Graphics were interrupted." | GPU reset or tab memory pressure | Click "Restore graphics", or switch to Lite mode in Settings |
| `asset.load_failed` | "Some 3D models didn't load." | Network or 404 on an asset URL | A code-built stand-in is used. Check `public/assets/<game>/` and `assets/LICENSES.md`. |
| `chunk.load_failed` | "The game files are out of date." | Lazy chunk 404 after a redeploy | Click "Reload" (hard refresh) |
| `worker.failed` | "World building slowed down." | Mesher worker crashed | Automatic main-thread fallback. Lower the render distance in Settings. |
| `storage.unavailable` | "Progress won't be saved." | localStorage blocked (private mode) | Play continues. Allow site data to keep progress. |
| `save.corrupt` | "Saved progress was reset." | Schema or version mismatch | None needed; a fresh save was created |
| `audio.blocked` | "Sound needs a click to start." | Browser autoplay policy | Click the sound toggle |
| `cv.missing` | "PDF CV unavailable." | `public/cv/*.pdf` absent | Add the PDF at `public/cv/Ellanti_Jathin_CV.pdf`. The `/cv` page still works. |
| `content.invalid` | (dev/test only) | Schema violation | Fix the named file and field in `src/content/data/` |

---

## 6. Performance budgets
- `/` entry JS ≤ 200 KB gzip. The hero diorama chunk loads on idle.
- LCP ≤ 2.5 s on simulated fast 4G.
- Each game is its own chunk group. Models are Draco- or meshopt-compressed GLB, textures KTX2 where it helps.
- 60 fps target on a mid-range laptop at Medium. Low must hold 30+ fps on a mid-range phone (emulated here; real devices untested).
- Images: responsive `srcset`, `loading="lazy"`, explicit dimensions.

## 7. Testing
- `npm test` = `eslint . && tsc --noEmit && vitest run`.
- **Lint (narrow):** `no-undef`, `no-use-before-define`, `react-hooks/*`, `no-restricted-imports` (isolation).
- **Unit tests (Vitest):**
  - Content schema, and the `verified` gate.
  - Terrain determinism by seed.
  - Mesher: empty chunk, one block, full chunk, chunk-border faces.
  - Ambient occlusion values.
  - Collision: corners, edges, tunnelling at high speed.
  - Vehicle step bounds.
  - Lane-graph integrity.
  - Save/load: valid, old version, corrupt, storage throws.
  - Fault registry completeness, plus the static scan of `raise()` ids.
- **Browser tests (`npm run e2e`, Playwright):**
  - `/` at 360/768/1280/1920 px × light/dark: screenshot plus measured `scrollWidth <= clientWidth`.
  - Keyboard nav and the ⌘K palette.
  - CV download returns a `application/pdf` 200.
  - Project pages, and a 404 for an unknown slug.
  - `/play` keyboard selection.
  - Each game boots and renders non-blank canvas pixels (headless Chromium, software GL).
  - The pause menu opens every region panel.
  - ExitBar present.
  - Reduced-motion path.
  - WebGL disabled → redirect with banner.
  - Deep links `?open=`.
- **Not testable here:** real phone GPUs and touch hardware (emulated instead), the live Vercel deploy (unless asked), performance on real low-end devices.

## 8. Build phases and acceptance
Each phase ends with: the suite green, a Playwright render review, an updated `ARCHITECTURE.md`/README, and a report of what's untested.

1. **Foundation + Professional site.**
   - Scaffold, tokens, the content layer with real data, platform layer (faults, log, settings, save, webgl, ExitBar), the full professional site, `/cv`, `/projects/:slug`, 404, metadata.
   - The hero uses its poster until the dioramas exist.
   - `/play` World Select with the games marked "In development" and not clickable. No dead links.
2. **Block World.**
   - All of §4.3, its diorama in the hero and World Select, and its loading screen.
3. **Neon City.** All of §4.4 plus its diorama.
4. **Open City.** All of §4.5 plus its diorama.
5. **Polish and deploy prep.**
   - Cross-game QA, performance pass, Vercel config (SPA rewrites, cache headers).
   - Deploy only on the owner's go-ahead.

## 9. Risks
- **Scope.** Three full 3D games is a multi-session build. Mitigation: strict phase gates, and each game is shippable alone.
- **CC0 availability.** If a pack can't be fetched, code-built stand-ins ship, and the gap is reported.
- **Headless WebGL in tests.** Software rendering is slow; game e2e tests use Low quality and a short boot check.
- **Mobile GPU variance.** Auto quality tiers plus Lite mode. Real-device performance is untested here.
- **IP proximity.** Everything is original or CC0. Names are working titles chosen to avoid trademarks.
