import { describe, it, expect } from "vitest";
import { B, BLOCK_IDS, blockDef, isOccluder } from "../../src/games/block/world/blocks";
import { TILES, tileUV, ATLAS_TILES_PER_ROW } from "../../src/games/block/world/tiles";
import { createNoise2, fbm, hash3 } from "../../src/games/block/world/noise";
import { CHUNK, HEIGHT, SEA, VOLUME, generateChunk, heightAt, idx } from "../../src/games/block/world/generate";
import { GROUND_Y, REGIONS, STRUCTURE_BLOCKS, TROPHY_FRAMES, isProtected, regionAt } from "../../src/games/block/world/structures";
import { meshChunk, quadCount, AO_CURVE, type Neighborhood } from "../../src/games/block/world/mesher";

describe("block registry and atlas", () => {
  it("every block's textures point at real atlas tiles", () => {
    for (const id of BLOCK_IDS) {
      const d = blockDef(id);
      for (const t of [d.top, d.side, d.bottom]) {
        expect(t, d.name).toBeGreaterThanOrEqual(0);
        expect(t, d.name).toBeLessThan(TILES.length);
      }
    }
    expect(TILES.length).toBeLessThanOrEqual(ATLAS_TILES_PER_ROW * ATLAS_TILES_PER_ROW);
  });

  it("tile UVs sit inside [0,1] and inside their own cell", () => {
    for (let i = 0; i < TILES.length; i++) {
      const [u0, v0, u1, v1] = tileUV(i);
      expect(u0).toBeGreaterThan(0);
      expect(v1).toBeLessThan(1);
      expect(u1 - u0).toBeLessThan(1 / 16);
      expect(v1 - v0).toBeLessThan(1 / 16);
    }
  });

  it("only full cubes occlude neighbours", () => {
    expect(isOccluder(B.STONE)).toBe(true);
    expect(isOccluder(B.LANTERN)).toBe(true);
    for (const id of [B.AIR, B.WATER, B.LEAVES, B.GLASS, B.TALL_GRASS, B.SPAWNER]) expect(isOccluder(id)).toBe(false);
  });
});

describe("noise", () => {
  it("is deterministic per seed and bounded", () => {
    const a = createNoise2(42);
    const b = createNoise2(42);
    const c = createNoise2(43);
    let diff = 0;
    for (let i = 0; i < 200; i++) {
      const x = i * 1.37;
      const y = i * -0.71;
      expect(a(x, y)).toBe(b(x, y));
      expect(Math.abs(fbm(a, x, y))).toBeLessThanOrEqual(1.05);
      diff += Math.abs(a(x, y) - c(x, y));
    }
    expect(diff).toBeGreaterThan(1);
  });
  it("hash3 is in [0,1) and repeatable", () => {
    for (let i = -50; i < 50; i++) {
      const h = hash3(i, i * 2, -i, 7);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
      expect(hash3(i, i * 2, -i, 7)).toBe(h);
    }
  });
});

