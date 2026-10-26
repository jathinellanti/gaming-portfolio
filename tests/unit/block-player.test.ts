import { describe, it, expect } from "vitest";
import { stepBody, PLAYER, type Body, type MoveInput, type WorldQuery } from "../../src/games/block/player/physics";
import { raycastVoxels } from "../../src/games/block/player/raycast";

const idle: MoveInput = { forward: 0, strafe: 0, jump: false, sneak: false, sprint: false, fly: false, yaw: 0 };
const body = (x: number, y: number, z: number): Body => ({ x, y, z, vx: 0, vy: 0, vz: 0, onGround: false, inWater: false });

/** Flat floor at y = 0 (blocks y ≤ 0 solid), plus optional extra solid blocks. */
function world(extra: [number, number, number][] = [], water: [number, number, number][] = []): WorldQuery {
  const s = new Set(extra.map((p) => p.join(",")));
  const w = new Set(water.map((p) => p.join(",")));
  return { solid: (x, y, z) => y <= 0 || s.has(`${x},${y},${z}`), water: (x, y, z) => w.has(`${x},${y},${z}`) };
}

function run(b: Body, input: MoveInput, seconds: number, w: WorldQuery, dt = 1 / 60) {
  let s = b;
  for (let t = 0; t < seconds; t += dt) s = stepBody(s, input, dt, w);
  return s;
}

describe("physics", () => {
  it("falls and lands on the ground", () => {
    const s = run(body(0.5, 10, 0.5), idle, 2, world());
    expect(s.y).toBeCloseTo(1, 5);
    expect(s.onGround).toBe(true);
    expect(s.vy).toBe(0);
  });

  it("walks forward (−Z at yaw 0) at walking speed", () => {
    const start = run(body(0.5, 1, 0.5), idle, 0.2, world());
    const s = run(start, { ...idle, forward: 1 }, 1, world());
    expect(s.z).toBeLessThan(start.z - 3.5);
    expect(Math.abs(s.x - start.x)).toBeLessThan(0.01);
  });

  it("is stopped by a wall", () => {
    const wall: [number, number, number][] = [];
    for (let x = -3; x <= 3; x++) for (let y = 1; y <= 3; y++) wall.push([x, y, -3]);
    const s = run(body(0.5, 1, 0.5), { ...idle, forward: 1 }, 3, world(wall));
    expect(s.z).toBeGreaterThanOrEqual(-2 + PLAYER.width / 2 - 1e-3);
  });

  it("does not tunnel through a 1-block floor at very high speed", () => {
    const s = stepBody({ ...body(0.5, 30, 0.5), vy: -78 }, idle, 0.1, world());
    const s2 = run(s, idle, 1, world());
    expect(s2.y).toBeGreaterThanOrEqual(1 - 1e-6);
  });

  it("jumps a bit over one block high", () => {
    let s = run(body(0.5, 1, 0.5), idle, 0.2, world());
    s = stepBody(s, { ...idle, jump: true }, 1 / 60, world());
    let apex = s.y;
    for (let i = 0; i < 90; i++) {
      s = stepBody(s, idle, 1 / 60, world());
      apex = Math.max(apex, s.y);
    }
    expect(apex - 1).toBeGreaterThan(1.1);
    expect(apex - 1).toBeLessThan(1.45);
  });

  it("bumps its head on a ceiling", () => {
    const ceiling: [number, number, number][] = [[0, 3, 0]];
    let s = run(body(0.5, 1, 0.5), idle, 0.2, world(ceiling));
    s = stepBody(s, { ...idle, jump: true }, 1 / 60, world(ceiling));
    for (let i = 0; i < 60; i++) s = stepBody(s, idle, 1 / 60, world(ceiling));
    expect(s.y + PLAYER.height).toBeLessThanOrEqual(3 + 1e-3);
  });

  it("sneaking stops at a ledge", () => {
    // Platform: blocks at y=0 only for z ≥ -1 (the floor function covers y ≤ 0 everywhere,
    // so build a raised platform instead).
    const plat: [number, number, number][] = [];
    for (let x = -2; x <= 2; x++) for (let z = -1; z <= 2; z++) plat.push([x, 5, z]);
    const w: WorldQuery = { solid: (x, y, z) => plat.some((p) => p[0] === x && p[1] === y && p[2] === z), water: () => false };
    let s = run(body(0.5, 6, 0.5), idle, 0.3, w);
    expect(s.onGround).toBe(true);
    s = run(s, { ...idle, forward: 1, sneak: true }, 3, w);
    expect(s.y).toBeCloseTo(6, 3);
    expect(s.z).toBeGreaterThan(-1 - PLAYER.width / 2 - 0.01);
  });

  it("floats slowly in water and can swim up", () => {
    const water: [number, number, number][] = [];
    for (let y = 1; y <= 6; y++) water.push([0, y, 0]);
    const s = run(body(0.5, 5, 0.5), idle, 0.5, world([], water));
    expect(s.inWater).toBe(true);
    expect(s.vy).toBeGreaterThanOrEqual(-3.5);
    const up = run(s, { ...idle, jump: true }, 0.5, world([], water));
    expect(up.y).toBeGreaterThan(s.y);
  });

  it("flies without gravity", () => {
    const s = run(body(0.5, 10, 0.5), { ...idle, fly: true }, 1, world());
    expect(s.y).toBeCloseTo(10, 1);
  });
});

describe("raycast", () => {
  const solidAt = (blocks: [number, number, number][]) => (x: number, y: number, z: number) => blocks.some((b) => b[0] === x && b[1] === y && b[2] === z);

  it("hits the first block and reports the entry face", () => {
    const hit = raycastVoxels([0.5, 0.5, 0.5], [0, 0, -1], 5, solidAt([[0, 0, -3], [0, 0, -2]]));
    expect(hit).toMatchObject({ x: 0, y: 0, z: -2, normal: [0, 0, 1] });
    expect(hit!.distance).toBeCloseTo(1.5, 5);
  });

  it("reports the top face when looking down", () => {
    const hit = raycastVoxels([2.5, 3.6, 2.5], [0, -1, 0], 5, solidAt([[2, 1, 2]]));
    expect(hit).toMatchObject({ x: 2, y: 1, z: 2, normal: [0, 1, 0] });
  });

  it("returns null beyond reach and for a zero direction", () => {
    expect(raycastVoxels([0.5, 0.5, 0.5], [1, 0, 0], 4, solidAt([[6, 0, 0]]))).toBeNull();
    expect(raycastVoxels([0.5, 0.5, 0.5], [0, 0, 0], 4, () => true)).toBeNull();
  });

  it("handles diagonal rays", () => {
    const hit = raycastVoxels([0.5, 0.5, 0.5], [1, 1, 0], 6, solidAt([[2, 2, 0]]));
    expect(hit).toMatchObject({ x: 2, y: 2, z: 0 });
  });
});
