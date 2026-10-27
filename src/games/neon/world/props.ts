import { BOUND, PITCH, type Box2 } from "./city";

// Deterministic street furniture for the Sprawl, shared by rendering (StreetLife)
// and collision (parked cars block the walker). Streets run along x and z at
// multiples of PITCH; each is 14 m wide with sidewalks 4–7 m from its centre line.

export const STREETS = [-2, -1, 0, 1, 2].map((k) => k * PITCH); // -84, -42, 0, 42, 84
const HALF = BOUND - 2;

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** True when `v` (a position along a street) is inside a crossing street. */
const inCrossing = (v: number, pad = 8) => STREETS.some((c) => Math.abs(v - c) < pad);

export interface Lamp {
  x: number;
  z: number;
  /** Direction the arm reaches (towards the street centre), as a unit x/z. */
  dx: number;
  dz: number;
}

export const LAMPS: Lamp[] = (() => {
  const out: Lamp[] = [];
  for (const c of STREETS)
    for (let v = -HALF + 6; v < HALF; v += 16) {
      if (inCrossing(v, 9)) continue;
      for (const side of [-1, 1]) {
        out.push({ x: c + side * 4.3, z: v, dx: -side, dz: 0 }); // street along z
        out.push({ x: v, z: c + side * 4.3, dx: 0, dz: -side }); // street along x
      }
    }
  return out;
})();

export interface ParkedCar {
  x: number;
  z: number;
  /** Heading along the street: 0 = along x, PI/2 = along z. */
  rot: number;
  color: number;
}

export const PARKED: ParkedCar[] = (() => {
  const r = rng(4242);
  const out: ParkedCar[] = [];
  for (const c of STREETS)
    for (let v = -HALF + 10; v < HALF - 4; v += 11) {
      if (inCrossing(v, 11) || r() < 0.55) continue;
      const side = r() < 0.5 ? -1 : 1;
      if (r() < 0.5) out.push({ x: c + side * 2.9, z: v, rot: Math.PI / 2, color: Math.floor(r() * 5) });
      else out.push({ x: v, z: c + side * 2.9, rot: 0, color: Math.floor(r() * 5) });
    }
  // Keep the spawn avenue and the POI doorsteps clear.
  return out.filter((p) => !(Math.abs(p.x) < 8 && Math.abs(p.z) < 26));
})();

export const CAR_SIZE = { length: 4.4, width: 1.9 };



export interface Walker {
  /** Street centre line and which axis the sidewalk runs along. */
  axis: "x" | "z";
  line: number;
  offset: number;
  start: number;
  speed: number;
  phase: number;
  accent: number;
}

export const PEDESTRIANS: Walker[] = (() => {
  const r = rng(777);
  return Array.from({ length: 150 }, () => {
    const side = r() < 0.5 ? -1 : 1;
    return {
      axis: r() < 0.5 ? "x" : "z",
      line: STREETS[1 + Math.floor(r() * 3)],
      offset: side * (4.6 + r() * 2),
      start: (r() * 2 - 1) * HALF,
      speed: (r() < 0.5 ? -1 : 1) * (1.1 + r() * 0.7),
      phase: r() * Math.PI * 2,
      accent: Math.floor(r() * 4),
    };
  });
})();

/** Wrap a walker's position into the walkable span. */
export function walkerAlong(w: Walker, t: number): number {
  const span = 2 * HALF;
  const p = (((w.start + w.speed * t + HALF) % span) + span) % span;
  return p - HALF;
}

export interface Cable {
  a: [number, number, number];
  b: [number, number, number];
  sag: number;
}

export const CABLES: Cable[] = (() => {
  const r = rng(31337);
  const out: Cable[] = [];
  for (const c of STREETS.slice(1, 4))
    for (let v = -HALF + 8; v < HALF; v += 9 + r() * 10) {
      if (inCrossing(v, 9)) continue;
      const h1 = 9 + r() * 22;
      const h2 = h1 + (r() - 0.5) * 6;
      const sag = 1 + r() * 2.5;
      if (r() < 0.5) out.push({ a: [c - 8, h1, v], b: [c + 8, h2, v], sag });
      else out.push({ a: [v, h1, c - 8], b: [v, h2, c + 8], sag });
    }
  return out;
})();

/** Steam vents in the road, near crossings. */
export const VENTS: [number, number][] = [
  [3, -40],
  [-40, 3],
  [44, -2],
  [-2, 46],
  [40, 40],
  [-44, -44],
];

/** The elevated monorail runs along x over this street. */
export const MONORAIL_Z = -PITCH;
export const MONORAIL_Y = 15;

/** Monorail gantry legs: pairs on the sidewalks' outer edges, clear of crossings. */
export const MONORAIL_PILLARS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let x = -HALF + 4; x < HALF; x += 21) if (!inCrossing(x, 9)) for (const side of [-1, 1]) out.push([x, MONORAIL_Z + side * 6.4]);
  return out;
})();

/** Parked cars and monorail legs as walker colliders (all axis-aligned). */
export const PROP_COLLIDERS: Box2[] = [
  ...PARKED.map((p) => {
    const alongZ = Math.abs(Math.sin(p.rot)) > 0.5;
    const hx = (alongZ ? CAR_SIZE.width : CAR_SIZE.length) / 2;
    const hz = (alongZ ? CAR_SIZE.length : CAR_SIZE.width) / 2;
    return { minX: p.x - hx, maxX: p.x + hx, minZ: p.z - hz, maxZ: p.z + hz };
  }),
  ...MONORAIL_PILLARS.map(([x, z]) => ({ minX: x - 0.45, maxX: x + 0.45, minZ: z - 0.45, maxZ: z + 0.45 })),
];
