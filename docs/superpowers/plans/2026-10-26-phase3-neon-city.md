# Phase 3: Neon City (NEON//SPRAWL), Implementation Plan

> Owner directive: build continuously; this plan is recorded for traceability and executed inline.

**Goal:** a first-person, Cyberpunk-style night district at `/play/neon` that presents the real CV through in-world locations and an angular neon HUD. Every section is reachable from the pause menu without walking.

**Spec:** §4.4, §4.6, §5. Same invariants as Block World: ExitBar always visible, nothing invented, games isolated (no imports from `games/block`).

## Design
- **District:** a bounded 4×4 grid of city blocks (28 m blocks, 14 m streets) ring-fenced by a barrier.
  - Seeded towers (18–150 m) on each block, merged into **one** geometry with UV-scaled window facades (a single draw call).
  - Ground is one canvas-painted texture: asphalt, lane lines, crosswalks, sidewalks, puddles.
- **Look:**
  - Night sky dome with horizon city-glow, exponential purple fog, rain streaks (GPU shader, no per-frame CPU).
  - Neon storefront signs and holographic billboards (canvas text), flying cars on loops.
  - `MeshStandardMaterial` lit by a procedural environment (drei `Environment` + `Lightformer`, so no HDR download) and a few coloured point lights.
  - Postprocessing: Bloom, ChromaticAberration, Vignette, Noise. Skipped on Low quality. Wet streets use a mirror reflector on High.
- **Player:** first-person walker (pure `stepWalker`: circle-vs-AABB against tower footprints, gravity and jump, district bounds). Unit-tested.
- **Locations (POIs) → screens:**

  | Location | Brief region | Screen |
  |---|---|---|
  | Home H7 | A | Character |
  | Records kiosk | B | Journal → Life Path |
  | Ripperdoc | C | Cyberware (skills by body slot) |
  | Netrunner den | D | Perks (skill tree) |
  | The Last Byte (fixer) | E | Journal → Jobs (projects) |
  | Gig board | F | Journal → Gigs (case studies; honest empty state) |
  | Data broker | G | Shards (achievements) |
  | Metro | H | Contact + leave |

- **Scanner (hold Tab):** the canvas desaturates; HTML tags track every POI on screen with name and distance.
- **HUD:**
  - Status card: name, level = locations discovered, street-cred bar.
  - Rotating minimap with POI pips, nearest-objective tracker, clock, interaction prompt, holo-call welcome.
  - Font: Rajdhani + Orbitron (OFL).

## Files
| Path | Contents |
|---|---|
| `src/games/neon/world/city.ts` | Layout, towers, POIs, colliders, billboard slots. Pure. |
| `src/games/neon/player/walker.ts` | Walker physics. Pure. |
| `src/games/neon/content.ts` | Perk columns, journal entries, cyberware slots. Pure. |
| `src/games/neon/world/*.tsx` | City meshes, Ground, Signs, Billboards, Rain, Traffic, Sky, Effects. |
| `src/games/neon/player/Player.tsx`, `input.ts` | Look, move, POI proximity, scanner. |
| `src/games/neon/store.ts`, `runtime.ts` | State; save `jp.neon.v1`. |
| `src/games/neon/ui/*` | `neon.css`, Hud, Minimap, ScanTags, HoloCall, screens (Character, Journal, Cyberware, Perks, Shards, Map, Pause, Settings, Exit). |
| `src/games/neon/NeonGame.tsx`, `index.tsx` | Game shell and the route entry `/play/neon`. |

## Tests
- **Unit:**
  - City is deterministic.
  - POIs are reachable: on a sidewalk, not inside a tower.
  - Colliders block walking into towers; district bounds hold.
  - Walker moves and slides along walls without tunnelling.
  - Content mapping: every skill sits in exactly one cyberware slot; perks cover the whole tree.
- **E2E:**
  - Boots and renders non-blank.
  - ExitBar visible.
  - The pause menu opens every screen; real content is present.
  - Map fast travel works; the metro exit returns to `/`.
  - No console errors; phone width has no overflow.
