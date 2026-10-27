import { useMemo } from "react";
import * as THREE from "three";
import { TOWERS, BOUND, type Tower } from "./city";

// All towers merged into one geometry (one draw call). Facades share a procedural
// texture: `map` is concrete, slabs, pilasters, glass and AC units; `emissiveMap`
// the lit windows (interior falloff, blinds) and LED strips. UVs are in world units:
// one repeat = 24 m x 48 m = 16 window bays x 12 floors (bays 1.5 m, floors 4 m),
// so windows read at real scale instead of as glowing squares.

const TEX_W = 24;
const TEX_H = 48;
const BAYS = 16;
const FLOORS = 12;

export function facadeTextures(detail: "low" | "full" = "full"): { map: THREE.CanvasTexture; emissive: THREE.CanvasTexture } {
  const W = detail === "low" ? 512 : 1024;
  const H = W * 2;
  const base = document.createElement("canvas");
  const glow = document.createElement("canvas");
  base.width = glow.width = W;
  base.height = glow.height = H;
  const b = base.getContext("2d")!;
  const g = glow.getContext("2d")!;
  let seed = 9001;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  // Concrete with a little grain.
  b.fillStyle = "#14161d";
  b.fillRect(0, 0, W, H);
  for (let i = 0; i < W * 6; i++) {
    b.fillStyle = rand() < 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.12)";
    b.fillRect(rand() * W, rand() * H, 1 + rand() * 2, 1 + rand() * 2);
  }
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);

  const bw = W / BAYS;
  const fh = H / FLOORS;
  const warm = ["#ffcf8a", "#ffd9a8", "#ffe2b8"];
  const cool = ["#9fd8ff", "#cfe9ff", "#b7c8ff"];
  const accent = ["#ff7ad9", "#7affd4", "#c59bff"];
  const strips = ["#3ef0ff", "#ff3ea5", "#ffb547", "#b07cff"];

  for (let f = 0; f < FLOORS; f++) {
    const y0 = f * fh;
    // Floor slab: a lighter concrete band with a crisp top edge.
    b.fillStyle = "#1c1f28";
    b.fillRect(0, y0 + fh * 0.86, W, fh * 0.14);
    b.fillStyle = "#272b36";
    b.fillRect(0, y0 + fh * 0.86, W, 2);
    // The top floor of the texture stays plain: roofs sample its top-left corner.
    if (f === 0) continue;
    const officeFloor = rand() < 0.16; // a whole lit floor now and then
    for (let c = 0; c < BAYS; c++) {
      const x = c * bw + bw * 0.12;
      const w = bw * 0.76;
      const y = y0 + fh * 0.16;
      const h = fh * 0.62;
      const glass = b.createLinearGradient(0, y, 0, y + h);
      glass.addColorStop(0, "#131a29");
      glass.addColorStop(1, "#090c14");
      b.fillStyle = glass;
      b.fillRect(x, y, w, h);
      b.fillStyle = "#20242f";
      b.fillRect(x + w / 2 - 1, y, 2, h); // mullion
      const lit = officeFloor ? rand() < 0.8 : rand() < 0.13;
      if (lit) {
        const pal = officeFloor ? cool : rand() < 0.75 ? warm : rand() < 0.7 ? cool : accent;
        const col = pal[Math.floor(rand() * pal.length)];
        const room = g.createLinearGradient(0, y, 0, y + h);
        room.addColorStop(0, col + "70");
        room.addColorStop(1, col + "ee");
        g.fillStyle = room;
        g.globalAlpha = 0.55 + rand() * 0.45;
        g.fillRect(x, y, w, h);
        g.globalAlpha = 1;
        if (rand() < 0.5) {
          g.fillStyle = "rgba(0,0,0,0.38)"; // blinds
          for (let k = y + 3; k < y + h * (0.3 + rand() * 0.7); k += 6) g.fillRect(x, k, w, 2);
        }
        b.fillStyle = "#283044";
        b.fillRect(x, y, w, h);
      }
      if (rand() < 0.07) {
        // An AC unit hanging under the window.
        b.fillStyle = "#2c303b";
        b.fillRect(x + w * 0.2, y + h + 3, w * 0.6, fh * 0.1);
        b.fillStyle = "#1a1d25";
        for (let k = 0; k < 3; k++) b.fillRect(x + w * 0.25, y + h + 6 + k * 4, w * 0.5, 1);
      }
    }
    // Some slabs carry a thin LED strip.
    if (rand() < 0.2) {
      g.fillStyle = strips[Math.floor(rand() * strips.length)];
      const from = rand() < 0.5 ? 0 : Math.floor(rand() * BAYS) * bw;
      g.fillRect(from, y0 + fh * 0.88, W - from, Math.max(2, fh * 0.018));
    }
  }
  // Pilasters every four bays.
  for (let c = 0; c <= BAYS; c += 4) {
    b.fillStyle = "#0f1117";
    b.fillRect(c * bw - bw * 0.08, fh, bw * 0.16, H - fh);
  }

  const mk = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { map: mk(base), emissive: mk(glow) };
}

const TINTS = [new THREE.Color("#8a93b8"), new THREE.Color("#b49ac8"), new THREE.Color("#7aa0b0"), new THREE.Color("#a0a0a8"), new THREE.Color("#9a8a9c")];

