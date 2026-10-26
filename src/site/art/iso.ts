// Isometric voxel helpers for the hand-built SVG art. Grid +x runs right-down,
// +y runs left-down, +z is up. Visible faces of a unit cube: top, right (+x), left (+y).

export type Pt = readonly [number, number];
export type Face = "top" | "left" | "right";

const COS30 = Math.cos(Math.PI / 6);

export function project(x: number, y: number, z: number, s: number): Pt {
  return [(x - y) * s * COS30, (x + y) * s * 0.5 - z * s];
}

/** The three visible faces of an axis-aligned box (w along x, d along y, h up). */
export function box(x: number, y: number, z: number, w: number, d: number, h: number, s: number): Record<Face, Pt[]> {
  const p = (a: number, b: number, c: number) => project(a, b, c, s);
  const t = z + h;
  return {
    top: [p(x, y, t), p(x + w, y, t), p(x + w, y + d, t), p(x, y + d, t)],
    // Right (+x) face, from the right corner down-left to the bottom corner.
    right: [p(x + w, y + d, t), p(x + w, y, t), p(x + w, y, z), p(x + w, y + d, z)],
    // Left (+y) face, from the left corner down-right to the bottom corner.
    left: [p(x, y + d, t), p(x + w, y + d, t), p(x + w, y + d, z), p(x, y + d, z)],
  };
}

/** Corner points of a visible unit-cube face (p0 top-left as the viewer sees it). */
export function faceCorners(x: number, y: number, z: number, face: Face, s: number, h = 1): Pt[] {
  return box(x, y, z, 1, 1, h, s)[face];
}

/** SVG transform that maps a flat 2D drawing onto a visible box face (x → face horizontal, y → down). */
export function faceMatrix(face: "left" | "right", origin: Pt): string {
  const c = Math.cos(Math.PI / 6);
  return face === "left" ? `matrix(${c} 0.5 0 1 ${origin[0]} ${origin[1]})` : `matrix(${c} -0.5 0 1 ${origin[0]} ${origin[1]})`;
}

/** Point inside the parallelogram p0,p1,p3 at fractional (u, v). */
export function lerpFace(c: Pt[], u: number, v: number): Pt {
  return [c[0][0] + (c[1][0] - c[0][0]) * u + (c[3][0] - c[0][0]) * v, c[0][1] + (c[1][1] - c[0][1]) * u + (c[3][1] - c[0][1]) * v];
}

export function cellCorners(c: Pt[], i: number, j: number, n: number, m = n): Pt[] {
  return [lerpFace(c, i / n, j / m), lerpFace(c, (i + 1) / n, j / m), lerpFace(c, (i + 1) / n, (j + 1) / m), lerpFace(c, i / n, (j + 1) / m)];
}

export const pts = (c: readonly Pt[]) => c.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

/** Deterministic 0..1 hash so the art is identical on every render. */
export function hash(...n: number[]): number {
  let h = 2166136261;
  for (const v of n) {
    h ^= Math.imul(v | 0, 2654435761);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
  }
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

export interface Voxel {
  x: number;
  y: number;
  z: number;
  mat: string;
}

/** Painter's order (back to front, bottom to top) with hidden-face culling. */
export function visibleFaces(voxels: Voxel[]): { v: Voxel; face: Face }[] {
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const solid = new Map(voxels.map((v) => [key(v.x, v.y, v.z), v]));
  const opaque = (x: number, y: number, z: number) => {
    const n = solid.get(key(x, y, z));
    return !!n && n.mat !== "water" && n.mat !== "leaves";
  };
  const sorted = [...voxels].sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z || a.x - b.x);
  const out: { v: Voxel; face: Face }[] = [];
  for (const v of sorted) {
    if (!opaque(v.x + 1, v.y, v.z)) out.push({ v, face: "right" });
    if (!opaque(v.x, v.y + 1, v.z)) out.push({ v, face: "left" });
    if (!opaque(v.x, v.y, v.z + 1)) out.push({ v, face: "top" });
  }
  return out;
}
