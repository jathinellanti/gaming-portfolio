// SUNSET BAY: a sunset coastal grid. Everything here is pure data, shared by
// rendering, physics, the minimap and tests. Units are metres; +x is east (the
// ocean), +z is south. Roads are 14 m wide on lines every 60 m; blocks are 46 m.

export const ROAD = 14;
export const BLOCK = 46;
export const PITCH = ROAD + BLOCK; // 60
export const ROAD_LINES = [-120, -60, 0, 60, 120];
export const BLOCK_CENTRES = [-90, -30, 30, 90];
/** Ocean Drive, the coastal boulevard, is the road at x = 120. */
export const OCEAN_DRIVE_X = 120;
export const SAND = { minX: 127, maxX: 165 };
export const SHORE_X = 165;
/** Walkable/drivable bounds (the beach extends past the city to the waterline). */
export const BOUNDS = { minX: -134, maxX: SHORE_X - 2, minZ: -134, maxZ: 134 };
export const SIDEWALK = 3;
/** Blocks (sidewalks, plazas) are raised by a kerb. */
export const KERB = 0.12;

/** Ground height: the kerb inside a block, the road or beach (0) elsewhere. */
export function groundY(x: number, z: number): number {
  const half = BLOCK / 2;
  return BLOCK_CENTRES.some((c) => Math.abs(x - c) <= half) && BLOCK_CENTRES.some((c) => Math.abs(z - c) <= half) ? KERB : 0;
}

export interface Box2 {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  /** Pastel palette index. */
  color: number;
  /** Art-deco crown: a stepped top block, as fractions of the footprint. */
  crown: number;
  /** A vertical fin on the street face (art-deco), or none. */
  fin: boolean;
  seed: number;
}

// Saturated enough to stay pastel after filmic tone mapping in the warm sunset light.
export const PASTELS = ["#ff9cc0", "#74dcc0", "#ffbf7a", "#b39dff", "#86c8ff", "#ffe07a", "#ff9f8a"];

function hash(a: number, b: number, c = 0): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1274126177) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Plazas: blocks left open (lawn + palms) so the city breathes, and so missions have space.
const PLAZAS = new Set(["30,30", "-30,-30"]);

export const BUILDINGS: Building[] = (() => {
  const out: Building[] = [];
  for (const cx of BLOCK_CENTRES)
    for (const cz of BLOCK_CENTRES) {
      if (PLAZAS.has(`${cx},${cz}`)) continue;
      const i = BLOCK_CENTRES.indexOf(cx);
      const j = BLOCK_CENTRES.indexOf(cz);
      const coastal = cx === 90; // lower, wider beachfront hotels
      const n = coastal ? 2 : 1 + Math.floor(hash(i, j) * 4); // 1..4 lots
      const inset = 2.5; // building line back from the block edge (sidewalk)
      const span = BLOCK - 2 * inset;
      if (n === 1) {
        out.push({ x: cx, z: cz, w: span, d: span, h: 22 + hash(i, j, 1) * 34, color: Math.floor(hash(i, j, 2) * PASTELS.length), crown: 0.6, fin: true, seed: i * 10 + j });
      } else if (n === 2) {
        for (const s of [-1, 1])
          out.push({ x: cx, z: cz + s * (span / 4 + 0.5), w: span, d: span / 2 - 1, h: (coastal ? 10 : 12) + hash(i, j, 3 + s) * (coastal ? 14 : 28), color: Math.floor(hash(i, j, 4 + s) * PASTELS.length), crown: 0.7, fin: hash(i, j, 9 + s) < 0.5, seed: i * 10 + j + s * 100 });
      } else {
        for (const sx of [-1, 1])
          for (const sz of [-1, 1]) {
            if (n === 3 && sx === 1 && sz === 1) continue;
            const q = hash(i * 7 + sx, j * 7 + sz);
            out.push({ x: cx + sx * (span / 4 + 0.5), z: cz + sz * (span / 4 + 0.5), w: span / 2 - 1, d: span / 2 - 1, h: 8 + q * 22, color: Math.floor(hash(i, j, 5 + sx + sz * 3) * PASTELS.length), crown: 0.72, fin: q < 0.4, seed: i * 100 + j * 10 + sx * 3 + sz });
          }
      }
    }
  return out;
})();

export const BUILDING_COLLIDERS: Box2[] = BUILDINGS.map((b) => ({ minX: b.x - b.w / 2, maxX: b.x + b.w / 2, minZ: b.z - b.d / 2, maxZ: b.z + b.d / 2 }));