/** Box sides + roof for a tower (with optional setback tier), UVs in world space. */
function addTower(t: Tower, pos: number[], nor: number[], uv: number[], col: number[], ind: number[]) {
  const color = TINTS[Math.floor(t.tint * TINTS.length) % TINTS.length].clone().multiplyScalar(0.75 + t.tint * 0.4);
  const ox = (t.seed * 0.37) % 1;
  const oy = (t.seed * 0.53) % 1;
  const parts: { w: number; d: number; y0: number; y1: number }[] = t.tier
    ? [
        { w: t.w, d: t.d, y0: 0, y1: t.h * t.tier.from },
        { w: t.w * t.tier.scale, d: t.d * t.tier.scale, y0: t.h * t.tier.from, y1: t.h },
      ]
    : [{ w: t.w, d: t.d, y0: 0, y1: t.h }];
  for (const p of parts) {
    const x0 = t.x - p.w / 2;
    const x1 = t.x + p.w / 2;
    const z0 = t.z - p.d / 2;
    const z1 = t.z + p.d / 2;
    const quad = (a: number[], b2: number[], c: number[], d: number[], n: number[], u0: number, u1: number, roof = false) => {
      const base = pos.length / 3;
      for (const v of [a, b2, c, d]) pos.push(...v);
      for (let k = 0; k < 4; k++) nor.push(...n);
      if (roof) uv.push(0.01, 0.99, 0.02, 0.99, 0.02, 0.985, 0.01, 0.985);
      else uv.push(u0 / TEX_W + ox, p.y0 / TEX_H + oy, u1 / TEX_W + ox, p.y0 / TEX_H + oy, u1 / TEX_W + ox, p.y1 / TEX_H + oy, u0 / TEX_W + ox, p.y1 / TEX_H + oy);
      for (let k = 0; k < 4; k++) col.push(color.r, color.g, color.b);
      ind.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    quad([x1, p.y0, z1], [x1, p.y0, z0], [x1, p.y1, z0], [x1, p.y1, z1], [1, 0, 0], z1, z0); // +x (u runs along -z)
    quad([x0, p.y0, z0], [x0, p.y0, z1], [x0, p.y1, z1], [x0, p.y1, z0], [-1, 0, 0], z0, z1);
    quad([x0, p.y0, z1], [x1, p.y0, z1], [x1, p.y1, z1], [x0, p.y1, z1], [0, 0, 1], x0, x1);
    quad([x1, p.y0, z0], [x0, p.y0, z0], [x0, p.y1, z0], [x1, p.y1, z0], [0, 0, -1], -x1, -x0);
    quad([x0, p.y1, z1], [x1, p.y1, z1], [x1, p.y1, z0], [x0, p.y1, z0], [0, 1, 0], 0, 0, true);
  }
}

function mergedGeometry(towers: Tower[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const ind: number[] = [];
  for (const t of towers) addTower(t, pos, nor, uv, col, ind);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(ind);
  g.computeBoundingSphere();
  return g;
}

/** Distant skyline: a ring of towers beyond the barrier, for depth. */
function farTowers(): Tower[] {
  const out: Tower[] = [];
  let seed = 77;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 90; k++) {
    const a = rand() * Math.PI * 2;
    const r = BOUND + 30 + rand() * 170;
    const s = 14 + rand() * 26;
    out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, w: s, d: s * (0.7 + rand() * 0.6), h: 40 + rand() * 190, tint: rand(), seed: 500 + k });
  }
  return out;
}

const NEON_EDGE = ["#3ef0ff", "#ff3ea5", "#f3e600", "#b07cff"];

export function Buildings({ detail = "full" }: { detail?: "low" | "full" }) {
  const { geometry, far, material, edges, beacons } = useMemo(() => {
    const { map, emissive } = facadeTextures(detail);
    const material = new THREE.MeshStandardMaterial({
      map,
      emissiveMap: emissive,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 1.05,
      vertexColors: true,
      roughness: 0.62,
      metalness: 0.35,
    });
    // Neon edge strips on the tallest towers' corners, plus blinking roof beacons.
    const edges: { pos: [number, number, number]; h: number; color: string }[] = [];
    const beacons: [number, number, number][] = [];
    for (const t of TOWERS) {
      const top = t.tier ? t.h * t.tier.from : t.h;
      if (t.h > 70) {
        const c = NEON_EDGE[t.seed % NEON_EDGE.length];
        for (const [sx, sz] of [[1, 1], [-1, -1]]) edges.push({ pos: [t.x + (sx * t.w) / 2, top / 2, t.z + (sz * t.d) / 2], h: top, color: c });
      }
      beacons.push([t.x, t.h + 1.5, t.z]);
    }
    return { geometry: mergedGeometry(TOWERS), far: mergedGeometry(farTowers()), material, edges, beacons };
  }, [detail]);

  return (
    <group>
      <mesh geometry={geometry} material={material} />
      <mesh geometry={far} material={material} />
      {edges.map((e, i) => (
        <mesh key={i} position={e.pos}>
          <boxGeometry args={[0.35, e.h, 0.35]} />
          <meshBasicMaterial color={e.color} toneMapped={false} />
        </mesh>
      ))}
      {beacons.map((p, i) => (
        <mesh key={`b${i}`} position={p}>
          <boxGeometry args={[0.6, 3, 0.6]} />
          <meshBasicMaterial color={i % 3 === 0 ? "#ff3b4f" : "#2a2e3c"} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
