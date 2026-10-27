import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { CarModel } from "../player/CarModel";
import { cityRuntime } from "../runtime";
import { CAR_COLORS, OCEAN_DRIVE_X } from "./layout";

// AI traffic: cars driving loops in right-hand lanes, slowing for whatever is ahead
// (the player, on foot or driving, and each other). They publish boxes so the
// player's car can hit them.

const LANE = 3.5;
const CRUISE = 11;

/** Road-centre rectangle corners → lane polyline with rounded corners, closed. */
function lanePath(corners: [number, number][]): [number, number][] {
  const pts: [number, number][] = [];
  const n = corners.length;
  for (let i = 0; i < n; i++) {
    const a = corners[(i + n - 1) % n];
    const b = corners[i];
    const c = corners[(i + 1) % n];
    const inDir = [b[0] - a[0], b[1] - a[1]].map((v) => v / Math.hypot(b[0] - a[0], b[1] - a[1]));
    const outDir = [c[0] - b[0], c[1] - b[1]].map((v) => v / Math.hypot(c[0] - b[0], c[1] - b[1]));
    // Lane offset to the right of travel (right = (-dz, dx) in this game's convention).
    const inR = [-inDir[1], inDir[0]];
    const outR = [-outDir[1], outDir[0]];
    const p0 = [b[0] + inR[0] * LANE - inDir[0] * 8, b[1] + inR[1] * LANE - inDir[1] * 8];
    const p2 = [b[0] + outR[0] * LANE + outDir[0] * 8, b[1] + outR[1] * LANE + outDir[1] * 8];
    const p1 = [b[0] + (inR[0] + outR[0]) * LANE, b[1] + (inR[1] + outR[1]) * LANE]; // where the two lanes meet
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
      const z = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
      pts.push([x, z]);
    }
  }
  return pts;
}

interface Loop {
  pts: [number, number][];
  cum: number[];
  length: number;
}

function makeLoop(corners: [number, number][]): Loop {
  const pts = lanePath(corners);
  const cum = [0];
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i % pts.length];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return { pts, cum, length: cum[cum.length - 1] };
}

function sample(loop: Loop, s: number): { x: number; z: number; heading: number } {
  const d = ((s % loop.length) + loop.length) % loop.length;
  let i = 1;
  while (loop.cum[i] < d) i++;
  const a = loop.pts[i - 1];
  const b = loop.pts[i % loop.pts.length];
  const t = (d - loop.cum[i - 1]) / Math.max(1e-6, loop.cum[i] - loop.cum[i - 1]);
  return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, heading: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}

const LOOPS: Loop[] = [
  makeLoop([
    [-60, -60],
    [60, -60],
    [60, 60],
    [-60, 60],
  ]),
  makeLoop([
    [0, -120],
    [OCEAN_DRIVE_X, -120],
    [OCEAN_DRIVE_X, 120],
    [0, 120],
  ]),
  makeLoop([
    [-120, 0],
    [-120, 120],
    [0, 120],
    [0, 0],
  ]),
];

interface Ai {
  loop: number;
  s: number;
  v: number;
  color: number;
}

export function Traffic({ count = 10 }: { count?: number }) {
  const cars = useMemo<Ai[]>(() => {
    const per = [3, 4, 3];
    const out: Ai[] = [];
    per.forEach((n, l) => {
      for (let k = 0; k < n; k++) out.push({ loop: l, s: (LOOPS[l].length / n) * k + 7, v: CRUISE, color: (l * 3 + k + 1) % CAR_COLORS.length });
    });
    return out.slice(0, count);
  }, [count]);
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    const rt = cityRuntime;
    const poses = cars.map((c) => sample(LOOPS[c.loop], c.s));
    // Every drivable car (parked or driven), and the player when on foot.
    const obstacles: [number, number][] = [...rt.cars.map((c) => [c.x, c.z] as [number, number]), ...(rt.driving >= 0 ? [] : [[rt.player.x, rt.player.z] as [number, number]])];
    cars.forEach((c, i) => {
      const p = poses[i];
      const fx = Math.cos(p.heading);
      const fz = Math.sin(p.heading);
      // Anything ahead in our lane? (The player, parked cars, other traffic.)
      let blocked = false;
      const check = (ox: number, oz: number) => {
        const dx = ox - p.x;
        const dz = oz - p.z;
        const ahead = dx * fx + dz * fz;
        const side = Math.abs(-dx * fz + dz * fx);
        if (ahead > 0.5 && ahead < 10 && side < 1.8) blocked = true;
      };
      obstacles.forEach(([ox, oz]) => check(ox, oz));
      poses.forEach((q, j) => j !== i && check(q.x, q.z));
      c.v += ((blocked ? 0 : CRUISE) - c.v) * Math.min(1, dt * (blocked ? 5 : 1.2));
      c.s += c.v * dt;
      const g = refs.current[i];
      if (g) {
        g.position.set(p.x, 0, p.z);
        g.rotation.y = -p.heading;
      }
    });
    rt.trafficBoxes = poses.map((p) => ({ minX: p.x - 1.3, maxX: p.x + 1.3, minZ: p.z - 1.3, maxZ: p.z + 1.3 }));
    rt.trafficDots = poses.map((p) => [p.x, p.z]);
  });

  return (
    <group>
      {cars.map((c, i) => (
        <CarModel
          key={i}
          ref={(g) => {
            refs.current[i] = g;
          }}
          color={CAR_COLORS[c.color]}
        />
      ))}
    </group>
  );
}
