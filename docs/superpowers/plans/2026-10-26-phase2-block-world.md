# Phase 2: Block World (JATHINCRAFT), Implementation Plan

> Owner directive (2026-10-26): build continuously without approval stops. This plan is written down for traceability and executed inline.

**Goal:** a playable, Minecraft-style, first-person voxel game at `/play/block` that presents the real CV through in-world places and Minecraft-like GUI screens. Every CV section is reachable without walking.

**Spec:** `docs/superpowers/specs/2026-10-26-dual-realm-portfolio-design.md` §4.3, §4.6, §5.

**Stack:**
| Package | Version |
|---|---|
| three | 0.186.1 |
| @react-three/fiber | 9.8.2 |
| @fontsource/pixelify-sans | 5.3.0 (OFL) |

There is no physics engine: physics, raycast and meshing are pure functions with unit tests.

## Global constraints
- **Content:** all CV content comes from `useContent()`. Nothing is invented. Unverified case studies never render; the dungeon shows a designed empty state.
- **Imports:** nothing under `src/games/block/` is imported by the site, play layer or other games, except through `lazy()` in the router (ESLint enforced).
- **ExitBar:** always visible. Pause menu (Esc), map (M) and inventory (E) open from anywhere.
- **IP:** all textures are generated in code; no Minecraft assets, logos, sounds or names.
- **Reduced motion:** no head-bob, no hand sway, no screen shake.
- **Faults:** `webgl.unsupported` (redirect to `/` with a banner), `webgl.context_lost`, `worker.failed` (synchronous fallback), `storage.unavailable` / `save.corrupt` (via `versionedStore`).

## Design decisions
- **Meshing:** per-face culling with per-vertex ambient occlusion and fixed face shading (top 1.0, N/S 0.8, E/W 0.6, bottom 0.5). This is how the original game looks.
  - Greedy meshing is **not** used, because it breaks per-vertex AO and atlas tiling. The spec mentioned it; this plan supersedes that line.
- **Rendering:** unlit `MeshBasicMaterial` with vertex colours. Day/night is done by scaling the material colour, as the original game does, rather than with a light rig. Fog matches the sky colour.
- **Chunks:** 16×16×96 `Uint8Array`, indexed `x + z*16 + y*256`. Data is generated for radius + 1 and meshed for the radius. Generation and meshing run in a module Web Worker with a synchronous fallback.
- **Render distance:** Low 3, Medium 5, High 7, Ultra 9. Auto picks Low on coarse pointers or when `lite` is set, otherwise Medium.

## File structure
```
src/games/block/
  index.tsx                 route entry (lazy): WebGL check → BlockGame
  BlockGame.tsx             Canvas + HUD + screens + ExitBar; owns pointer lock and input focus
  store.ts                  zustand: screen, hotbar slot, time, camera mode, discovered regions, toasts; persisted via versionedStore
  world/blocks.ts           block registry (id → textures, solid, opaque, render bucket)
  world/atlas.ts            procedural 16×16 pixel textures → 256×256 atlas (main thread), tile UV lookup
  world/noise.ts            seeded 2D simplex + fbm
  world/structures.ts       region buildings (village) as block-placement programs + protected boxes + interaction points
  world/generate.ts         chunk terrain: heightmap, beach/ocean, ores, trees, flowers, structures
  world/mesher.ts           chunk → {opaque, cutout, water} geometry arrays with AO
  world/world.worker.ts     gen + mesh off the main thread
  world/ChunkManager.ts     load/unload rings, worker jobs, edits, getBlock/setBlock, Three meshes
  world/WorldView.tsx       R3F component that mounts ChunkManager meshes and shared materials
  sky/Sky.tsx               sky colour, square sun and moon, stars, cloud layer, fog, day/night
  player/physics.ts         AABB vs voxel step (gravity, jump, sprint, sneak, swim, fly)
  player/raycast.ts         voxel DDA raycast (hit block + face normal)
  player/input.ts           keyboard/mouse/touch → input state
  player/Player.tsx         camera, first-person arm + held item, F5 modes, block breaking/placing
  player/Avatar.tsx         block-character model (original skin) for third person and the NPC guide
  ui/gui.css                Minecraft-like GUI styling (panels, slots, buttons, tooltips, book)
  ui/Hud.tsx                crosshair, hotbar, XP bar = regions discovered, actionbar, title/subtitle, toasts, boss bar, F3 overlay
  ui/screens/*.tsx          Inventory (Armory), Crafting (projects), Advancements (skill tree),
                            Book (bio + education + experience), Trophy (certs), Dungeon (case studies),
                            ExitPortal (contact), Pause, Map (+ teleport list), Chat
  ui/itemIcons.tsx          skill → pixel-art item icon (Simple Icons path rasterised to 16×16, upscaled)
  content.ts                CV → game mapping (recipes, advancement tree layout, book pages, regions)
```

## Regions (world coordinates; spawn at 0,0)
| Region | Spec | Building | Interaction | Screen |
|---|---|---|---|---|
| Spawn plaza | | Cobble cross paths, guide NPC, sign | | Welcome |
| The Archive (A + B) | A, B | Library: bookshelves, lectern | Lectern | Book & Quill: about, education, experience |
| The Armory (C) | C | Stone-brick hall, chests | Chest | Creative-style inventory, tabs per skill category |
| Advancement Shrine (D) | D | Rune table on a plinth | Rune table | Advancements tree |
| Crafting Hall (E) | E | Workshop with crafting tables | Crafting table | Recipe book: each project's tech → project item → project page |
| The Dungeon (F) | F | Cobble crypt with spawner | Spawner | Case studies, or the "arena awaits" empty state |
| Hall of Trophies (G) | G | Gold-trim hall, item frames | Frame | Certifications; toast on first entry |
| Exit Gate (H) | H | Stone arch portal | Walk into the portal | Contact card + leave confirmation |

## Tests
- **Unit:**
  - Block registry and atlas indices are valid.
  - Noise and generation are deterministic per seed.
  - Structures appear in their chunks; protected boxes are respected.
  - Mesher:
    - empty chunk → 0 quads; one block → 6;
    - two adjacent → 10;
    - a border face is culled when the neighbour is solid;
    - water gets its own bucket;
    - an AO corner gives a darker vertex.
  - Physics:
    - fall and land;
    - wall stop;
    - no tunnelling at 50 m/s;
    - jump apex ≈ 1.25 blocks;
    - sneak stays on the ledge (optional).
  - Raycast: first hit and face normal, nothing beyond reach.
  - Chat commands parser.
  - Content mapping:
    - one recipe per project, ingredients = tech;
    - the advancement layout covers every skill-tree node;
    - book pages cover all education and experience.
- **E2E (`/play/block`, Chromium with software WebGL):**
  - boots and renders non-blank pixels;
  - ExitBar visible;
  - the pause menu opens each screen;
  - map teleport works;
  - Esc closes screens;
  - no console errors;
  - screenshots at 1280 and 360 px.
- **Bundle:** `/` first paint is unchanged (≤ 200 KB gzip, no WebGL renderer).

## Done when
- `npm test` and `npm run e2e` pass.
- `WORLDS.block.status = "available"`.
- ARCHITECTURE.md and README are updated.
- Screenshots have been reviewed by eye.
