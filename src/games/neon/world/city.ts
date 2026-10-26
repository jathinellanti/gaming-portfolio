// NEON//SPRAWL district layout: pure data, deterministic. A 4×4 grid of city
// blocks around a central crossroads; the eight storefronts facing that crossroads
// are the CV locations (spec §4.2 A–H).

export const BLOCK = 28;
export const STREET = 14;
export const PITCH = BLOCK + STREET; // 42
export const BOUND = 2 * PITCH + STREET / 2; // ring barrier at ±91
export const SIDEWALK = 3;

export type ScreenId = "character" | "lifepath" | "cyberware" | "perks" | "jobs" | "gigs" | "shards" | "exit";

export interface Tower {
  x: number; // centre
  z: number;
  w: number; // x size
  d: number; // z size
  h: number;
  tint: number; // 0..1 facade tint
  seed: number;
  /** Optional upper tier (setback), as fraction of footprint and start height. */
  tier?: { scale: number; from: number };
}

export interface Poi {
  id: string;
  name: string;
  sign: string;
  hint: string;
  region: string;
  screen: ScreenId;
  color: string;
  /** Interaction point on the sidewalk (feet). */
  at: [number, number];
  /** Facade the sign hangs on: point on the wall + outward normal (x or z axis). */
  facade: { x: number; z: number; nx: number; nz: number };
}

export interface Box2 {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const blockCenter = (i: number) => (i - 1.5) * PITCH; // i in 0..3 → -63, -21, 21, 63

function hash(a: number, b: number, c = 0): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1274126177) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Towers for every block; the four blocks touching the crossroads get a full-width tower so storefronts line the avenue. */
function buildTowers(): Tower[] {
  const out: Tower[] = [];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const cx = blockCenter(i);
      const cz = blockCenter(j);
      const central = (i === 1 || i === 2) && (j === 1 || j === 2);
      const ring = Math.max(Math.abs(i - 1.5), Math.abs(j - 1.5)) - 0.5; // 0 inner, 1 outer
      const tall = (central ? 95 : 55) - ring * 15;
      const r = hash(i, j);
      if (central || r < 0.35) {
        out.push({ x: cx, z: cz, w: BLOCK - 2, d: BLOCK - 2, h: tall + hash(i, j, 1) * 60, tint: hash(i, j, 2), seed: i * 4 + j, tier: { scale: 0.62, from: 0.55 + hash(i, j, 3) * 0.2 } });
      } else if (r < 0.7) {
        const vertical = hash(i, j, 4) < 0.5;
        for (const s of [-1, 1]) {
          const w = vertical ? BLOCK / 2 - 1.5 : BLOCK - 2;
          const d = vertical ? BLOCK - 2 : BLOCK / 2 - 1.5;
          out.push({ x: cx + (vertical ? s * (BLOCK / 4) : 0), z: cz + (vertical ? 0 : s * (BLOCK / 4)), w, d, h: 22 + hash(i, j, 5 + s) * tall, tint: hash(i, j, 6 + s), seed: i * 40 + j * 4 + s + 2 });
        }
      } else {
        for (const sx of [-1, 1])
          for (const sz of [-1, 1]) {
            const q = hash(i * 7 + sx, j * 7 + sz);
            out.push({ x: cx + sx * (BLOCK / 4), z: cz + sz * (BLOCK / 4), w: BLOCK / 2 - 1.5, d: BLOCK / 2 - 1.5, h: 18 + q * tall * 0.9, tint: q, seed: i * 100 + j * 10 + sx * 3 + sz });
          }
      }
    }
  return out;
}

export const TOWERS: Tower[] = buildTowers();

const FACE = BLOCK / 2 - 1; // tower face offset from block centre (13)
const OUT = FACE + 2.2; // interaction point: on the sidewalk in front of the face

