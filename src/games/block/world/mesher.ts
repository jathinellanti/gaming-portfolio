import { B, blockDef, isOccluder, type Bucket } from "./blocks";
import { CHUNK, HEIGHT, idx } from "./generate";
import { tileUV } from "./tiles";

// Chunk → geometry, one quad per visible face, with per-vertex ambient occlusion
// and fixed face shading. Positions are chunk-local; the mesh is placed at
// (cx·16, 0, cz·16). Pure function: runs in the worker and in unit tests.

export interface MeshArrays {
  positions: Float32Array;
  uvs: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}
export type MeshBucket = "opaque" | "cutout" | "water" | "emissive";
export type ChunkMesh = Record<MeshBucket, MeshArrays>;

/** 3×3 chunk neighbourhood, index (dz+1)*3 + (dx+1); [4] is the chunk being meshed. */
export type Neighborhood = (Uint8Array | null)[];

type V3 = readonly [number, number, number];
interface FaceDef {
  n: V3;
  corners: readonly [V3, V3, V3, V3];
  shade: number;
  tile: "top" | "side" | "bottom";
}

// Corners are counter-clockwise seen from outside; (b−a)×(c−a) = n for each face.
const FACES: FaceDef[] = [
  { n: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], shade: 0.6, tile: "side" },
  { n: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], shade: 0.6, tile: "side" },
  { n: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], shade: 1, tile: "top" },
  { n: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], shade: 0.5, tile: "bottom" },
  { n: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], shade: 0.8, tile: "side" },
  { n: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], shade: 0.8, tile: "side" },
];

export const AO_CURVE = [0.5, 0.66, 0.83, 1] as const;
const WATER_TOP = 0.875;

class Builder {
  pos: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  ind: number[] = [];
  quad(p: number[][], uvs: number[][], c: number[], flip: boolean) {
    const base = this.pos.length / 3;
    for (let k = 0; k < 4; k++) {
      this.pos.push(p[k][0], p[k][1], p[k][2]);
      this.uv.push(uvs[k][0], uvs[k][1]);
      this.col.push(c[k], c[k], c[k]);
    }
    if (flip) this.ind.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
    else this.ind.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  build(): MeshArrays {
    return { positions: new Float32Array(this.pos), uvs: new Float32Array(this.uv), colors: new Float32Array(this.col), indices: new Uint32Array(this.ind) };
  }
}

export function makeGetter(n: Neighborhood) {
  return (x: number, y: number, z: number): number => {
    if (y < 0) return B.BEDROCK;
    if (y >= HEIGHT) return B.AIR;
    const dx = x < 0 ? -1 : x >= CHUNK ? 1 : 0;
    const dz = z < 0 ? -1 : z >= CHUNK ? 1 : 0;
    const c = n[(dz + 1) * 3 + dx + 1];
    if (!c) return B.AIR;
    return c[idx(x - dx * CHUNK, y, z - dz * CHUNK)];
  };
}

function bucketOf(b: Bucket): MeshBucket | null {
  if (b === "opaque") return "opaque";
  if (b === "cutout" || b === "cross") return "cutout";
  if (b === "water") return "water";
  if (b === "emissive") return "emissive";
  return null;
}

export function meshChunk(n: Neighborhood): ChunkMesh {
  const get = makeGetter(n);
  const center = n[4]!;
  const out: Record<MeshBucket, Builder> = { opaque: new Builder(), cutout: new Builder(), water: new Builder(), emissive: new Builder() };

  for (let y = 0; y < HEIGHT; y++)
    for (let z = 0; z < CHUNK; z++)
      for (let x = 0; x < CHUNK; x++) {
        const id = center[idx(x, y, z)];
        if (id === B.AIR) continue;
        const def = blockDef(id);
        const target = bucketOf(def.bucket);
        if (!target) continue;
        const b = out[target];

        if (def.bucket === "cross") {
          const [u0, v0, u1, v1] = tileUV(def.side);
          const uv = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
          const c = [0.92, 0.92, 0.92, 0.92];
          const i = 0.15;
          const j = 1 - i;
          b.quad([[x + i, y, z + i], [x + j, y, z + j], [x + j, y + 1, z + j], [x + i, y + 1, z + i]], uv, c, false);
          b.quad([[x + j, y, z + i], [x + i, y, z + j], [x + i, y + 1, z + j], [x + j, y + 1, z + i]], uv, c, false);
          continue;
        }

        const waterTop = id === B.WATER && get(x, y + 1, z) !== B.WATER ? WATER_TOP : 1;

        for (const f of FACES) {
          const nx = x + f.n[0];
          const ny = y + f.n[1];
          const nz = z + f.n[2];
          const nb = get(nx, ny, nz);
          let visible: boolean;
          if (def.bucket === "water") visible = nb !== B.WATER && (!isOccluder(nb) || (f.n[1] === 1 && waterTop < 1));
          else if (def.bucket === "cutout") visible = nb !== id && !isOccluder(nb);
          else visible = !isOccluder(nb);
          if (!visible) continue;

          const tile = f.tile === "top" ? def.top : f.tile === "bottom" ? def.bottom : def.side;
          const [u0, v0, u1, v1] = tileUV(tile);
          const uvs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
          const pts = f.corners.map((c) => [x + c[0], y + (c[1] === 1 ? waterTop : 0), z + c[2]]);

          if (def.bucket === "water" || def.bucket === "emissive") {
            const s = def.bucket === "emissive" ? 1 : f.shade;
            b.quad(pts, uvs, [s, s, s, s], false);
            continue;
          }

          // Ambient occlusion: sample the three blocks around each vertex in the layer the face looks into.
          const axis = f.n[0] !== 0 ? 0 : f.n[1] !== 0 ? 1 : 2;
          const ua = axis === 0 ? 1 : 0;
          const va = axis === 2 ? 1 : 2;
          const ao = f.corners.map((c) => {
            const su = c[ua] === 1 ? 1 : -1;
            const sv = c[va] === 1 ? 1 : -1;
            const p = [nx, ny, nz];
            const s1 = [...p];
            s1[ua] += su;
            const s2 = [...p];
            s2[va] += sv;
            const cc = [...p];
            cc[ua] += su;
            cc[va] += sv;
            const o1 = isOccluder(get(s1[0], s1[1], s1[2])) ? 1 : 0;
            const o2 = isOccluder(get(s2[0], s2[1], s2[2])) ? 1 : 0;
            const oc = isOccluder(get(cc[0], cc[1], cc[2])) ? 1 : 0;
            return o1 && o2 ? 0 : 3 - (o1 + o2 + oc);
          });
          const colors = ao.map((a) => AO_CURVE[a] * f.shade);
          b.quad(pts, uvs, colors, ao[0] + ao[2] > ao[1] + ao[3]);
        }
      }

  return { opaque: out.opaque.build(), cutout: out.cutout.build(), water: out.water.build(), emissive: out.emissive.build() };
}

export const quadCount = (m: MeshArrays) => m.indices.length / 6;
