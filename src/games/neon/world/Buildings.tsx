import { useMemo } from "react";
import * as THREE from "three";
import { TOWERS, BOUND, type Tower } from "./city";

// All towers merged into one geometry (one draw call). Facades share a procedural
// window texture: `map` is the concrete + frames, `emissiveMap` the lit windows.
// UVs are in world units (1 texture repeat = 40 m × 112 m), offset per tower.

const TEX_W = 40;
const TEX_H = 112;

function facadeTextures(): { map: THREE.CanvasTexture; emissive: THREE.CanvasTexture } {
  const S = 512;
  const cols = 16;
  const rows = 32;
  const base = document.createElement("canvas");
  const glow = document.createElement("canvas");
  base.width = glow.width = S;
  base.height = glow.height = S;
  const b = base.getContext("2d")!;
  const g = glow.getContext("2d")!;
  b.fillStyle = "#171a24";
  b.fillRect(0, 0, S, S);
  g.fillStyle = "#000";
  g.fillRect(0, 0, S, S);
  let seed = 9001;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const cw = S / cols;
  const rh = S / rows;
  const lit = ["#ffcf8a", "#ffd9a8", "#9fd8ff", "#cfe9ff", "#ff7ad9", "#7affd4"];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = c * cw + 3;
      const y = r * rh + 3;
      const w = cw - 6;
      const h = rh - 6;
      b.fillStyle = r < 2 ? "#12141c" : "#0b0d14";
      b.fillRect(x, y, w, h);
      b.fillStyle = "#262a36";
      b.fillRect(x - 3, y + h, w + 6, 2);
      if (r < 2) continue; // top band stays dark: roofs map here
      const band = Math.floor(r / 4) + Math.floor(c / 5);
      const p = rand() < 0.36 + (band % 3 === 0 ? 0.18 : 0) ? 1 : 0;
      if (p) {
        const col = lit[Math.floor(rand() * rand() * lit.length)];
        g.fillStyle = col;
        g.globalAlpha = 0.55 + rand() * 0.45;
        g.fillRect(x, y, w, h);
        g.globalAlpha = 1;
        b.fillStyle = "#2a2e3c";
        b.fillRect(x, y, w, h);
      }
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

export function Buildings() {
  const { geometry, far, material, edges, beacons } = useMemo(() => {
    const { map, emissive } = facadeTextures();
    const material = new THREE.MeshStandardMaterial({
      map,
      emissiveMap: emissive,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 1.35,
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
  }, []);

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
