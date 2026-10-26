import { describe, it, expect } from "vitest";
import { TOWERS, POIS, COLLIDERS, BOUND, SPAWN, BILLBOARDS, insideTower, nearestPoi } from "../../src/games/neon/world/city";
import { stepWalker, RADIUS, type Walker, type WalkInput } from "../../src/games/neon/player/walker";
import { CYBER_SLOTS, installedIn, lifePath, perkColumns } from "../../src/games/neon/content";
import { realContent } from "./render";

const idle: WalkInput = { forward: 0, strafe: 0, yaw: 0, sprint: false, jump: false };
const walker = (x: number, z: number): Walker => ({ x, y: 0, z, vy: 0, onGround: true });
function run(w: Walker, input: WalkInput, seconds: number, boxes = COLLIDERS) {
  let s = w;
  for (let t = 0; t < seconds; t += 1 / 60) s = stepWalker(s, input, 1 / 60, boxes, BOUND);
  return s;
}

describe("district layout", () => {
  it("has towers inside the bounds, none overlapping the cross streets", () => {
    expect(TOWERS.length).toBeGreaterThan(16);
    for (const t of TOWERS) {
      expect(Math.abs(t.x) + t.w / 2).toBeLessThan(BOUND);
      expect(Math.abs(t.z) + t.d / 2).toBeLessThan(BOUND);
      // The central avenues (|x| < 7 or |z| < 7) stay clear.
      expect(Math.abs(t.x) - t.w / 2).toBeGreaterThan(6.9);
      expect(Math.abs(t.z) - t.d / 2).toBeGreaterThan(6.9);
      expect(t.h).toBeGreaterThan(15);
    }
  });

  it("puts all eight CV locations on walkable sidewalk, one per brief region", () => {
    expect(POIS.map((p) => p.region).sort()).toEqual(["A", "B", "C", "D", "E", "F", "G", "H"]);
    for (const p of POIS) {
      expect(insideTower(p.at[0], p.at[1], RADIUS), p.id).toBe(false);
      // The storefront facade really is a tower face next to the point.
      expect(insideTower(p.facade.x - p.facade.nx * 0.5, p.facade.z - p.facade.nz * 0.5), `${p.id} facade`).toBe(true);
    }
  });

  it("spawns on open street with a POI within reach", () => {
    expect(insideTower(SPAWN[0], SPAWN[1], RADIUS)).toBe(false);
    expect(nearestPoi(SPAWN[0], SPAWN[1]).dist).toBeLessThan(30);
  });

  it("places billboards on tower faces (just outside the wall)", () => {
    expect(BILLBOARDS.length).toBeGreaterThan(4);
    for (const b of BILLBOARDS) expect(insideTower(b.x, b.z)).toBe(false);
  });
});

describe("walker", () => {
  it("walks forward (−Z at yaw 0) along the avenue", () => {
    const s = run(walker(0, 12), { ...idle, forward: 1 }, 1);
    expect(s.z).toBeLessThan(12 - 3.5);
    expect(s.x).toBeCloseTo(0, 5);
  });

  it("cannot walk into a tower and slides along its wall", () => {
    const t = TOWERS.find((x) => x.x < 0 && x.z < 0 && x.w > 20)!;
    const face = t.x + t.w / 2;
    // Start on the sidewalk east of the tower, walk west and slightly north.
    const s = run({ ...walker(face + 2, t.z), y: 0 }, { ...idle, forward: 1, strafe: -0.4, yaw: Math.PI / 2 }, 3);
    expect(s.x).toBeGreaterThanOrEqual(face + RADIUS - 1e-6);
    expect(s.z).not.toBeCloseTo(t.z, 1); // slid along the wall
  });

  it("never leaves the district", () => {
    const s = run(walker(0, 12), { ...idle, forward: 1, sprint: true }, 30);
    expect(Math.abs(s.z)).toBeLessThanOrEqual(BOUND);
  });

  it("jumps and lands", () => {
    let s = stepWalker(walker(0, 12), { ...idle, jump: true }, 1 / 60, COLLIDERS, BOUND);
    expect(s.onGround).toBe(false);
    s = run(s, idle, 1.5);
    expect(s.y).toBe(0);
    expect(s.onGround).toBe(true);
  });

  it("does not tunnel through a thin wall at sprint speed with a huge frame", () => {
    const wall = [{ minX: -10, maxX: 10, minZ: -0.1, maxZ: 0.1 }];
    const s = stepWalker(walker(0, 1), { ...idle, forward: 1, sprint: true }, 0.1, wall, BOUND);
    const s2 = run(s, { ...idle, forward: 1, sprint: true }, 2, wall);
    expect(s2.z).toBeGreaterThan(0.1);
  });
});

describe("CV → Neon City", () => {
  const c = realContent();
  it("installs every skill in exactly one cyberware slot", () => {
    const installed = CYBER_SLOTS.flatMap((s) => installedIn(c, s).map((k) => k.id));
    expect(installed.sort()).toEqual(c.skills.map((s) => s.id).sort());
  });
  it("life path lists every education and experience entry, newest first", () => {
    const lp = lifePath(c);
    expect(lp).toHaveLength(c.education.length + c.experience.length);
    expect(lp[0].start >= lp.at(-1)!.start).toBe(true);
    expect(lp.find((e) => e.id === "kl-university")!.detail).toContain("CGPA: 9.02");
  });
  it("perk columns cover the whole skill tree with prerequisites first", () => {
    const cols = perkColumns(c.skillTree);
    expect(cols.flatMap((x) => x.nodes).length).toBe(c.skillTree.length);
    expect(perkColumns([])).toEqual([]);
  });
});
