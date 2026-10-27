import { describe, it, expect } from "vitest";
import { BOUNDS, BUILDINGS, CAR_SPAWNS, MARKERS, MARKER_RADIUS, ROAD, ROAD_LINES, SOLIDS, SPAWN, placeName } from "../../src/games/city/world/layout";
import { CAR, WALK, forwardSpeed, resolveCircle, stepCar, stepWalker, type Car, type Walker } from "../../src/games/city/player/physics";

const inside = (x: number, z: number, r: number) => SOLIDS.some((b) => x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r);

describe("SUNSET BAY layout", () => {
  it("markers and the spawn point are on open ground inside the bounds", () => {
    for (const m of MARKERS) {
      // The centre is clear by more than a body width; the trigger (MARKER_RADIUS) reaches further.
      expect(inside(m.at[0], m.at[1], 0.6), m.id).toBe(false);
      expect(MARKER_RADIUS).toBeGreaterThan(1.5);
      expect(m.at[0]).toBeGreaterThan(BOUNDS.minX);
      expect(m.at[0]).toBeLessThan(BOUNDS.maxX);
    }
    expect(inside(SPAWN.x, SPAWN.z, WALK.radius)).toBe(false);
  });

  it("every parked car sits on a road, clear of buildings and palms, facing along it", () => {
    for (const c of CAR_SPAWNS) {
      expect(inside(c.x, c.z, 1.1), `${c.x},${c.z}`).toBe(false);
      const onRoadAlongZ = ROAD_LINES.some((r) => Math.abs(c.x - r) < ROAD / 2);
      const onRoadAlongX = ROAD_LINES.some((r) => Math.abs(c.z - r) < ROAD / 2);
      expect(onRoadAlongZ || onRoadAlongX).toBe(true);
      const alongZ = Math.abs(Math.sin(c.heading)) > 0.9;
      expect(alongZ ? onRoadAlongZ : onRoadAlongX).toBe(true);
    }
    const hero = CAR_SPAWNS.filter((c) => c.hero);
    expect(hero).toHaveLength(1);
    // The red car is within reach from the spawn point, so "Press F" shows at once.
    expect(Math.hypot(hero[0].x - SPAWN.x, hero[0].z - SPAWN.z)).toBeLessThan(3.6);
  });

  it("buildings stay inside their blocks, clear of every road", () => {
    for (const b of BUILDINGS) for (const r of ROAD_LINES) {
      expect(b.x + b.w / 2 <= r - ROAD / 2 || b.x - b.w / 2 >= r + ROAD / 2).toBe(true);
      expect(b.z + b.d / 2 <= r - ROAD / 2 || b.z - b.d / 2 >= r + ROAD / 2).toBe(true);
    }
  });

  it("names places for the HUD", () => {
    expect(placeName(120, 30)).toBe("Ocean Drive");
    expect(placeName(150, 0)).toBe("Sunset Beach");
    expect(placeName(30, 0)).toBe("Main Strip");
  });
});

const walker = (x: number, z: number): Walker => ({ x, z, y: 0, vy: 0, onGround: true, facing: 0, speed: 0 });
const OPEN = { minX: -1000, maxX: 1000, minZ: -1000, maxZ: 1000 };

