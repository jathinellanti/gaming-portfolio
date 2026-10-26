import * as THREE from "three";
import { B, blockDef, isSolid } from "./blocks";
import { CHUNK, HEIGHT, generateChunk, idx } from "./generate";
import { meshChunk, type ChunkMesh, type MeshArrays, type MeshBucket, type Neighborhood } from "./mesher";
import type { WorkerRequest, WorkerResponse } from "./world.worker";
import { raise } from "../../../platform/faults";
import { log } from "../../../platform/log";

// Owns the loaded world: chunk data, player edits, worker jobs and the Three.js
// meshes. Streams rings of chunks around the player; unloads far ones.

const key = (cx: number, cz: number) => `${cx},${cz}`;
const MAX_GEN_IN_FLIGHT = 4;
const MAX_MESH_IN_FLIGHT = 3;
const SYNC_JOBS_PER_UPDATE = 2;

export type Materials = Record<MeshBucket, THREE.Material>;

export class ChunkManager {
  readonly group = new THREE.Group();
  private data = new Map<string, Uint8Array>();
  private meshes = new Map<string, THREE.Mesh[]>();
  private edits = new Map<string, Map<number, number>>();
  private genPending = new Set<string>();
  private meshPending = new Set<string>();
  private dirty = new Set<string>();
  private worker: Worker | null = null;
  private nextId = 1;
  private disposed = false;
  private sync = false;
  radius = 5;

  constructor(private materials: Materials) {
    this.group.name = "chunks";
    try {
      if (typeof Worker !== "function") throw new Error("Web Workers unavailable");
      this.worker = new Worker(new URL("./world.worker.ts", import.meta.url), { type: "module" });
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => this.onWorker(e.data);
      this.worker.onerror = (e) => this.fallbackToSync(e.message || "worker error");
    } catch (err) {
      this.fallbackToSync(String(err), false);
    }
  }

  private fallbackToSync(reason: string, notify = true) {
    if (this.sync) return;
    this.sync = true;
    this.worker?.terminate();
    this.worker = null;
    this.genPending.clear();
    this.meshPending.clear();
    if (notify) raise("worker.failed", { reason });
    else log("info", "block.worker-unavailable", { reason });
  }

  // ------------------------------------------------------------ world queries

  getBlock(x: number, y: number, z: number): number {
    if (y < 0) return B.BEDROCK;
    if (y >= HEIGHT) return B.AIR;
    const cx = Math.floor(x / CHUNK);
    const cz = Math.floor(z / CHUNK);
    const d = this.data.get(key(cx, cz));
    if (!d) return -1; // unloaded
    return d[idx(x - cx * CHUNK, y, z - cz * CHUNK)];
  }

  /** Unloaded space counts as solid so the player never falls through an unloaded chunk. */
  isSolidAt = (x: number, y: number, z: number) => {
    const b = this.getBlock(x, y, z);
    return b === -1 ? true : isSolid(b);
  };

  isWaterAt = (x: number, y: number, z: number) => this.getBlock(x, y, z) === B.WATER;

  isLoaded(x: number, z: number): boolean {
    return this.meshes.has(key(Math.floor(x / CHUNK), Math.floor(z / CHUNK)));
  }

  /** Surface height at a column if loaded (for safe teleports). */
  surfaceY(x: number, z: number): number | null {
    for (let y = HEIGHT - 1; y >= 0; y--) {
      const b = this.getBlock(x, y, z);
      if (b === -1) return null;
      if (isSolid(b) || b === B.WATER) return y + 1;
    }
    return 0;
  }

  setBlock(x: number, y: number, z: number, id: number): boolean {
    if (y < 1 || y >= HEIGHT) return false;
    const cx = Math.floor(x / CHUNK);
    const cz = Math.floor(z / CHUNK);
    const k = key(cx, cz);
    const d = this.data.get(k);
    if (!d) return false;
    const lx = x - cx * CHUNK;
    const lz = z - cz * CHUNK;
    const i = idx(lx, y, lz);
    d[i] = id;
    let e = this.edits.get(k);
    if (!e) this.edits.set(k, (e = new Map()));
    e.set(i, id);
    this.markDirty(cx, cz);
    // Neighbours share faces and AO along borders.
    if (lx === 0) this.markDirty(cx - 1, cz);
    if (lx === CHUNK - 1) this.markDirty(cx + 1, cz);
    if (lz === 0) this.markDirty(cx, cz - 1);
    if (lz === CHUNK - 1) this.markDirty(cx, cz + 1);
    if (lx === 0 && lz === 0) this.markDirty(cx - 1, cz - 1);
    if (lx === CHUNK - 1 && lz === CHUNK - 1) this.markDirty(cx + 1, cz + 1);
    if (lx === 0 && lz === CHUNK - 1) this.markDirty(cx - 1, cz + 1);
    if (lx === CHUNK - 1 && lz === 0) this.markDirty(cx + 1, cz - 1);
    return true;
  }

  private markDirty(cx: number, cz: number) {
    const k = key(cx, cz);
    if (this.meshes.has(k)) this.dirty.add(k);
  }

  stats() {
    return { chunks: this.meshes.size, data: this.data.size, pending: this.genPending.size + this.meshPending.size, worker: !this.sync };
  }

  // ------------------------------------------------------------ streaming

