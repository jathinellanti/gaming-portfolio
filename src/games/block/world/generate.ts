import { B } from "./blocks";
import { createNoise2, fbm, hash3, type Noise2 } from "./noise";
import { GROUND_Y, STRUCTURE_BLOCKS } from "./structures";

export const CHUNK = 16;
export const HEIGHT = 96;
export const SEA = 30;
export const VOLUME = CHUNK * CHUNK * HEIGHT;
export const WORLD_SEED = 20260526;

const VILLAGE_FLAT = 40;
const VILLAGE_BLEND = 62;
const TREE_FREE = 46;

export const idx = (x: number, y: number, z: number) => x + z * CHUNK + y * CHUNK * CHUNK;

const noiseCache = new Map<number, { base: Noise2; hills: Noise2; cont: Noise2; forest: Noise2 }>();
function noises(seed: number) {
  let n = noiseCache.get(seed);
  if (!n) noiseCache.set(seed, (n = { base: createNoise2(seed), hills: createNoise2(seed + 1), cont: createNoise2(seed + 2), forest: createNoise2(seed + 3) }));
  return n;
}

/** Surface height (y of the top solid block) for a world column. */
export function heightAt(x: number, z: number, seed = WORLD_SEED): number {
  const n = noises(seed);
  let h = SEA + 3 + fbm(n.base, x * 0.008, z * 0.008, 4) * 9 + Math.max(0, fbm(n.hills, x * 0.018, z * 0.018, 3)) * 18;
  const c = fbm(n.cont, x * 0.0035 + 40, z * 0.0035 - 17, 3);
  if (c < -0.3) h -= (-0.3 - c) * 42;
  const d = Math.hypot(x, z);
  if (d < VILLAGE_FLAT) h = GROUND_Y;
  else if (d < VILLAGE_BLEND) {
    const t = (d - VILLAGE_FLAT) / (VILLAGE_BLEND - VILLAGE_FLAT);
    const s = t * t * (3 - 2 * t);
    h = GROUND_Y + (h - GROUND_Y) * s;
  }
  return Math.max(4, Math.min(HEIGHT - 24, Math.round(h)));
}

function treeAt(x: number, z: number, seed: number): boolean {
  if (Math.hypot(x, z) < TREE_FREE) return false;
  const density = 0.006 + Math.max(0, fbm(noises(seed).forest, x * 0.01, z * 0.01, 2)) * 0.05;
  return hash3(x, 7, z, seed) < density;
}

/** Generate the blocks of chunk (cx, cz). Deterministic for a seed. */
export function generateChunk(cx: number, cz: number, seed = WORLD_SEED): Uint8Array {
  const data = new Uint8Array(VOLUME);
  const ox = cx * CHUNK;
  const oz = cz * CHUNK;

  for (let lx = 0; lx < CHUNK; lx++)
    for (let lz = 0; lz < CHUNK; lz++) {
      const x = ox + lx;
      const z = oz + lz;
      const h = heightAt(x, z, seed);
      const beach = h <= SEA + 1;
      data[idx(lx, 0, lz)] = B.BEDROCK;
      for (let y = 1; y <= h; y++) {
        let id: number;
        if (y === h) id = beach ? (h < SEA - 2 ? B.GRAVEL : B.SAND) : B.GRASS;
        else if (y >= h - 3) id = beach ? B.SAND : B.DIRT;
        else {
          const r = hash3(x, y, z, seed);
          id = y < 26 && r < 0.0025 ? B.GOLD_ORE : y < 70 && r < 0.012 ? B.COAL_ORE : B.STONE;
        }
        data[idx(lx, y, lz)] = id;
      }
      for (let y = h + 1; y <= SEA; y++) data[idx(lx, y, lz)] = B.WATER;
      // Ground cover
      if (!beach && h + 1 < HEIGHT) {
        const r = hash3(x, 1, z, seed + 9);
        if (r < 0.06) data[idx(lx, h + 1, lz)] = r < 0.004 ? B.FLOWER_RED : r < 0.008 ? B.FLOWER_YELLOW : B.TALL_GRASS;
      }
    }

  // Trees: scan a margin so canopies that cross into this chunk are included.
  for (let x = ox - 2; x < ox + CHUNK + 2; x++)
    for (let z = oz - 2; z < oz + CHUNK + 2; z++) {
      if (!treeAt(x, z, seed)) continue;
      const h = heightAt(x, z, seed);
      if (h <= SEA + 1) continue;
      const trunk = 4 + Math.floor(hash3(x, 3, z, seed) * 3);
      const put = (wx: number, wy: number, wz: number, id: number, onlyAir: boolean) => {
        const lx = wx - ox;
        const lz = wz - oz;
        if (lx < 0 || lz < 0 || lx >= CHUNK || lz >= CHUNK || wy >= HEIGHT) return;
        const i = idx(lx, wy, lz);
        if (onlyAir && data[i] !== B.AIR && data[i] !== B.TALL_GRASS && data[i] !== B.FLOWER_RED && data[i] !== B.FLOWER_YELLOW) return;
        data[i] = id;
      };
      const top = h + trunk;
      for (let y = top - 2; y <= top + 1; y++) {
        const rad = y >= top ? 1 : 2;
        for (let dx = -rad; dx <= rad; dx++)
          for (let dz = -rad; dz <= rad; dz++) {
            if (rad === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2 && hash3(x + dx, y, z + dz, seed) < 0.6) continue;
            if (y === top + 1 && Math.abs(dx) + Math.abs(dz) > 1) continue;
            put(x + dx, y, z + dz, B.LEAVES, true);
          }
      }
      for (let y = h + 1; y <= top; y++) put(x, y, z, B.LOG, false);
      put(x, h, z, B.DIRT, false);
    }

  // Village structures override terrain (including explicit air to carve interiors).
  const s = STRUCTURE_BLOCKS.get(`${cx},${cz}`);
  if (s) for (let i = 0; i < s.length; i += 4) data[idx(s[i] - ox, s[i + 1], s[i + 2] - oz)] = s[i + 3];

  return data;
}