export const POIS: Poi[] = [
  { id: "ripperdoc", name: "Ripperdoc Clinic", sign: "RIPPERDOC", hint: "Skills, installed as cyberware", region: "C", screen: "cyberware", color: "#3ef0ff", at: [-21 + OUT, -21], facade: { x: -21 + FACE, z: -21, nx: 1, nz: 0 } },
  { id: "home", name: "Megabuilding H7", sign: "H7 · HOME", hint: "Who I am", region: "A", screen: "character", color: "#ffb547", at: [-21, -21 + OUT], facade: { x: -21, z: -21 + FACE, nx: 0, nz: 1 } },
  { id: "fixer", name: "The Last Byte", sign: "THE LAST BYTE", hint: "Jobs: my projects", region: "E", screen: "jobs", color: "#ff3ea5", at: [21 - OUT, -21], facade: { x: 21 - FACE, z: -21, nx: -1, nz: 0 } },
  { id: "netrunner", name: "Netrunner Den", sign: "NETRUNNER", hint: "Perks: the skill tree", region: "D", screen: "perks", color: "#59ff9c", at: [21, -21 + OUT], facade: { x: 21, z: -21 + FACE, nx: 0, nz: 1 } },
  { id: "records", name: "Records Kiosk", sign: "RECORDS", hint: "Life path: education & experience", region: "B", screen: "lifepath", color: "#f3e600", at: [-21 + OUT, 21], facade: { x: -21 + FACE, z: 21, nx: 1, nz: 0 } },
  { id: "broker", name: "Data Broker", sign: "DATA BROKER", hint: "Shards: certifications", region: "G", screen: "shards", color: "#b07cff", at: [-21, 21 - OUT], facade: { x: -21, z: 21 - FACE, nx: 0, nz: -1 } },
  { id: "gigs", name: "Gig Board", sign: "GIGS", hint: "Gigs: technical case studies", region: "F", screen: "gigs", color: "#ff4b3e", at: [21 - OUT, 21], facade: { x: 21 - FACE, z: 21, nx: -1, nz: 0 } },
  { id: "metro", name: "Metro · Exit", sign: "METRO", hint: "Contact & leave", region: "H", screen: "exit", color: "#e8f6ff", at: [21, 21 - OUT], facade: { x: 21, z: 21 - FACE, nx: 0, nz: -1 } },
];

export const SPAWN: [x: number, z: number, yaw: number] = [0, 12, 0];

export const COLLIDERS: Box2[] = TOWERS.map((t) => ({ minX: t.x - t.w / 2, maxX: t.x + t.w / 2, minZ: t.z - t.d / 2, maxZ: t.z + t.d / 2 }));

export interface Billboard {
  x: number;
  y: number;
  z: number;
  rotY: number;
  w: number;
  h: number;
  slot: number;
}

/** Holographic ad slots on street-facing tower faces (content is filled in at render time). */
export const BILLBOARDS: Billboard[] = (() => {
  const out: Billboard[] = [];
  let slot = 0;
  for (const t of TOWERS) {
    if (t.h < 40 || slot >= 12) continue;
    // Face the nearest cross street (x=0 or z=0) or the ring avenue.
    const faceX = Math.abs(t.x) > Math.abs(t.z);
    const sign = faceX ? -Math.sign(t.x) : -Math.sign(t.z);
    const y = 16 + hash(t.seed, 9) * Math.min(26, t.h - 26);
    if (faceX) out.push({ x: t.x + (sign * t.w) / 2 + sign * 0.3, y, z: t.z, rotY: sign > 0 ? Math.PI / 2 : -Math.PI / 2, w: Math.min(16, t.d * 0.7), h: 9, slot: slot++ });
    else out.push({ x: t.x, y, z: t.z + (sign * t.d) / 2 + sign * 0.3, rotY: sign > 0 ? 0 : Math.PI, w: Math.min(16, t.w * 0.7), h: 9, slot: slot++ });
  }
  return out;
})();

export function poiById(id: string): Poi | undefined {
  return POIS.find((p) => p.id === id);
}

export function nearestPoi(x: number, z: number): { poi: Poi; dist: number } {
  let best = POIS[0];
  let bestD = Infinity;
  for (const p of POIS) {
    const d = Math.hypot(p.at[0] - x, p.at[1] - z);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return { poi: best, dist: bestD };
}

export function insideTower(x: number, z: number, margin = 0): boolean {
  return COLLIDERS.some((b) => x > b.minX - margin && x < b.maxX + margin && z > b.minZ - margin && z < b.maxZ + margin);
}
