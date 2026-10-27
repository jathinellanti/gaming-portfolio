# Phase 4: Open City (SUNSET BAY) — plan

Owner request (2026-10-26/27): "the GTA as real GTA game … in which we need to run … finish them". Third person, run and drive, sunset coastal city, CV as missions. Original assets only (no GTA names, fonts, logos or map).

## Files (src/games/city/)

| File | Owns |
|---|---|
| `index.tsx` | Route `/play/city` (lazy); WebGL2 check → `/?notice=webgl`. |
| `CityGame.tsx` | Canvas, scene, lighting, HUD + screens, input wiring, audio, fault capture (`webgl.context_lost`). |
| `store.ts` | Zustand UI state; `jp.city.v1` save (missions passed, options), versioned + validated. |
| `runtime.ts` | Mutable per-frame state outside React (player, car, camera, input). |
| `content.ts` | CV → missions mapping (pure, unit-tested). |
| `world/layout.ts` | City grid, roads, buildings, palms, beach/ocean bounds, mission markers, car spawns, colliders (pure, unit-tested). |
| `world/World.tsx` | Sky, sun, ocean, ground (roads/sidewalks/sand), merged art-deco buildings, instanced palms, lamps. |
| `world/Traffic.tsx` | AI cars on road loops that yield to whatever is ahead. |
| `player/physics.ts` | Pure walker + arcade car (grip/handbrake drift) + circle-vs-AABB collision (unit-tested). |
| `player/Player.tsx` | Character model + procedural run cycle, enter/exit cars, third-person and chase cameras, marker triggers. |
| `player/CarModel.tsx` | Car meshes (body, cabin, wheels, lights). |
| `ui/*` | HUD (rotating minimap, zone/street name, help box), mission card + "MISSION PASSED", phone, pause/map/settings, `city.css`. |

## Mechanics

- On foot: WASD relative to camera, Shift sprint, Space jump, mouse orbit camera (pointer lock), collisions with buildings, props and bounds.
- Cars: F to enter the nearest car within 3.5 m, W/S throttle/brake-reverse, A/D steer (less lock at speed), Space handbrake (grip drops → drift), F to exit beside the car. Chase camera.
- Missions: yellow markers; entering one opens its card (project / section from content), "MISSION PASSED" on completion, saved.
- Phone (↑ or P): contacts (email, GitHub, CV), missions list, map, settings, exit.
- Audio: platform audio "city" ambience (surf, gulls, distant traffic), engine tone from speed.

## Tests

Unit: layout invariants (markers on sidewalks, spawns clear of colliders, roads inside bounds), physics (walker collides, car accelerates/turns/drifts/stops at walls), content mapping. E2E: boots, HUD + ExitBar visible, enter a car, open phone, no console errors.
