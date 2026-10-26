// Voxel ray traversal (Amanatides & Woo). Returns the first block for which
// `hit` is true, plus the face normal it was entered through (for placing).

export interface RayHit {
  x: number;
  y: number;
  z: number;
  normal: [number, number, number];
  distance: number;
}

export function raycastVoxels(
  origin: [number, number, number],
  dir: [number, number, number],
  maxDist: number,
  hit: (x: number, y: number, z: number) => boolean,
): RayHit | null {
  const len = Math.hypot(dir[0], dir[1], dir[2]);
  if (len === 0) return null;
  const d = [dir[0] / len, dir[1] / len, dir[2] / len];
  const pos = [Math.floor(origin[0]), Math.floor(origin[1]), Math.floor(origin[2])];
  const step = d.map((v) => (v > 0 ? 1 : v < 0 ? -1 : 0));
  const tDelta = d.map((v) => (v === 0 ? Infinity : Math.abs(1 / v)));
  const tMax = d.map((v, i) => {
    if (v === 0) return Infinity;
    const boundary = v > 0 ? pos[i] + 1 : pos[i];
    return (boundary - origin[i]) / v;
  });
  let normal: [number, number, number] = [0, 0, 0];
  let t = 0;
  if (hit(pos[0], pos[1], pos[2])) return { x: pos[0], y: pos[1], z: pos[2], normal, distance: 0 };
  while (t <= maxDist) {
    let axis = 0;
    if (tMax[1] < tMax[axis]) axis = 1;
    if (tMax[2] < tMax[axis]) axis = 2;
    t = tMax[axis];
    if (t > maxDist) break;
    pos[axis] += step[axis];
    tMax[axis] += tDelta[axis];
    normal = [0, 0, 0];
    normal[axis] = -step[axis];
    if (hit(pos[0], pos[1], pos[2])) return { x: pos[0], y: pos[1], z: pos[2], normal, distance: t };
  }
  return null;
}