  /** Call regularly with the player's position. */
  update(px: number, pz: number) {
    if (this.disposed) return;
    const pcx = Math.floor(px / CHUNK);
    const pcz = Math.floor(pz / CHUNK);
    const r = this.radius;

    // Nearest first.
    const ring: [number, number, number][] = [];
    for (let dx = -r - 1; dx <= r + 1; dx++)
      for (let dz = -r - 1; dz <= r + 1; dz++) {
        const d2 = dx * dx + dz * dz;
        if (d2 <= (r + 1.5) * (r + 1.5)) ring.push([pcx + dx, pcz + dz, d2]);
      }
    ring.sort((a, b) => a[2] - b[2]);

    let syncBudget = SYNC_JOBS_PER_UPDATE;
    for (const [cx, cz] of ring) {
      const k = key(cx, cz);
      if (this.data.has(k) || this.genPending.has(k)) continue;
      if (this.sync) {
        if (syncBudget-- <= 0) break;
        this.acceptData(cx, cz, generateChunk(cx, cz));
      } else if (this.genPending.size < MAX_GEN_IN_FLIGHT) {
        this.genPending.add(k);
        this.post({ type: "gen", id: this.nextId++, cx, cz });
      }
    }

    for (const [cx, cz, d2] of ring) {
      if (d2 > (r + 0.5) * (r + 0.5)) continue;
      const k = key(cx, cz);
      const needs = !this.meshes.has(k) || this.dirty.has(k);
      if (!needs || this.meshPending.has(k)) continue;
      const hood = this.neighborhood(cx, cz);
      if (!hood) continue;
      this.dirty.delete(k);
      if (this.sync) {
        if (syncBudget-- <= 0) break;
        this.acceptMesh(cx, cz, meshChunk(hood));
      } else if (this.meshPending.size < MAX_MESH_IN_FLIGHT) {
        this.meshPending.add(k);
        this.post({ type: "mesh", id: this.nextId++, cx, cz, hood });
      }
    }

    // Unload far chunks.
    const far = (r + 2.5) * (r + 2.5);
    for (const k of [...this.data.keys()]) {
      const [cx, cz] = k.split(",").map(Number);
      const d2 = (cx - pcx) ** 2 + (cz - pcz) ** 2;
      if (d2 > far) {
        this.data.delete(k);
        this.removeMesh(k);
      }
    }
    for (const k of [...this.meshes.keys()]) {
      const [cx, cz] = k.split(",").map(Number);
      if ((cx - pcx) ** 2 + (cz - pcz) ** 2 > (r + 1) * (r + 1)) this.removeMesh(k);
    }
  }

  private neighborhood(cx: number, cz: number): Neighborhood | null {
    const hood: Neighborhood = [];
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        const d = this.data.get(key(cx + dx, cz + dz));
        if (!d) return null;
        hood.push(d);
      }
    return hood;
  }

  private post(req: WorkerRequest) {
    try {
      this.worker!.postMessage(req);
    } catch (err) {
      this.fallbackToSync(String(err));
    }
  }

  private onWorker(m: WorkerResponse) {
    if (this.disposed) return;
    if (m.type === "error") {
      this.fallbackToSync(m.message);
      return;
    }
    const k = key(m.cx, m.cz);
    if (m.type === "gen") {
      this.genPending.delete(k);
      this.acceptData(m.cx, m.cz, m.data);
    } else {
      this.meshPending.delete(k);
      this.acceptMesh(m.cx, m.cz, m.mesh);
    }
  }

  private acceptData(cx: number, cz: number, data: Uint8Array) {
    const k = key(cx, cz);
    const e = this.edits.get(k);
    if (e) for (const [i, id] of e) data[i] = id;
    this.data.set(k, data);
  }

  private acceptMesh(cx: number, cz: number, mesh: ChunkMesh) {
    const k = key(cx, cz);
    if (!this.data.has(k)) return; // unloaded while meshing
    this.removeMesh(k);
    const list: THREE.Mesh[] = [];
    for (const bucket of ["opaque", "cutout", "emissive", "water"] as MeshBucket[]) {
      const arrays = mesh[bucket];
      if (arrays.indices.length === 0) continue;
      const m = new THREE.Mesh(toGeometry(arrays), this.materials[bucket]);
      m.position.set(cx * CHUNK, 0, cz * CHUNK);
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      m.renderOrder = bucket === "water" ? 2 : bucket === "cutout" ? 1 : 0;
      m.userData.bucket = bucket;
      this.group.add(m);
      list.push(m);
    }
    this.meshes.set(k, list);
  }

  private removeMesh(k: string) {
    const list = this.meshes.get(k);
    if (!list) return;
    for (const m of list) {
      this.group.remove(m);
      m.geometry.dispose();
    }
    this.meshes.delete(k);
    this.dirty.delete(k);
  }

  dispose() {
    this.disposed = true;
    this.worker?.terminate();
    for (const k of [...this.meshes.keys()]) this.removeMesh(k);
    this.data.clear();
  }

  /** Block name for UI (F3, break messages). */
  static blockName(id: number) {
    return blockDef(id).name;
  }
}

function toGeometry(a: MeshArrays): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(a.positions, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(a.uvs, 2));
  g.setAttribute("color", new THREE.BufferAttribute(a.colors, 3));
  g.setIndex(new THREE.BufferAttribute(a.indices, 1));
  g.computeBoundingSphere();
  return g;
}