/** Palms: both sides of Ocean Drive, along the main avenue (z = 0), and in the plazas. */
export const PALMS: { x: number; z: number; h: number; lean: number; rot: number }[] = (() => {
  const out: { x: number; z: number; h: number; lean: number; rot: number }[] = [];
  let k = 0;
  const add = (x: number, z: number) => {
    k++;
    out.push({ x, z, h: 8 + hash(k, 1) * 5, lean: 0.05 + hash(k, 2) * 0.16, rot: hash(k, 3) * Math.PI * 2 });
  };
  for (let z = -128; z <= 128; z += 13) {
    if (ROAD_LINES.some((r) => Math.abs(z - r) < 9)) continue;
    add(OCEAN_DRIVE_X + 8.6, z); // beach side
    add(OCEAN_DRIVE_X - 8.6, z);
  }
  for (let x = -128; x <= 112; x += 15) {
    if (ROAD_LINES.some((r) => Math.abs(x - r) < 9)) continue;
    add(x, 8.6);
    add(x, -8.6);
  }
  for (const [px, pz] of [
    [30, 30],
    [-30, -30],
  ])
    for (let a = 0; a < 6; a++) add(px + Math.cos((a / 6) * Math.PI * 2) * 13, pz + Math.sin((a / 6) * Math.PI * 2) * 13);
  return out;
})();

export const PALM_COLLIDERS: Box2[] = PALMS.map((p) => ({ minX: p.x - 0.35, maxX: p.x + 0.35, minZ: p.z - 0.35, maxZ: p.z + 0.35 }));

export type MissionId = "safehouse" | "weather" | "elms" | "skills" | "campus" | "harbor" | "studio";

export interface Marker {
  id: MissionId;
  /** Ground point of the marker. */
  at: [number, number];
  color: string;
}

// Markers stand on sidewalks or in plazas, never inside a collider.
export const MARKERS: Marker[] = [
  { id: "safehouse", at: [8.5, 16], color: "#ffd400" },
  { id: "weather", at: [30, 30], color: "#ffd400" },
  { id: "elms", at: [-30, -30], color: "#ffd400" },
  { id: "skills", at: [-51.5, 30], color: "#ffd400" },
  { id: "campus", at: [-90, -51.5], color: "#ffd400" },
  { id: "harbor", at: [148, -60], color: "#ffd400" },
  { id: "studio", at: [68.5, -90], color: "#ffd400" },
];
export const MARKER_RADIUS = 2.4;

export interface CarSpawn {
  x: number;
  z: number;
  /** Heading θ: forward is (cos θ, sin θ) in x/z (the convention everywhere in this game). */
  heading: number;
  color: number;
  hero?: boolean;
}

export const CAR_COLORS = ["#e63946", "#2a9d8f", "#f4a261", "#3a86ff", "#f1f1f1", "#8d5cf6", "#ffbe0b"];

/** Kerbside parking: 5.8 m from the road centre, outside the 3.5 m traffic lane. */
export const PARK = 5.8;

/** Parked, drivable cars at the kerb on the right-hand side, facing along their road.
 *  The red one waits by the spawn point, like on the poster. */
export const CAR_SPAWNS: CarSpawn[] = [
  { x: PARK, z: 36, heading: -Math.PI / 2, color: 0, hero: true },
  { x: OCEAN_DRIVE_X + PARK, z: -40, heading: -Math.PI / 2, color: 1 },
  { x: OCEAN_DRIVE_X - PARK, z: 70, heading: Math.PI / 2, color: 3 },
  { x: -60 + PARK, z: 40, heading: -Math.PI / 2, color: 2 },
  { x: 40, z: -60 + PARK, heading: 0, color: 4 },
  { x: -40, z: 60 - PARK, heading: Math.PI, color: 5 },
  { x: 60 - PARK, z: 100, heading: Math.PI / 2, color: 6 },
];

/** Spawn on the sidewalk of the main avenue, facing the red car and the sea. */
export const SPAWN: { x: number; z: number; yaw: number } = { x: 8.6, z: 37, yaw: -Math.PI / 2 };

/** Every static solid the player or a car can hit. */
export const SOLIDS: Box2[] = [...BUILDING_COLLIDERS, ...PALM_COLLIDERS];

export const STREET_NAMES: { axis: "x" | "z"; at: number; name: string }[] = [
  { axis: "x", at: OCEAN_DRIVE_X, name: "Ocean Drive" },
  { axis: "x", at: 60, name: "Palm Avenue" },
  { axis: "x", at: 0, name: "Sunset Boulevard" },
  { axis: "x", at: -60, name: "Coral Street" },
  { axis: "x", at: -120, name: "Hillcrest Road" },
  { axis: "z", at: 0, name: "Main Strip" },
  { axis: "z", at: -60, name: "Harbor Way" },
  { axis: "z", at: 60, name: "Marina Street" },
  { axis: "z", at: -120, name: "North Shore Road" },
  { axis: "z", at: 120, name: "South Bay Road" },
];

/** A friendly place name for the HUD: the nearest street, or the beach. */
export function placeName(x: number, z: number): string {
  if (x > SAND.minX) return "Sunset Beach";
  let best = { d: Infinity, name: "Downtown" };
  for (const s of STREET_NAMES) {
    const d = Math.abs((s.axis === "x" ? x : z) - s.at);
    if (d < best.d) best = { d, name: s.name };
  }
  return best.d < ROAD ? best.name : "Downtown";
}