describe("terrain generation", () => {
  it("is deterministic and fills the chunk volume", () => {
    const a = generateChunk(3, -2);
    const b = generateChunk(3, -2);
    expect(a.length).toBe(VOLUME);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  it("has bedrock at y=0, and water only up to sea level", () => {
    const c = generateChunk(7, 9);
    for (let x = 0; x < CHUNK; x++) for (let z = 0; z < CHUNK; z++) expect(c[idx(x, 0, z)]).toBe(B.BEDROCK);
    for (let y = SEA + 1; y < HEIGHT; y++) for (let x = 0; x < CHUNK; x++) for (let z = 0; z < CHUNK; z++) expect(c[idx(x, y, z)]).not.toBe(B.WATER);
  });

  it("flattens the village plateau to the ground level", () => {
    for (const [x, z] of [[0, 0], [10, -10], [-25, 20], [30, 0]]) expect(heightAt(x, z)).toBe(GROUND_Y);
  });

  it("places every region's interactive block in the generated world", () => {
    const blockAt = (x: number, y: number, z: number) => generateChunk(Math.floor(x / 16), Math.floor(z / 16))[idx(((x % 16) + 16) % 16, y, ((z % 16) + 16) % 16)];
    const F = GROUND_Y + 1;
    expect(blockAt(-20, F, -16)).toBe(B.LECTERN);
    expect(blockAt(20, F, -19)).toBe(B.CHEST);
    expect(blockAt(0, F + 1, -28)).toBe(B.RUNE_TABLE);
    expect(blockAt(20, F, 17)).toBe(B.CRAFTING_TABLE);
    expect(blockAt(-20, F + 1, 16)).toBe(B.SPAWNER);
    for (const [x, y, z] of TROPHY_FRAMES) expect(blockAt(x, y, z)).toBe(B.FRAME);
    expect(blockAt(-10, F, 8)).toBe(B.PORTAL);
    // Doors are open and region spawn points are standable (air at feet + head, solid below).
    for (const r of REGIONS) {
      const [sx, sy, sz] = r.spawn;
      const bx = Math.floor(sx);
      const bz = Math.floor(sz);
      expect(blockAt(bx, sy, bz), `${r.id} feet`).toBe(B.AIR);
      expect(blockAt(bx, sy + 1, bz), `${r.id} head`).toBe(B.AIR);
      expect(blockDef(blockAt(bx, sy - 1, bz)).solid, `${r.id} floor`).toBe(true);
    }
  });

  it("protects buildings and paths but not open terrain", () => {
    expect(isProtected(-20, GROUND_Y + 1, -16)).toBe(true);
    expect(isProtected(0, GROUND_Y, 10)).toBe(true); // south path
    expect(isProtected(60, 40, 60)).toBe(false);
    expect(STRUCTURE_BLOCKS.size).toBeGreaterThan(4);
  });

  it("knows which region the player is standing in", () => {
    expect(regionAt(-20, GROUND_Y + 1, -16)?.id).toBe("archive");
    expect(regionAt(0.5, GROUND_Y + 1, 0.5)?.id).toBe("spawn");
    expect(regionAt(80, 40, 80)).toBeUndefined();
  });
});

describe("mesher", () => {
  const empty = () => new Uint8Array(VOLUME);
  const hood = (center: Uint8Array, fill: (d: number) => Uint8Array | null = () => empty()): Neighborhood =>
    Array.from({ length: 9 }, (_, i) => (i === 4 ? center : fill(i)));

  it("an empty chunk produces no geometry", () => {
    const m = meshChunk(hood(empty()));
    expect(quadCount(m.opaque) + quadCount(m.cutout) + quadCount(m.water) + quadCount(m.emissive)).toBe(0);
  });

  it("a single floating block has 6 faces; two adjacent blocks share none", () => {
    const c = empty();
    c[idx(5, 40, 5)] = B.STONE;
    expect(quadCount(meshChunk(hood(c)).opaque)).toBe(6);
    c[idx(6, 40, 5)] = B.STONE;
    expect(quadCount(meshChunk(hood(c)).opaque)).toBe(10);
  });

  it("culls a border face only when the neighbouring chunk is solid there", () => {
    const c = empty();
    c[idx(15, 40, 5)] = B.STONE;
    expect(quadCount(meshChunk(hood(c)).opaque)).toBe(6);
    const east = empty();
    east[idx(0, 40, 5)] = B.STONE;
    expect(quadCount(meshChunk(hood(c, (i) => (i === 5 ? east : empty()))).opaque)).toBe(5);
  });

  it("routes water, plants and emissive blocks into their own buckets", () => {
    const c = empty();
    c[idx(1, 40, 1)] = B.WATER;
    c[idx(4, 40, 4)] = B.TALL_GRASS;
    c[idx(8, 40, 8)] = B.LANTERN;
    const m = meshChunk(hood(c));
    expect(quadCount(m.water)).toBe(6);
    expect(quadCount(m.cutout)).toBe(2);
    expect(quadCount(m.emissive)).toBe(6);
    expect(quadCount(m.opaque)).toBe(0);
  });

  it("darkens vertices tucked into a corner (ambient occlusion)", () => {
    const c = empty();
    c[idx(5, 40, 5)] = B.STONE; // floor block
    c[idx(4, 41, 5)] = B.STONE; // wall to the west of the space above it
    const m = meshChunk(hood(c)).opaque;
    // Find the floor block's top face (all four vertices at y = 41, x ∈ [5,6]).
    const p = m.positions;
    const col = m.colors;
    const topVerts: number[] = [];
    for (let v = 0; v < p.length / 3; v++) if (p[v * 3 + 1] === 41 && p[v * 3] >= 5 && p[v * 3] <= 6 && p[v * 3 + 2] >= 5 && p[v * 3 + 2] <= 6) topVerts.push(v);
    const shades = topVerts.map((v) => col[v * 3]);
    expect(Math.min(...shades)).toBeLessThan(AO_CURVE[3]);
    expect(Math.max(...shades)).toBe(AO_CURVE[3]);
  });
});
