import { memo } from "react";
import { BLOCK } from "./palette";
import { cellCorners, faceCorners, hash, pts, visibleFaces, type Face, type Voxel } from "./iso";

// A floating voxel island in the style of a block-building game: 16-ish pixel
// textures (4×4 cells per face here), grass overhang on dirt sides, a tree,
// gold ore and a pond. All geometry is generated from the voxel list below.

const S = 30;
const N = 4;
const FACE_LIGHT: Record<Face, number> = { top: 1, left: 0.84, right: 0.68 };

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c((n >> 16) & 255)} ${c((n >> 8) & 255)} ${c(n & 255)})`;
}

function buildIsland(): Voxel[] {
  const v: Voxel[] = [];
  const add = (x: number, y: number, z: number, mat: string) => v.push({ x, y, z, mat });
  const water = new Set(["0,4", "0,5", "1,5"]);
  const sand = new Set(["1,4", "2,5", "0,3"]);
  for (let x = 0; x < 6; x++)
    for (let y = 0; y < 6; y++) {
      const k = `${x},${y}`;
      add(x, y, -1, "dirt");
      add(x, y, 0, water.has(k) ? "water" : sand.has(k) ? "sand" : "grass");
    }
  for (let x = 1; x < 5; x++) for (let y = 1; y < 5; y++) add(x, y, -2, (x + y) % 3 === 0 ? "dirt" : "stone");
  for (let x = 2; x < 4; x++) for (let y = 2; y < 4; y++) add(x, y, -3, "stone");
  add(2, 3, -4, "stone");
  // Hill
  add(0, 0, 1, "grass");
  add(1, 0, 1, "grass");
  add(0, 1, 1, "grass");
  add(0, 0, 2, "grass");
  // Ore outcrop
  add(5, 0, 1, "ore");
  // Tree
  for (let z = 1; z <= 3; z++) add(3, 3, z, "log");
  for (let x = 2; x <= 4; x++)
    for (let y = 2; y <= 4; y++)
      for (let z = 3; z <= 4; z++) if (!(x === 3 && y === 3 && z === 3)) add(x, y, z, "leaves");
  for (const [x, y] of [
    [3, 3],
    [2, 3],
    [4, 3],
    [3, 2],
    [3, 4],
  ])
    add(x, y, 5, "leaves");
  // A block buried under another is dirt, not grass.
  const top = new Set(v.map((b) => `${b.x},${b.y},${b.z}`));
  return v.map((b) => (b.mat === "grass" && top.has(`${b.x},${b.y},${b.z + 1}`) ? { ...b, mat: "dirt" } : b));
}

function cellColor(mat: string, face: Face, i: number, j: number, r: number): string {
  const pick = (p: readonly string[]) => p[r < 0.33 ? 0 : r < 0.72 ? 1 : 2];
  switch (mat) {
    case "grass":
      if (face === "top") return pick(BLOCK.grass);
      if (j === 0 || (j === 1 && hash(i, 7, Math.floor(r * 100)) < 0.4)) return pick(BLOCK.grassSide);
      return pick(BLOCK.dirt);
    case "dirt":
      return pick(BLOCK.dirt);
    case "sand":
      return pick(BLOCK.sand);
    case "stone":
      return pick(BLOCK.stone);
    case "ore":
      return r > 0.82 ? BLOCK.ore[i % 2] : pick(BLOCK.stone);
    case "log":
      if (face === "top") return (i === 1 || i === 2) && (j === 1 || j === 2) ? BLOCK.logTop[0] : pick(BLOCK.logTop);
      return BLOCK.logSide[(i + (r > 0.6 ? 1 : 0)) % 3];
    case "leaves":
      return pick(BLOCK.leaves);
    default:
      return pick(BLOCK.stone);
  }
}

export const BlockVignette = memo(function BlockVignette() {
  const faces = visibleFaces(buildIsland());
  return (
    <g>
      {faces.map(({ v, face }) => {
        const isWater = v.mat === "water";
        const corners = faceCorners(v.x, v.y, v.z, face, S, isWater ? 0.85 : 1);
        const light = FACE_LIGHT[face];
        if (isWater) {
          return (
            <polygon
              key={`${v.x},${v.y},${v.z},${face}`}
              points={pts(corners)}
              fill={shade(BLOCK.water[face === "top" ? 0 : 2], light)}
              opacity={face === "top" ? 0.88 : 0.75}
            />
          );
        }
        const base = shade(cellColor(v.mat, face, 1, 2, 0.5), light);
        const cells = [];
        for (let i = 0; i < N; i++)
          for (let j = 0; j < N; j++) {
            const r = hash(v.x, v.y, v.z, face.length, i, j);
            const fill = shade(cellColor(v.mat, face, i, j, r), light);
            cells.push(<polygon key={`${i}-${j}`} points={pts(cellCorners(corners, i, j, N))} fill={fill} stroke={fill} strokeWidth={0.35} />);
          }
        return (
          <g key={`${v.x},${v.y},${v.z},${face}`}>
            <polygon points={pts(corners)} fill={base} />
            {cells}
          </g>
        );
      })}
    </g>
  );
});

/** Width/height of the island drawing around its origin, for framing in a viewBox. */
export const BLOCK_BOUNDS = { minX: -6 * S * 0.866, maxX: 6 * S * 0.866, minY: -6.2 * S, maxY: 7.6 * S };