describe("walker", () => {
  it("runs where the camera looks, sprints faster, and turns to face the way it moves", () => {
    let w = walker(0, 0);
    for (let i = 0; i < 60; i++) w = stepWalker(w, { forward: 1, strafe: 0, camYaw: Math.PI / 2, sprint: false, jump: false }, 1 / 60, [], OPEN);
    expect(w.z).toBeGreaterThan(2.5);
    expect(Math.abs(w.x)).toBeLessThan(0.3);
    expect(w.speed).toBeCloseTo(WALK.walk, 1);
    let s = walker(0, 0);
    for (let i = 0; i < 60; i++) s = stepWalker(s, { forward: 1, strafe: 0, camYaw: 0, sprint: true, jump: false }, 1 / 60, [], OPEN);
    expect(s.x).toBeGreaterThan(w.z);
  });

  it("is stopped by a wall and jumps and lands", () => {
    const wall = [{ minX: 2, maxX: 3, minZ: -10, maxZ: 10 }];
    let w = walker(0, 0);
    for (let i = 0; i < 120; i++) w = stepWalker(w, { forward: 1, strafe: 0, camYaw: 0, sprint: true, jump: i === 0 }, 1 / 60, wall, OPEN);
    expect(w.x).toBeLessThanOrEqual(2 - WALK.radius + 1e-6);
    expect(w.onGround).toBe(true);
    expect(w.y).toBe(0);
  });

  it("is kept inside the bounds", () => {
    let w = walker(0, 0);
    for (let i = 0; i < 300; i++) w = stepWalker(w, { forward: 1, strafe: 0, camYaw: 0, sprint: true, jump: false }, 1 / 60, [], { minX: -5, maxX: 5, minZ: -5, maxZ: 5 });
    expect(w.x).toBe(5);
  });
});

const car = (): Car => ({ x: 0, z: 0, heading: 0, vx: 0, vz: 0, steer: 0 });

describe("arcade car", () => {
  it("accelerates to a capped top speed, brakes, then reverses", () => {
    let c = car();
    for (let i = 0; i < 60 * 20; i++) c = stepCar(c, { throttle: 1, steer: 0, handbrake: false }, 1 / 60, [], OPEN).car;
    expect(forwardSpeed(c)).toBeGreaterThan(CAR.maxForward * 0.9);
    expect(forwardSpeed(c)).toBeLessThanOrEqual(CAR.maxForward + 1e-6);
    for (let i = 0; i < 60 * 6; i++) c = stepCar(c, { throttle: -1, steer: 0, handbrake: false }, 1 / 60, [], OPEN).car;
    expect(forwardSpeed(c)).toBeLessThan(0);
    expect(forwardSpeed(c)).toBeGreaterThanOrEqual(-CAR.maxReverse - 1e-6);
  });

  it("turns right when steering right, and slides more with the handbrake", () => {
    let c = { ...car(), vx: 20 };
    for (let i = 0; i < 30; i++) c = stepCar(c, { throttle: 0.5, steer: 1, handbrake: false }, 1 / 60, [], OPEN).car;
    expect(c.heading).toBeGreaterThan(0.2); // +θ turns toward +z, the car's right
    const lateral = (k: Car) => Math.abs(k.vx * -Math.sin(k.heading) + k.vz * Math.cos(k.heading));
    let grip = { ...car(), vx: 20 };
    let drift = { ...car(), vx: 20 };
    for (let i = 0; i < 20; i++) {
      grip = stepCar(grip, { throttle: 0, steer: 1, handbrake: false }, 1 / 60, [], OPEN).car;
      drift = stepCar(drift, { throttle: 0, steer: 1, handbrake: true }, 1 / 60, [], OPEN).car;
    }
    expect(lateral(drift)).toBeGreaterThan(lateral(grip));
  });

  it("bounces off a wall, reporting the impact, and never ends up inside it", () => {
    const wall = [{ minX: 10, maxX: 12, minZ: -20, maxZ: 20 }];
    let c = { ...car(), vx: 25 };
    let impact = 0;
    for (let i = 0; i < 60; i++) {
      const r = stepCar(c, { throttle: 1, steer: 0, handbrake: false }, 1 / 60, wall, OPEN);
      c = r.car;
      impact = Math.max(impact, r.impact);
    }
    expect(impact).toBeGreaterThan(10);
    expect(c.x + CAR.axle + CAR.radius).toBeLessThanOrEqual(10 + 1e-3);
  });

  it("resolveCircle pushes out of a box along the nearest face", () => {
    const r = resolveCircle(0.9, 0, 0.5, [{ minX: -1, maxX: 1, minZ: -1, maxZ: 1 }]);
    expect(r.hit).toBe(true);
    expect(r.x).toBeCloseTo(1.5, 5);
    expect(r.nx).toBeCloseTo(1, 5);
  });
});
